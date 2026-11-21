# TR-001 pre-registration: do prediction market odds move before related assets?

Locked before any price data was fetched or viewed. Only this file exists at lock time.
Follows skills: signal-preregistration, time-alignment-data-hygiene, lead-lag-testing,
signal-evaluation, prediction-market-data-quality.

## Claim (one sentence)
For Polymarket contracts tied to a tradable asset, a change in the contract's implied
probability at step t helps predict the asset's change at step t+1 (and later), beyond
what the asset's own past changes predict.

## Null (the boring explanation)
Odds changes add nothing beyond the asset's own past; any co-movement is same-step
(contemporaneous) or runs from the asset to the odds (odds follow the asset).

## Rival explanations to rule out
- Reverse direction: the asset moves first and the odds catch up.
- Common news shock hitting both, faster on one venue.
- Mechanical link: Bitcoin price-threshold contracts are defined on the Bitcoin price,
  so same-hour co-movement is by construction. Only the lagged (next-hour) relation is
  tested; same-hour correlation is reported but not counted as evidence of a lead.
- Stale prices: thin odds series or closed-market periods creating fake lags.

## Event types (analyzed separately, never pooled across types)

### A. Federal Reserve rate decisions (daily step)
- Universe rule: Polymarket markets (Gamma API metadata) for US Federal Reserve
  interest-rate decisions at scheduled meetings, outcome "decrease / cut by 25 basis
  points" (any wording of a 25 bps cut), whose end date falls between 2025-01-01 and
  2026-10-31, open or resolved, including those that resolved No. Keep those with
  lifetime volume of at least $1,000,000. If more than 8 qualify, take the 8 with highest
  volume. Rough run: the 2 highest-volume.
- Asset: US 2-year Treasury yield, daily, FRED series DGS2 (public). Secondary
  (exploratory): regional bank fund KRE daily close.
- Alignment: odds sampled at the last hourly point at or before 20:00 UTC on each US
  business day; DGS2 is an end-of-day value. Changes only between consecutive business
  days where both exist. Odds sign: rise in cut probability = easing expectation, which
  should come with a FALL in the 2-year yield (predicted sign negative).

### B. Bitcoin price-threshold markets (hourly step)
- Universe rule: Polymarket markets whose question asks whether Bitcoin will reach,
  hit, or be above/below a dollar level by or on a date, end date between 2025-01-01
  and 2026-10-31, open or resolved, lifetime volume of at least $1,000,000. If more than
  8 qualify, take the 8 with highest volume. Rough run: the 2 highest-volume.
- Asset: Bitcoin/US dollar hourly close from a public exchange API (Binance BTCUSDT,
  Coinbase BTC-USD as fallback), UTC hours. 24/7 market, no session gaps.
- Odds sign: for "above / reach (upside)" contracts a rise in probability should come
  with a rise in Bitcoin (predicted sign positive); for "below / dip" contracts flip the
  sign so all are sign-aligned to "bullish".

## Data hygiene rules
- All timestamps UTC; odds from Polymarket prices-history (fidelity 60 minutes).
- Bar-close convention: value at hour H = last observation at or before H.
- Exclude the final 24 hours before each contract's end date (near-resolution drift).
- Exclude bars where the odds price is below 0.03 or above 0.97.
- Stale rule: an odds bar is stale if it repeats the previous value exactly; changes from
  stale bars are kept (a zero change is information) but the stale share is reported;
  if above 50% for a contract, that contract is reported but dropped from pooled tests.
- Changes: odds in percentage points; also log-odds change as robustness. Asset: log return
  (Bitcoin) or yield change in basis points (DGS2).
- Outliers: winsorize changes at 1st and 99th percentiles within each contract.

## Tests (headline, counted) - 4 per event type, 8 total
For each event type, on contract-stacked data (each contract's series kept separate;
lags never cross contracts):
1. Odds lead asset: regression of asset change at t on 1..p lags of asset change and
   1..p lags of odds change (p = 4 hours for Bitcoin, p = 2 days for Fed); F-test that the
   odds-lag coefficients are zero; contract fixed effects; heteroskedasticity-robust errors.
2. Asset leads odds: the same with roles swapped.
3. Event study: events = |odds change| at least 5 percentage points in one step,
   sign-aligned; events at least 24 steps (Bitcoin) / 5 days (Fed) apart within a contract.
   Measure the sign-aligned asset move in the post window (+1..+4 hours / +1..+2 days)
   and pre window (-4..-1 hours / -2..-1 days). Lead = post move significantly in the
   predicted direction. Significance from a shuffled-event placebo (1,000 random
   same-count event times per contract), two-sided.
4. Attention: do big odds moves (same events) come with or before higher asset volatility
   (mean absolute asset change) in the post window, versus the shuffled placebo? Bitcoin
   also: exchange volume.

Descriptive only (not counted): cross-correlation of changes at lags -24..+24 hours
(Bitcoin) / -5..+5 days (Fed); per-contract results; KRE; log-odds version.

Multiple testing: Holm correction across the 8 headline tests at 5%.
Held-out slice: the last 30% of calendar time per event type, reported separately; YES
requires the same sign there.

## Decision bar (per event type)
- YES (odds lead): test 1 significant after Holm with the predicted sign, AND event-study
  post move significant in the predicted direction with no significant pre move in the
  same direction, AND same sign in the held-out slice.
- NO (odds follow or are simultaneous): test 1 not significant and either test 2
  significant, or the odds-to-asset effect is small (95% interval rules out a lagged
  correlation above 0.05 in absolute value).
- INCONCLUSIVE: anything else, or fewer than 30 events, or fewer than 100 usable
  step-pairs.
- Minimum meaningful effect: lagged correlation of at least 0.05, and for Bitcoin an
  average post-event move larger than 0.10% (roughly typical trading cost).

Attention (weaker claim), per event type:
- SUPPORTED: post-event absolute asset move above placebo after Holm.
- NOT SUPPORTED otherwise. Even if supported, this shows co-timing with volatility, not
  that it helps investors; that needs a user study (out of scope).

## Deviations (append only)
- 2026-11-10 00:36 Israel time (after first run). Pre-registered Bitcoin test returned no usable data:
  all 8 rule-selected contracts were either outside 3%-97% almost all the time (3 monthly
  "$150,000" contracts) or had 60%-86% of hourly odds unchanged (stale), above the 50% cut.
  Pre-registered Bitcoin verdict is therefore INCONCLUSIVE (data quality). Added EXPLORATORY,
  not pre-registered runs, labeled as such in all outputs:
  D1 Bitcoin hourly with the stale cut removed; D2 Bitcoin daily (00:00 UTC) with the stale
  cut removed; D3 Fed with the stale cut removed (identical to pre-registered: no Fed contract
  exceeded it). Holm correction applied within the 12 exploratory tests separately.
- Implementation detail not specified in advance: contracts with fewer than 30 usable changes
  are skipped; Fed daily odds = last hourly value at or before 20:00 UTC on dates where the
  2-year yield exists; the "untestable" Bitcoin tests count toward the 8-test Holm family as p = 1.
- Exploratory secondary asset KRE (regional bank fund) reported, not counted.
