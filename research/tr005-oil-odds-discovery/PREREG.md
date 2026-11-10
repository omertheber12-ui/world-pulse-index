# Pre-registration: Oil big-move days and World Pulse Index app events

Date locked: 10 Nov 2026, 14:24 Israel time (Asia/Jerusalem)
Status: LOCKED before any oil prices or odds paths were compared
Commit: pending (this file must be the first commit on the research branch)

Research finding only, not investment advice.
Who would pay for numbers like these is unknown and must not be stated as fact.
Use simple words in all write-ups. Separate fact, assumption, and guess.
Public data only. No paid data. No spending. No outbound messages or outside contact.

## Claim (one sentence)

Among events already listed in the World Pulse Index app, some event’s Polymarket odds show a repeating level and change before days when the main US oil price moves at least 1 percent, more than they do before ordinary oil days; if that pattern is visible the day before or the week before (not only on the same day), then when the locked pattern appears, the next oil session moves in the matching direction by more than oil usually moves.

## Null (the boring explanation)

App-event odds add nothing special before big oil days. Any percentage that “repeats” is just where those markets usually sit, or oil and the odds jump together on the same day when news hits, with no leftover next-session lead.

## Rival explanations to rule out

1. Reverse direction: oil moves first, then the odds catch up.
2. Common news: both jump on the same day (they move together, not a lead).
3. Mechanical link: a contract that is itself a bet on the oil price level. Those must be set aside.
4. Clock problems: mixed time zones, stale prints, or hourly snapshots stamped a few seconds after the hour (a fake delay found in an earlier check).
5. Searching many events and windows and keeping the one that looks best, then judging it on the same days.
6. Picking only famous events after seeing which oil days mattered.

## Data sources

- World Pulse Index app events: freeze titles and market ids from the app or from the app’s own code list in the public repo omertheber12-ui/world-pulse-index, whichever is the list of events the app already shows. Do not add extra Polymarket events that are not in the app.
- Polymarket public market list and public trades (or carefully aligned public price history). Prefer trade timestamps. Do not treat a price stamped a few seconds after the hour as the next hour.
- Main US oil price (West Texas oil, Cushing) daily from the US Energy Information Administration public series, or the same series as republished by the Federal Reserve’s public data site (the daily West Texas oil series). Use the price’s own date, not the download time.
- No paid data.

## Universe rule (freeze before any oil comparison)

1. Export the app’s current event list as titles, market ids, and any volume or end-date fields that come with the catalog. Save this frozen list to disk and do not change it later.
2. Set aside any event whose title or description is itself a bet on the oil price level (for example “will oil finish above this price”). Those pairs would appear by design. Record them in a set-aside file with the reason.
3. Keep resolved, cancelled, and closed events if the app lists them. Do not drop events because they later became less famous.
4. Do not add a new volume filter beyond what the app already used.
5. If the app lists many related markets inside one event, keep each listed market as a separate series, unless the app clearly treats them as one card; in that case use the single busiest market on that card, using catalog volume only.

## Window / held-out slice

- Oil sample: all daily oil prices from 1 Jan 2024 through 9 Nov 2026 (do not use 10 Nov 2026, which may be incomplete).
- A big oil day is a day the official daily oil price moved at least 1.00 percent up, or at least 1.00 percent down, measured as the simple return from the previous official oil day. Up and down are separate groups.
- Ordinary oil days are oil trading days whose absolute return is below 1.00 percent.
- Sort all big oil days (up and down together) by date. The first 70 percent are the discovery slice. The last 30 percent are the confirmation slice. Do not use confirmation dates to choose the event, the window, or the number.
- Ordinary-day comparisons in discovery use only ordinary oil days whose dates fall in the discovery date range (from the first discovery oil day through the last discovery big-oil day). Ordinary-day comparisons in confirmation use only the confirmation date range.

## Sampling step / time zone

