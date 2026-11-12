# TR-001: do prediction market odds move before related assets?

Research only, public data only, not investment advice.

- `PREREGISTRATION.md` - hypothesis, tests and yes/no bar, committed before any price data was fetched (first commit on this branch), plus an append-only deviations log.
- `scripts/select_markets.py` - picks markets by the written rule from Polymarket Gamma API metadata (includes resolved markets).
- `scripts/fetch_odds.py` - hourly odds from Polymarket CLOB `prices-history` (fidelity 60 minutes).
- `scripts/fetch_assets.py` - Bitcoin hourly (Binance BTCUSDT), 2-year Treasury yield (FRED DGS2), KRE daily (Yahoo chart API), fixed dates 2024-10-01 to 2026-11-01.
- `scripts/analyze.py` - lead-lag regressions in both directions, event study with shuffled placebo, attention (volatility) test, Holm correction, held-out last 30% of time, log-odds robustness, cross-correlations.
- `data/` - snapshots used for the reported results (fetched 2026-11-10).
- `results/summary.json`, `results/results.json`, `results/events_*.csv` - outputs.

## Reproduce

From this folder, with the saved data snapshots (deterministic, seed 20261110):

```
pip install -r requirements.txt && python scripts/analyze.py
```

To refetch everything from the public APIs first: `python scripts/select_markets.py && python scripts/fetch_odds.py && python scripts/fetch_assets.py && python scripts/analyze.py` (open markets may have changed since the snapshot).
