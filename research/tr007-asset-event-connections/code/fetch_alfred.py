"""First-release check for oil: ALFRED (Federal Reserve archival copy) DCOILWTICO, one vintage per calendar day.
For each oil date D we record the first vintage date where D has a value (publication date of the Federal Reserve copy)
and the first-release value. No values are printed."""
import requests, pandas as pd, io, os, time
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
days = pd.date_range('2023-12-15', '2026-11-10', freq='D')
batches = [days[i:i+20] for i in range(0, len(days), 20)]
def get(b):
    n = len(b); cosd = (b[0] - pd.Timedelta(days=45)).strftime('%Y-%m-%d')
    url = ('https://alfred.stlouisfed.org/graph/alfredgraph.csv?id=' + ','.join(['DCOILWTICO']*n) +
           '&vintage_date=' + ','.join(d.strftime('%Y-%m-%d') for d in b) + '&cosd=' + ','.join([cosd]*n))
    for i in range(5):
        try:
            r = requests.get(url, timeout=90)
            if r.ok and r.text.startswith('observation_date'): return pd.read_csv(io.StringIO(r.text), na_values=['.', ''])
        except Exception: pass
        time.sleep(3 + 3*i)
    raise RuntimeError(b[0])
with ThreadPoolExecutor(4) as ex: res = list(ex.map(get, batches))
long = pd.concat([d.melt(id_vars='observation_date', var_name='vintage', value_name='value') for d in res])
long['vintage'] = pd.to_datetime(long.vintage.str.split('_').str[1])
long = long.dropna(subset=['value'])
long['observation_date'] = pd.to_datetime(long.observation_date)
first = long.sort_values('vintage').groupby('observation_date').first().reset_index().rename(columns={'vintage':'first_vintage','value':'first_release_value'})
first.to_csv(os.path.join(HERE, 'raw/alfred_dcoilwtico_first_release.csv'), index=False)
print(len(first), first.observation_date.min().date(), first.observation_date.max().date())
