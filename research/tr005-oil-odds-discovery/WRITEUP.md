# TR-005 · Oil big-move days and World Pulse Index app events

Research finding only, not investment advice.
Who would pay for numbers like these is unknown.

## Answer

1. **Verdict: Not yet clear.** The best event was the Polymarket market "Will Benjamin Netanyahu be the next Prime Minister of Israel?". Its one-week odds change looked a little different before big oil days, and that difference showed up again, in smaller form, on the later days we held back. But the next-day oil move after the pattern was too noisy to tell apart from luck.
2. **How sure:** weak evidence. The event was picked using only 3 independent big oil-up days, so the pick itself is fragile. The later check used 130 big oil days (28 independent ones) and 110 usable days for the next-day test.
3. **Biggest caveat:** 11 of the 16 app events did not exist yet, or barely traded, during the first 70 percent of the oil days. So the "search" really compared 5 events, and the winner came from a very small sample.
4. **What it means:** we did not find a reliable rule that turns World Pulse Index odds into a next-day oil number. The one pattern we found has not been shown to be real.
5. **Next step:** the same locked test could be rerun once the newer app events have a year or more of history.

This result meets the plan's **"unclear"** bar, written before we looked: the next-day extra move was positive, but it did not beat 95 percent of the shuffled-date checks, and its likely range includes both values near zero and values above 0.20 percentage points.

## The best event (locked from the first 70 percent of oil days only)

- **Event:** Prime Minister of Israel after the next election? (app event 81557)
- **Market used:** Will Benjamin Netanyahu be the next Prime Minister of Israel? (market 682705). This was the busiest market on that app card.
- **Window:** the week before the oil day (the odds change over the 7 days ending at midnight New York time, at the start of the oil day)
- **Locked numbers:**
  - Before big oil-up days: typical (middle) one-week change −2 points of odds (3 independent days)
  - Before big oil-down days: typical change 0 points (7 independent days)
  - Before ordinary oil days: typical change +1 point (26 days)
  - Winning score: 3 points (oil-up versus ordinary)
- **The typical odds level was not special.** It sat near 53 percent (most common band 50 to 55 percent) before oil-up days, oil-down days, and ordinary days alike.

A "point" here means one percentage point on the Polymarket odds, for example from 52 in 100 to 53 in 100.

### All app events, ranked by the same locked discovery score

The score is the largest gap, in odds points, between the typical change before big oil days (up or down) and the typical change before ordinary days.

| Rank | App event | Market used | Best window | Score (odds points) | Independent big-day counts (up / down) | Ordinary days |
|---|---|---|---|---|---|---|
| 1 | Prime Minister of Israel after the next election? | Netanyahu | week before | 3.0 | 3 / 7 | 26 |
| 2 | Will the US officially declare war on Iran by...? | by 31 Dec 2026 | week before | 2.0 | 1 / 2 | 7 |
| 3 | Will China invade Taiwan by end of 2026? | same | week before | 1.0 | 9 / 11 | 63 |
| 4 | Next French Presidential Election | David Lisnard | week before | 0.6 | 3 / 5 | 22 |
| 5 | Presidential Election Winner 2028 (United States) | Gavin Newsom | all windows | 0.0 | 21 / 21 | 64 |
| – | Federal Reserve decision in December; Federal Reserve decision in January; European Central Bank rates December 2026; European Central Bank rates February 2027; People's Bank of China rate change by 31 December; Nvidia data center revenue; Nvidia gross margin; Nvidia market value end of 2026; Israel x Iran ceasefire continues; Russia x Ukraine ceasefire agreement; US x Iran ceasefire begins | – | no usable data | – | – | – |

The 11 unranked events were created after 3 March 2026 (the last discovery day), so they had no odds history in the discovery period. Full per-window numbers are in `discovery_table.csv` and `event_ranking_discovery.csv`.

The confirmation step used only the rank-1 event. It did not re-pick from this table.

## Findings

