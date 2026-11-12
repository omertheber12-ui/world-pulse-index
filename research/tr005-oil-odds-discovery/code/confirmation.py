"""Step 8: confirmation on last 30% of big oil days, using ONLY locked_pick.json."""
import json, os, numpy as np, pandas as pd, warnings; warnings.filterwarnings('ignore')
from common import *
P = json.load(open(os.path.join(HERE, 'locked_pick.json')))
s_all, info = oil(); s = s_all[s_all.slice == 'confirmation'].reset_index(drop=True)
arr = trades()[P['market_id']]; w = P['window']; rng = np.random.default_rng(SEED)
out = dict(locked_pick=P, same_day_only=P['same_day_only'])
n_conf_raw = int((s.kind != 'ordinary').sum())
# 1) reverse check
keep = nonoverlap_mask(s, GAP[w]); sub = s[keep].copy()
v = [window(arr, D, w) for D in sub.date]; sub['lvl'] = [x[0] for x in v]; sub['chg'] = [x[1] for x in v]; sub = sub.dropna(subset=['chg'])
rev = {}
for k in ['up', 'down', 'ordinary']:
    g = sub[sub.kind == k]
    rev[k] = dict(n=len(g), median_level=float(g.lvl.median()) if len(g) else None,
                  modal_band=g.lvl.map(band).mode().sort_values().iloc[0] if len(g) else None,
                  median_change=float(g.chg.median()) if len(g) else None)
for k in ['up', 'down']:
    rev[f'gap_{k}_vs_ordinary'] = (rev[k]['median_change'] - rev['ordinary']['median_change']) if rev[k]['n'] and rev['ordinary']['n'] else None
d = P['winning_direction']; dg = P[f'discovery_gap_{d}']; cg = rev[f'gap_{d}_vs_ordinary']
rev['winning_direction'] = d; rev['discovery_gap'] = dg; rev['confirmation_gap'] = cg
rev['same_sign'] = None if cg is None else bool(np.sign(cg) == np.sign(dg) and cg != 0)
rev['near_zero'] = None if cg is None else bool(abs(cg) < 0.5)
rev['n_big_raw_confirmation'] = n_conf_raw; rev['n_big_nonoverlap_confirmation'] = int((keep & (s.kind != 'ordinary').values).sum())
out['reverse_check'] = rev
# 2) forward check (only if lead window)
def fires(c):
    u = d_ = False; oc = P['ordinary_change']
    for name, val in [('up', P['up_change']), ('down', P['down_change'])]:
        f = (c >= val) if val > oc else ((c <= val) if val < oc else False)
        if name == 'up': u = f
        else: d_ = f
    return u, d_
if not P['same_day_only']:
    f = s.copy(); f['chg'] = [window(arr, D, w)[1] for D in f.date]; f = f.dropna(subset=['chg', 'ret_cap'])
    fu, fd = zip(*[fires(c) for c in f.chg]); f['fu'], f['fd'] = fu, fd
    conflicts = int((f.fu & f.fd).sum())
    f['sign'] = np.where(f.fu & ~f.fd, 1, np.where(f.fd & ~f.fu, -1, 0))
    f = f[~(f.fu & f.fd)]
    fire, nof = f[f.sign != 0], f[f.sign == 0]
    def extra(sign_arr, ret_fire, ret_nof): return float(np.mean(sign_arr * (ret_fire - np.mean(ret_nof))))
    ex = extra(fire.sign.values, fire.ret_cap.values, nof.ret_cap.values) if len(fire) and len(nof) else None
    boots = []
    if ex is not None:
        for _ in range(2000):
            i = rng.integers(0, len(fire), len(fire)); j = rng.integers(0, len(nof), len(nof))
            boots.append(extra(fire.sign.values[i], fire.ret_cap.values[i], nof.ret_cap.values[j]))
    lo, hi = (float(np.percentile(boots, 2.5)), float(np.percentile(boots, 97.5))) if boots else (None, None)
    hit = float(np.mean(fire.sign.values * fire.ret.values >= 1.0)) if len(fire) else None
    pu = float(np.mean(fire.sign == 1)) if len(fire) else 0
    base = float(pu * np.mean(nof.ret >= 1.0) + (1 - pu) * np.mean(nof.ret <= -1.0)) if len(nof) else None
    # 3) placebo
    pl = []
    if ex is not None:
        allr = f.ret_cap.values; sg = fire.sign.values
        for _ in range(1000):
            idx = rng.permutation(len(f)); fi, ni = idx[:len(fire)], idx[len(fire):]
            pl.append(extra(sg, allr[fi], allr[ni]))
    rank = float(np.mean(np.array(pl) < ex)) if pl else None
    out['forward_check'] = dict(n_evaluable_days=len(f) + conflicts, n_fire=len(fire), n_fire_up=int((fire.sign == 1).sum()), n_fire_down=int((fire.sign == -1).sum()),
        n_no_fire=len(nof), n_conflict_dropped=conflicts, extra_average_pct_points=ex, likely_range_95=[lo, hi],
        mean_signed_return_fire=float(np.mean(fire.sign * fire.ret_cap)) if len(fire) else None,
        hit_rate_1pct_fire=hit, hit_rate_1pct_nofire_same_mix=base,
        placebo_share_below_real=rank, placebo_beats_95=None if rank is None else bool(rank >= 0.95))
    # 4) oil-first check
    def gaps(shift):
        g = s[keep].copy(); g['chg'] = [window(arr, D, w, shift)[1] for D in g.date]; g = g.dropna(subset=['chg'])
        o = g[g.kind == 'ordinary'].chg.median(); b = g[g.kind == d].chg.median()
        return float(b - o), int((g.kind == d).sum())
    gb, nb = gaps(0); ga, na = gaps(1)
    out['oil_first_check'] = dict(direction=d, before_gap=gb, n_before=nb, after_gap=ga, n_after=na, oil_first_stronger=bool(abs(ga) > abs(gb)))
# verdict
r = out['reverse_check']; fw = out.get('forward_check', {}); of = out.get('oil_first_check', {})
if P['same_day_only']:
    verdict = 'NO' if (P['best_day_before_score'] <= 1 and P['best_week_before_score'] <= 1) else 'UNCLEAR'
elif n_conf_raw < 30: verdict = 'UNCLEAR'
else:
    no = (r['same_sign'] is False) or r['near_zero'] or (fw.get('extra_average_pct_points') is not None and (fw['extra_average_pct_points'] < 0 or fw['likely_range_95'][1] < 0.20))
    yes = (r['same_sign'] and not r['near_zero'] and fw.get('extra_average_pct_points', -1) > 0 and fw.get('placebo_beats_95') and not of.get('oil_first_stronger'))
    verdict = 'NO' if no else ('YES' if yes else 'UNCLEAR')
out['verdict'] = verdict; out['n_big_raw_confirmation'] = n_conf_raw; out['seed'] = SEED
json.dump(out, open(os.path.join(HERE, 'confirmation_summary.json'), 'w'), indent=1, default=str)
print(json.dumps({k: v for k, v in out.items() if k != 'locked_pick'}, indent=1, default=str))
