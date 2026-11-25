"""Step 5: public Polymarket trades (Data API v2 cursor feed) for the frozen chosen markets only.
Stores only market id, trade time (unix seconds, UTC), price, outcome index, side, size. No wallet fields."""
import json, time, os, requests, pandas as pd
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://data-api.polymarket.com/v2/trades"
STOP = 0  # TR-007: fetch every market back to its very first trade
meta = json.load(open(os.path.join(HERE, 'raw/gamma_market_meta.json')))
def fetch(mid):
    cid = meta[mid]['conditionId']; s = requests.Session(); rows = []; cur = None; pages = 0; done = False
    while pages < 5000:
        p = dict(condition=cid, limit=1000) if cur is None else dict(condition=cid, cursor=cur)
        for i in range(6):
            try:
                r = s.get(URL, params=p, timeout=60)
                if r.status_code == 429: time.sleep(2 + i); continue
                if r.ok: break
            except Exception: pass
            time.sleep(1 + 2 * i)
        else: break
        j = r.json(); data = j.get('data') or []; pages += 1
        rows += [(mid, int(x['timestamp']), float(x['price']), int(x['outcome_index']), x['side'], float(x['size'])) for x in data]
        cur = (j.get('pagination') or {}).get('next_cursor')
        if not data or not cur or not (j.get('pagination') or {}).get('has_more', True) or int(data[-1]['timestamp']) < STOP:
            done = True; break
    print(mid, pages, len(rows), 'complete' if done else 'INCOMPLETE', flush=True)
    return rows, dict(market_id=mid, pages=pages, n=len(rows), complete=done, last_page_has_more=(j.get('pagination') or {}).get('has_more') if pages else None)
if __name__ == '__main__':
    t0 = pd.Timestamp.now(tz='UTC')
    with ThreadPoolExecutor(6) as ex: res = list(ex.map(fetch, list(meta)))
    df = pd.DataFrame([r for x, _ in res for r in x], columns=['market_id','t','price','outcome_index','side','size']).drop_duplicates()
    df.to_csv(os.path.join(HERE, 'raw/trades.csv.gz'), index=False)
    cov = pd.DataFrame([i for _, i in res]); cov['download_started_utc'] = str(t0); cov['download_finished_utc'] = str(pd.Timestamp.now(tz='UTC'))
    cov.to_csv(os.path.join(HERE, 'raw/trades_fetch_coverage.csv'), index=False)
    print('total', len(df))
