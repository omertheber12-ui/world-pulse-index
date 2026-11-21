import json, csv, os, requests
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ids = [r['chosen_market_id'] for r in csv.DictReader(open(os.path.join(HERE, 'frozen_app_events.csv')))]
out = {}
for i in ids:
    j = requests.get(f'https://gamma-api.polymarket.com/markets/{i}', timeout=60).json()
    out[i] = {k: j.get(k) for k in ['id','question','conditionId','clobTokenIds','outcomes','createdAt','startDate','endDate','closed','closedTime','umaResolutionStatus','resolutionSource','description']}
json.dump(out, open(os.path.join(HERE, 'raw/gamma_market_meta.json'), 'w'), indent=1)
for i,v in out.items(): print(i, v['conditionId'][:12], v['createdAt'], v['startDate'], v['endDate'], v['closed'])
