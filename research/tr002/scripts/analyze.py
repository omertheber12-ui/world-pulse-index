"""TR-002 analysis, exactly as pre-registered (PREREGISTRATION.md). Deterministic: seed 20261110."""
import json, pathlib, warnings
import numpy as np, pandas as pd, statsmodels.api as sm
warnings.filterwarnings("ignore")
R = pathlib.Path(__file__).resolve().parent.parent; D = R / "data"; O = R / "results"; O.mkdir(exist_ok=True)
SEED = 20261110; RNG = np.random.default_rng(SEED)
EQUITY = {"SPY", "FXI", "XRT", "META", "EWY", "ARGT"}
HS = [1, 4, 24]

def ts(s):
    t = pd.Timestamp(str(s).replace(" ", "T").replace("+00", "+00:00") if "+00" in str(s) and "+00:" not in str(s) else s)
    return t.tz_convert("UTC") if t.tzinfo else t.tz_localize("UTC")

# ---------- load ----------
markets = json.load(open(D / "markets.json"))["selected"]
odds = pd.read_csv(D / "odds.csv.gz"); odds["market_id"] = odds.market_id.astype(str)
ah = pd.read_csv(D / "assets_hourly.csv.gz"); ad = pd.read_csv(D / "assets_daily.csv.gz")
btc = pd.read_csv(D / "btc_hourly.csv.gz")

def hourly_series(sym):
    if sym == "BTCUSDT":
        return pd.Series(btc.close.values, index=pd.to_datetime(btc.t, unit="s", utc=True)).sort_index()
    a = ah[ah.sym == sym].copy()
    if a.empty: return None
    to = pd.to_datetime(a.t_open, unit="s", utc=True)
    tc = to + pd.Timedelta(hours=1)
    if sym in EQUITY:  # cap last bar at 16:00 New York
        ny = to.dt.tz_convert("America/New_York")
        cap = (ny.dt.normalize() + pd.Timedelta(hours=16)).dt.tz_convert("UTC")
        tc = tc.where(tc <= cap, cap)
    s = pd.Series(a.close.values, index=pd.DatetimeIndex(tc)).sort_index()
    return s[~s.index.duplicated(keep="last")]

def daily_series(sym):
    a = ad[ad.sym == sym.replace("_D", "")].copy()
    d = pd.to_datetime(a.t_open, unit="s", utc=True).dt.tz_convert("America/New_York").dt.normalize().dt.tz_localize(None)
    idx = pd.DatetimeIndex(d).tz_localize("UTC") + pd.Timedelta(hours=21)  # ASSUMPTION: daily close known by 21:00 UTC
    s = pd.Series(a.close.values, index=idx).sort_index(); return s[~s.index.duplicated(keep="last")]

def logit(p): p = np.clip(p, 0.01, 0.99); return np.log(p / (1 - p))

def winsor(s): lo, hi = s.quantile([0.01, 0.99]); return s.clip(lo, hi)

def build(m, sym, step):
    """Return per-bar frame for one market: t, p, x (dlogit), dp, y (log return), segment flag."""
    end = ts(m["endDate"])
    if m.get("closedTime"): end = min(end, ts(m["closedTime"]))
    start = max(ts(m["startDate"]) if m.get("startDate") else end - pd.Timedelta(days=180), end - pd.Timedelta(days=180))
    o = odds[odds.market_id == str(m["market_id"])]
    if o.empty: return None, None
    os_ = pd.Series(o.p.values, index=pd.to_datetime(o.t, unit="s", utc=True)).sort_index()
    a = hourly_series(sym) if step == "H" else daily_series(sym)
    if a is None or a.empty: return None, None
    a = a[(a.index >= start) & (a.index <= end + pd.Timedelta(hours=48))]
    if len(a) < 30: return None, None
    df = pd.DataFrame({"t": a.index, "c": a.values})
    # odds: last point at or before bar close, and no older than 2 hours (hourly) / 1 day (daily)
    oi = pd.DataFrame({"to": os_.index, "p": os_.values})
    df["t"] = df.t.astype("datetime64[ns, UTC]"); oi["to"] = oi.to.astype("datetime64[ns, UTC]")
    df = pd.merge_asof(df.sort_values("t"), oi.sort_values("to"), left_on="t", right_on="to", direction="backward")
    maxage = pd.Timedelta(hours=2) if step == "H" else pd.Timedelta(days=1)
    df.loc[(df.t - df.to) > maxage, "p"] = np.nan
    gap = df.t.diff()
    ok_gap = gap <= (pd.Timedelta(minutes=70) if step == "H" else pd.Timedelta(days=4))
    df["y"] = np.where(ok_gap, np.log(df.c).diff(), np.nan)
    inb = df.p.between(0.03, 0.97) & df.p.shift().between(0.03, 0.97)
    df["x"] = np.where(ok_gap & inb, logit(df.p).diff(), np.nan)
    df["dp"] = np.where(ok_gap & inb, df.p.diff(), np.nan)
    df["seg"] = np.where(df.t > end - pd.Timedelta(hours=24), "near", "main")
    df["market_id"] = str(m["market_id"]); df["event_id"] = str(m["event_id"])
    cover = (df.t <= end - pd.Timedelta(hours=24)).sum()
    return df, dict(start=start, end=end, cover=cover)

