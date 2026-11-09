# TR-003: Bitcoin near-price markets - do odds move first?

Research only, public data only, not investment advice.

- `PREREGISTRATION.md` - locked before any odds, price or volatility data (first commit, alone), plus an append-only deviations log.
- `scripts/fetch_btc_and_vol.py` - Binance BTCUSDT hourly closes and the Deribit public Bitcoin volatility index, hourly (fixed dates 2024-11-01 to 2026-11-01).
- `scripts/select_markets.py` - pre-registered selection from Polymarket Gamma metadata: Bitcoin price-target contracts (above / reach / dip), end dates 2025-01-01 to 2026-10-31, target within 10% of Bitcoin at listing, at least 48 hours of life, at least $50,000 lifetime volume, random 60 (seed 20261110). Resolved contracts included.
- `scripts/fetch_odds.py` - hourly odds from Polymarket CLOB prices-history.
- `scripts/analyze.py` - model-implied probability from the Bitcoin price and volatility index, the gap (odds minus model), 5 pre-registered tests with Holm correction, held-out last 30%, as-locked vs timestamp-fixed versions, and a realized-volatility robustness check.
- `data/` - snapshots used (fetched 2026-11-10). `results/summary.json`, `results/events_*.csv`, `results/quality_*.csv` - outputs.

## Reproduce (from this folder, using the saved snapshots; fixed seed 20261110)

```
pip install -r requirements.txt && python scripts/analyze.py
```

Full refetch: `python scripts/fetch_btc_and_vol.py && python scripts/select_markets.py && python scripts/fetch_odds.py && python scripts/analyze.py`