- [FACT | weak | 3 independent oil-up days] In the discovery period (2 Jan 2024 to 3 Mar 2026; the Netanyahu market only existed from mid-November 2025), the Netanyahu odds typically fell 2 points in the week before big oil-up days, against a 1-point rise before ordinary days.
- [FACT | weak | 13 oil-up days, 40 ordinary days] **Repeat check on the held-back days (5 Mar to 3 Nov 2026):** before big oil-up days the typical one-week change was again −2 points, against −1 point on ordinary days. The gap (−1 point) points the same way as in discovery but is a third of the size. For oil-down days the gap flipped (+1 point, against −1 in discovery).
- [FACT | weak | 44 pattern days, 66 no-pattern days] **Next-day test on held-back days:** under the locked rule, the pattern pointed to "oil down next day" on 44 days. On those days, oil's next-session move in the predicted direction was on average 0.43 percentage points better than on no-pattern days. The likely range is −0.94 to +1.98, which means the true effect could be zero, negative, or moderately positive.
- [FACT | weak | 1,000 shuffles] **Luck check:** when we put the same 44 pattern days on random dates inside the held-back period, the real result beat 74 percent of the random versions. The bar was 95 percent. So this looks like what chance alone often produces.
- [FACT | weak | 44 vs 66 days] **1 percent hit rate:** after the pattern, oil fell at least 1 percent the next session 36 percent of the time, against 35 percent on no-pattern days (same mix of directions). That is almost no difference.
- [FACT | weak | 13 oil-up days] **Did oil move first?** No. The gap versus ordinary days was −1.0 point in the week before big oil-up days and close to 0 in the week after. So "oil first, odds follow" was not the stronger story.
- [FACT] The locked rule worked out oddly in practice. The "oil-up" signal (odds down 2 or more points in a week) always overlapped with the "oil-down" signal (odds at or below 0 change), so all 60 such days were dropped as conflicts. Every firing was the "oil-down" signal, which in plain terms means "Netanyahu odds did not rise this week".
- [ASSUMPTION] The daily oil price for a date reflects that day's trading, and the midnight New York cut keeps the odds window fully before that oil day.
- [ASSUMPTION] The last trade before midnight is a fair stand-in for the market's odds at that time, if there was a trade in the previous 24 hours.
- [GUESS] An Israeli election market has no obvious business explaining oil moves. The most likely reading of the discovery gap is chance from a search across 5 usable events with very few days, not a real link.

## Numbers at a glance

- App events frozen: 16. Set aside as bets on the oil price: 0. Kept: 16. Events with usable discovery data: 5.
- Search size: 16 events × 3 windows × 2 directions = 96 looks (15 event-and-window cells actually had data).
- Oil days: 709 (2 Jan 2024 to 3 Nov 2026). Big oil days (moved at least 1 percent): 433, of which 230 up and 203 down. Ordinary days: 276.
- Discovery slice: first 303 big oil days (through 3 Mar 2026), plus 236 ordinary days in that range.
- Held-back slice: last 130 big oil days (5 Mar to 3 Nov 2026), 72 up and 58 down, plus 40 ordinary days. This passes the 30-day minimum.
- Independent (non-overlapping) big oil days in the held-back slice for the one-week window: 28.
- Counted confirmatory claims: 2 (repeat check and next-day extra move). Controls: luck check and oil-first check.

## What would change this

- More history for the newer app events (interest-rate, ceasefire and company events), so more than 5 events can compete and the winner is not chosen from 3 days.
- A calmer oil period: in this sample, oil moved at least 1 percent on 61 percent of days, so a "big oil day" was the normal case, not a rare one.
- A held-back next-day result that beats 95 percent of random dates, with a likely range above 0.20 percentage points.

## Method (short)

- **Plan:** locked 10 Nov 2026, 14:24 Israel time, before any oil or odds comparison (`PREREG.md`, original fingerprint 7ed103f2…).
- **App events:** the app's own list (`site/data/fallback.json` in the public World Pulse Index repository; the app loads every event in it). The app shows one card per event, so each event uses the busiest market on its card (plan rule 5).
- **Oil:** main US oil price (West Texas oil, Cushing), daily, US Energy Information Administration public file. Simple daily return from the previous oil day. Very large days were pulled in to the 1st and 99th percentile of the previous 252 oil days before averaging.
- **Odds:** every public Polymarket trade for the 16 markets (492,842 trades). Odds at a cut time = last trade at or before midnight New York time, used only if there was a trade in the previous 24 hours. No filled-in prices.
- **Windows:** day before, same day, week before, all cut at midnight New York time (daylight saving handled).
- **Independence:** big oil days within 2 oil days (day windows) or 5 oil days (week window) of an earlier kept big day were dropped.
- **Confirmation:** run once, on the last 30 percent of big oil days, with the locked event, window and numbers. Likely ranges come from 2,000 resamples; the luck check uses 1,000 shuffles; seed 20261110.

## Deviations from the plan (all logged in PREREG.md before being relied on)

1. The oil data ends 3 Nov 2026, not 9 Nov 2026. The Federal Reserve copy of the series timed out three times. The US Energy Information Administration file was used instead, and its latest published day is 3 Nov.
2. Oil prices from 2023 (same file) were used only to set the trailing outlier cap for early 2024 dates. They are not in the sample.
3. Implementation notes, written before any discovery number was computed, fill gaps in the plan: how "yes" odds are read from trades, that both ends of a change must be fresh, what "near zero" means (under 0.5 odds points), and exactly how the next-day, luck and oil-first checks are computed.

## Files

`/workspace/research/oil-odds-discovery/`: `PREREG.md`, `frozen_app_events.csv`, `set_aside_oil_price_contracts.csv`, `discovery_table.csv`, `event_ranking_discovery.csv`, `locked_pick.json`, `confirmation_summary.json`, `MANIFEST.md`, `run_all.sh` (one command reproduces everything from `raw/`), code in `code/`.

Research finding only, not investment advice.
