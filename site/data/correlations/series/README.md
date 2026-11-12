# TD-011 chart series (internal, description only, not proven)

File: chart_series.json, 1519870 bytes, sha256 5f968fbdb71f2bafa8043d4ffbe6278bd6897d0adfa8c0077ccdbad9ee3ef1be
Built 11 Nov 2026 about 22:30 Israel time (generated_at in the file is UTC). run_id TR-016-2026-11-11.
Summary it belongs to: tr016_summary.json sha256 a801a002f45b93c22acc60287ab168c0f220c9545b8381ae794beaaedd7049d9 (unchanged).
Code read: Research's TR-016 repo, commit 7042b51, code/build.py. No new statistics; nothing fetched from the internet.

## How it was made
1. Cloned TR-016 at 7042b51 into tr016_copy/ and copied its stored inputs (raw/). Research's folders were only read.
2. export_series.py runs TR-016's own build.py text on the copy, stops before it writes any output, with the shuffle count cut to 2
   (shuffles do not change the series, the correlations or the episode counts). Three small text patches only keep values TR-016 already
   computes: the asset closing level, the event id per day, and the first day of each independent episode.
3. build_chart_series.py writes chart_series.json. check_series.py writes series_checks.json and series_checks.log.

## What is in the file
- assets[asset]: dates (that asset's trading days), level (closing price, or yield/rate in percent), move (what TR-016 correlated for
  direction rows: daily percent change, or daily change in basis points for yields and rates), size_scaled (what size rows used: size of
  the daily move either way, divided by its median over the previous 60 trading days). Clipped to 10 trading days around the odds data.
- odds["family/measure|asset"]: the odds values TR-016 used, on that asset's calendar, from first_date to last_date (null = missing day).
  direction: daily change in odds points (Fed, other central banks: chance of a rate cut; wars: chance of peace minus chance of war,
  averaged over traded markets; inflation: change in expected monthly inflation, basis points).
  size: what TR-016 ranked (total odds movement either way, divided by its median over the previous 60 values); raw_odds_points also given.
  No value after the family's hold-back boundary.
- busy_trading_runs[family]: busy-trading runs (TR-014 rule: 7-day average number of trades above 5 times the median of the 28 days
  before), the only special days TR-016 marks. Runs starting after the boundary dropped; ends clipped to the boundary (flagged).
- pick_episodes: for each of the 21 picks, the first day of each independent episode, and whether it was a busy-trading run or a spaced day.
- row_episode_days: the same first days for all 517 shown rows (key "family/measure|asset|lag").

## Rounding
Every number is rounded to 4 significant digits for display only. The summary statistics were computed on unrounded values.

## Limits for the charts
- There is no single odds level line in TR-016: a family's daily change sums several markets of the current event, and the event
  switches over time. A chart must show the daily changes (bars), or a running total clearly labelled as one.
- TR-016 has no "large-move day" rule. Independent episodes are not large moves: they are the used days, thinned so close days count once
  (up to 146 per row). The closest marked days are the busy-trading runs.
- Odds series are per asset calendar, so the same family looks slightly different against each asset.
- Lead rows (one moved first) pair the odds with the asset 1 day later, or summed over 5 trading days; the chart shows same-day series.
