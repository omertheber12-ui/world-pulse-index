# TR-007 · Locked method: asset and event connections (revised)

Task: TR-007 (Task Ledger row 36), parent TR-006.
Date locked: 10 Nov 2026, 16:19 Israel time (Asia/Jerusalem)
Status: LOCKED before any new price or odds comparisons. This document writes the method only. It does not run the data-quality audit, does not run the test, does not hunt pairs, and does not change the live site.

This is a new document. It replaces TR-006 for the coming test. TR-006 (https://docs.google.com/document/d/1l4empk2D3iTQ1tYJUVUHnHtTWU_wcjo3XgHRx6dKP0U/edit, fingerprint e4fad636f810cd737f9b73b0672aec588bdc2a6862315061cec8bfc6f2644aa3) was not edited and stays as the record of the earlier plan.

Research finding only, not investment advice.
Who would pay for numbers like these is unknown and must not be stated as fact.
Use simple words in all write-ups. Separate fact, assumption, and guess.
Public data only. No paid data. No spending. No outbound messages or outside contact.
Do not open, search, or cite Equi files or paths.

## Why this revision exists

On 10 Nov 2026 at about 16:10 Israel time, Omer sent the COO an outside review of TR-006 and asked for a working beta. The COO took the useful parts of the review without being overly strict. The companion note "TR-007 Note: what we take from the outside review of TR-006" lists the reviewer's opinions (labeled as opinions) and what was taken. That note is based on the COO's summary of the review; the original review was not found in our files.

What changed from TR-006, in short:

1. One signed forward formula, one locked direction per pair, and only that direction is tested in confirmation.
2. Search size written before scoring; first-wave passes labeled "first look"; an extra many-pair correction is reported.
3. Prediction time and observation time are defined; an unused 7-day gap separates discovery from confirmation; oil publication delay is stated.
4. Luck check uses circular shifts instead of fully shuffled dates; likely range uses resampled blocks of days.
5. At least 10 independent firing days are needed in confirmation.
6. The market used for an event is the one the app listed at freeze time, not one picked by lifetime volume.
7. A data-quality audit comes before the run; incomplete history means "not enough history".

Product and Development design requests do not change any statistical bar in this document. A change to a bar needs the COO first and a new locked document.

## Claim (one sentence)

For each chosen asset and each eligible World Pulse Index app event, a change in that event's Polymarket odds over the day-before or week-before window, at least as large as the typical change seen before that asset's large-move days in one locked direction, is followed by a next-session asset return in that direction that is larger, on average, than on days the pattern does not fire, and this still holds on unused later days.

## Null (the boring explanation)

Event odds add nothing before the asset's next session. The average signed next-session return is the same on firing days and non-firing days. Any repeating odds level is just where the market usually sits. Any match is the asset and the odds reacting to the same news at the same time, with no leftover lead.

## Rival explanations to rule out

1. Reverse direction: the asset moves first, then the odds catch up (asset-first check).
2. Common news: both move on the same day (same-day match = moved together, not a lead).
3. Mechanical link: a contract that is itself a bet on that asset's price. Set aside for that asset.
4. Clock problems: mixed time zones, stale prints, forward-filled odds, prints stamped a few seconds after a cut time (the fake delay found in TR-003), and oil prices published days after the day they describe.
5. Many pairs searched: some pairs will pass by luck (search size and extra correction below).
6. A fragile pattern locked from too few days (TR-005 oil pick from 3 independent days).
7. A pattern that almost never fires in confirmation.
8. Look-ahead in choosing the market (lifetime volume known only later).
9. Incomplete trade history that makes a market look calm or fresh when it was not.

## What a connection is and is not

A connection is a measured statistical link between one asset and one app event: a locked odds-change pattern from the day-before or week-before window that (a) still shows a gap before unused large-move days, (b) is followed by an extra next-session asset move in the locked direction that passes the bar below, and (c) is not better explained by the asset moving first.

A connection is not: a story about why two topics feel related; proof that one causes the other; proof that someone could have acted in time (see oil timing); a same-day match; a pair labeled no, unclear, or not enough history; investment advice. In the first wave every connection is a "first look, not independently verified".

The oil and Netanyahu pair from TR-005 ("Will Benjamin Netanyahu be the next Prime Minister of Israel?") is not a connection and must not be shown, unless it passes TR-007 fresh on its own unused days.

## First assets (do not add more in this wave)

1. The main US oil price: West Texas oil at Cushing, Oklahoma (display label "Main US oil price", field value oil).
2. Bitcoin in US dollars (display label "Bitcoin", field value bitcoin).

Each asset is handled on its own and each pair is confirmed on that asset's own unused days.

## First events (do not add the rest of Polymarket)

- Only events the World Pulse Index app lists at freeze time.
- Keep resolved, cancelled, and closed events if the app still lists them.
- Do not add a new volume filter. Do not add Polymarket events that are not in the app.
- Set aside, per asset, any event that is itself a bet on that asset's price level (for example "will oil finish above this price", "will Bitcoin reach this dollar level"). Record them in a set-aside file with the reason. An event set aside for one asset may be eligible for the other.

### Which market represents an event (replaces TR-006's lifetime-volume rule)

- The market used for an app event is the market the app itself lists or displays for that event at freeze time (as recorded in the frozen app data file).
- If the app lists one event card with several related markets and the app's own data does not single one out, a choice is unavoidable. Then use only volume known up to the freeze date, computed from public trades dated on or before the freeze date, and record that rule and the result in the freeze file. Known limit (assumption): volume up to the freeze date still includes volume from after the early discovery days; this is stated as a limit, not hidden.
- Do not pick a market by today's lifetime catalog volume when a freeze-time app choice exists.

## Freeze before any scoring

At the start of the run, and before any prices are compared with odds:

1. Freeze the asset list (these two assets only), with the freeze time.
2. Freeze the app event list from the live site data file (site/data/fallback.json in the public repository omertheber12-ui/world-pulse-index, or the current equivalent file the app loads), at a recorded commit hash. Save titles, event ids, market ids, and any volume and end-date fields that come with it. Do not change it during the run.
3. Save the set-aside file per asset.
4. Write the search size before scoring (see "Number of tests").

Newer events may enter on a later rerun if they appear in that rerun's freeze and meet the history rule. They may not be added in the middle of a run.

## Data sources

- App events: the frozen app list above.
- Prediction-market odds: the public Polymarket trade history (the public data service "data-api.polymarket.com", trades feed), keyed by the market's condition id, preferring trade timestamps over displayed prices. Store market id, trade time (unix seconds, UTC), price, outcome index, side, and size. No wallet fields. "Yes" odds = the trade price for yes-outcome trades, or one minus the trade price for no-outcome trades, times 100 (scaled from 0-1 to 0-100 percent).
- Main US oil price: the public daily West Texas (Cushing) spot price from the US Energy Information Administration (series RWTC), or the same series republished by the Federal Reserve Bank of St. Louis public data site, Federal Reserve Economic Data (FRED, series DCOILWTICO). If one public source fails, use the other and log it before comparing with odds. Publish-lag limit: see oil timing below.
- Bitcoin: a public Bitcoin/US dollar price from Binance (BTCUSDT), with Coinbase (BTC-USD) as fallback, the same family of sources used in earlier Bitcoin work. Log which source supplied each day.
- No paid data.

## Time rules (prediction time and observation time)

- Store every timestamp in UTC (world clock) and keep the original zone.
- Use New York time (America/New_York, with daylight saving, via a real time-zone library) for day boundaries and window ends. "00:00 New York on day D" is the end of calendar day D-1.
- Prefer trade timestamps. A trade stamped exactly at a cut time counts as at-or-before that cut. A trade stamped even a few seconds after a cut time belongs to the next window; it must never be treated as belonging to the earlier one, and a print a few seconds after the hour must not be treated as the next hour's value (TR-003 trap).
- No forward-filled odds changes. An odds value at a window end is stale if there is no trade in the 24 hours before that window end; a stale end drops that event-and-day.
- **Prediction time** for asset day D = 00:00 New York on D (the end of calendar day D-1). Every odds value used to predict day D must come from trades at or before that time.
- **Observation time** for asset day D = the time the day-D asset price refers to:
  - Bitcoin: 00:00 New York on D+1 (the last public price at or before that time).
  - Oil: the end of the oil trading day D in New York (the official daily spot assessment for date D).
- **Publication time** (oil only) = when the US Energy Information Administration actually released the file containing date D. This is often several days after D.

### Bitcoin day

A Bitcoin day is a New York calendar date. The daily price for D is the last public price at or before 00:00 New York on D+1. The return on D is that price versus the previous Bitcoin day's price. If a needed price is missing, drop the day.

For Bitcoin, the day-D return runs from exactly the prediction time to the observation time, so a lead window never overlaps the return it predicts.

### Oil day and publication delay

- Oil days follow the official oil series dates (US oil trading days).
- Oil prices are timestamped by the market date they refer to, not by when the US Energy Information Administration published the file.
- Fact from public documentation read on 10 Nov 2026 (no price values used): the US Energy Information Administration's Cushing spot page showed "Release Date: 11/4/2026, Next Release Date: 11/12/2026", and the Federal Reserve Economic Data copy showed "Updated: Nov 4, 2026" and "Next Release Date: Nov 12, 2026". Public documentation describes these spot prices as published in weekly batches (typically Wednesdays, later in holiday weeks), so the official print for a date is often published between about 1 and 8 days after that date.
- So an oil connection is a statistical association with a delayed official observation. It is not proof that someone could have acted on that official print on the same day.
- Do not treat a later revised file as if it were known earlier. If a free archive of first-release values is available (for example the archival copy of the Federal Reserve Economic Data series, called ALFRED), the audit uses first-release values; otherwise it uses the current file and labels the oil result as at risk of revision. The audit records which.
- Timing limit (assumption, stated now): the oil day-D return starts at the previous oil day's official assessment, while the prediction time is 00:00 New York on D, which is several hours after that assessment and after oil futures reopen in the evening. Some of day D's move may already be visible in futures by the prediction time. This makes any oil result partly a "moved together" result. We keep TR-006's windows (no change ordered) and state this limit in every oil write-up.
- Ordered checks on oil holidays: if day D-1 or the previous oil day is not an oil trading day, the return uses the previous day that has a price.

## What a large-move day is

- A large-move day is a day whose raw (uncapped) simple return from the previous priced day is at least +1.00 percent (up) or at most -1.00 percent (down). Ordinary days have an absolute return below 1.00 percent.
- Same 1 percent cut for both assets. After freeze, report the share of days meeting it. Do not change the cut after seeing that share.
- Assumption: 1 percent may be a common daily move for Bitcoin, so ordinary Bitcoin days may be rarer than ordinary oil days. That does not allow a change to the cut.

## Sample window

- Starts 2 January 2024 (as in TR-006) and ends on the last complete published day for that asset at freeze time. Never use a possibly incomplete current day.
- For oil, "last complete published day" is the last date in the official file as downloaded; note the release date of that file.
- If early 2024 dates need 2023 prices only to compute the trailing cap, those earlier prices may be used for the cap alone.

## Windows (odds), for asset day D

- Day-before level: last trade at or before 00:00 New York on D.
- Day-before change: that level minus the last trade at or before 00:00 New York on D-1.
- Week-before level: the same as the day-before level.
- Week-before change: that level minus the last trade at or before 00:00 New York on D-7.
- Same-day level: last trade at or before 00:00 New York on D+1. Same-day change: same-day level minus day-before level. Same-day numbers are recorded only to describe "moved together"; they cannot choose or confirm a connection.
- A change is computed only when both ends are fresh (a trade in the 24 hours before each end). Odds must be between 0 and 100 after scaling.

## Independence

- Day-before or same-day analyses: keep a large-move day only if no earlier kept large-move day sits in the previous 2 asset days.
- Week-before analyses: keep a large-move day only if no earlier kept large-move day sits in the previous 5 asset days.
- Apply inside each slice separately, only to large-move days. Use all ordinary days in range.
- Report raw and non-overlapping counts. Official discovery scores and reverse checks use the non-overlapping set.
- Independent firing days (for the minimum firing count): apply the same spacing to firing days in confirmation (2 asset days for day-before, 5 asset days for week-before), keeping the earliest first.

## Discovery, unused gap, and confirmation

For each asset, sort all large-move days (up and down together) by date. Let N be their count.

1. Discovery large-move days: the first floor(0.70 x N) days. Let B be the date of the last one.
2. Unused gap: the 7 New York calendar days B+1 through B+7. Large-move days and ordinary days in the gap are not discovery and not confirmation. They are reported as a count and not used.
3. Confirmation large-move days: large-move days dated B+8 or later. So every confirmation day is at least 7 calendar days after B (in fact at least 8), and a confirmation week-before window (D-7 to D-1) can never include a discovery day.
4. Discovery date range: from the first sample day through B. Confirmation date range: from B+8 through the sample end. Ordinary-day comparisons and forward tests use only days inside the matching range.

Do not use confirmation dates to choose any window, direction, or number.

## Enough history (eligibility)

A pair (one asset, one event) and window are eligible only if all hold:

- The event is in the frozen app list and was not set aside for that asset.
- The event's market has complete public trade history for the dates used (the audit confirms the trade download reached back past the start of the needed range, or to the market's first trade, without a page limit cutting it off). Incomplete history = "not enough history", never a signal.
- The event existed and traded during the discovery range.
- At least 10 independent large-move days (up and down together) with a fresh window change in discovery.
- At least one ordinary-day value and at least one large-move value in the direction scored.

