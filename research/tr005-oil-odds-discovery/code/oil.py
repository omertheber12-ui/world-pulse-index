"""Step 4: oil days (main US oil price, West Texas, Cushing; agency series RWTC)."""
import pandas as pd, numpy as np, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
START, END = pd.Timestamp('2024-01-01'), pd.Timestamp('2026-11-09')

def load():
    d = pd.read_excel(os.path.join(HERE, 'raw/eia_RWTCd.xls'), sheet_name='Data 1', engine='xlrd', skiprows=2)
    d.columns = ['date', 'price']
    d['date'] = pd.to_datetime(d['date']); d = d.dropna().sort_values('date').drop_duplicates('date')
    d = d[d.price > 0].reset_index(drop=True)          # missing close -> day dropped
    d['ret'] = d.price.pct_change() * 100               # simple return vs previous official oil day, percent
    # trailing 252-day 1st/99th percentile cap (strictly before the date)
    lo = d.ret.shift(1).rolling(252, min_periods=252).quantile(0.01)
    hi = d.ret.shift(1).rolling(252, min_periods=252).quantile(0.99)
    d['ret_cap'] = d.ret.clip(lo, hi)
    d['cap_lo'], d['cap_hi'] = lo, hi
    s = d[(d.date >= START) & (d.date <= END)].dropna(subset=['ret']).reset_index(drop=True)
    s['kind'] = np.where(s.ret >= 1.0, 'up', np.where(s.ret <= -1.0, 'down', 'ordinary'))
    big = s[s.kind != 'ordinary'].sort_values('date')
    n_disc = int(np.floor(0.7 * len(big)))
    last_disc = big.date.iloc[n_disc - 1]
    s['slice'] = np.where(s.date <= last_disc, 'discovery', 'confirmation')
    s['tidx'] = np.arange(len(s))                        # oil trading-day index
    return s, dict(n_big=len(big), n_disc_big=n_disc, n_conf_big=len(big) - n_disc,
                   last_disc_big=str(last_disc.date()), first_conf_big=str(big.date.iloc[n_disc].date()),
                   first_oil=str(s.date.iloc[0].date()), last_oil=str(s.date.iloc[-1].date()))

def nonoverlap(s, gap):
    """Keep big day only if no earlier KEPT big day sits in previous `gap` oil trading days."""
    keep, last = [], -10**9
    for _, r in s.iterrows():
        if r.kind == 'ordinary': keep.append(False); continue
        k = (r.tidx - last) > gap
        keep.append(k)
        if k: last = r.tidx
    return pd.Series(keep, index=s.index)

if __name__ == '__main__':
    s, info = load(); print(info)
    print(s.groupby(['slice', 'kind']).size())
    s.to_csv(os.path.join(HERE, 'oil_days.csv'), index=False)
