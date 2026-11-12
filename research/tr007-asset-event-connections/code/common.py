"""TR-007 run: shared loaders. Reproduces the audit's asset days, split and independence flags exactly
(code/audit.py), and adds odds lookups. No price is compared with odds in this file."""
import pandas as pd, numpy as np, csv, os
from zoneinfo import ZoneInfo
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NY = ZoneInfo('America/New_York'); START = pd.Timestamp('2024-01-02')
SPACING = {'day_before': 2, 'week_before': 5}; LOOK = {'day_before': 1, 'week_before': 7}
SEED = 20260007
FINGERPRINT = '149a7c2b6e2d4e812c8612281a478272c69a0d03a3dc9ae960446f1802d4b953'

def cut(day):
    """00:00 New York on calendar date `day`, as unix seconds (UTC)."""
    return int(pd.Timestamp(day.year, day.month, day.day, tzinfo=NY).timestamp())

def _asset_days(df):
    df = df.sort_values('date').reset_index(drop=True)
    df['ret'] = df.price.pct_change() * 100
    full = df.copy()
    d = df[df.date >= START].dropna(subset=['ret']).reset_index(drop=True)
    d['kind'] = np.where(d.ret >= 1.0, 'up', np.where(d.ret <= -1.0, 'down', 'ordinary'))
    d['tidx'] = np.arange(len(d)); return d, full

def _split(d):
    big = d[d.kind != 'ordinary']; N = len(big); nd = int(np.floor(0.7 * N)); B = big.date.iloc[nd - 1]
    d['slice'] = np.where(d.date <= B, 'discovery', np.where(d.date <= B + pd.Timedelta(days=7), 'gap', 'confirmation'))
    for w, k in SPACING.items():   # spacing on the asset's own large-move days first, inside each slice
        keep = np.zeros(len(d), bool)
        for sl in ('discovery', 'confirmation'):
            last = -10**9
            for i in np.where((d.slice == sl) & (d.kind != 'ordinary'))[0]:
                if d.tidx[i] - last > k: keep[i] = True; last = d.tidx[i]
        d['indep_' + w] = keep
    return d, dict(N_big=N, n_discovery_big=nd, B=B)

def _cap(d, full):
    """Capped return: clip to 1st/99th percentile of the 252 asset days before that date (trailing only)."""
    r = full.dropna(subset=['ret']).reset_index(drop=True); pos = {dt: i for i, dt in enumerate(r.date)}
    rv = r.ret.to_numpy(); capped, nprior = [], []
    for dt, x in zip(d.date, d.ret):
        i = pos[dt]; prior = rv[max(0, i - 252):i]; nprior.append(len(prior))
        if len(prior) < 2: capped.append(np.nan); continue
        lo, hi = np.percentile(prior, 1), np.percentile(prior, 99); capped.append(float(np.clip(x, lo, hi)))
    d['ret_capped'] = capped; d['cap_prior_days'] = nprior; return d

def load_oil():
    x = pd.read_excel(os.path.join(HERE, 'raw/eia_RWTCd.xls'), sheet_name='Data 1', engine='xlrd', skiprows=2)
    x.columns = ['date', 'price']; x['date'] = pd.to_datetime(x.date)
    x = x.dropna().sort_values('date').drop_duplicates('date'); x = x[x.price > 0]
    alf = pd.read_csv(os.path.join(HERE, 'raw/alfred_dcoilwtico_first_release.csv'), parse_dates=['observation_date', 'first_vintage'])
    fr = alf[['observation_date', 'first_release_value', 'first_vintage']].rename(columns={'observation_date': 'date', 'first_release_value': 'price'})
    fr = fr[fr.date.isin(x.date)]
    d, full = _asset_days(fr[['date', 'price']].copy()); d, info = _split(d); d = _cap(d, full)
    d = d.merge(fr[['date', 'first_vintage']], on='date', how='left'); return d, info

