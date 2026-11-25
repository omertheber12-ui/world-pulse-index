# TR-004 pre-registration: decision moments and big bets — is a "big bets just came in" alert a usable signal?

- Locked: 2026-11-09 23:28 UTC (2026-11-10 01:28 Asia/Jerusalem), before pulling ANY trade, odds or price data for this study. Proof: this file is the first git commit, alone, and a copy is uploaded to Google Drive (Deliverables · Research).
- Only Polymarket event/market METADATA (titles, volumes, end and close times) will be used to build the event list.
- Research only, public free data only, not investment advice. Wallets are a statistical pattern only: wallet ids are hashed with a secret salt kept outside the repository before anything is saved; no trader or wallet is named, listed or accused anywhere.

## 1. Question and claims

Product question: would an alert that fires when an unusually large, one-sided bet comes in give users useful early information?

- Claim A (odds): in decision-moment windows, a flagged large bet is followed, starting 5 minutes after the bet (alert delay), by a further move in the Polymarket odds in the bet's direction that is larger than after ordinary bets in the same market and larger than at random times.
- Claim B (asset): the same flagged bets are followed, from 5 minutes after the bet, by a move in a linked asset in the direction implied by the bet.
- Null: after the 5-minute delay, flagged bets are followed by no more same-direction movement than ordinary bets or random times.
- Rivals: (1) price impact of the bet itself (a large buy mechanically moves the price; the 5-minute delay and the ordinary-bet control address this); (2) momentum/order flow in general (ordinary-bet control); (3) news already public (big bets reacting to news, not anticipating it); (4) timestamp traps (Polymarket hourly snapshots are stamped seconds after the hour, which TR-003 showed can fake a one-step lag; here all times come from trade timestamps and exchange bar-close times, never from snapshots).

## 2. Event list rule (metadata only)

Source: Polymarket Gamma `/events` (closed events), end or close date between 2025-01-01 and 2026-10-31. An event is a "decision moment" if its title matches one of:
- Election night: national presidential, prime-minister or parliamentary election (title contains "election" or "next president/prime minister"), event volume at least $5 million; excluded: margin, turnout, vote share, seats count, 2nd/3rd place, sub-national, primaries, nominations.
- Court ruling day: title contains "court", "Supreme Court", "SCOTUS", "ruling", "rule on", "verdict", "guilty", "convicted" or "sentenced", event volume at least $300,000.
- Strike or deal news: title contains "strike", "strikes", "ceasefire", "deal", "agreement", "capture", "invade" or "invasion", event volume at least $5 million.
- Shutdown deadline: title contains "shutdown", event volume at least $1 million.
Within each event: the 2 markets with the highest lifetime volume (each at least $250,000). If more than 80 events qualify, keep the 80 with the highest event volume (cost limit), stated before seeing any trade data. Minimum 30 events with at least one alert, else the answer is UNCLEAR by rule.

Decision-moment window per market: the 72 hours before the market's actual close time (metadata `closedTime`; if missing, the end date). This window is chosen from metadata only and contains the moment the outcome became known for nearly every closed market.

## 3. Data (public, free)

- Trades: Polymarket Data API `https://data-api.polymarket.com/trades?market=<conditionId>` (all trades in the window; fields used: wallet (hashed immediately), side, outcome index, size, price, timestamp in seconds). If the API cannot return the full window (paging cap), the window is truncated to what is returned; markets with less than 50% of the window covered are dropped and reported.
- Wallet history for the size-vs-own-history signal: Data API `trades?user=<wallet>` (up to the first 3,000 records returned), only for wallets that pass the market-size signal; only trades strictly before the bet are used. Saved with hashed id, timestamp and cash amount only.
- Odds at minute step: the Yes-equivalent trade price (a No trade at price q counts as Yes price 1-q), taken as the median of the last 5 trades at or before each moment (reduces bid-ask bounce). From trades, not snapshots.
- Asset: Bitcoin 1-minute bars from Binance (free, 24/7), stamped at bar close (open time + 60 s). Event-specific assets at 5-minute steps from the Yahoo chart API only exist for roughly the last 60 days; those are exploratory only.

## 4. Large-bet screen (adapted from Ofir and Mitts 2026; only information known at the time of the trade)

