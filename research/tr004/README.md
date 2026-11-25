# TR-004: decision moments and big bets — is a "big bets just came in" alert a usable signal?

Research only, public free data only, not investment advice. Wallets are treated as a statistical pattern only: every wallet id is hashed with a secret salt kept outside this repository before saving; no trader or wallet is named anywhere. Results files contain no wallet ids at all.

- `PREREGISTRATION.md` — question, event rule, screen, 5 counted tests (Holm), held-back slice, decision bar. First commit, alone, before any trade/odds/price data. Append-only deviations (D1 before data, D2 data-access changes).
- `scripts/select_events.py` — 80 decision-moment events from Polymarket Gamma metadata (2 top-volume markets each).
- `scripts/fetch_trades.py` — taker trades from Data API v2 for each 72-hour window before close, plus a 7-day baseline (hashed wallets).
- `scripts/fetch_btc.py` — Bitcoin 1-minute bars from Binance (bar-close stamps).
- `scripts/screen.py` — size-vs-market and one-sidedness signals using only trades up to the bet.
- `scripts/fetch_wallet_history.py` — size-vs-own-history inputs (count and median of earlier trades only). Needs the private salt/map, so it cannot be rerun from this repo alone; its output is saved.
- `scripts/analyze.py` — tests A1-A3 (odds), B1-B2 (Bitcoin), Holm, held-back slice, exploratory outputs. Seed 20261110.
- `data/` snapshots (fetched 2026-11-10 Asia/Jerusalem), `results/results.json`, `results/run_log.txt`, `results/alerts_no_wallet_ids.csv`.

## Reproduce (from saved snapshots, deterministic)

```
pip install -r requirements.txt && python scripts/analyze.py
```