def choose_step(m):
    sym = m["primary"]
    if sym == "BTCUSDT": return "H"
    end = ts(m["endDate"])
    if m.get("closedTime"): end = min(end, ts(m["closedTime"]))
    start = max(ts(m["startDate"]) if m.get("startDate") else end - pd.Timedelta(days=180), end - pd.Timedelta(days=180))
    h = hourly_series(sym)
    if h is None: return "D"
    first = h.index.min()
    covered = max(pd.Timedelta(0), (end - max(start, first))) / max(end - start, pd.Timedelta(hours=1))
    return "H" if covered >= 0.5 else "D"

def prep_market(m, sym=None, step=None):
    sym = sym or m["primary"]; step = step or choose_step(m)
    df, info = build(m, sym, step)
    if df is None: return None
    main = df[df.seg == "main"].copy()
    v = main.dropna(subset=["x", "y"])
    if len(v) < 30 or v.x.abs().sum() == 0: return None
    for c in ("x", "y", "dp"):
        df.loc[df[c].notna(), c] = winsor(df[c].dropna())
    t0, t1 = main.t.min(), main.t.max(); cut = t0 + 0.7 * (t1 - t0)
    df["split"] = np.where(df.t <= cut, "train", "test")
    tr = df[(df.seg == "main") & (df.split == "train")].dropna(subset=["x", "y"])
    c = np.corrcoef(tr.x, tr.y)[0, 1] if len(tr) > 10 and tr.x.std() > 0 and tr.y.std() > 0 else np.nan
    s = 1.0 if not np.isfinite(c) or c >= 0 else -1.0
    sx, sy = tr.x.std(), tr.y.std()
    if not (sx > 0 and sy > 0): return None
    df["xa"] = s * df.x / sx; df["ys"] = df.y / sy; df["sign"] = s
    df["sx"] = sx; df["sy"] = sy; df["step"] = step; df["sym"] = sym
    # forward sums (next h bars within market, consecutive rows)
    for h in HS:
        df[f"yf{h}"] = sum(df.ys.shift(-k) for k in range(1, h + 1))
        df[f"xf{h}"] = sum(df.xa.shift(-k) for k in range(1, h + 1))
    for k in range(1, 5):
        df[f"xl{k}"] = df.xa.shift(k); df[f"yl{k}"] = df.ys.shift(k)
    return df

def demean(df, cols):
    return df[cols] - df.groupby("market_id")[cols].transform("mean")

def ols_hac(df, ycol, xcols, lags):
    d = df.dropna(subset=[ycol] + xcols)
    if len(d) < 50: return None
    Y = demean(d, [ycol])[ycol]; X = demean(d, xcols)
    r = sm.OLS(Y.values, X.values).fit(cov_type="HAC", cov_kwds=dict(maxlags=lags))
    return dict(coef=float(r.params[0]), se=float(r.bse[0]), t=float(r.tvalues[0]), p=float(r.pvalues[0]), n=int(len(d)),
                ci=[float(r.params[0] - 1.96 * r.bse[0]), float(r.params[0] + 1.96 * r.bse[0])], r=r, X=X)

