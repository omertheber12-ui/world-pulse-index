"""TR-001 analysis, following PREREGISTRATION.md. Writes results/results.json and results/*.csv."""
import json, pathlib
import numpy as np, pandas as pd, statsmodels.api as sm
R = pathlib.Path(__file__).resolve().parent.parent
D, OUT = R / "data", R / "results"; OUT.mkdir(exist_ok=True)
rng = np.random.default_rng(20261110)
N_PLACEBO = 1000

def load_odds(name):
    meta = {m["id"]: m for m in json.load(open(D / f"markets_{name}.json"))["selected"]}
    o = pd.read_csv(D / f"odds_{name}.csv.gz"); o["market_id"] = o.market_id.astype(str)
    o["time"] = pd.to_datetime(o.t, unit="s", utc=True)
    return o, meta

def winsor(s):
    lo, hi = s.quantile([0.01, 0.99]); return s.clip(lo, hi)

def hourly_odds(o, meta):
    out = []
    for mid, g in o.groupby("market_id"):
        g = g.set_index("time").p.sort_index()
        h = g.groupby(g.index.ceil("h")).last()          # value at hour H = last obs at or before H
        h = h.asfreq("h")                                 # no forward fill: missing hours stay missing
        end = pd.Timestamp(meta[mid]["endDate"]).tz_convert("UTC")
        h = h[h.index <= end - pd.Timedelta(hours=24)]   # drop final 24h before end date
        out.append(pd.DataFrame({"market_id": mid, "time": h.index, "p": h.values}))
    return pd.concat(out)

def prep_changes(df, xcol="p", ycol="y", step=1):
    df = df.sort_values(["market_id", "time"]).copy()
    g = df.groupby("market_id")
    df["p_prev"] = g[xcol].shift(1)
    df["dX"] = (df[xcol] - df.p_prev) * 100              # percentage points
    lo = lambda v: np.log(np.clip(v, .01, .99) / (1 - np.clip(v, .01, .99)))
    df["dLO"] = lo(df[xcol]) - lo(df.p_prev)
    ok = df[xcol].between(.03, .97) & df.p_prev.between(.03, .97)
    df.loc[~ok, ["dX", "dLO"]] = np.nan
    return df

def add_lags(df, cols, p):
    g = df.groupby("market_id")
    for c in cols:
        for j in range(1, p + 1): df[f"{c}_l{j}"] = g[c].shift(j)
    return df

def granger(df, ycol, xcol, p):
    d = add_lags(df.copy(), [ycol, xcol], p)
    cols = [f"{ycol}_l{j}" for j in range(1, p + 1)] + [f"{xcol}_l{j}" for j in range(1, p + 1)]
    d = d.dropna(subset=[ycol] + cols)
    X = pd.concat([d[cols], pd.get_dummies(d.market_id, drop_first=True, dtype=float)], axis=1)
    X = sm.add_constant(X); m = sm.OLS(d[ycol], X).fit(cov_type="HC1")
    xl = [f"{xcol}_l{j}" for j in range(1, p + 1)]
    w = m.wald_test(" + ".join(xl) + " = 0", scalar=True)   # sum of lag effects
    f = m.f_test(", ".join(f"{c} = 0" for c in xl))
    csum = sum(m.params[c] for c in xl)
    se = float(np.sqrt(w.statistic) and abs(csum) / np.sqrt(w.statistic)) if w.statistic > 0 else np.nan
    return dict(n=int(len(d)), F_p=float(f.pvalue), sum_coef=float(csum), sum_coef_ci95=[float(csum - 1.96 * se), float(csum + 1.96 * se)],
                sum_p=float(w.pvalue), lag1_corr=float(d[ycol].corr(d[f"{xcol}_l1"])))

def lag_corr_ci(r, n):
    z = np.arctanh(r); s = 1 / np.sqrt(n - 3); return [float(np.tanh(z - 1.96 * s)), float(np.tanh(z + 1.96 * s))]

def ccf(df, ycol, xcol, K):
    res = {}
    for k in range(-K, K + 1):
        yk = df.groupby("market_id")[ycol].shift(-k)
        m = df[xcol].notna() & yk.notna(); res[k] = float(np.corrcoef(df.loc[m, xcol], yk[m])[0, 1])
    return res

def window_sum(df, col, a, b):
    g = df.groupby("market_id")[col]
    return sum(g.shift(-k) for k in range(a, b + 1))