- Store every timestamp on one world clock (UTC) and also keep the original zone.
- Use New York time (America/New_York) to decide which oil trading day a clock time belongs to, and to define calendar windows. New York observes daylight saving; use a real time-zone library.
- Day-before level for an oil day D: last trade at or before 00:00 New York time on day D (that is, the end of calendar day D-1).
- Day-before change: that level minus the last trade at or before 00:00 New York time on day D-1.
- Same-day level for oil day D: last trade at or before 00:00 New York time on day D+1.
- Same-day change: same-day level minus day-before level.
- Week-before level for oil day D: the same as the day-before level.
- Week-before change: that level minus the last trade at or before 00:00 New York time on day D-7.
- If there is no fresh trade in the 24 hours before a window’s end time, drop that event-and-day. Do not fill old prices forward and pretend they are new.
- If a needed oil close is missing, drop that day.

## Independence rule

Big oil days close together share windows, especially the week-before window.

- For any analysis that uses the day-before or same-day window, keep a big oil day only if no earlier kept big oil day sits in the previous 2 oil trading days.
- For any analysis that uses the week-before window, keep a big oil day only if no earlier kept big oil day sits in the previous 5 oil trading days.
- Report both the raw count of big oil days and the non-overlapping count. Official tests use the non-overlapping set for that window.

## What we record (discovery)

For each kept app event, each window (day before, same day, week before), and each kept big oil-up day, big oil-down day, and ordinary day in the discovery slice:

- The odds level at the end of the window (in percent, 0 to 100)
- Which 5-point band that level falls into (0-5, 5-10, …, 95-100)
- The odds change over the window, in percentage points

“The percentage that repeated most” means:

- The middle value (median) of the odds level before big oil-up days
- The 5-point band that appeared most often before big oil-up days
- The same two numbers before big oil-down days
- Each placed next to the same numbers for ordinary days in the discovery range

## How we pick the oil pair (written now, before seeing results)

Search across every frozen app event and all three windows. That is many looks.

Choose the event and window where the median odds change before big oil days differs most from the median odds change before ordinary days. Measure oil-up versus ordinary and oil-down versus ordinary separately. The winning score is the largest absolute gap in those median changes.

We use the change to choose the pair because the raw level often just shows where that market usually sits. We still report the typical percentage (median level and most common 5-point band).

Tie-break, if needed: pick the event-and-window with more non-overlapping big oil days; if still tied, pick the earlier event id (as text) so the choice is mechanical.

If the same day is the only window that looks different from ordinary days (meaning the best day-before score and the best week-before score are both no larger than a small gap of 1 percentage point of odds), we will say they move together and we will not turn that into a next-session signal. We may still confirm whether the same-day association repeats on unused days, labeled as a same-day finding, not as a lead.

If the day before or the week before wins, lock three things from the discovery slice only:

1. The event (the pair)
2. The window
3. The number: the typical odds level and the typical odds change before oil-up days and/or oil-down days, plus the ordinary-day median change used as the comparison

## Forward pattern (locked from discovery numbers)

Let ordinary_change be the discovery median change on ordinary days for the winning event and window.
Let up_change be the discovery median change before oil-up days.
Let down_change be the discovery median change before oil-down days.

- An “oil-up pattern” fires when the winning event’s locked-window change is at least as extreme as up_change in the direction away from ordinary_change. If up_change is greater than ordinary_change, fire when change is greater than or equal to up_change. If up_change is less than ordinary_change, fire when change is less than or equal to up_change. If up_change and ordinary_change are the same, the oil-up pattern does not fire.
- An “oil-down pattern” is defined the same way with down_change.
- If both would fire on the same day, drop that day from the forward test and record the conflict.
- The up pattern predicts a positive next oil session return. The down pattern predicts a negative next oil session return.

Next oil session after a pattern that is knowable at the end of calendar day T (New York): the official oil return on the next oil trading day after T. That matches discovery, where the day-before and week-before windows for oil day D end at the start of day D.

Do not build a next-session signal from a same-day-only win.

## Confirmation tests (last 30 percent of big oil days)

1. Reverse check: before unused big oil days, does the locked event and window still show a similar percentage and a change gap versus ordinary days in the same direction as discovery?
2. Forward check: when the locked pattern appears in the confirmation date range, what is the average next-session oil return in the predicted direction, compared with confirmation-range days when the pattern does not fire? Also report how often oil then moves at least 1 percent in the predicted direction, versus those no-pattern days.
3. Placebo for the forward check: shuffle the pattern dates 1,000 times inside the confirmation date range and rerun the extra-average calculation. Report where the real extra average ranks.
4. Reverse story check: after a large oil day in the confirmation range (absolute return at least 1 percent), does the locked event’s next-session odds change look like the discovery “after” pattern more than like a lead? In practice, compare the locked window ending the day after a big oil day versus the locked window ending the day before. If the after-window gap versus ordinary days is larger than the before-window gap, oil-first is the stronger story.

