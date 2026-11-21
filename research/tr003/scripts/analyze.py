"""TR-003 analysis per PREREGISTRATION.md. Outputs results/summary.json and results/*.csv."""
import json, pathlib
import numpy as np, pandas as pd, statsmodels.api as sm
from scipy.stats import norm, spearmanr
R = pathlib.Path(__file__).resolve().parent.parent; D, OUT = R / "data", R / "results"; OUT.mkdir(exist_ok=True)
SEED = 20261110; P = 4

def utc(s):
    x = pd.Timestamp(s); return x.tz_convert("UTC") if x.tzinfo else x.tz_localize("UTC")

def model_prob(kind, S, K, s, t):
    st = s * np.sqrt(np.maximum(t, 1e-9))
    if kind == "above": return norm.cdf((np.log(S / K) - 0.5 * s ** 2 * t) / st)
    if kind == "reach": return np.where(K > S, np.minimum(1, 2 * norm.cdf(-np.log(K / S) / st)), 1.0)
    return np.where(K < S, np.minimum(1, 2 * norm.cdf(-np.log(S / K) / st)), 1.0)   # dip

def build(vol_source="dvol", align="fixed"):
    meta = {m["id"]: m for m in json.load(open(D / "markets.json"))["selected"]}
    o = pd.read_csv(D / "odds.csv.gz"); o["market_id"] = o.market_id.astype(str); o["time"] = pd.to_datetime(o.t, unit="s", utc=True)
    b = pd.read_csv(D / "btc_hourly.csv.gz"); b["time"] = pd.to_datetime(b.t, unit="s", utc=True); b = b.set_index("time").sort_index()
    b["ret"] = np.log(b.close).diff() * 100
    b["rv"] = (b.ret / 100).rolling(720, min_periods=240).std().shift(1) * np.sqrt(8760)   # trailing only
    v = pd.read_csv(D / "dvol_hourly.csv.gz"); v["time"] = pd.to_datetime(v.t, unit="s", utc=True); v = v.set_index("time").dvol.sort_index()
    out = []
    for mid, g in o.groupby("market_id"):
        m = meta[mid]; end = utc(m["endDate"])
        h = g.set_index("time").p.sort_index()
        if align == "fixed":   # deviation D1: snapshots stamped within 60 s after the hour belong to that hour
            sec = (h.index - h.index.floor("h")).total_seconds()
            key = np.where(sec < 60, h.index.floor("h"), h.index.ceil("h"))
        else:                  # as locked: last point at or before H (pushes HH:00:07 snapshots into H+1)
            key = h.index.ceil("h")
        h = h.groupby(key).last(); h.index = pd.DatetimeIndex(h.index, tz="UTC") if h.index.tz is None else h.index; h = h.asfreq("h")
        h = h[h.index <= end - pd.Timedelta(hours=24)]
        if h.empty: continue
        df = pd.DataFrame({"p": h}); df.index.name = "time"
        df = df.join(b[["close", "ret", "rv"]], how="left")
        df["dvol"] = v.reindex(df.index, method="ffill").values / 100
        sig = df.dvol if vol_source == "dvol" else df.rv
        tyrs = (end - df.index).total_seconds() / (365.25 * 86400)
        df["m"] = model_prob(m["kind"], df.close.values, m["strike"], sig.values, tyrs.values)
        sgn = -1 if m["kind"] == "dip" else 1
        df["sgn"] = sgn; df["market_id"] = mid; df["kind"] = m["kind"]
        out.append(df.reset_index())
    df = pd.concat(out).sort_values(["market_id", "time"]).reset_index(drop=True)
    g = df.groupby("market_id")
    ok = df.p.between(.03, .97) & df.m.between(.03, .97)
    okprev = g.p.shift(1).between(.03, .97) & g.m.shift(1).between(.03, .97)
    df["dX"] = df.sgn * (df.p - g.p.shift(1)) * 100
    df["dM"] = df.sgn * (df.m - g.m.shift(1)) * 100
    df["G"] = df.sgn * (df.p - df.m) * 100
    df.loc[~(ok & okprev), ["dX", "dM"]] = np.nan; df.loc[~ok, "G"] = np.nan
    df["dG"] = df.dX - df.dM; df["y"] = df.ret
    return df

