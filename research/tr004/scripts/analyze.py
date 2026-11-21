"""TR-004 analysis as pre-registered. Seed 20261110. Output never contains wallet ids (hashed ids stay in data/ only)."""
import json, pathlib, sys
import numpy as np, pandas as pd
from scipy import stats
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from screen import load, s1_s3
R = pathlib.Path(__file__).resolve().parent.parent; D = R / "data"; O = R / "results"; O.mkdir(exist_ok=True)
RNG = np.random.default_rng(20261110); DELAY = 300

ev = json.load(open(D / "events.json"))["selected"]
mk = {str(m["market_id"]): dict(event_id=e["event_id"], type=e["type"], title=e["title"]) for e in ev for m in e["markets"]}
t = s1_s3(load())
wh = pd.read_csv(D / "wallet_history.csv.gz")
cand = t[(t.side == "BUY") & (t.t >= t.w0) & (t.t <= t.w1) & t.p_yes.between(0.05, 0.95) & t.s1 & t.s3].merge(wh, on=["wallet_hash", "t"], how="left")
cand["s2"] = (cand.n_prior < 5) | (cand.cash >= 5 * cand.median_prior_cash)
flag = cand[cand.s2 & cand.ok.fillna(False)].sort_values(["market_id", "wallet_hash", "t"])
# merge repeated flagged buys by the same wallet in the same market within 30 minutes (first time kept)
keep, last = [], {}
for r in flag.itertuples():
    k = (r.market_id, r.wallet_hash)
    if k in last and r.t - last[k] <= 1800: last[k] = r.t; continue
    last[k] = r.t; keep.append(r.Index)
alerts = flag.loc[keep].copy()

# odds path per market from trades: median Yes-equivalent price of the last 5 trades at or before a time
paths = {}
for mid, g in t.groupby("market_id"):
    g = g.sort_values("t"); paths[mid] = (g.t.values, g.p_yes.rolling(5, min_periods=1).median().values)
def odds_at(mid, tau):
    tt, pp = paths[mid]; i = np.searchsorted(tt, tau, side="right") - 1
    return np.where(i >= 0, pp[np.clip(i, 0, None)], np.nan)

btc = pd.read_csv(D / "btc_1m.csv.gz").sort_values("t"); bt, bc = btc.t.values, np.log(btc.close.values)
def lbtc(tau):
    i = np.searchsorted(bt, tau, side="right") - 1
    ok = (i >= 0) & (tau - bt[np.clip(i, 0, None)] <= 120)
    return np.where(ok, bc[np.clip(i, 0, None)], np.nan)

win = t.groupby("market_id")[["w0", "w1"]].first()
# event sign for Bitcoin: same-minute correlation of odds changes and Bitcoin returns, first 70% of each market window
bsign = {}
for mid, (w0, w1) in win.iterrows():
    grid = np.arange(w0, w0 + 0.7 * (w1 - w0), 60)
    o = np.diff(odds_at(mid, grid)); b = np.diff(lbtc(grid)); m = np.isfinite(o) & np.isfinite(b) & (o != 0)
    c = np.corrcoef(o[m], b[m])[0, 1] if m.sum() > 30 else np.nan
    bsign[mid] = 1.0 if not np.isfinite(c) or c >= 0 else -1.0

def moves(df, H, kind):
    a = df.t.values + DELAY; b = a + H; out = np.full(len(df), np.nan)
    for mid, idx in df.groupby("market_id").indices.items():
        w1 = win.loc[mid, "w1"]; aa, bb = a[idx], b[idx]
        if kind == "odds": v = (odds_at(mid, bb) - odds_at(mid, aa)) * 100 * df.dir.values[idx]
        else: v = (lbtc(bb) - lbtc(aa)) * 100 * df.dir.values[idx] * bsign[mid]
        v[bb > w1] = np.nan; out[idx] = v
    return out

alerts["event_id"] = alerts.market_id.map(lambda m: mk[str(m)]["event_id"]); alerts["type"] = alerts.market_id.map(lambda m: mk[str(m)]["type"])
for H in (900, 3600):
    alerts[f"odds_{H}"] = moves(alerts, H, "odds"); alerts[f"btc_{H}"] = moves(alerts, H, "btc")
alerts["odds_impact_300_from_t"] = [((odds_at(r.market_id, r.t + 300) - odds_at(r.market_id, r.t - 1)) * 100 * r.dir) for r in alerts.itertuples()]

# ordinary-bet control: window buys with cash between the market's 25th and 75th percentile, price 5%-95%
wb = t[(t.side == "BUY") & (t.t >= t.w0) & (t.t <= t.w1) & t.p_yes.between(0.05, 0.95)].copy()
q = wb.groupby("market_id").cash.quantile([0.25, 0.75]).unstack()
wb = wb.join(q, on="market_id"); ordn = wb[(wb.cash >= wb[0.25]) & (wb.cash <= wb[0.75])]
ordn = ordn.sample(frac=1, random_state=20261110); ordn = ordn[ordn.groupby("market_id").cumcount() < 3000].sort_values(["market_id", "t"])
ctrl = {}
for H in (900, 3600):
    ordn[f"odds_{H}"] = moves(ordn, H, "odds"); ctrl[H] = ordn.groupby("market_id")[f"odds_{H}"].mean()
