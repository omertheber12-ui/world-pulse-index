# TR-005 data manifest

All times below are Israel time (Asia/Jerusalem, UTC+2) unless marked UTC. Reproduce everything with `./run_all.sh` (needs Python with pandas, numpy, xlrd; seed 20261110 is fixed in code/common.py).

## Sources

| File | Source URL | Downloaded | Rows | First / last | Notes |
|---|---|---|---|---|---|
| raw/app_fallback.json | github.com/omertheber12-ui/world-pulse-index, file site/data/fallback.json, commit db8a9616bd1c70b93bec7d6d0d3541f95e7bc8cd (committed 10 Nov 2026 00:55 Israel time) | 10 Nov 2026 14:25 | 16 events | built 9 Nov 2026 18:35 | The app's own event list (site/lib/pulse.js loads every event in this file) |
| raw/gamma_market_meta.json | https://gamma-api.polymarket.com/markets/{id} for the 16 frozen market ids | 10 Nov 2026 ~14:28 | 16 markets | created 12 Jul 2025 ... 8 Nov 2026 | Catalog metadata only (condition id, created date) |
| raw/eia_RWTCd.xls | https://www.eia.gov/dnav/pet/hist_xls/RWTCd.xls (US Energy Information Administration, Cushing West Texas spot, series RWTC) | 10 Nov 2026 14:26 (12:26 UTC) | 709 oil days used (2024-01-02 to 2026-11-03); 2023 rows used only for the trailing cap | 1986-01-02 / 2026-11-03 | Federal Reserve copy (DCOILWTICO) timed out 3 times; see Deviation 1 |
| raw/trades.csv.gz | https://data-api.polymarket.com/v2/trades?condition={conditionId} (public cursor feed) | 10 Nov 2026 14:29 to 14:31 | 492,842 trades, 16 markets, every market fetched to its first trade | first trade 11 Jul 2025 22:21; last 10 Nov 2026 14:28 | Only market id, trade time (unix seconds UTC), price, outcome index, side, size kept. No wallet fields. |

Per-market trade counts, first/last trade (UTC), and stale share are in `stale_share.csv`. Stale share = share of oil days after the market opened with no trade in the 24 hours before 00:00 New York time. The 5 markets that could enter discovery (created before March 2026) had stale shares of 0 to 6.9 percent. Several small late markets were 48 to 83 percent stale.

## Outputs

| File | sha256 |
|---|---|
| PREREG.md (locked plan + appended deviations; locked original sha256 7ed103f2907b4b0a014c42d22a89ca1dc2214d1bfb2df0d81d7c193b4846da5a) | f055d96facf28f0085fda1717d4bc4cb1ad2c8d31cbb8169a40b04fea7a1a8fd |
| raw/app_fallback.json | e09283830bc657c72d7d85812fa62a784b90163dc1f22c107b0d9be501649f5a |
| raw/eia_RWTCd.xls | d14bf481bee0d9a8f1b475d9103821f33289e2c55234711712e1231ee75e1b36 |
| raw/gamma_market_meta.json | f3e650eb9e71c486d3c42bb5655fe4b06ee66b03ee3c9898458408cc450b1af3 |
| raw/trades.csv.gz | e646f949457af2f93729037de58d59dccffe9e16b34ac1ae8fb8b7c92836f707 |
| raw/trades_fetch_coverage.csv | 145443784224e2fe1b9c68724a4bd8c485a050d136180636e2e7e34f578f9f27 |
| frozen_app_events.csv | b971e6cb18eeb74b285a7d21b1ce0bedb46df50f049396a07b474f536e3fee6c |
| set_aside_oil_price_contracts.csv (header only; none set aside) | 5ab199a34348bbfa70c11e9a38737034735b1d648d68e617f31a36b3f35e1a0d |
| oil_days.csv | aa1b2cdb536046ef081fcca795c644dbdb5454179d3b49ff2f369605c0d3a5b4 |
| discovery_table.csv (16 events x 3 windows = 48 rows) | ae851b22e2ba9501b0b53ad54dbcf09bf18bc56ee4990a4feaf6ab34fb6d4a00 |
| event_ranking_discovery.csv | ae2a3023f861ceaecf733b6de10784421d20b2df55502d177fbe4980ff9696bf |
| locked_pick.json | 44dbe4d86315ea8da0bf81fe452cf22f623801de65cd90221719c94a17cd8edf |
| confirmation_summary.json | 9946a7cdcc07716955a9e24b1221416166d77f9c285362b306979eeb11776242 |
| stale_share.csv | 752bb47842d10ea168c095d022efa636b75541f267a01d7665ba6e43e0a7c095 |

## Order of work (local git log, branch research/oil-odds-discovery)

1. a2e8bac Lock pre-registration
2. 6e2db4d Freeze app event list (before any price or trade download)
3. 04fb06f Deviations 1-2 appended (oil source and end date; 2023 rows for trailing cap)
4. fe2f014 Implementation notes appended before any discovery statistic; raw oil and trades saved
5. c667231 Discovery on first 70 percent only; locked pick written
6. 291ac40 Confirmation on last 30 percent (14:33:45 Israel time)
7. 01856f7 Write-up and manifest; later commit adds a timestamp correction to PREREG.md