def quality(df):
    rows = []
    for mid, g in df.groupby("market_id"):
        u = g.dX.notna().sum()
        rows.append(dict(market_id=mid, kind=g.kind.iloc[0], hours=int(g.p.notna().sum()), usable=int(u), stale_share=float((g.dX == 0).sum() / max(u, 1))))
    return pd.DataFrame(rows)

def lagged(df, ycol, xcol, p=P):
    d = df.copy(); g = d.groupby("market_id")
    cols = []
    for c in [ycol, xcol]:
        for j in range(1, p + 1): d[f"{c}_l{j}"] = g[c].shift(j); cols.append(f"{c}_l{j}")
    d = d.dropna(subset=[ycol] + cols)
    X = sm.add_constant(pd.concat([d[cols], pd.get_dummies(d.market_id, drop_first=True, dtype=float)], axis=1))
    m = sm.OLS(d[ycol], X).fit(cov_type="cluster", cov_kwds={"groups": pd.factorize(d.time)[0]})
    xl = [f"{xcol}_l{j}" for j in range(1, p + 1)]
    f = m.f_test(", ".join(f"{c} = 0" for c in xl)); w = m.t_test(" + ".join(xl) + " = 0")
    ci = np.asarray(w.conf_int()).ravel()
    r = float(d[ycol].corr(d[f"{xcol}_l1"])); n = len(d); z = np.arctanh(r); se = 1 / np.sqrt(n - 3)
    return dict(n=int(n), F_p=float(f.pvalue), sum_coef=float(np.asarray(w.effect).ravel()[0]), sum_ci95=[float(ci[0]), float(ci[1])],
                lag1_corr=r, lag1_corr_ci95=[float(np.tanh(z - 1.96 * se)), float(np.tanh(z + 1.96 * se))])

def event_study(df, rng, thresh=5.0, spacing=24):
    df = df.reset_index(drop=True); g = df.groupby("market_id").y
    df["post"] = sum(g.shift(-k) for k in range(1, 5)); df["pre"] = sum(g.shift(k) for k in range(1, 5))
    elig = df.dropna(subset=["post", "pre"]); ev = []
    for mid, gg in elig[elig.dG.abs() >= thresh].groupby("market_id"):
        last = -10 ** 9
        for i in gg.index:
            if i - last >= spacing: ev.append(i); last = i
    E = df.loc[ev]; s = np.sign(E.dG).values
    res = dict(n_events=int(len(E)), post=float((s * E.post).mean()) if len(E) else None, pre=float((s * E.pre).mean()) if len(E) else None,
               same=float((s * E.y).mean()) if len(E) else None)
    if len(E) < 3: return res, E
    counts = E.market_id.value_counts(); pools = {m: elig.index[elig.market_id == m].values for m in counts.index}
    pl = {"post": [], "pre": []}
    for _ in range(1000):
        idx = np.concatenate([rng.choice(pools[m], c, replace=False) for m, c in counts.items()]); ss = rng.permutation(s)
        for k in pl: pl[k].append(float((ss * df.loc[idx, k].values).mean()))
    for k in pl:
        a = np.array(pl[k]); res[f"{k}_p"] = float(np.mean(np.abs(a - a.mean()) >= abs(res[k] - a.mean())))
    return res, E

def level_test(df, rng):
    d = df.copy(); g = d.groupby("market_id").y
    d["fwd"] = sum(g.shift(-k) for k in range(1, 5)); d["k"] = d.groupby("market_id").cumcount()
    d = d[(d.k % 4 == 0)].dropna(subset=["G", "fwd"])
    rho = float(spearmanr(d.G, d.fwd).statistic); mids = d.market_id.unique(); grp = {m: d[d.market_id == m] for m in mids}; bs = []
    for _ in range(1000):
        s = pd.concat([grp[m] for m in rng.choice(mids, len(mids), replace=True)]); bs.append(spearmanr(s.G, s.fwd).statistic)
    bs = np.array(bs); p = float(min(1, 2 * min(np.mean(bs <= 0), np.mean(bs >= 0))))
    return dict(n=int(len(d)), contracts=int(len(mids)), spearman=rho, ci95=[float(np.nanpercentile(bs, 2.5)), float(np.nanpercentile(bs, 97.5))], p=p)

def ccf(df, K=12):
    out = {}
    for k in range(-K, K + 1):
        yk = df.groupby("market_id").y.shift(-k); m = df.dG.notna() & yk.notna(); out[k] = round(float(np.corrcoef(df.dG[m], yk[m])[0, 1]), 3)
    return out