def granger(df, ycol, xcol):
    xl = [f"{xcol}l{k}" for k in range(1, 5)]; yl = [f"{ycol}l{k}" for k in range(1, 5)]
    tgt = "ys" if ycol == "y" else "xa"
    d = df.dropna(subset=[tgt] + xl + yl)
    if len(d) < 80: return None
    Y = demean(d, [tgt])[tgt]; X = demean(d, xl + yl)
    r = sm.OLS(Y.values, X.values).fit(cov_type="HAC", cov_kwds=dict(maxlags=4))
    R_ = np.zeros((4, 8)); R_[np.arange(4), np.arange(4)] = 1
    w = r.wald_test(R_, scalar=True)
    return dict(F=float(w.statistic), p=float(w.pvalue), n=int(len(d)))

def rename_lags(df):
    d = df.copy()
    for k in range(1, 5): d[f"xal{k}"] = d[f"xl{k}"]; d[f"ysl{k}"] = d[f"yl{k}"]
    return d

def jumps(df, col_val, thr_abs=None, k=3.0, sep=24):
    """Big moves in one market: returns row positions. Odds: |dp|>=0.05 and |dlogit|>=3 trailing sd. Asset: |r|>=3 trailing sd."""
    d = df.reset_index(drop=True)
    sd = d[col_val].shift(1).rolling(168, min_periods=48).std()
    cond = (d[col_val].abs() >= k * sd)
    if thr_abs is not None: cond &= d.dp.abs() >= thr_abs
    idx = list(d.index[cond.fillna(False)]); out, last = [], -10**9
    for i in idx:
        if i - last >= sep: out.append(i); last = i
    return out

def car(d, i, a, b, col="ys"):
    """Sum of abnormal values over bars i+a..i+b (abnormal = value minus trailing 168-bar mean)."""
    mu = d[col].shift(1).rolling(168, min_periods=24).mean()
    lo, hi = i + a, i + b
    if lo < 0 or hi >= len(d): return np.nan
    seg = d[col].iloc[lo:hi + 1] - mu.iloc[i]
    return float(seg.sum()) if seg.notna().sum() == len(seg) else np.nan

def event_study(frames, split, shift=0):
    """Sign-aligned abnormal asset move (in units of the asset's hourly sd and in percent) after/before big odds jumps."""
    ev = []
    for df in frames:
        d = df[(df.seg == "main") & (df.split == split)].reset_index(drop=True) if split else df[df.seg == "main"].reset_index(drop=True)
        if shift:
            d = d.copy(); d["x"] = d.x.shift(shift); d["dp"] = d.dp.shift(shift); d["xa"] = d.xa.shift(shift)
        for i in jumps(d, "x", thr_abs=0.05):
            sgn = np.sign(d.x.iloc[i]) * d.sign.iloc[i]
            post = car(d, i, 1, 4); pre = car(d, i, -24, -1)
            ev.append(dict(market_id=d.market_id.iloc[i], event_id=d.event_id.iloc[i], t=d.t.iloc[i], dp=float(d.dp.iloc[i]),
                           post=sgn * post if np.isfinite(post) else np.nan, pre=sgn * pre if np.isfinite(pre) else np.nan,
                           post_pct=100 * sgn * post * d.sy.iloc[i] if np.isfinite(post) else np.nan,
                           pre_pct=100 * sgn * pre * d.sy.iloc[i] if np.isfinite(pre) else np.nan, i=i))
    e = pd.DataFrame(ev)
    if e.empty: return e
    # de-duplicate within event: jumps within 24 hours count once (largest |dp| kept)
    e = e.sort_values(["event_id", "t"]); keep = []
    for _, g in e.groupby("event_id"):
        g = g.sort_values("t"); cl = []; cur = None
        for _, r in g.iterrows():
            if cur is None or (r.t - cur[-1].t) > pd.Timedelta(hours=24): cur = [r]; cl.append(cur)
            else: cur.append(r)
        keep += [max(c, key=lambda r: abs(r.dp)) for c in cl]
    return pd.DataFrame(keep).reset_index(drop=True)