def event_study(df, ycol, spacing, pre, post, thresh=5.0):
    df = df.sort_values(["market_id", "time"]).reset_index(drop=True)
    df["post"] = window_sum(df, ycol, *post); df["pre"] = window_sum(df, ycol, *pre)
    df["same"] = df[ycol]
    df["abs_post"] = sum(df.groupby("market_id")[ycol].shift(-k).abs() for k in range(post[0], post[1] + 1)) / (post[1] - post[0] + 1)
    elig = df.dropna(subset=["post", "pre", "abs_post"])
    ev = []
    for mid, g in elig[elig.dX.abs() >= thresh].groupby("market_id"):
        last = -10**9
        for i, r in g.iterrows():
            if i - last >= spacing: ev.append(i); last = i
    E = df.loc[ev]; s = np.sign(E.dX)
    act = dict(n_events=int(len(E)), post=float((s * E.post).mean()), pre=float((s * E.pre).mean()),
               same=float((s * E.same).mean()), abs_post=float(E.abs_post.mean()), base_abs=float(elig.abs_post.mean()))
    if len(E) < 3:
        act.update(post_p=np.nan, pre_p=np.nan, abs_post_p=np.nan, abs_post_placebo_mean=np.nan, abs_post_ratio=np.nan); return act, E
    pl = {k: [] for k in ["post", "pre", "abs_post"]}
    counts = E.market_id.value_counts(); signs = s.values
    pools = {mid: elig.index[elig.market_id == mid].values for mid in counts.index}
    for _ in range(N_PLACEBO):
        idx = np.concatenate([rng.choice(pools[m], c, replace=False) for m, c in counts.items()])
        ss = rng.permutation(signs); P = df.loc[idx]
        for k in ["post", "pre"]: pl[k].append(float((ss * P[k].values).mean()))
        pl["abs_post"].append(float(P.abs_post.mean()))
    for k in ["post", "pre"]:
        a = np.array(pl[k]); act[f"{k}_p"] = float(np.mean(np.abs(a - a.mean()) >= abs(act[k] - a.mean())))
    a = np.array(pl["abs_post"]); act["abs_post_placebo_mean"] = float(a.mean()); act["abs_post_p"] = float(np.mean(a >= act["abs_post"]))
    act["abs_post_ratio"] = float(act["abs_post"] / a.mean())
    return act, E

def holm(ps):
    keys = sorted(ps, key=ps.get); m = len(keys); out, mx = {}, 0
    for i, k in enumerate(keys):
        mx = max(mx, min(1, (m - i) * ps[k])); out[k] = mx
    return out

def quality(df):
    q = []
    for mid, g in df.groupby("market_id"):
        q.append(dict(market_id=mid, bars=int(g.p.notna().sum()), usable_changes=int(g.dX.notna().sum()),
                      stale_share=float((g.dX == 0).sum() / max(1, g.dX.notna().sum())),
                      share_outside_3_97=float((~g.p.between(.03, .97)).mean())))
    return pd.DataFrame(q)

def run(name, df, p, spacing, pre, post, K, unit, max_stale=.5):
    df["dX"] = df.groupby("market_id").dX.transform(winsor); df["y"] = df.groupby("market_id").y.transform(winsor)
    q = quality(df); keep = q[(q.stale_share <= max_stale) & (q.usable_changes >= 30)].market_id
    dq = df[df.market_id.isin(keep)].copy()
    if dq.dX.notna().sum() < 100:
        return dict(unit=unit, contracts_used=list(keep), quality=q.to_dict("records"), verdict_note="fewer than 100 usable step-pairs after pre-registered filters")
    t1, t2 = granger(dq, "y", "dX", p), granger(dq, "dX", "y", p)
    t1["lag1_corr_ci95"] = lag_corr_ci(t1["lag1_corr"], t1["n"])
    es, E = event_study(dq, "y", spacing, pre, post)
    cut = dq.time.quantile(.7); ho = dq[dq.time >= cut].copy()
    ho1 = granger(ho, "y", "dX", p) if ho.dX.notna().sum() > 50 else None
    hoes, _ = event_study(ho, "y", spacing, pre, post) if (ho.dX.abs() >= 5).sum() >= 3 else (None, None)
    dlo = dq.copy(); dlo["dX"] = dlo.groupby("market_id").dLO.transform(winsor)
    rob = granger(dlo, "y", "dX", p)
    E[["market_id", "time", "dX", "pre", "same", "post", "abs_post"]].to_csv(OUT / f"events_{name}.csv", index=False)
    return dict(unit=unit, contracts_used=list(keep), quality=q.to_dict("records"), odds_lead_asset=t1, asset_lead_odds=t2,
                event_study=es, holdout_from=str(cut), holdout_odds_lead_asset=ho1, holdout_event_study=hoes,
                logodds_odds_lead_asset=rob, ccf=ccf(dq, "y", "dX", K))

def bitcoin(max_stale=.5, daily=False):
    o, meta = load_odds("btc"); h = hourly_odds(o, meta)
    if daily:
        h = h.dropna(subset=["p"]); h = h[h.time.dt.hour == 0]
    b = pd.read_csv(D / "btc_hourly.csv.gz"); b["time"] = pd.to_datetime(b.t, unit="s", utc=True)
    b["ret"] = np.log(b.close).diff() * 100
    if daily:
        b = b[b.time.dt.hour == 0].copy(); b["ret"] = np.log(b.close).diff() * 100
    df = h.merge(b[["time", "ret", "volume"]], on="time", how="left")
    df = prep_changes(df); df["y"] = df.ret
    df = df.dropna(subset=["p"])
    if daily:
        return run("btc_daily", df, p=2, spacing=5, pre=(-2, -1), post=(1, 2), K=5, unit="Bitcoin daily log return, percent", max_stale=max_stale)
    return run("btc" if max_stale == .5 else "btc_relaxed", df, p=4, spacing=24, pre=(-4, -1), post=(1, 4), K=24,
               unit="Bitcoin hourly log return, percent; odds change in percentage points", max_stale=max_stale)

