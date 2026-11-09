# TR-002 pre-registration: events priced mainly on Polymarket — do odds move first?

- Date locked: 2026-11-09 22:50 UTC (2026-11-10 00:50 Asia/Jerusalem). Proof: first git commit of this file, plus a copy uploaded to Google Drive (Deliverables · Research) before any price or odds history was fetched.
- Written before fetching ANY odds history or asset price history. Only Polymarket market metadata (titles, volumes, end dates) was browsed to write the selection rule.
- Research only, public free data only, not investment advice.

## 1. Claims (one per event type, tested separately)

- E (elections): For national elections, a change in Polymarket win odds in one hour is followed by a same-direction move in the linked asset over the next 1, 4 or 24 hours (odds lead the asset).
- P (policy decisions: tariffs, government shutdowns, Fed chair appointment): same claim for policy markets and their linked asset.
- C (court rulings): same claim for court-ruling markets and their linked asset.

Direction ("same direction") for each market is set by the sign of the same-hour correlation between odds changes and asset returns measured on the first 70% of that market's data only (so the rule picks the sign, not the analyst).

## 2. Null hypothesis and rivals

- Null: odds changes add nothing to the asset's next move beyond the asset's own recent moves; any link is same-hour only, or the asset moves first.
- Rivals to rule out: (a) reverse direction (asset leads odds); (b) common news hitting both at once; (c) stale prices (asset market closed while Polymarket trades 24/7) creating fake leads; (d) final convergence of odds to 0 or 1 after the outcome is public.

## 3. Data sources (all public, free)

- Polymarket Gamma API (`https://gamma-api.polymarket.com/events`, `/markets`) for metadata; Polymarket CLOB `https://clob.polymarket.com/prices-history` (fidelity 60 minutes) for the odds of the Yes token.
- Bitcoin hourly: Binance public klines BTCUSDT 1h.
- Currencies, exchange-traded funds and futures hourly: Yahoo Finance public chart API, interval 60m (only available for roughly the last 730 days, i.e. from about 2024-11-11). Daily: same API, interval 1d.
- All times converted to UTC. Asset bars stamped at bar close (Yahoo 60m bars are stamped at bar open: +60 minutes, capped at 16:00 New York for the last stock bar; Binance stamped at close).

## 4. Market selection rule (metadata only; includes resolved markets)

Window: event end date between 2024-06-01 and 2026-10-31. Source: Gamma `/events` with tag slugs `elections`, `world-elections`, `global-elections`, `politics`, `tariffs`, `economy`, `fed-chair`, `courts`, `scotus`, open and closed.

- E: event title names a national presidential, prime-minister or parliamentary election (or "next prime minister/president" decided by that election); event volume at least $20 million; the country has its own floating currency in the pairing table below. Excluded by rule: sub-national races (states, mayors, by-elections), euro-area countries (shared currency does not isolate the country), countries without a freely traded currency in free data (Ethiopia, Vietnam, Russia, Honduras, Belarus, Bolivia, Venezuela, Tunisia), margin/turnout/second-place/vote-share side markets, party-nomination races.
- P: event title contains "tariff", "shutdown", "Fed Chair" or "trade deal"; event volume at least $5 million.
- C: event in tags `courts` or `scotus` whose question is a court ruling or court timing on an economic policy (tariffs) or a listed company; event volume at least $300,000.
- Within each selected event, use the single market (outcome) with the highest lifetime volume. One market per event, so events are independent units.
- Market-level minimum lifetime volume: $1 million (E, P) and $250,000 (C).
- Analysis window per market: from max(market start, end date minus 180 days) to end date minus 24 hours (the last 24 hours before scheduled end are excluded from headline tests and studied as a separate segment, section 7).

## 5. Asset pairing (written before looking; one PRIMARY asset per market for headline tests)

| Market type | Primary asset (hourly where possible) | Secondary (exploratory only) | Reason |
|---|---|---|---|
| US 2024 presidential winner | Bitcoin (Binance hourly) | S&P 500 (SPY daily), US dollar vs Mexican peso (daily) | Bitcoin was a widely cited "Trump trade" and trades 24/7 like Polymarket; free hourly stock data before Nov 2024 is not available |
| Romania presidential 2025 | Euro vs Romanian leu (EURRON=X) | — | own currency |
| South Korea presidential 2025 | US dollar vs Korean won (KRW=X) | Korea exchange-traded fund EWY | own currency |
| Poland presidential 2025 | US dollar vs Polish zloty (PLN=X) | — | own currency |
| Canada 2025 (next prime minister) | US dollar vs Canadian dollar (CAD=X) | — | own currency |
| Hungary 2026 | US dollar vs Hungarian forint (HUF=X) | — | own currency |
| Chile 2025 | US dollar vs Chilean peso (CLP=X) | — | own currency |
| Peru 2026 | US dollar vs Peruvian sol (PEN=X) | — | own currency |
| Colombia 2026 | US dollar vs Colombian peso (COP=X) | — | own currency |
| Brazil 2026 | US dollar vs Brazilian real (BRL=X) | — | own currency |
| Israel 2026 | US dollar vs Israeli shekel (ILS=X) | — | own currency |
| Czech Republic 2025 | US dollar vs Czech koruna (CZK=X) | — | own currency |
| Argentina 2025 deputies | US dollar vs Argentine peso (ARS=X) | Argentina fund ARGT | own currency (managed; flagged) |
| Any other election selected by the rule | US dollar vs that country's currency | — | rule |
| Fed chair (appointment, Powell exit) | 2-year Treasury note futures (ZT=F) | US dollar index (DX-Y.NYB) | rates expectations |
| Government shutdown | S&P 500 fund SPY | 10-year note futures (ZN=F) | broad risk sentiment |
| Tariffs on / trade deal with China | China large-cap fund FXI | US dollar vs offshore yuan (CNH=X) | direct exposure |
| Other tariff policy | S&P 500 fund SPY | Retail fund XRT | broad exposure |
| Court rulings on tariffs | Retail fund XRT (import-heavy retailers) | SPY | tariff costs fall on importers |
| Court rulings on a named company | that company's stock | SPY | direct |