def mean_test(v):
    v = pd.Series(v).dropna()
    if len(v) < 3: return dict(mean=np.nan, se=np.nan, t=np.nan, p=np.nan, n=int(len(v)))
    m, se = v.mean(), v.std(ddof=1) / np.sqrt(len(v)); t = m / se if se > 0 else np.nan
    from scipy import stats
    p = 2 * (1 - stats.t.cdf(abs(t), len(v) - 1)) if np.isfinite(t) else np.nan
    return dict(mean=float(m), se=float(se), t=float(t), p=float(p), n=int(len(v)), ci=[float(m - 1.96 * se), float(m + 1.96 * se)])

def shuffled_placebo(frames, ev, n=1000):
    """Draw the same number of random times per market (train, main), random sign from the real event, compare post means."""
    if ev.empty: return dict(pct=np.nan)
    pools = {}
    for df in frames:
        d = df[(df.seg == "main") & (df.split == "train")].reset_index(drop=True)
        pools[d.market_id.iloc[0] if len(d) else None] = d
    real = ev.post.mean(); draws = []
    cnt = ev.groupby("market_id").size()
    for _ in range(n):
        vals = []
        for mid, c in cnt.items():
            d = pools.get(mid)
            if d is None or len(d) < 60: continue
            for i in RNG.integers(24, len(d) - 5, size=c):
                v = car(d, int(i), 1, 4)
                if np.isfinite(v): vals.append(v * RNG.choice([-1, 1]))
        draws.append(np.mean(vals) if vals else np.nan)
    draws = np.array(draws); draws = draws[np.isfinite(draws)]
    return dict(real=float(real), pct=float((draws < real).mean()), placebo_mean=float(draws.mean()), p95=float(np.quantile(draws, 0.95)), n=int(len(draws)))

def reverse_event(frames, split):
    out = []
    for df in frames:
        d = df[(df.seg == "main") & (df.split == split)].reset_index(drop=True)
        for i in jumps(d, "y", thr_abs=None):
            sgn = np.sign(d.y.iloc[i]) * d.sign.iloc[i]
            post = car(d, i, 1, 4, col="xa"); pre = car(d, i, -24, -1, col="xa")
            out.append(dict(post=sgn * post if np.isfinite(post) else np.nan, pre=sgn * pre if np.isfinite(pre) else np.nan))
    e = pd.DataFrame(out)
    return dict(post=mean_test(e.post) if len(e) else None, pre=mean_test(e.pre) if len(e) else None, n=int(len(e)))

def xcorr(frames, K=24):
    d = pd.concat([f[(f.seg == "main") & (f.split == "train")] for f in frames])
    out = {}
    for k in range(-K, K + 1):
        vals = []
        for _, g in d.groupby("market_id"):
            g = g.reset_index(drop=True); a = g.xa; b = g.ys.shift(-k)
            m = a.notna() & b.notna()
            if m.sum() > 30: vals.append((a[m] * b[m]).sum() / np.sqrt((a[m] ** 2).sum() * (b[m] ** 2).sum()) * 1.0)
        out[k] = float(np.nanmean(vals)) if vals else np.nan
    return out

def holm(ps):
    ps = np.array([1.0 if (p is None or not np.isfinite(p)) else p for p in ps]); m = len(ps); order = np.argsort(ps)
    adj = np.empty(m); run = 0
    for r, i in enumerate(order):
        run = max(run, min(1, (m - r) * ps[i])); adj[i] = run
    return adj

