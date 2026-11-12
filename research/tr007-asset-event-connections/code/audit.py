"""TR-007 data-quality audit. Dates, counts, and coverage only.
Never compares odds changes with asset returns. No pair is scored."""
import pandas as pd, numpy as np, json, csv, os
from zoneinfo import ZoneInfo
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NY = ZoneInfo('America/New_York'); START = pd.Timestamp('2024-01-02')
SPACING = {'day_before': 2, 'week_before': 5}; LOOK = {'day_before': 1, 'week_before': 7}
OUT = {}
def cut(day): return int(pd.Timestamp(day.year, day.month, day.day, tzinfo=NY).timestamp())

# ---------------- oil ----------------
x = pd.read_excel(os.path.join(HERE, 'raw/eia_RWTCd.xls'), sheet_name='Data 1', engine='xlrd', skiprows=2)
x.columns = ['date', 'price']; x['date'] = pd.to_datetime(x.date)
x = x.dropna().sort_values('date').drop_duplicates('date'); x = x[x.price > 0]
alf = pd.read_csv(os.path.join(HERE, 'raw/alfred_dcoilwtico_first_release.csv'), parse_dates=['observation_date', 'first_vintage'])
m = x.merge(alf, left_on='date', right_on='observation_date', how='left')
oilq = {}
s = m[m.date >= START]
oilq['eia_last_date'] = str(x.date.max().date()); oilq['eia_rows_in_sample'] = int(len(s))
oilq['missing_in_alfred'] = int(s.first_release_value.isna().sum())
alf_s = alf[alf.observation_date >= START]
oilq['alfred_dates_not_in_eia'] = int((~alf_s.observation_date.isin(x.date)).sum())
diff = (s.first_release_value - s.price).abs()
oilq['dates_revised_after_first_release'] = int((diff > 0.005).sum())
lag = (s.first_vintage - s.date).dt.days
oilq['publish_lag_days'] = dict(median=float(lag.median()), p10=float(lag.quantile(.1)), p90=float(lag.quantile(.9)),
                                 min=int(lag.min()), max=int(lag.max()), mean=round(float(lag.mean()), 2))
oilq['publish_lag_hist'] = {int(k): int(v) for k, v in lag.value_counts().sort_index().items()}
oilq['first_vintage_weekday'] = {k: int(v) for k, v in s.first_vintage.dt.day_name().value_counts().items()}
oilq['n_distinct_first_vintages'] = int(s.first_vintage.nunique())
# calendar gaps between consecutive oil days (weekends/holidays expected)
g = s.date.diff().dt.days
oilq['oil_day_gaps_over_4_calendar_days'] = [str(d.date()) for d, k in zip(s.date, g) if k and k > 4]
OUT['oil_quality'] = oilq

def asset_days(df):
    """df: date, price (sorted). Returns sample days with return, kind, tidx."""
    df = df.sort_values('date').reset_index(drop=True)
    df['ret'] = df.price.pct_change() * 100
    d = df[df.date >= START].dropna(subset=['ret']).reset_index(drop=True)
    d['kind'] = np.where(d.ret >= 1.0, 'up', np.where(d.ret <= -1.0, 'down', 'ordinary'))
    d['tidx'] = np.arange(len(d)); return d

def split(d):
    big = d[d.kind != 'ordinary']; N = len(big); nd = int(np.floor(0.7 * N)); B = big.date.iloc[nd - 1]
    d['slice'] = np.where(d.date <= B, 'discovery', np.where(d.date <= B + pd.Timedelta(days=7), 'gap', 'confirmation'))
    for w, k in SPACING.items():
        keep = np.zeros(len(d), bool)
        for sl in ('discovery', 'confirmation'):
            last = -10**9
            for i in np.where((d.slice == sl) & (d.kind != 'ordinary'))[0]:
                if d.tidx[i] - last > k: keep[i] = True; last = d.tidx[i]
        d['indep_' + w] = keep
    return d, dict(N_big=N, n_discovery_big=nd, last_discovery_big_B=str(B.date()), gap=f'{(B+pd.Timedelta(days=1)).date()} to {(B+pd.Timedelta(days=7)).date()}',
                   confirmation_from=str((B + pd.Timedelta(days=8)).date()))

