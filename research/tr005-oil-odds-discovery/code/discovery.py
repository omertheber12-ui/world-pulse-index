"""Step 6-7: discovery on first 70% of big oil days ONLY; apply locked winner rule."""
import json, os, numpy as np, pandas as pd, warnings; warnings.filterwarnings('ignore')
from common import *
s, info = oil(); s = s[s.slice == 'discovery'].reset_index(drop=True)
T = trades(); rows = []
for ev in events():
    arr = T.get(ev['chosen_market_id'])
    for w in WINDOWS:
        keep = nonoverlap_mask(s, GAP[w]); sub = s[keep]
        vals = [window(arr, D, w) if arr is not None else (np.nan, np.nan) for D in sub.date]
        sub = sub.assign(lvl=[v[0] for v in vals], chg=[v[1] for v in vals]).dropna(subset=['chg'])
        r = dict(event_id=ev['event_id'], event_title=ev['event_title'], market_id=ev['chosen_market_id'],
                 question=ev['chosen_question'], window=w)
        for k in ['up', 'down', 'ordinary']:
            g = sub[sub.kind == k]
            r[f'n_{k}'] = len(g)
            r[f'median_level_{k}'] = round(g.lvl.median(), 3) if len(g) else np.nan
            r[f'modal_band_{k}'] = g.lvl.map(band).mode().sort_values().iloc[0] if len(g) else ''
            r[f'median_change_{k}'] = round(g.chg.median(), 4) if len(g) else np.nan
        r['n_big_raw_in_slice'] = int((s.kind != 'ordinary').sum()); r['n_big_nonoverlap_in_slice'] = int((keep & (s.kind != 'ordinary').values).sum())
        gu = abs(r['median_change_up'] - r['median_change_ordinary']) if r['n_up'] and r['n_ordinary'] else np.nan
        gd = abs(r['median_change_down'] - r['median_change_ordinary']) if r['n_down'] and r['n_ordinary'] else np.nan
        r['gap_up_vs_ordinary'] = round(r['median_change_up'] - r['median_change_ordinary'], 4) if not np.isnan(gu) else np.nan
        r['gap_down_vs_ordinary'] = round(r['median_change_down'] - r['median_change_ordinary'], 4) if not np.isnan(gd) else np.nan
        r['score'] = np.nanmax([gu, gd]) if not (np.isnan(gu) and np.isnan(gd)) else np.nan
        r['score_direction'] = '' if np.isnan(r['score']) else ('up' if (not np.isnan(gu) and gu == r['score']) else 'down')
        r['n_big_used'] = r['n_up'] + r['n_down']
        rows.append(r)
tab = pd.DataFrame(rows); tab.to_csv(os.path.join(HERE, 'discovery_table.csv'), index=False)
# winner rule (+ tie-breaks: more non-overlapping big days used, then earlier event id as text)
c = tab.dropna(subset=['score']).copy(); c['neg_n'] = -c.n_big_used
c = c.sort_values(['score', 'neg_n', 'event_id'], ascending=[False, True, True])
win = c.iloc[0]
best_lead = c[c.window != 'same_day'].score.max() if (c.window != 'same_day').any() else np.nan
best_db = c[c.window == 'day_before'].score.max(); best_wb = c[c.window == 'week_before'].score.max()
same_only = win.window == 'same_day'
# ranked table of all kept events by their best locked score (Omer's request: show best event next to others)
rk = tab.sort_values('score', ascending=False).groupby('event_id', sort=False).head(1).reset_index(drop=True)
rk.loc[rk.score.isna(), ['window', 'score_direction']] = ['(no scorable data in discovery range)', '']
rk.insert(0, 'rank', range(1, len(rk) + 1))
rk[['rank', 'event_id', 'event_title', 'market_id', 'question', 'window', 'score', 'score_direction', 'n_up', 'n_down', 'n_ordinary',
    'median_change_up', 'median_change_down', 'median_change_ordinary', 'median_level_up', 'median_level_down', 'median_level_ordinary']].to_csv(
    os.path.join(HERE, 'event_ranking_discovery.csv'), index=False)
_lp = os.path.join(HERE, 'locked_pick.json'); _old = json.load(open(_lp)).get('locked_at') if os.path.exists(_lp) else None
pick = dict(locked_at=_old or str(pd.Timestamp.now(tz='Asia/Jerusalem')), oil_info=info,
            event_id=win.event_id, event_title=win.event_title, market_id=win.market_id, question=win.question,
            window=win.window, winning_direction=win.score_direction, score_points=float(win.score),
            same_day_only=bool(same_only), best_day_before_score=float(best_db), best_week_before_score=float(best_wb),
            up_change=float(win.median_change_up), down_change=float(win.median_change_down), ordinary_change=float(win.median_change_ordinary),
            median_level_up=float(win.median_level_up), median_level_down=float(win.median_level_down), median_level_ordinary=float(win.median_level_ordinary),
            modal_band_up=win.modal_band_up, modal_band_down=win.modal_band_down, modal_band_ordinary=win.modal_band_ordinary,
            n_up=int(win.n_up), n_down=int(win.n_down), n_ordinary=int(win.n_ordinary),
            discovery_gap_up=float(win.gap_up_vs_ordinary), discovery_gap_down=float(win.gap_down_vs_ordinary),
            search_size=f"{len(events())} events x 3 windows x 2 directions = {len(events())*6}",
            cells_with_score=int(len(c)))
json.dump(pick, open(os.path.join(HERE, 'locked_pick.json'), 'w'), indent=1, default=str)
print(json.dumps(pick, indent=1, default=str))