Pairs that fail are labeled "not enough history" (verdict not_enough_history). That is neither a pass nor a fail and is not shown on the map.

## Discovery: what we record and how we lock

For each eligible pair, each lead window (day before, week before), and each kept large-up, kept large-down, and ordinary day in discovery: the odds level (0-100), its 5-point band (0-5, 5-10, ..., 95-100), and the odds change in percentage points. Also record same-day values for description only.

Report: the median level and most common 5-point band before large up-move days, before large down-move days, and on ordinary days.

Score per pair and window = the largest absolute gap among (median change before large up days minus median change on ordinary days) and (median change before large down days minus median change on ordinary days).

Lock, from discovery only:

1. The window with the larger score (tie: more non-overlapping large-move days; still tied: day-before).
2. The locked direction (up or down) that produced that score. If the up and down gaps are exactly equal, pick the direction with more non-overlapping large-move days; if still tied, up.
3. The locked change: the discovery median change before large-move days in the locked direction (discovery_median_odds_change_percentage_points), and the ordinary-day median change (discovery_median_odds_change_ordinary_percentage_points).
4. The typical odds level and most common 5-point band for those groups.

If both lead-window scores are 1 percentage point of odds or less, do not lock a next-session pattern (verdict no for a lead). If the same-day window looks different, describe the pair as "moved together", not a connection.

