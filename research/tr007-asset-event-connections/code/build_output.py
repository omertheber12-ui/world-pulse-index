"""TR-007 step 5: results file (connections-1) and tables. Main reading only."""
import json, os, csv, numpy as np, pandas as pd
from common import HERE, FINGERPRINT, load_events
RUN_DATE = os.environ.get('TR007_RUN_DATE', '2026-11-10'); RUN_ID = f'TR-007-{RUN_DATE}'
J = json.load(open(os.path.join(HERE, 'run/locked_patterns.json'))); C = json.load(open(os.path.join(HERE, 'run/confirmation_results.json')))
audit = json.load(open(os.path.join(HERE, 'audit_summary.json')))
LABEL = {'oil': 'Main US oil price', 'bitcoin': 'Bitcoin'}
END = {'oil': audit['oil_first_release']['sample_end'], 'bitcoin': audit['bitcoin']['sample_end']}
CHANCE = {'79987': 'the chance that Marine Le Pen wins the 2027 French presidential election',
          '34044': 'the chance that China invades Taiwan by the end of 2026'}
PRED = '00:00 New York time on the asset day. The pattern uses only trades at or before this time.'
OBS = {'bitcoin': '00:00 New York time on the next day (last public price at or before that time).',
       'oil': 'The official daily oil spot price for that trading day. This is the market date, not the later publication time.'}
OILNOTE = ('The official oil print often comes out after the trade date, so this is a statistical link with a delayed official number, '
           'not proof someone could have acted on that official number the same day. In this sample the first official print usually appeared '
           'about 7 days after the trade date (middle 80 percent of dates: 2 to 13 days). The oil day\'s change starts at the previous official price, '
           'while the prediction time is 00:00 New York, so some of that day\'s oil move may already show in overnight futures.')
SCORING = ['lead_window', 'locked_direction', 'extra_average_percentage_points', 'extra_average_likely_range_low_percentage_points',
           'extra_average_likely_range_high_percentage_points', 'placebo_share_beaten_percent', 'many_pair_correction_pass',
           'confirmation_firing_count', 'confirmation_evaluated_count', 'predicted_big_move_count', 'predicted_big_move_rate_percent',
           'predicted_big_move_rate_when_not_firing_percent', 'odds_pattern', 'discovery_median_odds_change_percentage_points',
           'discovery_median_odds_change_ordinary_percentage_points', 'discovery_median_odds_level_percent', 'most_common_odds_band',
           'signals_up_count', 'signals_down_count', 'reverse_check_passed', 'reverse_check_gap_odds_points', 'asset_first_stronger',
           'conflict_share_percent', 'how_sure']
