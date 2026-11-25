"""Step 2: freeze the World Pulse Index app event list (metadata only, no prices/paths)."""
import json, csv, re, datetime, hashlib, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
f = json.load(open(os.path.join(HERE, 'raw/app_fallback.json')))
OIL = re.compile(r'\b(oil|crude|wti|brent|barrel)\b', re.I)
rows, aside = [], []
for ev in f['events']:
    mk = ev.get('markets', [])
    # App shows each event as ONE card (StoryCard per event_id) -> universe rule 5:
    # single busiest market on that card by catalog volume.
    best = max(mk, key=lambda m: float(m.get('volumeNum') or 0))
    text = ' '.join([ev.get('title',''), best.get('question','') or '', best.get('description','') or ''])
    r = dict(event_id=ev['event_id'], event_title=ev['title'], group=ev.get('group'),
             app_market_ids=';'.join(str(m['id']) for m in mk), n_app_markets=len(mk),
             chosen_market_id=best['id'], chosen_question=best.get('question'),
             chosen_market_volume=best.get('volumeNum'), event_volume=ev.get('volume'),
             end_date=best.get('endDate') or ev.get('endDate'), closed=best.get('closed'),
             yes_token=json.loads(best['clobTokenIds'])[0] if best.get('clobTokenIds') else '',
             outcomes=best.get('outcomes'))
    if OIL.search(text):
        aside.append(dict(event_id=ev['event_id'], title=ev['title'], market_id=best['id'], reason='bet on oil price level'))
    else:
        rows.append(r)
with open(os.path.join(HERE,'frozen_app_events.csv'),'w',newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
with open(os.path.join(HERE,'set_aside_oil_price_contracts.csv'),'w',newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=['event_id','title','market_id','reason']); w.writeheader(); w.writerows(aside)
print(len(f['events']), 'events in app;', len(rows), 'kept;', len(aside), 'set aside')
