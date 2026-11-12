"""Public Binance BTCUSDT 1-hour candles (open time, close time, close price, trade count). UTC unix ms."""
import requests, pandas as pd, time, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
start = int(pd.Timestamp('2023-01-01', tz='UTC').timestamp() * 1000)
t0 = pd.Timestamp.now(tz='UTC'); rows = []; s = requests.Session(); cur = start
while True:
    r = s.get('https://api.binance.com/api/v3/klines', params=dict(symbol='BTCUSDT', interval='1h', startTime=cur, limit=1000), timeout=60)
    r.raise_for_status(); d = r.json()
    if not d: break
    rows += [(x[0], x[6], float(x[4]), int(x[8])) for x in d]
    cur = d[-1][0] + 3600_000
    if len(d) < 1000: break
df = pd.DataFrame(rows, columns=['open_ms', 'close_ms', 'close', 'n_trades']).drop_duplicates('open_ms')
df.to_csv(os.path.join(HERE, 'raw/btc_binance_1h.csv.gz'), index=False)
open(os.path.join(HERE, 'raw/btc_download_time.txt'), 'w').write(f'{t0} to {pd.Timestamp.now(tz="UTC")}\n')
print(len(df), pd.to_datetime(df.open_ms.min(), unit='ms'), pd.to_datetime(df.open_ms.max(), unit='ms'))