def counts(d, info):
    r = dict(info, sample_start=str(d.date.min().date()), sample_end=str(d.date.max().date()), n_days=int(len(d)),
             share_meeting_1pct=round(100 * float((d.kind != 'ordinary').mean()), 2),
             n_up=int((d.kind == 'up').sum()), n_down=int((d.kind == 'down').sum()), n_ordinary=int((d.kind == 'ordinary').sum()))
    for sl in ('discovery', 'gap', 'confirmation'):
        q = d[d.slice == sl]
        r[sl] = dict(date_range=f'{q.date.min().date()} to {q.date.max().date()}' if len(q) else '', days=int(len(q)),
                     raw_big=int((q.kind != 'ordinary').sum()), raw_up=int((q.kind == 'up').sum()), raw_down=int((q.kind == 'down').sum()),
                     ordinary=int((q.kind == 'ordinary').sum()))
        if sl != 'gap':
            for w in SPACING:
                r[sl]['indep_' + w] = int(q['indep_' + w].sum())
                r[sl]['indep_' + w + '_up'] = int((q['indep_' + w] & (q.kind == 'up')).sum())
                r[sl]['indep_' + w + '_down'] = int((q['indep_' + w] & (q.kind == 'down')).sum())
    return r

oil_cur = asset_days(x[['date', 'price']].copy())
fr = alf[['observation_date', 'first_release_value']].rename(columns={'observation_date': 'date', 'first_release_value': 'price'})
fr = fr[fr.date.isin(x.date)]   # first-release values for official oil dates
oil_fr = asset_days(fr.copy())
oil_fr, info_fr = split(oil_fr); oil_cur, info_cur = split(oil_cur)
OUT['oil_first_release'] = counts(oil_fr, info_fr); OUT['oil_current_file'] = counts(oil_cur, info_cur)
lab = oil_fr[['date', 'kind']].merge(oil_cur[['date', 'kind']], on='date', suffixes=('_fr', '_cur'))
OUT['oil_quality']['days_large_or_ordinary_label_differs_first_release_vs_current'] = int((lab.kind_fr != lab.kind_cur).sum())
oil = oil_fr   # method: use first-release values when a free archive exists