def load_btc():
    b = pd.read_csv(os.path.join(HERE, 'raw/btc_binance_1h.csv.gz')); cb = pd.read_csv(os.path.join(HERE, 'raw/btc_coinbase_1h.csv.gz'))
    bi = dict(zip(b.open_ms // 1000, b.close)); ci = dict(zip(cb.open_s, cb.close))
    freeze_utc = pd.Timestamp(open(os.path.join(HERE, 'raw/btc_download_time.txt')).read().split(' to ')[0])
    rows = []
    for D in pd.date_range('2022-12-31', '2026-11-12'):
        c = cut(D + pd.Timedelta(days=1))
        if c > freeze_utc.timestamp() - 3600: break
        o = c - 3600; rows.append(dict(date=D, price=bi.get(o, ci.get(o)), source='binance' if o in bi else ('coinbase' if o in ci else None)))
    bd = pd.DataFrame(rows).dropna(subset=['price'])
    d, full = _asset_days(bd[['date', 'price']].copy()); d, info = _split(d); d = _cap(d, full)
    d = d.merge(bd[['date', 'source']], on='date', how='left'); return d, info

def load_events():
    return list(csv.DictReader(open(os.path.join(HERE, 'frozen_app_events.csv'))))

class Odds:
    """Yes-odds (0-100) from public trades. Level at a cut = last trade at or before the cut;
    fresh only if that trade is within 24 h before the cut. No forward-filling of changes."""
    def __init__(self, market_id, trades):
        g = trades[trades.market_id == market_id].iloc[::-1]          # feed is newest-first; reverse so same-second ties keep feed order
        g = g.sort_values('t', kind='stable'); self.t = g.t.to_numpy(); self.y = g.yes.to_numpy()
    def level(self, c):
        i = np.searchsorted(self.t, c, side='right') - 1
        if i < 0 or c - self.t[i] > 86400: return np.nan
        return float(self.y[i])
    def change(self, end_c, start_c):
        a, b = self.level(end_c), self.level(start_c)
        if np.isnan(a) or np.isnan(b): return np.nan
        return a - b if RAW else round(a - b, 2)

# Price precision. Polymarket trade prices sit on a tick grid (0.001 for these markets: 99.0% of Taiwan and 93.5%
# of Le Pen prices are within 0.000001 of it), but the feed returns them with arithmetic noise (0.4529999012 for 0.453).
# MAIN reading: round yes-odds to 0.01 odds points (price to 0.0001, finer than the tick) and round changes to 0.01 points,
# so a threshold such as "1 odds point or less" is not decided by noise of about 0.00001 points.
# SENSITIVITY reading (TR007_RAW_PRICES=1): use the feed floats as downloaded.
RAW = os.environ.get('TR007_RAW_PRICES') == '1'
def load_trades():
    t = pd.read_csv(os.path.join(HERE, 'raw/trades.csv.gz'), dtype={'market_id': str}).drop_duplicates()
    t['yes'] = np.where(t.outcome_index == 0, t.price, 1 - t.price) * 100
    if not RAW: t['yes'] = t.yes.round(2)
    return t

def add_odds(d, od):
    """Window changes for asset days d (calendar-day windows ending 00:00 New York)."""
    D = d.date
    d['level'] = [od.level(cut(x)) for x in D]
    d['chg_day_before'] = [od.change(cut(x), cut(x - pd.Timedelta(days=1))) for x in D]
    d['chg_week_before'] = [od.change(cut(x), cut(x - pd.Timedelta(days=7))) for x in D]
    d['chg_same_day'] = [od.change(cut(x + pd.Timedelta(days=1)), cut(x)) for x in D]          # description only
    d['after_day_before'] = [od.change(cut(x + pd.Timedelta(days=1)), cut(x)) for x in D]      # asset-first check
    d['after_week_before'] = [od.change(cut(x + pd.Timedelta(days=1)), cut(x - pd.Timedelta(days=6))) for x in D]
    return d

def band(v):
    if v is None or np.isnan(v): return None
    lo = min(int(v // 5) * 5, 95); return f'{lo}-{lo + 5}'
