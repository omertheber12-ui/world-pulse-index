# TR-002: events priced mainly on Polymarket — do odds move before related assets?

Research only, public free data only, not investment advice.

- `PREREGISTRATION.md` — claims, selection rule, asset pairing, tests (36 counted, Holm-corrected), decision bar. First commit on this branch, locked before any odds or price history was fetched; append-only deviations log (D1 before data, D2 code fix).
- `scripts/select_markets.py` — picks markets by the written rule from Polymarket Gamma metadata (open and resolved markets).
- `scripts/fetch_odds.py` — hourly odds of the Yes token from Polymarket CLOB `prices-history` (fidelity 60 minutes).
- `scripts/fetch_assets.py` — Yahoo Finance public chart API (60-minute bars for the last ~729 days, daily since 2024-01-01) and Binance BTCUSDT hourly (May to Nov 2024).
- `scripts/analyze.py` — lead and reverse regressions (h = 1, 4, 24 bars) with Newey-West errors, Granger-style tests both ways, event study with shuffled, time-shift and reverse placebos, near-resolution segment, held-out last 30%, Holm across 36 tests, exploratory per-event, daily, percentage-point and US election-night outputs. Seed 20261110.
- `data/` — snapshots used for the reported results (fetched 2026-11-10 Asia/Jerusalem). `results/` — `results.json`, `run_log.txt`, `data_quality.csv`, `per_event_exploratory.csv`, `events_*.csv`, `us_election_night_hourly.csv`.

## Reproduce

From this folder, with the saved data snapshots (deterministic):

```
pip install -r requirements.txt && python scripts/analyze.py
```

To refetch from the public sources first (open markets and the 729-day hourly window will have moved): `python scripts/select_markets.py && python scripts/fetch_odds.py && python scripts/fetch_assets.py && python scripts/analyze.py`.
