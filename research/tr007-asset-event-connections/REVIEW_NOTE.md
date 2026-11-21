# TR-007 Note: what we take from the outside review of TR-006

Written: 10 Nov 2026, Israel time (Asia/Jerusalem). Research team.
Parent: TR-006 locked method (https://docs.google.com/document/d/1l4empk2D3iTQ1tYJUVUHnHtTWU_wcjo3XgHRx6dKP0U/edit). TR-006 is not edited. TR-007 is a new, separate locked method.

Research finding only, not investment advice. Who would pay is unknown.

**Source of this note.** We searched Google Drive and our local research files for the original outside review and did not find it. This note is based on the COO's summary of the review (relayed on 10 Nov 2026), not on the original document. Everything in section 1 is the reviewer's opinion as the COO relayed it. We have not measured or checked any of it.

## 1. What the reviewer said (their opinions, not facts we measured)

- They scored TR-006 at about 7.5 out of 10 as research design.
- They liked three parts: keeping unused later days for a separate check, accepting an empty result, and comparing large-move days with ordinary days.
- They flagged seven risks:
  1. The forward-test formula (how the extra next-day move was calculated).
  2. False finds from looking at many asset-and-event pairs.
  3. Oil timing: the date an oil price refers to versus the date it is published.
  4. Week-before windows that overlap across the line between the discovery days and the later check days.
  5. Risk of incomplete trade history.
  6. Picking which market to use for an event by its lifetime trading volume, which is only known later.
  7. Fully shuffled dates in the luck check.
- They suggested an order of work: first check whether the data is good enough, then a corrected run, then a small connections view, then a later check of whether anyone is actually helped.
- They said first passes should not be treated as product-ready proof, and that who would pay is still unknown.

## 2. What we take (the COO decided to take these)

1. **One clear forward formula.** Each pair gets one locked direction. Every day's next-session return is turned into a "signed return" in that direction (the return itself if the direction is up, minus the return if it is down). The extra average is the mean signed return on days the pattern fires minus the mean signed return on days it does not. Later checks test only the locked direction. We report how many signals each direction gave.
2. **Many pairs.** We write down the search size before scoring. First-wave passes are called a "first look", not independently verified. We add a simple many-pairs correction (Benjamini-Hochberg false-discovery check at 10 percent) as an extra reported number. A pair that passes the main bar but not this correction is still reported, with the first-look label.
3. **Timing.** We define prediction time and observation time. Oil prices are dated by the market day they describe, not by when the government published them, and we state that the official oil price is often published days later. We add an unused 7-day gap between the discovery days and the later check days so week-before windows cannot share information.
4. **Luck check.** We switch from fully shuffled dates to a circular-shift test, which keeps the calendar clustering of signals. The likely range uses resamples of blocks of consecutive days.
5. **Enough signals.** A pair needs at least 10 independent firing days in the later check, not just 30 large-move days for the asset.
6. **No lifetime-volume look-ahead.** The market used for an event is the one the app listed at freeze time, not one picked by lifetime volume.
7. **Data check first.** A data-quality audit comes before the run. A pair with incomplete trade history is "not enough history", not a signal.

## 3. What we keep from TR-006

- Discovery days kept separate from later check days (first 70 percent of large-move days and last 30 percent, now with the 7-day gap).
- An empty map is an allowed result.
- Large-move days are compared with ordinary days.
- Same 1 percent large-move cut for both assets; day-before and week-before windows only for a next-session claim.
- At least 10 independent discovery days before a pattern can be locked; same independence spacing rules.
- Every eligible asset-and-event pair checked on its own; bets on the same asset's price set aside.
- The 0.20 percentage-point minimum meaningful extra move and the 95 percent luck-check bar.
- Unclear pairs are not shown, including oil and the Netanyahu bet from TR-005.
- First wave is only the main US oil price and Bitcoin, against eligible World Pulse Index app events.

## 4. What we are not treating as a measured fact

- The 7.5 out of 10 score and every point above are the reviewer's opinions as relayed by the COO.
- We have not measured whether any of the flagged risks changed the TR-005 oil result. TR-007 will be run fresh.
- First-look passes are not product-ready proof and are not independently verified.
- Who would pay is unknown. Nothing in the review or in our work shows it.
- Whether anyone is helped by a connections view is not tested yet. That is a later step.

Research finding only, not investment advice.
