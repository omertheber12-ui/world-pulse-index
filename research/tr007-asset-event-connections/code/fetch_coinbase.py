"""Coinbase BTC-USD 1-hour candles (public), used only as a cross-check and fallback for the Binance series."""
import requests, pandas as pd, os, time
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
st = pd.Timestamp('2023-12-25', tz='UTC'); en = pd.Timestamp('2026-11-10 14:00', tz='UTC')
chunks = pd.date_range(st, en, freq='300h')
def get(a):
    b = min(a + pd.Timedelta(hours=299), en)
    for i in range(6):
        try:
            r = requests.get('https://api.exchange.coinbase.com/products/BTC-USD/candles',
                             params=dict(granularity=3600, start=a.isoformat(), end=b.isoformat()), timeout=60,
                             headers={'User-Agent': 'research-audit'})
            if r.status_code == 429: time.sleep(2 + 2*i); continue
            r.raise_for_status(); return r.json()
        except Exception: time.sleep(2 + 2*i)
    raise RuntimeError(a)
with ThreadPoolExecutor(3) as ex: res = list(ex.map(get, chunks))
rows = [(int(x[0]), float(x[4])) for d in res for x in d]
df = pd.DataFrame(rows, columns=['open_s', 'close']).drop_duplicates('open_s').sort_values('open_s')
df.to_csv(os.path.join(HERE, 'raw/btc_coinbase_1h.csv.gz'), index=False)
print(len(df), pd.to_datetime(df.open_s.min(), unit='s'), pd.to_datetime(df.open_s.max(), unit='s'))