# ---------------- bitcoin ----------------
b = pd.read_csv(os.path.join(HERE, 'raw/btc_binance_1h.csv.gz')); cb = pd.read_csv(os.path.join(HERE, 'raw/btc_coinbase_1h.csv.gz'))
bq = {}
hours = pd.Series(b.open_ms // 1000); exp = np.arange(hours.min(), hours.max() + 1, 3600)
bq['binance_hours'] = int(len(b)); bq['binance_missing_hours'] = int(len(set(exp) - set(hours)))
bq['binance_close_time_ok_share'] = round(100 * float(((b.close_ms + 1 - b.open_ms) == 3600_000).mean()), 3)
bq['binance_zero_trade_hours'] = int((b.n_trades == 0).sum())
cbh = pd.Series(cb.open_s); expc = np.arange(cbh.min(), cbh.max() + 1, 3600)
bq['coinbase_hours'] = int(len(cb)); bq['coinbase_missing_hours'] = int(len(set(expc) - set(cbh)))
bi = dict(zip(b.open_ms // 1000, b.close)); ci = dict(zip(cb.open_s, cb.close))
freeze_utc = pd.Timestamp(open(os.path.join(HERE, 'raw/btc_download_time.txt')).read().split(' to ')[0])
rows = []
for D in pd.date_range('2023-12-31', '2026-11-12'):
    c = cut(D + pd.Timedelta(days=1))
    if c > freeze_utc.timestamp() - 3600: break     # only complete days (cut hour closed before download)
    o = c - 3600; src = 'binance' if o in bi else ('coinbase' if o in ci else None)
    rows.append(dict(date=D, price=bi.get(o, ci.get(o)), source=src, coinbase=ci.get(o), binance=bi.get(o)))
bd = pd.DataFrame(rows)
bq['days_missing_both_sources'] = int(bd.price.isna().sum()); bq['days_from_coinbase_fallback'] = int((bd.source == 'coinbase').sum())
both = bd.dropna(subset=['coinbase', 'binance'])
rel = (both.binance / both.coinbase - 1).abs() * 100
bq['binance_vs_coinbase_close_abs_diff_pct'] = dict(median=round(float(rel.median()), 4), p99=round(float(rel.quantile(.99)), 4), max=round(float(rel.max()), 4))
btc = asset_days(bd.dropna(subset=['price'])[['date', 'price']].copy())
cbd = asset_days(bd.dropna(subset=['coinbase'])[['date', 'coinbase']].rename(columns={'coinbase': 'price'}).copy())
lb = btc[['date', 'kind']].merge(cbd[['date', 'kind']], on='date', suffixes=('_b', '_c'))
bq['days_large_or_ordinary_label_differs_binance_vs_coinbase'] = int((lb.kind_b != lb.kind_c).sum())
bq['last_complete_day'] = str(btc.date.max().date())
btc, info_b = split(btc); OUT['bitcoin'] = counts(btc, info_b); OUT['bitcoin_quality'] = bq

# ---------------- Polymarket coverage ----------------
ev = list(csv.DictReader(open(os.path.join(HERE, 'frozen_app_events.csv'))))
meta = json.load(open(os.path.join(HERE, 'raw/gamma_market_meta.json')))
fc = pd.read_csv(os.path.join(HERE, 'raw/trades_fetch_coverage.csv'), dtype={'market_id': str})
t = pd.read_csv(os.path.join(HERE, 'raw/trades.csv.gz'), dtype={'market_id': str})
ndup = int(t.duplicated().sum()); t = t.drop_duplicates()
t['yes'] = np.where(t.outcome_index == 0, t.price, 1 - t.price) * 100
all_cuts = np.array(sorted({cut(D) for D in pd.date_range('2023-12-20', '2026-11-12')}))
cov_rows, elig_rows = [], []
for e in ev:
    mid = e['chosen_market_id']; g = t[t.market_id == mid].sort_values('t', kind='stable'); arr = g.t.to_numpy()
    f = fc[fc.market_id == mid].iloc[0]; created = pd.Timestamp(meta[mid]['createdAt'])
    first, last = pd.to_datetime(arr.min(), unit='s', utc=True), pd.to_datetime(arr.max(), unit='s', utc=True)
    pos = np.searchsorted(all_cuts, arr, side='left'); nxt = np.where(pos > 0, arr - all_cuts[np.clip(pos - 1, 0, None)], 10**9)
    gaps = np.diff(arr) / 86400 if len(arr) > 1 else np.array([0])
    cr = dict(event_id=e['event_id'], market_id=mid, event_title=e['event_title'], n_trades=len(arr),
              first_trade_utc=str(first), last_trade_utc=str(last), market_created_utc=str(created),
              hours_created_to_first_trade=round((first - created).total_seconds() / 3600, 1),
              history_complete=bool(f.complete) and f.get('last_page_has_more') in (False, 'False'), fetch_pages=int(f.pages),
              trades_before_created=int((arr < created.timestamp()).sum()), odds_out_of_0_100=int(((g.yes < 0) | (g.yes > 100)).sum()),
              outcome_index_values=';'.join(map(str, sorted(g.outcome_index.unique()))),
              trades_exactly_on_midnight_cut=int(np.isin(arr, all_cuts).sum()),
              trades_1_to_59s_after_midnight_cut=int(((nxt >= 1) & (nxt <= 59)).sum()),
              longest_gap_between_trades_days=round(float(gaps.max()), 2), end_date=meta[mid]['endDate'])
    def fresh(c):
        i = np.searchsorted(arr, c, side='right') - 1
        return i >= 0 and c - arr[i] <= 86400
    for aname, d in (('oil', oil), ('bitcoin', btc)):
        disc = d[d.slice == 'discovery']
        cr[f'{aname}_traded_in_discovery'] = bool(((arr >= cut(disc.date.min())) & (arr <= cut(disc.date.max() + pd.Timedelta(days=1)))).any())
        for w in SPACING:
            fz = np.array([fresh(cut(D)) and fresh(cut(D - pd.Timedelta(days=LOOK[w]))) for D in d.date])
            alive = d.date.to_numpy() >= np.datetime64(first.tz_localize(None).normalize())
            cr[f'{aname}_{w}_fresh_share_all_sample_days_pct'] = round(100 * float(fz.mean()), 1)
            cr[f'{aname}_{w}_fresh_share_since_first_trade_pct'] = round(100 * float(fz[alive].mean()), 1) if alive.any() else ''
            rr = dict(asset=aname, event_id=e['event_id'], event_title=e['event_title'], market_id=mid, window=w)
            for sl in ('discovery', 'confirmation'):
                q = (d.slice == sl).to_numpy(); big = (d.kind != 'ordinary').to_numpy(); ind = d['indep_' + w].to_numpy()
                up = (d.kind == 'up').to_numpy(); dn = (d.kind == 'down').to_numpy(); od = (d.kind == 'ordinary').to_numpy()
                rr[f'{sl}_raw_big_fresh'] = int((q & big & fz).sum())
                rr[f'{sl}_indep_big_fresh'] = int((q & ind & fz).sum())
                rr[f'{sl}_indep_up_fresh'] = int((q & ind & up & fz).sum()); rr[f'{sl}_indep_down_fresh'] = int((q & ind & dn & fz).sum())
                rr[f'{sl}_ordinary_fresh'] = int((q & od & fz).sum())
                # sensitivity: freshness first, then spacing (counts only)
                last, k = -10**9, 0
                for i in np.where(q & big & fz)[0]:
                    if d.tidx.iloc[i] - last > SPACING[w]: k += 1; last = d.tidx.iloc[i]
                rr[f'{sl}_indep_big_fresh_if_fresh_first'] = k
                rr[f'{sl}_evaluable_days'] = int((q & fz).sum())
            reasons = []
            if not cr['history_complete']: reasons.append('incomplete trade history')
            if not cr[f'{aname}_traded_in_discovery']: reasons.append('no trade in discovery range')
            if rr['discovery_indep_big_fresh'] < 10: reasons.append(f"only {rr['discovery_indep_big_fresh']} independent discovery large-move days with a fresh window change (need 10)")
            if rr['discovery_ordinary_fresh'] < 1: reasons.append('no ordinary day with a fresh change')
            rr['status'] = 'eligible to be tested later' if not reasons else 'not enough history'
            rr['reason'] = '; '.join(reasons)
            elig_rows.append(rr)
    cov_rows.append(cr)
pd.DataFrame(cov_rows).to_csv(os.path.join(HERE, 'coverage_by_market.csv'), index=False)
pd.DataFrame(elig_rows).to_csv(os.path.join(HERE, 'eligibility_by_pair.csv'), index=False)
OUT['polymarket'] = dict(duplicate_trade_rows_dropped=ndup, n_trades=int(len(t)), n_markets=len(ev))
oil[['date', 'price', 'ret', 'kind', 'slice', 'indep_day_before', 'indep_week_before']].to_csv(os.path.join(HERE, 'oil_days_audit.csv'), index=False)
btc[['date', 'price', 'ret', 'kind', 'slice', 'indep_day_before', 'indep_week_before']].to_csv(os.path.join(HERE, 'bitcoin_days_audit.csv'), index=False)
json.dump(OUT, open(os.path.join(HERE, 'audit_summary.json'), 'w'), indent=1, default=str)
print(json.dumps(OUT, indent=1, default=str))