r2 = lambda x: None if x is None else round(float(x), 2)
pairs = []
for e in load_events():
    for a in ('oil', 'bitcoin'):
        P = J['pairs'][f"{a}|{e['event_id']}"]
        o = dict(event_name=e['event_title'], event_id=e['event_id'], market_id=e['chosen_market_id'], market_question=e['chosen_question'],
                 asset=a, asset_label=LABEL[a], date_last_checked=RUN_DATE, method_id='TR-007', method_fingerprint=FINGERPRINT, run_id=RUN_ID,
                 search_size=128, sample_start_date='2024-01-02', sample_end_date=END[a], prediction_time=PRED, observation_time=OBS[a])
        o.update({k: None for k in SCORING})
        if P['status'] == 'not_enough_history':
            o.update(history_status='not_enough_history', insight_kind='not_enough_history', verdict='not_enough_history', stronger_connection=False)
            s = f"We do not have enough public history yet to describe how “{e['event_title']}” and {LABEL[a]} moved together. No number is shown for this pair."
            W = P['windows']
            o['verdict_reason'] = ('Not enough history: ' + '; '.join(f"{w.replace('_', ' ')}: {W[w]['indep_large_days_fresh']} independent discovery large-move days with a fresh odds change (need 10)" for w in ('day_before', 'week_before')) + '.')
        elif P['status'] == 'no_lead_pattern':
            W = P['windows']; sc = {w: W[w]['score'] for w in W}
            # Moved-together check, locked method's own rule: both lead scores <= 1 odds point and the same-day values look
            # different, using the same score formula (largest absolute gap of median up / median down vs median ordinary)
            # on the same-day values already recorded, with the same 1-odds-point line used for the lead windows.
            SD = W['day_before']['same_day']; gu = SD['median_change_up'] - SD['median_change_ordinary']; gd = SD['median_change_down'] - SD['median_change_ordinary']
            sd_score = max(abs(gu), abs(gd)); SD['score_odds_points'] = sd_score
            mt = sd_score > 1.0
            if mt:
                dn = 'up' if abs(gu) >= abs(gd) else 'down'; N = SD[f'{dn}_days']
                s = (f"On those days, {LABEL[a]} made a large move while the chance of {e['event_title']} changed by a median of {SD['median_change_' + dn]:.2f} points that same day, "
                     f"compared with a median of {SD['median_change_ordinary']:.2f} points on ordinary days (from {N} large-move days in the earlier sample). "
                     "This describes them moving together that day. It is not a next-day pattern.")
                o.update(history_status='described', insight_kind='moved_together', verdict='no', stronger_connection=False)
                if a == 'oil': s += ' ' + OILNOTE.split(' In this sample')[0]
            else:
                # COO written decision 10 Nov 2026 about 17:00 Israel time: enough history, no locked
                # next-day pattern, and no moved-together numbers -> checked_no_pattern, not described
                # and not not_enough_history.
                moves = f"large moves in the {LABEL[a]}" if a == 'oil' else f"large {LABEL[a]} moves"
                s = (f"We checked how {CHANCE[e['event_id']]} changed over the day and the week before {moves}. "
                     "Before those moves it did not change differently from ordinary days by more than 1 point of chance, so no next-day pattern was measured and no number is shown. "
                     "This describes public prices only; it does not mean one caused the other.")
                o.update(history_status='checked_no_pattern', insight_kind='checked_no_pattern', verdict='no', stronger_connection=False)
            o['verdict_reason'] = (f"No (for a lead): in discovery both lead-window scores were 1 odds point or less "
                                   f"(day before {sc['day_before']:.2f}, week before {sc['week_before']:.2f}), so the locked rule does not lock a next-session pattern. "
                                   f"Never reached the confirmation test, so all scoring numbers are null.")
            o['discovery_summary'] = {w: dict(score_odds_points=W[w]['score'], independent_large_move_days=W[w]['indep_large_days_fresh'],
                                              up_days=W[w]['up_days'], down_days=W[w]['down_days'], ordinary_days=W[w]['ordinary_days'],
                                              median_change_before_up_days=W[w]['median_change_up'], median_change_before_down_days=W[w]['median_change_down'],
                                              median_change_ordinary_days=W[w]['median_change_ordinary'], median_level_ordinary_days=W[w]['median_level_ordinary'])
                                      for w in ('day_before', 'week_before')}
            o['discovery_summary']['same_day_description_only'] = W['day_before']['same_day']
        else:
            raise SystemExit('a locked pair exists; extend build_output for scored pairs before publishing')
        o['insight_sentence'] = s; o['readable_fact'] = s
        if a == 'oil': o['oil_publish_lag_note'] = OILNOTE
        pairs.append(o)
out = dict(schema_version='connections-1', method_id='TR-007', method_fingerprint=FINGERPRINT, run_id=RUN_ID, date_last_checked=RUN_DATE,
           search_size=128, assets_checked=['oil', 'bitcoin'], set_aside=[], pairs=pairs)
assert len(pairs) == 32 and all(p['search_size'] == out['search_size'] for p in pairs)
assert not any(p['stronger_connection'] for p in pairs if p['verdict'] != 'yes_first_look')
assert all(p['extra_average_percentage_points'] is None for p in pairs if p['verdict'] == 'not_enough_history')
for rel in ('site/data/connections/latest.json', f'site/data/connections/runs/{RUN_ID}.json'):
    p = os.path.join(HERE, rel); os.makedirs(os.path.dirname(p), exist_ok=True); json.dump(out, open(p, 'w'), indent=1, ensure_ascii=False)
with open(os.path.join(HERE, 'run/pairs_table.csv'), 'w', newline='') as f:
    wr = csv.writer(f); wr.writerow(['asset', 'event_id', 'event_name', 'market_id', 'verdict', 'stronger_connection', 'history_status', 'lead_window',
                                     'extra_average_pp', 'confirmation_firing_count', 'predicted_big_move_count', 'placebo_share_beaten_percent',
                                     'indep_discovery_days_day_before', 'indep_discovery_days_week_before', 'score_day_before', 'score_week_before'])
    for p in pairs:
        W = J['pairs'][f"{p['asset']}|{p['event_id']}"]['windows']
        wr.writerow([p['asset'], p['event_id'], p['event_name'], p['market_id'], p['verdict'], p['stronger_connection'], p['history_status'], p['lead_window'],
                     p['extra_average_percentage_points'], p['confirmation_firing_count'], p['predicted_big_move_count'], p['placebo_share_beaten_percent'],
                     W['day_before']['indep_large_days_fresh'], W['week_before']['indep_large_days_fresh'], W['day_before'].get('score'), W['week_before'].get('score')])
print('wrote', len(pairs), 'pairs;', {v: sum(p['verdict'] == v for p in pairs) for v in ('yes_first_look', 'no', 'unclear', 'not_enough_history')})
