# TR-003 pre-registration: Bitcoin near-price markets - do odds move first?

Locked before any odds history, Bitcoin price history or volatility data was fetched.
Follows the skills signal-preregistration, time-alignment-data-hygiene, lead-lag-testing,
signal-evaluation, prediction-market-data-quality. Follow-up to TR-001, where the
volume-based selection picked long-shot contracts with stale odds.

## Claim
For Polymarket Bitcoin price-target contracts whose target was near the Bitcoin price at
listing, the part of the odds NOT explained by the Bitcoin price (the "gap" between the
odds and a price-implied probability) helps predict Bitcoin's next-hour moves.

## Null
The gap adds nothing to predicting Bitcoin beyond Bitcoin's own past. Odds follow Bitcoin.

## Mechanical link handling (locked)
These contracts are defined on the Bitcoin price, so odds move with Bitcoin by construction.
We therefore compute, every hour, a model-implied probability from the Bitcoin price:
- Volatility input: Deribit's public Bitcoin volatility index (DVOL, annualized implied
  volatility, hourly), value at or before the hour. Fallback if unavailable: trailing 30-day
  realized volatility of hourly Bitcoin returns (no future data).
- "Above $K on date T" contracts: probability = N(d), d = [ln(S/K) - 0.5*s^2*t] / (s*sqrt(t)),
  S = Bitcoin price at hour, s = volatility, t = years to resolution time.
- "Reach / hit $K (upside) by T" contracts (touch): probability = min(1, 2*N(-ln(K/S)/(s*sqrt(t))))
  if K > S, else 1. "Dip / fall to $K by T": same with ln(S/K), K < S.
- Gap = odds - model probability (percentage points). The signal is the hourly change in the gap.
The model is an approximation (no drift, no fat tails, resolution source price not exactly
Binance); its errors are mostly slow-moving, so we test changes, not levels, as headline.

## Selection rule (locked; metadata knowable at listing + one Bitcoin price)
1. Polymarket Gamma markets whose question is a Bitcoin price target: "above $K on <date>",
   "reach / hit $K", or "dip / fall to / below $K" (any "Bitcoin" or "BTC" wording),
   excluding "up or down" and range/bracket ("between") markets.
2. End date between 2025-01-01 and 2026-10-31, open or resolved, including all resolutions.
3. Near-price: |K / S0 - 1| <= 10%, where S0 = Bitcoin hourly close (Binance BTCUSDT) at the
   hour of the market's listing time (startDate, else createdAt).
4. Lifetime of at least 48 hours between listing and end date (so a test window exists).
5. Liquidity: lifetime volume of at least $50,000. Known limitation: lifetime volume is not
   knowable at listing; it is used only as a liquidity floor, not ranked on.
6. If more than 60 qualify, take a random sample of 60 with seed 20261110 (no ranking by
   volume or outcome).
Rough run allowed on the first 10 of that random order; final result uses all selected.

## Data hygiene (locked)
- All times UTC. Odds: Polymarket CLOB prices-history, Yes token, fidelity 60 minutes; value at
  hour H = last point at or before H; no forward fill. Bitcoin: Binance hourly close, stamped at
  the end of the hour.
- Drop the last 24 hours before each contract's end date. Drop hours with odds or model
  probability outside 3%-97%.
- Contracts with more than 50% unchanged hourly odds (stale) or fewer than 30 usable changes are
  reported but excluded.
- Winsorize changes at the 1st and 99th percentiles within each contract.

## Tests (headline, counted) - 5 tests, Holm correction at 5%
On contract-stacked hourly data (lags never cross contracts), contract fixed effects,
standard errors clustered by hour (same hour shared across contracts), predicted sign positive:
1. Gap leads Bitcoin: Bitcoin return at t on 1..4 lags of Bitcoin return and 1..4 lags of gap
   change; F-test that the gap-lag coefficients are zero; sum of coefficients must be positive.
2. Bitcoin leads odds: odds change at t on 1..4 lags of odds change and 1..4 lags of Bitcoin
   return (expected to be significant; tells us whether odds lag).
3. Odds lead Bitcoin (raw odds, no model): same as test 1 with odds change instead of gap change.
4. Event study: events = |gap change| >= 5 percentage points in one hour, at least 24 hours apart
   within a contract; sign-aligned Bitcoin return over +1..+4 hours vs 1,000 shuffled placebo
   event sets (same count per contract, shuffled signs); also report -4..-1 hours.
5. Level signal: rank correlation between the gap level at t and Bitcoin's return over t+1..t+4,
   using non-overlapping 4-hour steps; p from a block bootstrap by contract (1,000 resamples).
Descriptive only: cross-correlation of gap change and Bitcoin return at -12..+12 hours;
per-contract counts; results with realized-volatility fallback.

Held-out slice: the last 30% of calendar time (by hour) across the sample, reported separately.

## Decision bar
- YES (gap leads): test 1 significant after Holm with positive sum, AND test 4 post move
  positive and significant (raw p < 0.05) without a significant same-direction pre move, AND
  same positive sign in the held-out slice for test 1. Practical relevance additionally needs the
  average post-event move above 0.10%.
- NO: test 1 not significant AND the 95% interval of the one-hour-ahead correlation between gap
  change and Bitcoin return lies below +0.05.
- INCONCLUSIVE: anything else, or fewer than 30 events for test 4 (then judge on 1 and 3 only),
  or fewer than 500 usable hour-pairs.

## Deviations (append only)
- D1, 2026-11-10 00:49 Israel time, after the first run. Polymarket prices-history points are
  stamped a few seconds after each hour (all at minute 0, median 9 seconds past). The locked rule
  "value at hour H = last point at or before H" therefore assigns the 10:00:07 snapshot to 11:00,
  an artificial one-hour delay (first run: same-hour correlation of odds and Bitcoin 0.006,
  next-hour 0.77). Fix: a point within the first 60 seconds after the hour is treated as the value
  at that hour. Both versions are reported; the fixed version is the headline. Look-ahead from the
  fix is at most 59 seconds.
- Implementation details not specified in advance: odds and model probabilities for "dip"
  contracts are sign-flipped so that up = bullish; the realized-volatility version is a robustness
  check, not counted.