Report, for information, how many discovery days each direction's rule would have fired on (signals_up_count, signals_down_count). Every eligible pair gets its own locked pattern (not one winner per asset).

## Forward rule (locked from discovery)

Let L be the locked change and O the ordinary-day median change (both discovery numbers, for the locked window).

- The pattern fires on asset day D when the locked-window change ending at the prediction time of D is at least as extreme as L in the direction away from O: if L > O, fire when change >= L; if L < O, fire when change <= L; if L = O, the pattern never fires (verdict unclear).
- Only the locked direction's rule is used in confirmation. The other direction is not tested.
- Locked direction sign: d = +1 if the locked direction is up, d = -1 if down.

## Confirmation tests (each pair on its own unused days)

Evaluable day: an asset day D in the confirmation date range where the locked-window change ending at 00:00 New York on D is computable (both ends fresh) and the asset's day-D return exists. Days that are not evaluable are excluded from both groups.

For each evaluable day D: r_D = capped next-session simple return of day D (cap below). Signed return s_D = d x r_D.

1. **Forward extra average (main result).** extra_average = mean(s_D over firing days) minus mean(s_D over non-firing days), in percentage points of the asset return (0.20 percentage points = a 0.0020 simple return). Positive = extra move in the locked direction. This compares firing days with non-firing days, not with ordinary days.
2. **Companion hit rate.** Percent of firing days whose raw next-session simple return was at least 1 percent in the locked direction, next to the same percent on non-firing days. Companion number, not a bar.
3. **Firing count.** Number of firing days, number of evaluable days, and number of independent firing days (spacing rule above).
4. **Reverse check.** Using non-overlapping confirmation large-move days in the locked direction versus confirmation ordinary days: median locked-window change gap. Passes if it has the same sign as discovery and its absolute size is at least 0.5 odds points.
5. **Luck check (circular shift, replaces fully shuffled dates).** Put evaluable days in date order. Keep the returns fixed and shift the whole firing on/off sequence around the circle by k positions, with k drawn uniformly from 5 to n-5 (n = number of evaluable days), 1,000 draws, seed 20260007. Recompute extra_average each time. placebo_share_beaten_percent = percent of the 1,000 draws whose extra average is strictly below the real one. Passes if at least 95 percent. This keeps calendar clustering of signals. Limit: the sequence wraps from the end to the start. If n < 30, the luck check is not run and the pair is unclear. For comparison only, also report the old fully shuffled-date rank (1,000 shuffles, same seed); it does not decide anything, and its limit is that shuffling dates breaks calendar clustering.
6. **Likely range (block resampling).** Moving-block bootstrap over evaluable days in date order, blocks of 7 consecutive evaluable days, 2,000 resamples, seed 20260007. Likely range = middle 95 percent (2.5th to 97.5th percentile) of resampled extra averages. A resample with no firing day or no non-firing day is redrawn; report how many were redrawn.
7. **Asset-first check.** For confirmation large-move days in the locked direction, compare the gap versus ordinary days of the locked window ending 00:00 New York on D+1 (after) with the gap of the one ending 00:00 New York on D (before). Asset-first is the stronger story if the absolute after-gap is larger.
8. **Clash check (safety).** Count the evaluable days on which both the up rule and the down rule (each defined from discovery as in TR-006) would fire. conflict_share_percent = that count / evaluable days x 100. The default path is one locked direction, so clashes do not affect the forward test and should be rare; but if the share is 30 percent or more, the pair is unclear.
9. **Many-pair correction (extra reported check, not the main bar).** For every pair that reached a confirmation forward test, compute the luck-check p-value p = (1 + number of placebo draws with extra average >= real) / 1,001. Apply the Benjamini-Hochberg false-discovery procedure across all those pairs together (both assets, both windows) at a false-discovery rate of 10 percent, locked now. Record many_pair_correction_pass (true or false) and the family size. This check does not delay the run and does not replace the main bar. No stricter family-wise cut is used as the main bar.