for H in (900, 3600):
    alerts[f"diff_{H}"] = alerts[f"odds_{H}"] - alerts.market_id.map(ctrl[H])

# held-back slice: last 30% of events by close time
close = {e["event_id"]: max(m.get("closedTime") or m["endDate"] for m in e["markets"]) for e in ev}
order = sorted(close, key=lambda k: close[k]); test_ev = set(order[int(0.7 * len(order)):])
alerts["slice"] = np.where(alerts.event_id.isin(test_ev), "held_back", "main")
alerts.drop(columns=["wallet_hash"]).to_csv(O / "alerts_no_wallet_ids.csv", index=False)

def event_ttest(df, col):
    e = df.groupby("event_id")[col].mean().dropna()
    if len(e) < 3: return dict(n_events=int(len(e)), mean=float(e.mean()) if len(e) else None, p=None)
    tt = stats.ttest_1samp(e, 0); se = e.std(ddof=1) / np.sqrt(len(e))
    return dict(n_events=int(len(e)), n_alerts=int(df[col].notna().sum()), mean=float(e.mean()), ci=[float(e.mean() - 1.96 * se), float(e.mean() + 1.96 * se)], p=float(tt.pvalue))

def placebo(df, H, kind, n=1000):
    real = np.nanmean(df[f"{kind}_{H}"]); draws = []
    lo = df.market_id.map(win.w0).values; hi = df.market_id.map(win.w1).values - DELAY - H
    for _ in range(n):
        rt = lo + RNG.random(len(df)) * np.maximum(hi - lo, 1)
        d = df[["market_id", "dir"]].copy(); d["t"] = rt
        draws.append(np.nanmean(moves(d, H, kind)))
    draws = np.array(draws); pu = (np.sum(draws >= real) + 1) / (n + 1); pl = (np.sum(draws <= real) + 1) / (n + 1)
    return dict(real=float(real), placebo_mean=float(np.mean(draws)), placebo_95=float(np.quantile(draws, 0.95)), p=float(min(1, 2 * min(pu, pl))))

M = alerts[alerts.slice == "main"]; HB = alerts[alerts.slice == "held_back"]
tests = {"A1_odds_60m_vs_ordinary": event_ttest(M, "diff_3600"), "A2_odds_15m_vs_ordinary": event_ttest(M, "diff_900"),
         "A3_odds_60m_vs_random_times": placebo(M, 3600, "odds"), "B1_bitcoin_60m_vs_random_times": placebo(M, 3600, "btc"),
         "B2_bitcoin_15m_vs_random_times": placebo(M, 900, "btc")}
ps = [tests[k]["p"] if tests[k].get("p") is not None else 1.0 for k in tests]; order_ = np.argsort(ps); run = 0; m_ = len(ps)
for r, i in enumerate(order_):
    run = max(run, min(1, (m_ - r) * ps[i])); tests[list(tests)[i]]["p_holm"] = float(run)
held = event_ttest(HB, "diff_3600")
A1 = tests["A1_odds_60m_vs_ordinary"]; n_ev_alert = int(M.event_id.nunique() + HB.event_id.nunique())
yes = A1.get("p_holm", 1) < 0.05 and A1["mean"] >= 2 and tests["A3_odds_60m_vs_random_times"]["p_holm"] < 0.05 \
      and tests["A3_odds_60m_vs_random_times"]["real"] > tests["A3_odds_60m_vs_random_times"]["placebo_95"] \
      and (held.get("mean") or 0) >= 1 and n_ev_alert >= 30 and len(alerts) >= 100
no = A1.get("ci") is not None and (A1["ci"][1] < 1 or (A1["mean"] < 0 and A1.get("p_holm", 1) < 0.05))
decision = "YES" if yes else ("UNCLEAR" if n_ev_alert < 30 else ("NO" if no else "UNCLEAR"))
B = [tests[k] for k in ("B1_bitcoin_60m_vs_random_times", "B2_bitcoin_15m_vs_random_times")]
asset = any(b["p_holm"] < 0.05 and b["real"] > 0 and b["real"] >= 0.10 for b in B)
expl = dict(
    hit_rate_odds_60m=float((alerts.odds_3600.dropna() > 0).mean()), hit_rate_ordinary_60m=float((ordn.odds_3600.dropna() > 0).mean()),
    mean_alert_odds_60m=float(alerts.odds_3600.mean()), mean_ordinary_odds_60m=float(ordn.odds_3600.mean()),
    impact_first_5m_from_bet=event_ttest(alerts, "odds_impact_300_from_t"),
    by_type={k: event_ttest(g, "diff_3600") for k, g in alerts.groupby("type")},
    alerts_per_event=alerts.groupby("event_id").size().describe().to_dict(),
    flagged_buys_before_merge=int(len(flag)), candidates_s1_s3=int(len(cand)), wallet_history_ok=float(cand.ok.fillna(False).mean()),
    window_buys=int(len(wb)), new_wallet_share=float((alerts.n_prior < 5).mean()))
out = dict(n_events=len(ev), n_markets=int(t.market_id.nunique()), n_trades=int(len(t)), n_alerts=int(len(alerts)), n_events_with_alert=n_ev_alert,
           tests=tests, held_back_A1=held, decision=decision, carries_into_bitcoin=asset, exploratory=expl)
json.dump(out, open(O / "results.json", "w"), indent=1, default=float)
print(json.dumps(out, indent=1, default=float))