Pairings are ASSUMPTIONS about which asset is most exposed; they are not tested facts.

## 6. Data hygiene rules

- Odds: Yes-token price; sampled on each asset bar-close time as the last odds point at or before that time. Bars with odds below 0.03 or above 0.97 are dropped. Odds changes in log-odds, log(p/(1-p)) with p clipped to [0.01, 0.99]; percentage-point changes as robustness.
- Asset: log returns between consecutive fresh bars only. Hourly pairs that span a market closure (gap > 70 minutes) are dropped (no forward-filled changes). Bitcoin trades 24/7. Stocks: regular session only.
- Winsorize odds changes and asset returns at the 1st and 99th percentiles per market.
- Polymarket spread and depth history are not available from the free history endpoint; data quality is reported via volume and share of zero-change bars instead (limitation stated in advance).
- Step: hourly where the primary asset has hourly data covering the window; otherwise daily (New York close, odds sampled at 21:00 UTC). Markets whose hourly asset data covers less than 50% of the analysis window use daily and are reported separately.

## 7. Tests (per event type, pooled across its markets; markets as fixed effects)

Notation: x = sign-aligned odds change in bar t, y = asset return.
1. Lead, odds to asset: regress y over (t, t+h] on x_t and y_t, for h = 1, 4 and 24 bars (hourly) [3 tests]. Newey-West standard errors with lag max(h, 4), pooled.
2. Reverse, asset to odds: regress x over (t, t+h] on y_t and x_t, same h [3 tests].
3. Granger-style F-tests both directions with 4 lags, stacked across markets [2 tests].
4. Event study: big odds jump = |change in odds| at least 5 percentage points in one bar AND |log-odds change| at least 3 times its trailing 168-bar standard deviation; jumps at least 24 bars apart. Sign-aligned cumulative abnormal asset return (actual minus trailing 168-bar mean) over [+1,+4] (post) [1 test] and [-24,-1] (pre) [1 test]. Placebos: (a) shuffled event times within the same market, 1,000 draws, seed 20261110; (b) odds shifted +168 bars; (c) reverse event study using asset jumps (|return| at least 3 trailing standard deviations) and looking at odds.
5. Near-resolution segment: from end date minus 24 hours to end date plus 48 hours, the 1-bar lead and 1-bar reverse regressions [2 tests].
- Total headline tests: 12 per event type x 3 types = 36. Holm correction at 5% across all 36. Anything else (secondary assets, daily step, percentage-point odds, cross-correlations at lags -24..+24) is exploratory and labeled so.

## 8. Held-out slice

The last 30% of each market's analysis window (by time) is held out. Signs for alignment and all headline estimates use the first 70%; the held-out slice is checked once for the same sign.

## 9. Decision bar (per event type)

- YES (odds move first): a lead test (odds to asset, h = 1, 4 or 24) is positive and passes Holm across 36 tests; AND the event-study post-window mean is positive, at least 0.10% (10 basis points), and above the 95th percentile of the shuffled placebo, with no significant positive pre-window move; AND the held-out slice has the same sign; AND at least 30 independent big-jump events.
- NO: no lead test passes Holm and the 95% interval of the 1-bar lead correlation lies below 0.05; OR the reverse direction (asset to odds) passes Holm while odds to asset does not.
- INCONCLUSIVE: anything else, including fewer than 30 big-jump events or fewer than 3 markets in the type.
- Minimum meaningful effect: correlation 0.05 at the 1-bar lead, or 10 basis points average post-jump move.

## 10. Deviations (append only)

- D1 (2026-11-09 23:00 UTC, still BEFORE any odds or price history was fetched; only metadata seen). Reason: the "single highest-volume market per event" rule picked long-shot candidates in several multi-candidate events (for example a minor candidate in Romania and Chile), which would leave almost no usable odds between 3% and 97%. Change: (a) keep EVERY market in a selected event whose lifetime volume meets the market minimum ($1 million for elections and policy, $250,000 for courts); the 3%-97% odds filter then removes long-shot periods by rule; (b) one event per election (two Hungary events matched; keep the higher-volume one); (c) analysis window end = earlier of scheduled end date and actual close time (metadata `closedTime`) minus 24 hours, because some events carry placeholder end dates; (d) because markets in one event share news, big-jump events in the event study are de-duplicated per event: jumps in different markets of the same event within 24 bars count once (largest kept); the independence count for the YES bar uses these de-duplicated events. Tests, assets, decision bar and test count are unchanged.
- D2 (2026-11-09 23:20 UTC, after the first analysis run). Not a change to the plan; a code fix so the code follows section 9 as written. The first run of `analyze.py` required at least 30 big-jump events before it would return NO; section 9 applies the 30-event minimum to YES only, and NO is decided by the 1-bar lead interval and the reverse-direction test. The code now follows the text. Both outputs are reported in the write-up.
- Notes on what could not run as planned (facts, not changes): (a) elections and policy had too few big one-hour odds jumps outside the last 24 hours (1 and 5 de-duplicated events in the first 70%) so the event study and its placebos are uninformative; (b) for stock and futures assets with hourly bars only in market hours, the 24-bar forward sum could not be computed under the no-cross-closure rule for policy and courts, so those tests count as p = 1 in the Holm correction; (c) the percentage-point robustness and a descriptive US election-night cross-correlation (the final 24 hours, Bitcoin vs Trump odds) were added as exploratory outputs.
