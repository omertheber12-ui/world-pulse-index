"""TR-007 step 3: discovery and locking. Uses ONLY discovery-slice days. Writes run/locked_patterns.json.
No confirmation-slice return or odds value is read here."""
import json, os, numpy as np, pandas as pd
from common import *
OUTD = os.path.join(HERE, 'run' if not RAW else 'run_sensitivity_raw_prices'); os.makedirs(OUTD, exist_ok=True)
oil, oinfo = load_oil(); btc, binfo = load_btc()
assets = {'oil': (oil, oinfo), 'bitcoin': (btc, binfo)}
# reproduce the audit's asset-day file exactly
for a, f in (('oil', 'oil_days_audit.csv'), ('bitcoin', 'bitcoin_days_audit.csv')):
    au = pd.read_csv(os.path.join(HERE, f), parse_dates=['date']); d = assets[a][0]
    assert len(au) == len(d) and (au.date.values == d.date.values).all() and (au.kind.values == d.kind.values).all()
    assert (au.slice.values == d.slice.values).all() and (au.indep_day_before.values == d.indep_day_before.values).all() and (au.indep_week_before.values == d.indep_week_before.values).all()
elig = pd.read_csv(os.path.join(HERE, 'eligibility_by_pair.csv'), dtype={'event_id': str, 'market_id': str})
trades = load_trades(); events = load_events()
med = lambda s: float(np.median(s)) if len(s) else np.nan
locked, detail = {}, []
for e in events:
    od = Odds(e['chosen_market_id'], trades)
    for a, (dall, info) in assets.items():
        disc = add_odds(dall[dall.slice == 'discovery'].copy(), od)      # discovery rows only
        key = f"{a}|{e['event_id']}"; P = dict(asset=a, event_id=e['event_id'], market_id=e['chosen_market_id'], windows={})
        for w in SPACING:
            c = disc['chg_' + w]; fr = c.notna(); ind = disc['indep_' + w]
            up = disc[ind & (disc.kind == 'up') & fr]; dn = disc[ind & (disc.kind == 'down') & fr]; orr = disc[(disc.kind == 'ordinary') & fr]
            er = elig[(elig.asset == a) & (elig.event_id == e['event_id']) & (elig.window == w)].iloc[0]
            n_ind = len(up) + len(dn)
            assert n_ind == er.discovery_indep_big_fresh and len(orr) == er.discovery_ordinary_fresh, (key, w)
            eligible = er.status.startswith('eligible')
            W = dict(eligible=bool(eligible), indep_large_days_fresh=int(n_ind), up_days=len(up), down_days=len(dn), ordinary_days=len(orr),
                     audit_reason=None if eligible else er.reason)
            if eligible:
                mu, mdn, mo = med(up['chg_' + w]), med(dn['chg_' + w]), med(orr['chg_' + w])
                gu, gd = mu - mo, mdn - mo
                W.update(median_change_up=mu, median_change_down=mdn, median_change_ordinary=mo, gap_up=gu, gap_down=gd,
                         score=max(abs(gu), abs(gd)),
                         median_level_up=med(up.level), median_level_down=med(dn.level), median_level_ordinary=med(orr.level),
                         band_up=up.level.map(band).mode().iloc[0], band_down=dn.level.map(band).mode().iloc[0], band_ordinary=orr.level.map(band).mode().iloc[0])
                # same-day, description only (same 2-day spacing as day-before)
                sd = disc.chg_same_day; sf = sd.notna(); i2 = disc.indep_day_before
                W['same_day'] = dict(median_change_up=med(disc[i2 & (disc.kind == 'up') & sf].chg_same_day), median_change_down=med(disc[i2 & (disc.kind == 'down') & sf].chg_same_day),
                                     median_change_ordinary=med(disc[(disc.kind == 'ordinary') & sf].chg_same_day),
                                     up_days=int((i2 & (disc.kind == 'up') & sf).sum()), down_days=int((i2 & (disc.kind == 'down') & sf).sum()), ordinary_days=int(((disc.kind == 'ordinary') & sf).sum()))
                # how many discovery days each direction's rule would fire on (all fresh discovery days)
                for dirn, L in (('up', mu), ('down', mdn)):
                    W[f'signals_{dirn}_count'] = int((c[fr] >= L).sum()) if L > mo else (int((c[fr] <= L).sum()) if L < mo else 0)
                W['evaluable_days'] = int(fr.sum())
            P['windows'][w] = W
        ew = {w: W for w, W in P['windows'].items() if W['eligible']}
        if not ew:
            P['status'] = 'not_enough_history'; P['lock'] = None
        else:
            order = sorted(ew, key=lambda w: (-ew[w]['score'], -ew[w]['indep_large_days_fresh'], 0 if w == 'day_before' else 1))
            w = order[0]; W = ew[w]
            if all(ew[x]['score'] <= 1.0 for x in ew):
                P['status'] = 'no_lead_pattern'; P['lock'] = None
            else:
                if abs(W['gap_up']) != abs(W['gap_down']): dirn = 'up' if abs(W['gap_up']) > abs(W['gap_down']) else 'down'
                else: dirn = 'up' if W['up_days'] >= W['down_days'] else 'down'
                L = W['median_change_' + dirn]; O = W['median_change_ordinary']
                other = 'down' if dirn == 'up' else 'up'
                P['status'] = 'locked'
                P['lock'] = dict(lead_window=w, locked_direction=dirn, d=1 if dirn == 'up' else -1, L=L, O=O,
                                 rule='fire when change >= L' if L > O else ('fire when change <= L' if L < O else 'never fires'),
                                 discovery_gap=W['gap_' + dirn], median_level=W['median_level_' + dirn], band=W['band_' + dirn],
                                 up_rule=dict(L=W['median_change_up'], O=O), down_rule=dict(L=W['median_change_down'], O=O),
                                 signals_up_count=W['signals_up_count'], signals_down_count=W['signals_down_count'],
                                 indep_discovery_days=W['indep_large_days_fresh'])
        locked[key] = P
for k, P in locked.items():
    if P['status'] != 'not_enough_history': print(k, P['status'], json.dumps(P['lock'], default=float), {w: (W.get('score'), W.get('gap_up'), W.get('gap_down')) for w, W in P['windows'].items()})
meta = dict(written_utc=pd.Timestamp.now('UTC').isoformat(), note='Locked from discovery only, before any confirmation value was read.', price_reading='raw feed floats (sensitivity)' if RAW else 'odds rounded to 0.01 points (main)',
            oil=dict(B=str(oinfo['B'].date())), bitcoin=dict(B=str(binfo['B'].date())))
fn = os.path.join(OUTD, 'locked_patterns.json')
_enc = lambda o: None if (isinstance(o, float) and np.isnan(o)) else (int(o) if isinstance(o, np.integer) else float(o))
if os.path.exists(fn):   # keep the original lock time when a rerun reproduces the same locks
    old = json.load(open(fn))
    if json.loads(json.dumps(locked, default=_enc)) == old['pairs']: meta = old['meta']; print('locks reproduced exactly; original lock time kept')
    else: print('WARNING: locks differ from the saved file')
json.dump(dict(meta=meta, pairs=locked), open(fn, 'w'), indent=1, default=lambda o: None if (isinstance(o, float) and np.isnan(o)) else (int(o) if isinstance(o, np.integer) else float(o)))
print('n locked', sum(P['status'] == 'locked' for P in locked.values()), 'no lead', sum(P['status'] == 'no_lead_pattern' for P in locked.values()))