def fed(max_stale=.5):
    o, meta = load_odds("fed"); h = hourly_odds(o, meta)
    h = h[h.time.dt.hour <= 20].copy(); h["date"] = h.time.dt.date.astype(str)
    h = h.dropna(subset=["p"]).sort_values("time").groupby(["market_id", "date"]).last().reset_index()  # last value at or before 20:00 UTC
    y = pd.read_csv(D / "dgs2_daily.csv"); y["dy"] = y.dgs2.diff() * 100
    k = pd.read_csv(D / "kre_daily.csv"); k["kre_ret"] = np.log(k.close).diff() * 100
    df = h.merge(y[["date", "dgs2"]], on="date", how="inner").merge(k[["date", "kre_ret"]], on="date", how="left")
    df = df.sort_values(["market_id", "date"]); df["dy"] = df.groupby("market_id").dgs2.diff() * 100
    df = prep_changes(df); df["y"] = -df.dy      # predicted sign positive: higher cut odds -> lower 2y yield
    res = run("fed", df.copy(), max_stale=max_stale, p=2, spacing=5, pre=(-2, -1), post=(1, 2), K=5, unit="minus daily change in 2-year yield, basis points; odds change in percentage points")
    dk = df.copy(); dk["y"] = dk.kre_ret; dk = dk.dropna(subset=["y"])
    res["exploratory_kre"] = run("fed_kre", dk, max_stale=max_stale, p=2, spacing=5, pre=(-2, -1), post=(1, 2), K=5, unit="KRE daily log return, percent")
    return res

def summarize(r):
    if "odds_lead_asset" not in r: return r.get("verdict_note")
    return dict(odds_lead_asset={a: r["odds_lead_asset"][a] for a in ["n", "F_p", "sum_coef", "sum_coef_ci95", "lag1_corr", "lag1_corr_ci95"]},
                asset_lead_odds={a: r["asset_lead_odds"][a] for a in ["n", "F_p", "sum_coef", "lag1_corr"]},
                events=r["event_study"], holdout_ols=r["holdout_odds_lead_asset"] and {a: r["holdout_odds_lead_asset"][a] for a in ["n", "F_p", "sum_coef"]},
                holdout_events=r["holdout_event_study"], logodds={a: r["logodds_odds_lead_asset"][a] for a in ["n", "F_p", "sum_coef"]},
                ccf={k: round(v, 3) for k, v in r["ccf"].items() if abs(int(k)) <= 4})

def headline(res):
    ps = {}
    for k, r in res.items():
        if "odds_lead_asset" not in r: continue
        ps[f"{k}:1_odds_lead_asset"] = r["odds_lead_asset"]["F_p"]; ps[f"{k}:2_asset_lead_odds"] = r["asset_lead_odds"]["F_p"]
        ps[f"{k}:3_event_post"] = r["event_study"]["post_p"]; ps[f"{k}:4_attention"] = r["event_study"]["abs_post_p"]
    return ps

if __name__ == "__main__":
    pre = {"bitcoin": bitcoin(), "fed": fed()}
    ps = headline(pre); m_total = 8   # pre-registered count; untestable tests count as not rejected
    holm_p = holm({**ps, **{f"untestable_{i}": 1.0 for i in range(m_total - len(ps))}})
    dev = {"D1_bitcoin_hourly_relaxed_stale": bitcoin(max_stale=1.0), "D2_bitcoin_daily": bitcoin(max_stale=1.0, daily=True),
           "D3_fed_relaxed_stale": fed(max_stale=1.0)}
    dps = headline(dev)
    out = {"preregistered": pre, "preregistered_p_raw": ps, "preregistered_p_holm": {k: holm_p[k] for k in ps},
           "deviations_exploratory": dev, "deviation_p_raw": dps, "deviation_p_holm_within": holm(dps) if dps else {}}
    json.dump(out, open(OUT / "results.json", "w"), indent=1, default=str)
    summ = {"preregistered": {k: summarize(v) for k, v in pre.items()}, "fed_kre_exploratory": summarize(pre["fed"]["exploratory_kre"]) if "exploratory_kre" in pre["fed"] else None,
            "deviations": {k: summarize(v) for k, v in dev.items()}, "p_raw": ps, "p_holm": out["preregistered_p_holm"], "dev_p_raw": dps, "dev_p_holm": out["deviation_p_holm_within"]}
    json.dump(summ, open(OUT / "summary.json", "w"), indent=1, default=str)
    print(json.dumps(summ, indent=1, default=str))
    for k, r in {**pre, **dev}.items(): print(k); print(pd.DataFrame(r["quality"]).to_string())