A buy (of Yes or of No) at time t is FLAGGED if all three hold:
1. Size vs market: cash (size x price) at least $1,000 AND at least the 99th percentile of cash of all earlier trades in the same market in the fetched data (expanding window; at least 200 earlier trades required).
2. Size vs the wallet's own history: cash at least 5 times the wallet's median earlier trade cash (any market), or the wallet has fewer than 5 earlier trades (new wallet).
3. One-sidedness: of the wallet's buy cash in this market up to and including t, at least 90% is on the same side as this bet.
Excluded from the paper's five signals: profit and timing relative to the outcome (both need future information). Only trades with Yes-equivalent price between 0.05 and 0.95 are eligible. Repeated flagged buys by the same wallet in the same market within 30 minutes are merged into one alert (first trade time). Sells are not flagged.

## 5. Tests (5 confirmatory tests, Holm correction at 5% across all 5)

Signed move = (odds at t+5m+H minus odds at t+5m) x direction (+1 for buying Yes, -1 for buying No), in percentage points.
- A1: flagged-alert signed odds move over H = 60 minutes minus the ordinary-bet control in the same market (ordinary bets = buys with cash between the market's 25th and 75th percentile, same window, same signed-move definition, averaged per market). Unit: event (alerts averaged within event, then t-test across events).
- A2: same as A1 with H = 15 minutes.
- A3: flagged signed odds move (H = 60) versus random-time placebo: 1,000 draws of random times in the same market windows, keeping each alert's direction; permutation p-value (one-sided, then doubled).
- B1: signed Bitcoin return from t+5m to t+65m versus random-time placebo (1,000 draws). Direction for Bitcoin = bet direction x event sign, where the event sign is the sign of the same-minute correlation between odds changes and Bitcoin returns in the first 70% of that market's window (rule picks the sign, not the analyst).
- B2: same as B1 with H = 15 minutes.
Seed 20261110. Standard errors at the event level (alerts within an event are not independent).

Exploratory (not counted, labeled so): hit rates; results by event type; event-specific assets at 5-minute steps where available; flagged vs ordinary at H = 5 minutes from t (includes price impact); alert frequency per event.

## 6. Held-back slice

Events sorted by close time; the last 30% are held back. All headline numbers use the first 70%; the held-back slice is checked once for the sign and size of A1.

## 7. Decision bar

- YES (usable alert signal): A1 passes Holm with a positive effect of at least 2 percentage points beyond ordinary bets (measured from 5 minutes after the bet, so there is time to act); A3 beats the placebo; the held-back slice has the same sign and at least 1 percentage point; at least 30 events with an alert and at least 100 alerts.
- NO: the 95% interval for A1 lies below 1 percentage point, or A1 is significantly negative.
- UNCLEAR: anything else, including fewer than 30 events with alerts.
- Asset (B1, B2) is reported separately: "carries into the asset" only if B1 or B2 passes Holm with the expected sign and the mean move is at least 0.10%.

## 8. Deviations (append only)

(none yet)
- D1 (2026-11-09 23:40 UTC, before any trade, odds or price data; metadata only). Three fixes to the event list, found by reading titles: (a) the word "strike" matched esports "Counter-Strike" matches, which are not news events: excluded; (b) the volume-sorted event listing stops at the API paging cap before reaching small court events, so court events were also pulled through the `courts` and `scotus` tags; (c) to keep small types in the sample, all qualifying court and shutdown events are kept and the remaining places up to 80 are filled by event volume. Tests, screen and decision bar unchanged.
- D2 (2026-11-09 23:45 UTC, logged after data pull, before analysis results). Data-access changes forced by the source, not by results: (a) Polymarket's Data API v1 `/trades` is retired (HTTP 410); we used v2 `/v2/trades` (cursor feed, taker side of each fill only, the default), so maker-side bets are not screened; (b) wallet history uses the v2 `user` + `end` filter: the wallet's most recent 1,000 taker trades strictly before the bet (instead of "the first 3,000 records returned"), which fits the "known at the time" rule better; (c) to give the size-vs-market signal a baseline, trades from the 7 days before each 72-hour window were also fetched ("earlier trades in the fetched data"); (d) the ordinary-bet control uses up to 3,000 randomly sampled ordinary buys per market (seeded) to keep run time short.
