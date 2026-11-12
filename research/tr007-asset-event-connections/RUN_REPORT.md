# TR-007 run: oil and Bitcoin external strength check

Run id TR-007-2026-11-10. Run on 10 Nov 2026, about 16:45 to 17:00 Israel time (Asia/Jerusalem). Method: TR-007 locked method (https://docs.google.com/document/d/1dWymJYMHR7BbwhtRYgBurC9S082YU-4sBm0kuCmUnko/edit), lock fingerprint 149a7c2b6e2d4e812c8612281a478272c69a0d03a3dc9ae960446f1802d4b953. The method, its bars and TR-006 were not edited.

Research finding only, not investment advice. Who would pay is unknown. Insights only.

## The answer (5 lines)

1. **Verdict: no pair gets a stronger connection.** Of 32 asset-and-event pairs, 0 are yes_first_look, 3 are no, 0 are unclear and 29 are not enough history.
2. **How sure, and how much data:** the 3 testable pairs (Main US oil price with the French election and with the Taiwan event, Bitcoin with the Taiwan event) had 10 to 40 independent earlier large-move days each. In every one, the usual odds change before large moves differed from ordinary days by 1 odds point or less, which the locked method says is too small to lock a next-day pattern. So none reached the later check.
3. **Biggest caveat:** two of those scores sit exactly on the 1-point line (oil + Taiwan and Bitcoin + Taiwan, week before). The public trade feed stores prices with tiny rounding noise; read raw, Bitcoin + Taiwan scores 1.0000076 and would lock. We tested that reading too: it still ends as **no** (the later extra move went the wrong way, -0.76 percentage points). No verdict changes either way.
4. **What it means in practice:** the results file has no stronger-connection pair and no next-session numbers to show yet. This is an allowed result under the locked method; it is not a reason to loosen any bar.
5. **Next step:** rerun weekly under the same lock; most app events are too new and will gain history. On 10 Nov 2026, about 17:00 Israel time, the COO confirmed in writing that we keep rounding public chances to 0.01 points, and that the 3 no rows use history_status and insight_kind checked_no_pattern.

## Every pair

FACT, from the saved files. "Indep. days" = independent earlier (discovery) large-move days with a fresh odds change, day before / week before (10 needed). "Score" = largest gap in median odds change before large-move days versus ordinary days, odds points (more than 1 needed to lock).

| Asset | Event (market) | Verdict | Stronger connection | Indep. days (day / week) | Score (day / week) | Lead window locked | Extra average | Later firing days | Big-move count | Luck-check share beaten |
|---|---|---|---|---|---|---|---|---|---|---|
| Main US oil price | Next French Presidential Election (679018, Le Pen) | no | false | 19 / 10 | 0.00 / 0.50 | none | null | null | null | null |
| Main US oil price | Will China invade Taiwan by end of 2026? (567621) | no | false | 40 / 20 | 0.00 / 1.00 | none | null | null | null | null |
| Bitcoin | Will China invade Taiwan by end of 2026? (567621) | no | false | 32 / 18 | 0.00 / 1.00 | none | null | null | null | null |
| Main US oil price | Prime Minister of Israel after the next election? (682708, Eizenkot) | not_enough_history | false | 8 / 4 | not computed | none | null | null | null | null |
| Main US oil price | Will the US officially declare war on Iran by...? (1170144) | not_enough_history | false | 6 / 3 | not computed | none | null | null | null | null |
| Main US oil price | Presidential Election Winner 2028 (561261, Ossoff) | not_enough_history | false | 3 / 1 | not computed | none | null | null | null | null |
| Bitcoin | Next French Presidential Election (679018) | not_enough_history | false | 4 / 2 | not computed | none | null | null | null | null |
| Bitcoin | Prime Minister of Israel after the next election? (682708) | not_enough_history | false | 2 / 1 | not computed | none | null | null | null | null |
| Both assets | the other 11 events (Fed December, Fed January, ECB December 2026, ECB February 2027, People's Bank of China, 3 Nvidia events, Israel x Iran ceasefire, Russia x Ukraine ceasefire, US x Iran ceasefire), plus Bitcoin with US war on Iran and US 2028 | not_enough_history | false | 0 / 0 | not computed | none | null | null | null | null |

That is 3 pairs checked in discovery and 29 not-enough-history pairs (oil 14, Bitcoin 15). Search size stays 128 (2 assets x 16 events x 2 lead windows x 2 directions; nothing set aside). Pairs that reached the later check: 0, so the many-pair (Benjamini-Hochberg) family size is 0 and many_pair_correction_pass is null everywhere.

Earlier sample used for the 3 pairs: oil 2 Jan 2024 to 3 Mar 2026; Bitcoin 2 Jan 2024 to 2 Dec 2025. Ordinary days with a fresh odds change: oil + French 27 / 26, oil + Taiwan 63 / 63, Bitcoin + Taiwan 65 / 60 (day / week).

## Findings, labeled

- **FACT (no evidence of a lead; samples 10 to 40 independent days):** for all 3 testable pairs the median day-before odds change was 0.00 points before large up days, before large down days, and on ordinary days alike. Week-before gaps were 0.50 (oil + French), 1.00 (oil + Taiwan: median -1 point before large oil rises versus 0 on ordinary days, 9 up days) and 1.00 (Bitcoin + Taiwan: median -1 point before large Bitcoin falls versus 0, 9 down days). The bar needs more than 1 point.
- **FACT:** these odds mostly move in whole-point steps. In the earlier sample the median absolute window change was exactly 1.00 point for every pair and window, and 20 to 40 percent of window changes were exactly zero.
- **GUESS:** with whole-point steps, a median gap must reach about 2 points to clear "more than 1 point", so this bar is hard to clear for low-priced, slow-moving markets such as Taiwan (median level about 14 to 17 percent in the earlier sample). This is a property of the locked bar, not a reason to change it.
- **FACT (same-day description only):** the same-day medians already recorded do not look different under the method's own score formula with the same 1-point line: oil + French 1.00 (median -1 point on 7 large down days versus 0 on 28 ordinary days), oil + Taiwan 0.00, Bitcoin + Taiwan 0.50. So no pair is labeled moved together.
- **FACT (sensitivity, not the official result):** with raw feed prices, Bitcoin + Taiwan locks a week-before "chance fell by about 1 point or more" pattern for Bitcoin falls. On the later days (10 Dec 2025 to 9 Nov 2026, 335 checkable days, 42 firing days, 16 independent firing days) the extra move in the locked direction was **-0.76 percentage points** (wrong way; likely range -1.17 to -0.23), it beat only 1.1 percent of 1,000 luck checks, the reverse check failed (gap +0.15 points, wrong sign), and 2 of 16 independent firing days had a 1 percent move the predicted way. Verdict under that reading: **no**. Oil + French and oil + Taiwan still do not lock under the raw reading.
- **ASSUMPTION:** the public trades feed gives every trade with whole-second UTC timestamps, back to each market's first trade (checked in the audit).
- **ASSUMPTION:** trades in the same second keep the feed's own order (the feed is newest first, so the last of those is treated as the latest).

## Points the reader must know

- **Independence order (COO clarification, recorded here, not added to the method):** spacing is applied first to the asset's own large-move days (2 asset days for day before, 5 for week before, earliest first, inside each slice separately, only among large-move days), and only then is a fresh odds change required. The other reading (filter to fresh-odds days first, then space) was not used. Consequence: Prime Minister of Israel (event 81557, market 682708) with oil, day before, has 8 independent days and stays not enough history (the other reading would give 11).
- **Price precision (COO written decision, 10 Nov 2026, about 17:00 Israel time):** keep rounding public chances to 0.01 points before scoring, so the “1 point or less” line is not decided by feed noise of about 0.00001 points. This is data cleaning, not a bar change. The locked method was not edited. Polymarket trade prices sit on a 0.001 tick (99.0 percent of Taiwan and 93.5 percent of Le Pen prices are within 0.000001 of that grid), but the feed returns them with arithmetic noise, for example 0.4529999012 for 0.453. Under the raw reading, noise also creates nonsense rules (for example, an “up” rule that fires whenever the change is 0 or more because the ordinary median is -0.0000000000000036). The main reading was chosen and committed before any later-day value was read. The COO also checked that discovery locks were committed (bedc36a, about 16:48 Israel time) before confirmation values were written (76aa43d, about 16:50). It changes no verdict and no stronger_connection value; it does change whether Bitcoin + Taiwan carries numbers in the file.
- **Oil publish delay:** the official oil price for a date first appeared a median of 7 days later (middle 80 percent: 2 to 13 days). Any oil link is with a delayed official number, not proof someone could have acted on it the same day. Also, the oil day's change starts at the previous official price while the prediction time is 00:00 New York, so part of that day's oil move may already show in overnight futures.
- **Mild look-ahead in market choice:** for multi-market cards the app's lead option is the highest listed price in the file built on 9 Nov 2026 (frozen at commit db8a9616bd1c70b93bec7d6d0d3541f95e7bc8cd). Picking it uses present-day information. It follows the locked "app's own lead option" rule.
- **Oil values are first-release values** (Federal Reserve archive), not later revisions.
- **Same-day hour gaps** (odds moving hours before the asset on the same day) are parked as Backlog row 30; windows were not changed.
- **No TR-005 figures were copied.** The Israel prime minister card uses the Eizenkot market 682708, not the Netanyahu market 682705.
- **Method text fingerprint:** the original locked text (audit commit fb4402f) hashes to 149a7c2b...4b953. The current local copy also carries the display-only predicted_big_move_count addition and its Deviations entry, so it hashes differently (0def65a8...); no bar changed.

## What would change this

- More history: most app events started trading between May and November 2026. A weekly rerun can admit them once they have 10 independent earlier large-move days.
- A later rerun that does not round public chances to 0.01 points (the COO has now ruled that out for this method).
- A market with larger day-to-day odds moves could clear the 1-point line; whether that happens is unknown.

## Results file fields (for Product and Development)

- site/data/connections/latest.json and runs/TR-007-2026-11-10.json: schema_version connections-1, method_id TR-007, run_id TR-007-2026-11-10, date_last_checked 2026-11-10, search_size 128 on the wrapper and every pair, set_aside empty, 32 pairs.
- stronger_connection is false on all 32. insight_sentence and readable_fact are identical on every pair.
- not_enough_history rows: history_status and insight_kind not_enough_history, every scoring field null, the agreed "not enough history" sentence.
- The 3 "no" rows: history_status and insight_kind are checked_no_pattern (COO written decision, 10 Nov 2026, about 17:00 Israel time). Do not use described (that means we can describe the pair with numbers). Do not use not_enough_history (that would be untrue). Verdict stays no. stronger_connection stays false. Every scoring field is null. They keep the honest sentence that no next-day pattern was measured and no number is shown, in both insight_sentence and readable_fact, plus a discovery_summary detail object and a verdict_reason.
- Oil rows carry oil_publish_lag_note. prediction_time and observation_time use the agreed sentences.

## COO written decisions (10 Nov 2026, about 17:00 Israel time)

1. **Price precision.** Confirmed: keep rounding public chances to 0.01 points before scoring, so the “1 point or less” line is not decided by feed noise of about 0.00001 points. This is data cleaning, not a bar change. Do not edit the locked method. The COO also checked that discovery locks were committed (bedc36a, about 16:48 Israel time) before confirmation values were written (76aa43d, about 16:50).
2. **Labels for the 3 no rows.** Use history_status = checked_no_pattern and insight_kind = checked_no_pattern. Do not use described (that means we can describe the pair with numbers). Do not use not_enough_history (that would be untrue). Verdict stays no. stronger_connection stays false. All scoring numbers stay empty. Keep the honest sentence in both insight_sentence and readable_fact. The COO is telling Product and Development the display choice: show these 3 as cards with that sentence; do not put them on the quiet line that says other events do not have enough history yet; no stronger-connection tag, no First look tag, and no Moved together tag; empty page only when there is no described card and no checked_no_pattern card.

## Method (short)

- Data (reused from the audit, nothing re-downloaded): 16 frozen app events and their app-listed markets; public Polymarket trades (data-api.polymarket.com/v2/trades, no wallet fields); oil first-release daily Cushing price, 709 oil days 2 Jan 2024 to 3 Nov 2026; Bitcoin Binance BTCUSDT at 00:00 New York, 1,043 days 2 Jan 2024 to 9 Nov 2026 (Coinbase fallback needed on 0 days).
- Large-move day: at least 1 percent up or down. Split: first 70 percent of large-move days are the earlier sample, then an unused 7-day gap, then the later sample (oil from 11 Mar 2026, 127 raw later large-move days; Bitcoin from 10 Dec 2025, 171).
- Odds level at 00:00 New York; a window end is used only if a trade happened in the 24 hours before it; no carried-forward values.
- Discovery locks were computed and committed (git commit bedc36a) before any later-day value was read. The later-day code (luck check with 1,000 circular shifts, seed 20260007; old shuffle for comparison; 2,000 block resamples of 7 days; reverse, asset-first and clash checks; Benjamini-Hochberg at 10 percent) ran on 0 pairs in the main reading and on 1 pair in the sensitivity reading.
- Reproduce: code/run_all.sh (discovery.py, confirm.py, build_output.py).
- Local folder: /workspace/research/tr007-asset-event-connections/ (branch research/tr007-run, not pushed).

Research finding only, not investment advice.