## Number of tests

- Discovery search size = sum over the 2 assets of (frozen events minus that asset's set-aside events) x 2 lead windows x 2 directions. Also report the raw size 2 x frozen events x 2 x 2. Both are written after freeze and before scoring.
- Confirmation: each eligible pair with a locked pattern has 2 counted confirmatory claims (reverse check and forward extra average), on the locked direction only. Report the number of pairs that reached confirmation (the many-pair family size).
- Every pair is reported (yes_first_look, no, unclear, not_enough_history). No headline pair is picked after seeing results.

## Decision bar (each pair)

**YES (first look)**, verdict yes_first_look, only if all hold:

- The locked window is day-before or week-before (not only same-day).
- At least 10 independent discovery large-move days were used to lock the pattern.
- The pair is not a same-asset price bet.
- The reverse check passes (same sign as discovery, absolute gap at least 0.5 odds points).
- The forward extra average is positive, at least 0.20 percentage points, and beats at least 95 percent of the 1,000 circular-shift placebo draws.
- At least 10 independent confirmation firing days.
- The asset has at least 30 raw confirmation large-move days (after the gap).
- The asset-first check is not the stronger story.
- The clash share is under 30 percent.

A pair that meets YES but fails the many-pair correction is still reported as yes_first_look, not hidden, with the extra sentence in how_sure (below). No first-wave pass is called independently verified.

**NO**, if any hold:

- The unused days do not repeat the pattern (reverse gap flips sign, or its absolute size is below 0.5 odds points).
- The forward extra average is zero or negative (the wrong way).
- The likely range of the extra average sits entirely below 0.20 percentage points.
- Only the same-day window matched in discovery, or both lead scores were 1 odds point or less (no for a lead; the same-day link may be described, labeled "moved together").
- The asset-first check is the stronger story.

**UNCLEAR**, if any hold (and the pair is not already NO):

- Fewer than 10 independent confirmation firing days.
- Fewer than 30 raw confirmation large-move days for the asset.
- Too few evaluable days for the luck check (n < 30).
- Forward extra average is positive but does not beat 95 percent of placebo draws, or is below 0.20, and the likely range includes both near-zero values and values above 0.20.
- Clash share is 30 percent or more.
- The locked change equals the ordinary change (pattern can never fire).
- Anything else that is not a clean yes or no.

**NOT ENOUGH HISTORY**: fewer than 10 independent discovery days, incomplete trade history, or the event did not trade in discovery.

Do not show no, unclear, or not-enough-history pairs on any map, including oil and the Netanyahu bet. If an asset has no yes pairs, the map lists that asset with zero events. That is an allowed result and not a reason to loosen any bar.

## Minimum meaningful effect

0.20 percentage points of the asset's next-session return (extra average, firing minus not firing). There is no separate guessed odds threshold; the odds pattern comes from discovery.

## Outlier, filter, and missing-data rules (copied from TR-006)

- Pull very large asset days in toward the typical range using the 1st and 99th percentiles of that asset's daily returns in the 252 asset days before that date (trailing window only; never use future days). Apply this cap to returns used in averages. The 1 percent definition of a large-move day and the 1 percent companion hit rate use the raw uncapped return.
- If early 2024 dates need 2023 prices only to compute the trailing cap, those prices may be used for the cap alone. They are not part of the sample, the large-move list, or the split.
- Do not compute anything on forward-filled odds changes.
- One command should reproduce the run from saved raw files with a fixed random seed of 20260007 (20260006 stays reserved for TR-006).

## Order of later work (not started by this document)

1. Data-quality audit (separate task step): freeze the app events at a recorded commit; check Polymarket trade-history coverage and timestamps per market (complete or cut off, first and last trade, stale share at window ends, prints near cut times); check the oil series (market date versus publication date, first-release availability, gaps) and the Bitcoin series (source, gaps, the 00:00 New York cut); report how many pairs can genuinely be tested. No signal is built from incomplete history.
2. Write the search size.
3. Run discovery on each asset's discovery slice; lock each eligible pair's pattern and save the locked patterns before touching confirmation.
4. Run confirmation on days after the gap.
5. Report every eligible, ineligible, and rejected pair, with the answer first and fact, assumption, and guess labeled.
6. Code goes on a research branch as a draft pull request. Do not merge. Do not change the live site.

## Updates (proposal)

Rerun the same locked method about once a week. Each rerun: freeze assets and the app's then-current event list; download the newest public prices and trades; score every eligible pair; keep pairs that still meet YES; drop pairs that now meet NO or become unclear; let newer app events enter once they have enough history; show the date last checked, sample size, and how sure. A change to the assets, event universe, cut, windows, gap, or bars is a new method and needs a new locked document.

## What the app may show later (field names; no change to any bar)

This document does not ask anyone to change the live site. Field names below match what the COO sent Product. They describe outputs only; they do not change any statistical bar.

Main screen (only pairs with verdict yes_first_look; an empty map is allowed):

- event_name, event_id
- asset: oil or bitcoin, with display labels "Main US oil price" and "Bitcoin"
- lead_window: day_before or week_before
- extra_average_percentage_points = mean(signed next-session return over firing days) minus mean(signed next-session return over non-firing days), in percentage points of the asset return. Positive = extra move in the predicted direction. This is firing versus not firing, not versus ordinary days.
- predicted_big_move_rate_percent = percent of confirmation firing days whose next-session simple return was at least 1 percent in the predicted direction (companion number, not the bar)
- predicted_big_move_count = whole number of confirmation firing days whose next-session simple return was at least 1 percent in the locked direction (companion display field only, not a bar; appended after lock, see Deviations)
- confirmation_firing_count (confirmed signals; minimum 10 independent firing days to pass) and confirmation_evaluated_count
- odds_pattern: plain-language text built from the odds-pattern builders below
- how_sure: in the first wave, starts with "First look, not independently verified." If the main bar passes but the extra many-pair check fails, add a sentence saying so (for example "Did not pass the extra check for looking at many pairs."). Do not hide the pair.
- date_last_checked: YYYY-MM-DD, Israel calendar date of the run
- method_id = TR-007

Odds-pattern builders:

- locked_direction: up or down
- discovery_median_odds_change_percentage_points
- discovery_median_odds_change_ordinary_percentage_points
- discovery_median_odds_level_percent (0-100)
- most_common_odds_band

Detail view also includes:

- market_id, sample_start_date, sample_end_date
- extra_average_likely_range_low_percentage_points, extra_average_likely_range_high_percentage_points
- placebo_share_beaten_percent
- many_pair_correction_pass
- search_size
- signals_up_count, signals_down_count
- predicted_big_move_rate_when_not_firing_percent
- reverse_check_passed, reverse_check_gap_odds_points
- asset_first_stronger
- prediction_time, observation_time
- oil_publish_lag_note (oil only)
- conflict_share_percent
- verdict: yes_first_look, no, unclear, or not_enough_history (only yes_first_look appears on the main screen)
- method_fingerprint = the lock fingerprint at the end of this document

Any view is a research finding shown in the product, not advice to buy or sell. Who would pay remains unknown.

## What this method is not

- Not shipping the oil and Netanyahu pair.
- Not a search across every Polymarket event and every asset.
- Not a new hunt for pairs: no new prices or odds were downloaded or compared while writing it.
- Not the data-quality audit and not the test run.
- Not permission to change the live site.
- Not a claim about who would pay.

## Deviations (append only)

None at lock time.

10 Nov 2026, 16:23 Israel time (Asia/Jerusalem) — display-field addition only. No statistical bar was changed. The lock fingerprint below is unchanged and still refers to the method text as locked at 16:19 Israel time.

Appended output field: predicted_big_move_count (whole number). This is the count of confirmation firing days whose next-session simple return was at least 1 percent in the locked direction. The app can show n of m as predicted_big_move_count of confirmation_firing_count, without rounding predicted_big_move_rate_percent to invent n. The COO asked for this on 10 Nov 2026 after accepting the locked method.

## Local copy

- /workspace/prereg/2026-11-10-tr007-asset-event-connections.md
- /workspace/research/tr007-asset-event-connections/PREREG.md

Lock fingerprint (sha256 of the text above this line): 149a7c2b6e2d4e812c8612281a478272c69a0d03a3dc9ae960446f1802d4b953