def run_type(frames, label):
    res = dict(n_markets=len(frames), n_events=len({f.event_id.iloc[0] for f in frames}))
    if not frames: return res, {}
    panel = rename_lags(pd.concat(frames, ignore_index=True))
    tr = panel[(panel.seg == "main") & (panel.split == "train")]; te = panel[(panel.seg == "main") & (panel.split == "test")]
    near = panel[panel.seg == "near"]
    res["n_bars_train"] = int(tr.dropna(subset=["xa", "ys"]).shape[0]); res["n_bars_test"] = int(te.dropna(subset=["xa", "ys"]).shape[0])
    tests = {}
    for h in HS:
        a = ols_hac(tr, f"yf{h}", ["xa", "ys"], max(h, 4)); tests[f"lead_odds_to_asset_h{h}"] = a
        b = ols_hac(tr, f"xf{h}", ["ys", "xa"], max(h, 4)); tests[f"lead_asset_to_odds_h{h}"] = b
        res[f"heldout_lead_odds_to_asset_h{h}"] = strip(ols_hac(te, f"yf{h}", ["xa", "ys"], max(h, 4)))
        res[f"heldout_lead_asset_to_odds_h{h}"] = strip(ols_hac(te, f"xf{h}", ["ys", "xa"], max(h, 4)))
    tests["granger_odds_to_asset"] = granger(tr, "y", "xa"); tests["granger_asset_to_odds"] = granger(tr, "xa", "ys")
    ev = event_study(frames, "train"); ev_te = event_study(frames, "test")
    tests["event_post_1_4"] = mean_test(ev.post) if len(ev) else None
    tests["event_pre_24_1"] = mean_test(ev.pre) if len(ev) else None
    res["event_post_pct"] = mean_test(ev.post_pct) if len(ev) else None
    res["event_pre_pct"] = mean_test(ev.pre_pct) if len(ev) else None
    res["event_heldout_post"] = mean_test(ev_te.post) if len(ev_te) else None
    res["event_heldout_post_pct"] = mean_test(ev_te.post_pct) if len(ev_te) else None
    res["n_jump_events_dedup_train"] = int(len(ev)); res["n_jump_events_dedup_test"] = int(len(ev_te))
    res["placebo_shuffled"] = shuffled_placebo(frames, ev) if len(ev) else None
    ev_shift = event_study(frames, "train", shift=168)
    res["placebo_timeshift_post"] = mean_test(ev_shift.post) if len(ev_shift) else None
    res["reverse_event_asset_jumps"] = reverse_event(frames, "train")
    tests["near_lead_odds_to_asset_h1"] = ols_hac(near, "yf1", ["xa", "ys"], 4)
    tests["near_lead_asset_to_odds_h1"] = ols_hac(near, "xf1", ["ys", "xa"], 4)
    # simple same-bar correlation (exploratory) and cross-correlation
    res["same_bar_corr_train"] = float(np.corrcoef(tr.dropna(subset=["xa", "ys"]).xa, tr.dropna(subset=["xa", "ys"]).ys)[0, 1])
    res["xcorr_train"] = xcorr(frames)
    if len(ev): ev.assign(type=label).to_csv(O / f"events_{label}.csv", index=False)
    return res, {k: strip(v) for k, v in tests.items()}

def strip(v):
    if v is None: return None
    return {k: x for k, x in v.items() if k not in ("r", "X")}