def holm(ps):
    ks = sorted(ps, key=ps.get); m = len(ks); out, mx = {}, 0
    for i, k in enumerate(ks): mx = max(mx, min(1, (m - i) * ps[k])); out[k] = mx
    return out

def study(vol_source, align="fixed"):
    rng = np.random.default_rng(SEED)
    df = build(vol_source, align); q = quality(df)
    keep = q[(q.stale_share <= .5) & (q.usable >= 30)].market_id
    d = df[df.market_id.isin(keep)].copy()
    for c in ["dX", "dM", "dG", "y"]: d[c] = d.groupby("market_id")[c].transform(lambda s: s.clip(*s.quantile([.01, .99])))
    t1 = lagged(d, "y", "dG"); t2 = lagged(d, "dX", "y"); t3 = lagged(d, "y", "dX")
    t4, E = event_study(d, rng); t5 = level_test(d, rng)
    cut = d.time.quantile(.7); ho = d[d.time >= cut]
    h1 = lagged(ho, "y", "dG"); h4, _ = event_study(ho.copy(), rng)
    E[["market_id", "time", "dG", "pre", "y", "post"]].to_csv(OUT / f"events_{vol_source}_{align}.csv", index=False)
    q.to_csv(OUT / f"quality_{vol_source}_{align}.csv", index=False)
    ps = {"1_gap_leads_btc": t1["F_p"], "2_btc_leads_odds": t2["F_p"], "3_odds_lead_btc": t3["F_p"],
          "4_event_post": t4.get("post_p", 1.0), "5_gap_level": t5["p"]}
    same_hour = float(d[["dX", "y"]].dropna().corr().iloc[0, 1]); same_hour_gap = float(d[["dG", "y"]].dropna().corr().iloc[0, 1])
    return dict(vol_source=vol_source, align=align, contracts_selected=int(q.shape[0]), contracts_used=int(len(keep)),
                usable_hour_pairs=int(d.dX.notna().sum()), median_stale_share=float(q.stale_share.median()),
                kinds_used=d.drop_duplicates("market_id").kind.value_counts().to_dict(),
                same_hour_corr_odds_btc=same_hour, same_hour_corr_gap_btc=same_hour_gap,
                t1_gap_leads_btc=t1, t2_btc_leads_odds=t2, t3_odds_lead_btc=t3, t4_events=t4, t5_gap_level=t5,
                holdout_from=str(cut), holdout_t1=h1, holdout_events=h4, ccf_gap_btc=ccf(d), p_raw=ps, p_holm=holm(ps))

if __name__ == "__main__":
    res = {"A_as_locked_dvol": study("dvol", "as_locked"), "B_timestamp_fixed_dvol": study("dvol", "fixed"),
           "C_timestamp_fixed_realized_vol": study("rv", "fixed")}
    json.dump(res, open(OUT / "summary.json", "w"), indent=1, default=str)
    for k, r in res.items():
        print("==", k, "contracts", r["contracts_used"], "pairs", r["usable_hour_pairs"], "stale med", round(r["median_stale_share"], 3), r["kinds_used"])
        print(" same-hour corr odds-btc", round(r["same_hour_corr_odds_btc"], 3), "gap-btc", round(r["same_hour_corr_gap_btc"], 3))
        for t in ["t1_gap_leads_btc", "t2_btc_leads_odds", "t3_odds_lead_btc"]:
            x = r[t]; print(" ", t, "n", x["n"], "p", round(x["F_p"], 4), "sum", round(x["sum_coef"], 4), [round(v, 4) for v in x["sum_ci95"]], "lag1r", round(x["lag1_corr"], 3), [round(v, 3) for v in x["lag1_corr_ci95"]])
        print("  events", r["t4_events"]); print("  level", r["t5_gap_level"])
        print("  holdout t1 p", round(r["holdout_t1"]["F_p"], 3), "sum", round(r["holdout_t1"]["sum_coef"], 4), "n", r["holdout_t1"]["n"], "| holdout events", r["holdout_events"])
        print("  ccf", {k2: v for k2, v in r["ccf_gap_btc"].items() if abs(k2) <= 3}); print("  holm", {k2: round(v, 4) for k2, v in r["p_holm"].items()})
