"""TR-007 audit step 1: freeze the app event list (catalog fields only; no prices or trades used).
Market per event = the market the app itself displays as the lead option at freeze time,
reproducing site/lib/score.js optionsOf(): open markets with prices, options sorted by price desc, first one.
Set-asides: per asset, events that are themselves a bet on that asset's price."""
import json, csv, re, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
f = json.load(open(os.path.join(HERE, 'raw/app_fallback.json')))
commit = open(os.path.join(HERE, 'raw/freeze_commit.txt')).read().split()
P = lambda x: x if isinstance(x, list) else json.loads(x or '[]')
def lead_option(ev):
    opts = []
    for m in ev['markets']:
        if m.get('closed') or not m.get('outcomePrices'): continue
        oc, pr = P(m['outcomes']), [float(v) for v in P(m['outcomePrices'])]
        tk = P(m.get('clobTokenIds'))
        if len(oc) == 2 and str(oc[0]).lower() == 'yes':
            opts.append((pr[0], m, 0, tk[0] if tk else ''))
        else:
            for i, o in enumerate(oc): opts.append((pr[i], m, i, tk[i] if tk else ''))
    opts.sort(key=lambda x: -x[0])   # JS sort is stable, same as Python
    return opts[0] if opts else None
OIL = re.compile(r'\b(oil|crude|wti|brent|barrel|petroleum)\b', re.I)
BTC = re.compile(r'\b(bitcoin|btc|crypto|cryptocurrency)\b', re.I)
rows, aside = [], []
for ev in f['events']:
    lo = lead_option(ev)
    pr, m, oi, tok = lo
    text = ' '.join([ev.get('title', ''), ev.get('plain', '') or '', m.get('question', '') or ''])
    r = dict(event_id=ev['event_id'], event_title=ev['title'], group=ev.get('group'),
             app_market_ids=';'.join(str(x['id']) for x in ev['markets']), n_app_markets=len(ev['markets']),
             app_market_ids_field=';'.join(map(str, ev.get('market_ids') or [])), app_top_n=ev.get('top_n') or '',
             chosen_market_id=m['id'], chosen_question=m.get('question'), chosen_group_item=m.get('groupItemTitle') or '',
             chosen_outcome_index=oi, chosen_token=tok, chosen_rule=('only market on card' if len(ev['markets']) == 1 else
                 'app lead option at freeze (highest listed price among open markets, site/lib/score.js optionsOf)'),
             chosen_price_in_frozen_file=pr, event_volume_catalog=ev.get('volume'),
             chosen_volume_catalog=m.get('volumeNum'), chosen_closed=m.get('closed'), slug=ev.get('slug'),
             freeze_commit=commit[0])
    rows.append(r)
    for asset, rx in (('oil', OIL), ('bitcoin', BTC)):
        if rx.search(text):
            aside.append(dict(asset=asset, event_id=ev['event_id'], title=ev['title'], market_id=m['id'],
                              reason=f'event text mentions {asset}; reviewed as a bet on that asset price'))
with open(os.path.join(HERE, 'frozen_app_events.csv'), 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
with open(os.path.join(HERE, 'set_aside.csv'), 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=['asset', 'event_id', 'title', 'market_id', 'reason']); w.writeheader(); w.writerows(aside)
print(len(rows), 'frozen;', len(aside), 'set-aside rows')
for r in rows: print(r['event_id'], r['chosen_market_id'], r['chosen_outcome_index'], round(float(r['chosen_price_in_frozen_file']),3), r['chosen_question'][:70])