The two findings we may report as results are the reverse check and the forward extra average (with the 1 percent hit rate as a companion number). The placebo and the oil-first check are controls.

## Total number of tests

- Discovery search size: (number of frozen kept events) times 3 windows times 2 directions (oil up, oil down). Write this number in the report after the list is frozen. This search is not a confirmatory test.
- Confirmatory tests: reverse check; forward extra average; forward 1 percent hit rate (companion); placebo rank for the extra average (control); oil-first check (control).
- Counted confirmatory claims: 2 (reverse check and forward extra average).

## Decision bar

YES, if all of these hold:

- The winning window was the day before or the week before, not only the same day.
- The reverse check on unused days has the same sign as discovery (the change gap versus ordinary days points the same way).
- The forward extra average next-session oil move, in the predicted direction, is positive and more extreme than at least 95 percent of the 1,000 shuffled-date placebos.
- There are at least 30 unused big oil days (raw count in the confirmation slice, before de-overlapping) to judge.
- The oil-first check is not the stronger story.

NO, if any of these hold:

- The unused days do not repeat the pattern (the reverse gap flips sign, or is near zero).
- The forward extra average is the wrong way, or its likely range sits entirely below 0.20 percentage points of oil.
- Only the same day ever matched in discovery (this is a NO for a lead; the same-day association may still be described, clearly labeled).

UNCLEAR, if:

- There are fewer than 30 unused big oil days.
- There are too few matching events in the app (fewer than 2 kept events after set-aside).
- The unused-day result is too noisy to read (forward extra average is positive but does not beat 95 percent of shuffles, and the likely range includes both near-zero and values above 0.20).
- Anything else that is not a clean yes or no.

## Minimum meaningful effect

A forward extra average whose likely range sits entirely below 0.20 percentage points of oil is too small to call useful (NO). There is no separate guessed odds threshold such as 60 percent; that number must come from discovery.

## Outlier / filter / missing-data rules

- Pull very large oil days in toward the typical range using the 1st and 99th percentiles of oil’s daily returns in the 252 oil trading days before that date (trailing window only; never use future days). Apply this cap to oil returns used in averages. The definition of a “big oil day” (the 1 percent cut) uses the raw un-capped return so the slice membership does not depend on the cap.
- Odds must be between 0 and 100 percent. Drop prints outside that range after allowing for 0 to 1 quotes that should be scaled to percent (if a source quotes 0 to 1, multiply by 100; document which).
- Do not compute anything on forward-filled odds changes.
- One command should reproduce the results from saved raw files and a fixed random seed of 20261110.

## What this test will report

Discovery (labeled as discovery, not yet confirmed):

- How many app events were frozen, how many were set aside as oil-price contracts, and the search size
- How many big oil-up days, big oil-down days, and ordinary days, in each slice
- For each app event and window, the typical odds level, the most common 5-point band, and the typical odds change before oil-up, oil-down, and ordinary days
- The winning event, window, and locked numbers, and why it won under the rule above

Confirmation:

- Reverse check numbers
- Forward extra average with a likely range, the 1 percent hit rate, and the placebo rank
- The oil-first check
- The yes / no / unclear verdict against the bar above

## What this test will not do

- Guess a 60 percent crossing threshold
- Add assets other than the main US oil price
- Add Polymarket events that are not in the app
- Use later profit, later news timing, or whether an event later came true as inputs
- Open, search, or cite Equi files or paths
- Change the live website

## Deviations (append only)

None at lock time.

## Code and outputs

- Working folder: /workspace/research/oil-odds-discovery/
- Frozen event list: /workspace/research/oil-odds-discovery/frozen_app_events.csv
- Set-aside list: /workspace/research/oil-odds-discovery/set_aside_oil_price_contracts.csv
- Discovery table: /workspace/research/oil-odds-discovery/discovery_table.csv
- Locked pick: /workspace/research/oil-odds-discovery/locked_pick.json
- Confirmation summary: /workspace/research/oil-odds-discovery/confirmation_summary.json
- Write-up: /workspace/research/oil-odds-discovery/WRITEUP.md
- Data manifest: /workspace/research/oil-odds-discovery/MANIFEST.md