if __name__ == "__main__":
    by_type = {"E": [], "P": [], "C": []}; daily_by_type = {"E": [], "P": [], "C": []}; quality = []
    for m in markets:
        step = choose_step(m)
        df = prep_market(m, step=step)
        o = odds[odds.market_id == str(m["market_id"])]
        q = dict(type=m["type"], market_id=m["market_id"], event=m["event_title"], question=m["question"], volume=m["market_volume"],
                 primary=m["primary"], step=step, odds_points=int(len(o)))
        if df is None: q["used"] = False; quality.append(q); continue
        mm = df[df.seg == "main"]; v = mm.dropna(subset=["x", "y"])
        q.update(used=True, bars_main=int(len(mm)), usable_pairs=int(len(v)), share_zero_odds_change=float((v.x == 0).mean()),
                 share_zero_asset_return=float((v.y == 0).mean()), share_bars_odds_outside_3_97=float(1 - mm.p.between(0.03, 0.97).mean()),
                 sign=float(df.sign.iloc[0]))
        quality.append(q)
        (by_type if step == "H" else daily_by_type)[m["type"]].append(df)
    pd.DataFrame(quality).to_csv(O / "data_quality.csv", index=False)
    results, pvals, names = {}, [], []
    for T in ["E", "P", "C"]:
        res, tests = run_type(by_type[T], T)
        results[T] = dict(summary=res, tests=tests)
        for k in ["lead_odds_to_asset_h1", "lead_odds_to_asset_h4", "lead_odds_to_asset_h24", "lead_asset_to_odds_h1", "lead_asset_to_odds_h4",
                  "lead_asset_to_odds_h24", "granger_odds_to_asset", "granger_asset_to_odds", "event_post_1_4", "event_pre_24_1",
                  "near_lead_odds_to_asset_h1", "near_lead_asset_to_odds_h1"]:
            names.append((T, k)); t = tests.get(k); pvals.append(t["p"] if t else None)
    adj = holm(pvals)
    for (T, k), a in zip(names, adj):
        if results[T]["tests"].get(k) is not None: results[T]["tests"][k]["p_holm"] = float(a)
    # decision per type
    for T in ["E", "P", "C"]:
        s, t = results[T]["summary"], results[T]["tests"]
        lead_pass = [h for h in HS if t.get(f"lead_odds_to_asset_h{h}") and t[f"lead_odds_to_asset_h{h}"]["coef"] > 0 and t[f"lead_odds_to_asset_h{h}"]["p_holm"] < 0.05]
        rev_pass = [h for h in HS if t.get(f"lead_asset_to_odds_h{h}") and t[f"lead_asset_to_odds_h{h}"]["coef"] > 0 and t[f"lead_asset_to_odds_h{h}"]["p_holm"] < 0.05]
        ev_post, pl = t.get("event_post_1_4"), s.get("placebo_shuffled") or {}
        ep = s.get("event_post_pct") or {}
        nev = s.get("n_jump_events_dedup_train", 0)
        yes = bool(lead_pass) and ev_post and ev_post["mean"] > 0 and (ep.get("mean") or 0) >= 0.10 and pl.get("pct", 0) >= 0.95 \
              and not (t.get("event_pre_24_1") and t["event_pre_24_1"]["mean"] > 0 and t["event_pre_24_1"]["p"] < 0.05) \
              and all((s.get(f"heldout_lead_odds_to_asset_h{h}") or {}).get("coef", -1) > 0 for h in lead_pass) and nev >= 30 and s["n_markets"] >= 3
        l1 = t.get("lead_odds_to_asset_h1")
        no = (not lead_pass and l1 is not None and l1["ci"][1] < 0.05) or (bool(rev_pass) and not lead_pass)
        insufficient = s.get("n_markets", 0) < 3 or nev < 30
        # Pre-registration section 9: NO does not require the event count; the 30-event minimum applies to YES (and makes everything else INCONCLUSIVE)
        results[T]["decision"] = "YES" if yes else ("NO" if no else "INCONCLUSIVE")
        results[T]["decision_inputs"] = dict(lead_pass=lead_pass, reverse_pass=rev_pass, insufficient_sample=insufficient)
    # exploratory: daily-step markets per type (1-day lead and reverse)
    expl = {}
    for T in ["E", "P", "C"]:
        fr = daily_by_type[T]
        if fr:
            p = rename_lags(pd.concat(fr, ignore_index=True)); tr = p[(p.seg == "main")]
            expl[f"daily_{T}"] = dict(n_markets=len(fr), lead=strip(ols_hac(tr, "yf1", ["xa", "ys"], 4)), reverse=strip(ols_hac(tr, "xf1", ["ys", "xa"], 4)))
    # exploratory: per-election lead/lag (hourly), and US election secondary assets (daily)
    per = []
    for T in ["E", "P", "C"]:
        for ev_id, grp in pd.Series(by_type[T]).groupby([f.event_id.iloc[0] for f in by_type[T]]) if by_type[T] else []:
            fr = list(grp); p = rename_lags(pd.concat(fr, ignore_index=True)); tr = p[(p.seg == "main") & (p.split == "train")]
            a = strip(ols_hac(tr, "yf1", ["xa", "ys"], 4)); b = strip(ols_hac(tr, "xf1", ["ys", "xa"], 4))
            mk = next(m for m in markets if str(m["event_id"]) == str(ev_id))
            per.append(dict(type=T, event=mk["event_title"], asset=mk["primary"], markets=len(fr), lead_coef=a and a["coef"], lead_p=a and a["p"],
                            rev_coef=b and b["coef"], rev_p=b and b["p"], n=a and a["n"],
                            same_bar_corr=float(np.corrcoef(tr.dropna(subset=['xa','ys']).xa, tr.dropna(subset=['xa','ys']).ys)[0, 1])))
    pd.DataFrame(per).to_csv(O / "per_event_exploratory.csv", index=False)
    us = [m for m in markets if m["primary"] == "BTCUSDT"]
    sec = {}
    for sym in ["SPY_D", "MXN=X_D"]:
        fr = [f for f in (prep_market(m, sym=sym, step="D") for m in us) if f is not None]
        if fr:
            p = rename_lags(pd.concat(fr, ignore_index=True)); tr = p[p.seg == "main"]
            sec[sym] = dict(n_markets=len(fr), lead=strip(ols_hac(tr, "yf1", ["xa", "ys"], 4)), reverse=strip(ols_hac(tr, "xf1", ["ys", "xa"], 4)),
                            near_same_day_corr=None)
    expl["us_election_secondary_daily"] = sec
    # robustness: percentage-point odds changes instead of log-odds (1-bar lead, both directions), hourly markets
    rob = {}
    for T in ["E", "P", "C"]:
        if not by_type[T]: continue
        p = pd.concat(by_type[T], ignore_index=True)
        p["dps"] = p.sign * p.dp / p.groupby("market_id").dp.transform("std")
        p["dpf1"] = p.groupby("market_id").dps.shift(-1)
        tr = p[(p.seg == "main") & (p.split == "train")]
        rob[T] = dict(lead=strip(ols_hac(tr, "yf1", ["dps", "ys"], 4)), reverse=strip(ols_hac(tr, "dpf1", ["ys", "dps"], 4)))
    expl["robust_percentage_points"] = rob
    # US election: the final days including election night (hourly Bitcoin vs Trump odds), descriptive cross-correlation
    trump = next(m for m in markets if m["primary"] == "BTCUSDT" and "Donald Trump" in m["question"])
    f = prep_market(trump)
    w = f[(f.t >= pd.Timestamp("2024-11-05 12:00", tz="UTC")) & (f.t <= pd.Timestamp("2024-11-06 12:00", tz="UTC"))].reset_index(drop=True)
    cc = {}
    for k in range(-3, 4):
        a, b = w.x, w.y.shift(-k); mk = a.notna() & b.notna()
        cc[k] = float(np.corrcoef(a[mk], b[mk])[0, 1]) if mk.sum() > 5 else None
    w[["t", "p", "c"]].to_csv(O / "us_election_night_hourly.csv", index=False)
    expl["us_election_night_xcorr_positive_k_means_odds_first"] = dict(n_hours=int(len(w)), xcorr=cc)
    out = dict(seed=SEED, tests_counted=len(pvals), results=results, exploratory=expl)
    json.dump(out, open(O / "results.json", "w"), indent=1, default=str)
    for T in ["E", "P", "C"]:
        s, t = results[T]["summary"], results[T]["tests"]
        print(f"== {T}: decision {results[T]['decision']} | markets {s.get('n_markets')} events {s.get('n_events')} bars train {s.get('n_bars_train')} test {s.get('n_bars_test')} jumps {s.get('n_jump_events_dedup_train')}/{s.get('n_jump_events_dedup_test')}")
        for k, v in t.items():
            if v: print(f"   {k:30s} coef/mean {v.get('coef', v.get('mean', v.get('F'))):+.4f} p {v['p']:.4f} holm {v.get('p_holm', float('nan')):.4f} n {v['n']}")
        print("   same-bar corr", round(s.get("same_bar_corr_train", np.nan), 4), "event post %", s.get("event_post_pct"), "pre %", s.get("event_pre_pct"))
        print("   placebo", s.get("placebo_shuffled"), "timeshift", s.get("placebo_timeshift_post"))
        print("   reverse events", s.get("reverse_event_asset_jumps"))
        print("   heldout h1", s.get("heldout_lead_odds_to_asset_h1"), "rev", s.get("heldout_lead_asset_to_odds_h1"))
    print(json.dumps(expl, indent=1, default=str)[:3000])
