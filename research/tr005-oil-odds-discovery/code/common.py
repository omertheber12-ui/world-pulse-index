import pandas as pd, numpy as np, os, csv
from zoneinfo import ZoneInfo
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NY = ZoneInfo('America/New_York'); SEED = 20261110
WINDOWS = ['day_before', 'same_day', 'week_before']; GAP = {'day_before': 2, 'same_day': 2, 'week_before': 5}

def events():
    return list(csv.DictReader(open(os.path.join(HERE, 'frozen_app_events.csv'))))

def trades():
    d = pd.read_csv(os.path.join(HERE, 'raw/trades.csv.gz'))
    d['yes'] = np.where(d.outcome_index == 0, d.price, 1 - d.price) * 100
    d = d[(d.yes >= 0) & (d.yes <= 100)]
    return {str(k): g.sort_values('t', kind='stable')[['t', 'yes']].to_numpy() for k, g in d.groupby('market_id')}

def cut(day):
    """00:00 New York time on calendar date `day` -> unix seconds UTC (DST-aware)."""
    return int(pd.Timestamp(day.year, day.month, day.day, tzinfo=NY).timestamp())

def level(arr, day):
    """Last trade at or before 00:00 NY on `day`; NaN if none in previous 24 hours (stale)."""
    c = cut(day); i = np.searchsorted(arr[:, 0], c, side='right') - 1
    if i < 0 or c - arr[i, 0] > 86400: return np.nan
    return arr[i, 1]

def window(arr, D, w, shift=0):
    """Locked window for oil day D (optionally ending `shift` days later). Returns (level, change)."""
    D = D + pd.Timedelta(days=shift); d = pd.Timedelta(days=1)
    if w == 'day_before': end, start = D, D - d
    elif w == 'same_day': end, start = D + d, D
    else: end, start = D, D - 7 * d
    L1, L0 = level(arr, end), level(arr, start)
    return L1, (L1 - L0) if not (np.isnan(L1) or np.isnan(L0)) else np.nan

def band(x):
    if np.isnan(x): return ''
    b = min(int(x // 5) * 5, 95); return f'{b}-{b+5}'

def nonoverlap_mask(s, gap):
    keep, last = [], -10**9
    for k, t in zip(s.kind, s.tidx):
        if k == 'ordinary': keep.append(True); continue
        ok = (t - last) > gap; keep.append(ok)
        if ok: last = t
    return np.array(keep)

def oil():
    import sys; sys.path.insert(0, os.path.join(HERE, 'code'))
    import oil as o
    s, info = o.load(); return s, info