## Deviations (append only)

- 10 Nov 2026, 14:26 Israel time, after lock and before results were delivered: Omer asked that we also name the event that performed best, not only a pair and a number. The winner rule already selects that event. The write-up will also rank all kept app events by the same locked discovery score. No change to the claim, windows, split, or yes/no/unclear bars.

### Deviation 1 — appended 10 Nov 2026, 14:31 Israel time, before any oil-vs-odds comparison
Oil source: the Federal Reserve daily West Texas oil download (fredgraph.csv?id=DCOILWTICO) timed out three times (HTTP/2 stream error, then two 40-60 second timeouts with no bytes). We use the US Energy Information Administration public daily file https://www.eia.gov/dnav/pet/hist_xls/RWTCd.xls (series RWTC, Cushing West Texas spot). Its last published day is 3 Nov 2026 (the agency publishes weekly), so the oil sample ends 3 Nov 2026 rather than 9 Nov 2026. No other public free daily source was substituted. Oil returns were only inspected for date coverage, not compared with odds.

### Deviation 2 — appended 10 Nov 2026, 14:31 Israel time
Outlier cap: the locked cap uses the 252 oil trading days before each date. For dates early in 2024 those days fall in 2023, so 2023 prices from the same agency file are used ONLY to compute that trailing cap. They are not part of the oil sample, the big-day list, or the split.

### Implementation note (not a deviation) — 10 Nov 2026, 14:31 Israel time
Universe rule 5: the app renders one card per event (StoryCard keyed by event_id). So each of the 16 app events is represented by the single busiest market on that card by catalog volume (volumeNum in the app's own fallback.json). Frozen at commit 6e2db4d before any download of prices or odds.

### Implementation notes — appended 10 Nov 2026, 14:41 Israel time, after downloading oil and trades but BEFORE computing any discovery statistic
These fill gaps the locked text leaves open; none changes the claim, windows, split, winner rule, or bars.
1. Odds source: Polymarket public Data API v2 trades (trade timestamps). "Yes" odds = price for outcome 0 trades, 1 minus price for outcome 1 trades, times 100.
2. A window change is computed only when BOTH endpoint levels have a trade in the 24 hours before their cut time; otherwise that event-and-day is dropped (no forward fill).
3. The independence rule is applied to big oil days only, and only to big oil days in the same slice; all ordinary days in range are used.
4. A score exists for an event-and-window only if it has at least one ordinary-day value and at least one value in that direction. No other minimum count is added.
5. Winner = largest score across all event-and-window cells (all three windows). If that winner is the same-day window, it is treated as a same-day finding (no next-session signal); the verdict is NO if the best day-before and best week-before scores are both no larger than 1 point, otherwise UNCLEAR ("anything else").
6. "Winning direction" = whichever of up or down produced the winning score. The reverse check is judged on that direction; "near zero" means an absolute confirmation gap below 0.5 odds points.
7. Forward check is run per oil trading day D in the confirmation range: the pattern uses the locked window ending at 00:00 New York time on D (knowable at the end of calendar day D-1) and the outcome is the capped return of D. Days where the window cannot be computed are excluded from both groups. Extra average = mean over firing days of predicted sign times (return minus the mean return on non-firing days). Likely range = 95 percent bootstrap (2,000 resamples, seed 20261110). 1 percent hit rate uses raw returns; the comparison rate on non-firing days uses the same mix of up and down predictions.
8. Placebo: shuffle the firing days (keeping their predicted signs) among evaluable confirmation days, 1,000 times, seed 20261110.
9. Oil-first check: for confirmation big days in the winning direction, compare the gap versus ordinary days of the locked window ending 00:00 New York time on D+1 (after) with the one ending on D (before). Oil-first is stronger if the absolute after-gap is larger.

### Timestamp correction — appended 10 Nov 2026, 14:36 Israel time
The clock times typed into the two headers above were estimates. The local git log is the true record: Deviations 1-2 were committed at 14:28:21 Israel time; the implementation notes were committed at 14:32:13, before discovery ran (discovery commit 14:32:55; locked_pick.json locked_at 14:32:40). Confirmation ran after that (commit 14:33:45). No content changed.
