"""Share of oil days (after each market's creation + 2 days) with no trade in the 24h before 00:00 New York time."""
import json, numpy as np, pandas as pd
from common import *
T = trades(); m = json.load(open(HERE + '/raw/gamma_market_meta.json')); s, _ = oil(); rows = []
for k, a in T.items():
    c0 = pd.Timestamp(m[k]['createdAt']).tz_convert(None).normalize() + pd.Timedelta(days=2)
    days = [D for D in s.date if D >= c0]
    rows.append(dict(market_id=k, n_trades=len(a), first_trade_utc=str(pd.Timestamp(a[0,0], unit='s', tz='UTC')), last_trade_utc=str(pd.Timestamp(a[-1,0], unit='s', tz='UTC')),
                     oil_days_after_creation=len(days), stale_share=round(sum(np.isnan(level(a, D)) for D in days) / len(days), 3) if days else None))
pd.DataFrame(rows).to_csv(HERE + '/stale_share.csv', index=False)
