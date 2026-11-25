"""TR-007 step 4: confirmation on days after the unused gap, for pairs locked in run*/locked_patterns.json only."""
import json, os, numpy as np, pandas as pd
from common import *
OUTD = os.path.join(HERE, 'run' if not RAW else 'run_sensitivity_raw_prices')
J = json.load(open(os.path.join(OUTD, 'locked_patterns.json')))
assets = {'oil': load_oil()[0], 'bitcoin': load_btc()[0]}; trades = load_trades()
med = lambda s: float(np.median(s)) if len(s) else np.nan
def fires(c, L, O): return (c >= L) if L > O else ((c <= L) if L < O else np.zeros(len(c), bool))
def extra(s, f): return s[f].mean() - s[~f].mean()
res = {}
for key, P in J['pairs'].items():
    if P['status'] != 'locked': continue
    K = P['lock']; w = K['lead_window']; dsg = K['d']; L, O = K['L'], K['O']; dirn = K['locked_direction']
    d = assets[P['asset']]; conf = add_odds(d[d.slice == 'confirmation'].copy(), Odds(P['market_id'], trades))
    assert (conf.cap_prior_days >= 252).all()
    ev = conf[conf['chg_' + w].notna() & conf.ret.notna()].reset_index(drop=True); n = len(ev)
    c = ev['chg_' + w].to_numpy(); f = fires(c, L, O); s = dsg * ev.ret_capped.to_numpy(); raw_s = dsg * ev.ret.to_numpy()
    R = dict(evaluable=n, firing_all_days=int(f.sum()))
    # independent firing days (same spacing, earliest first)
    last, ind = -10**9, np.zeros(n, bool)
    for i in np.where(f)[0]:
        if ev.tidx[i] - last > SPACING[w]: ind[i] = True; last = ev.tidx[i]
    R['firing_independent'] = int(ind.sum())
    R['big_move_count_independent'] = int((raw_s[ind] >= 1.0).sum())
    R['big_move_rate_independent_pct'] = 100 * R['big_move_count_independent'] / R['firing_independent'] if ind.sum() else None
    R['big_move_rate_all_firing_pct'] = 100 * float((raw_s[f] >= 1).mean()) if f.sum() else None
    R['big_move_rate_not_firing_pct'] = 100 * float((raw_s[~f] >= 1).mean()) if (~f).sum() else None
    real = extra(s, f) if 0 < f.sum() < n else np.nan; R['extra_average_pp'] = real
    # reverse check: non-overlapping confirmation large days in locked direction vs ordinary days
    cf = conf['chg_' + w].notna(); ldays = conf[conf['indep_' + w] & (conf.kind == dirn) & cf]; odays = conf[(conf.kind == 'ordinary') & cf]
    gap = med(ldays['chg_' + w]) - med(odays['chg_' + w]); R.update(reverse_gap=gap, reverse_n_large=len(ldays), reverse_n_ordinary=len(odays))
    R['reverse_pass'] = bool(np.sign(gap) == np.sign(K['discovery_gap']) and abs(gap) >= 0.5)
    # asset-first: after-window (ending 00:00 NY on D+1) vs before-window, same days where both are fresh
    aw = 'after_' + w; both = conf[conf['chg_' + w].notna() & conf[aw].notna()]
    bl = both[both['indep_' + w] & (both.kind == dirn)]; bo = both[both.kind == 'ordinary']
    g_before = med(bl['chg_' + w]) - med(bo['chg_' + w]); g_after = med(bl[aw]) - med(bo[aw])
    R.update(asset_first_gap_before=g_before, asset_first_gap_after=g_after, asset_first_stronger=bool(abs(g_after) > abs(g_before)))
    # clash
    fu = fires(c, K['up_rule']['L'], O); fd = fires(c, K['down_rule']['L'], O); R['conflict_share_pct'] = 100 * float((fu & fd).mean())
    # luck checks
    if n >= 30 and not np.isnan(real):
        rng = np.random.default_rng(SEED); ks = rng.integers(5, n - 5, size=1000, endpoint=True)
        pl = np.array([extra(s, np.roll(f, k)) for k in ks])
        R['placebo_share_beaten_pct'] = 100 * float((pl < real).mean()); R['p_value'] = (1 + int((pl >= real).sum())) / 1001
        rng2 = np.random.default_rng(SEED); sh = np.array([extra(s, rng2.permutation(f)) for _ in range(1000)])
        R['old_shuffle_share_beaten_pct'] = 100 * float((sh < real).mean())
        rng3 = np.random.default_rng(SEED); boots, redraw = [], 0; nb = int(np.ceil(n / 7))
        while len(boots) < 2000:
            st = rng3.integers(0, n - 7, size=nb, endpoint=True); idx = (st[:, None] + np.arange(7)).ravel()[:n]
            fb = f[idx]
            if fb.all() or not fb.any(): redraw += 1; continue
            boots.append(extra(s[idx], fb))
        R['likely_low'], R['likely_high'] = float(np.percentile(boots, 2.5)), float(np.percentile(boots, 97.5)); R['bootstrap_redrawn'] = redraw
    R['raw_confirmation_large_days'] = int((conf.kind != 'ordinary').sum())
    ev.assign(fires=f, independent_fire=ind, signed_capped=s).to_csv(os.path.join(OUTD, f"confirmation_days_{key.replace('|', '_')}.csv"), index=False)
    res[key] = R
# Benjamini-Hochberg across pairs that reached a forward test, q = 0.10
fam = sorted([(R['p_value'], k) for k, R in res.items() if 'p_value' in R]); m = len(fam); kmax = 0
for i, (p, k) in enumerate(fam, 1):
    if p <= i / m * 0.10: kmax = i
for i, (p, k) in enumerate(fam, 1): res[k]['bh_pass'] = i <= kmax; res[k]['bh_family_size'] = m
json.dump(res, open(os.path.join(OUTD, 'confirmation_results.json'), 'w'), indent=1, default=float)
print(json.dumps(res, indent=1, default=float)); print('pairs confirmed', len(res))
