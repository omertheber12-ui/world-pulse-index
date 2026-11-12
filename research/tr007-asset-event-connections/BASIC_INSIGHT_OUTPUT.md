# Basic insight output and stronger-connection status

Accepted by the COO on 10 Nov 2026, Israel time (Asia/Jerusalem). Product agreed the field names (TP-019). Written 10 Nov 2026; same-day wording updated the same day so the sentence does not say “often” unless a measured count supports it.

This note does not edit the locked TR-007 method. The locked bars stay as they are. The later oil and Bitcoin run still computes those bars. The run is the external strength check.

Source: CEO direction as reported by the COO on 10 Nov 2026, about 16:32 Israel time. Insights only, not advice to buy or sell. Who would pay is unknown and is never stated.

## What this note proposes

The live feature should show a readable fact about how an event’s chances and an asset’s price moved, without saying that one caused the other.

The locked bars (extra average of at least 0.20 percentage points, beating at least 95 of 1,000 luck checks, at least 10 independent confirmation firing days, and enough history to lock a pattern) are not a hide-gate for the beta. They can mark a pair as a stronger connection.

Incomplete history still cannot become a number.

## Two layers

1. **Basic insight.** A short measured description: “this moved like this while that moved like this.” Shown when we were able to compute the numbers. No cause claim.
2. **Stronger connection.** An extra status from the locked TR-007 checks. It does not hide a pair that fails those checks.

## What is measured

For a pair that has enough history to lock a pattern (the same eligibility the audit already used), the run still measures:

- How the public chances changed over the day before or the week before (the locked odds pattern).
- What the asset did in the next session after days that pattern appeared, compared with days it did not appear (the extra average move, in percentage points of the asset’s next-session return).
- How often the asset then moved at least 1 percent in the locked direction (the companion count, not a pass bar).

These numbers can be shown even if they fail the strength bars. Failing means the pair does not get the stronger-connection status. It does not mean we hide the measured description.

For a pair that does not have enough history (too few independent discovery days with a fresh odds change, incomplete trade history, or the event did not trade in discovery):

- Every scoring number is null, not zero.
- The only honest sentence is that we do not have enough history yet.
- We do not invent an extra average, a hit rate, or a direction.

Same-day numbers, when recorded, may be described as “moved together.” They cannot receive stronger-connection status. The locked method already says a same-day match is not a next-day pattern. Hour gaps inside the same day (for example, chances moved hours before the asset) are written down to consider later. They are Backlog row 30. They do not change the locked method now.

## Smallest field list

The results file can keep every field already agreed with Development. The live sentence only needs the fields below.

**On every pair**

- event_name, event_id, market_id
- asset: oil or bitcoin (display labels: “Main US oil price” and “Bitcoin”)
- date_last_checked: YYYY-MM-DD, Israel calendar date of the run
- method_id: TR-007
- method_fingerprint: 149a7c2b6e2d4e812c8612281a478272c69a0d03a3dc9ae960446f1802d4b953
- run_id: TR-007-YYYY-MM-DD
- history_status: described, not_enough_history, or checked_no_pattern (enough history, no locked next-day pattern, and no moved-together numbers)
- insight_kind: next_session, moved_together, not_enough_history, or checked_no_pattern
- insight_sentence: plain words written by Research from the measured fields (see wording below). readable_fact, if present, is the same text, so older display notes that look for that name do not invent or assemble a sentence.
- stronger_connection: true or false
- verdict: yes_first_look, no, unclear, or not_enough_history (the external check result; not a hide-gate)

**Only when history_status is described** (otherwise null)

- lead_window: day_before or week_before (null if the description is same-day only)
- locked_direction: up or down
- extra_average_percentage_points: firing days minus not-firing days, in the locked direction. Positive means an extra move in that direction. This compares days the pattern appeared with days it did not, not with ordinary days. For moved_together rows this field may be null. history_status is still described when the locked method recorded same-day median odds changes we can put in the sentence. Do not treat an empty extra average as missing history for those rows.
- confirmation_firing_count and confirmation_evaluated_count
- predicted_big_move_count and predicted_big_move_rate_percent (companion numbers, not a bar)
- odds_pattern: everyday words, such as “the chance rose,” not jargon
- oil_publish_lag_note: oil rows only
- how_sure: filled when stronger_connection is true. In this first wave it starts with “First look, not independently verified.” If the pair passed the main bars but failed the extra many-pair check, add a sentence saying so. That pair still has stronger_connection = true.

**Proposed status field for Product (TP-019)**

- Machine name: stronger_connection
- Type: true or false
- true only when verdict is yes_first_look (the pair passed every locked TR-007 yes bar)
- false in every other case, including no, unclear, not_enough_history, and any same-day-only description
- The app must not hide a pair because this value is false
- Suggested on-screen words: “Stronger connection.” For the first wave, keep the first-look sentence next to it. Product owns the final label words.

## Plain wording (templates, not findings)

These are sentence shapes. Any example figure would be labeled “Example only, not a real finding.”

**Not enough history**

“We do not have enough public history yet to describe how [event] and [asset] moved together. No number is shown for this pair.”

**Next-session pattern**

“On days when [odds_pattern], [asset] then moved an extra [X]% [up/down] on average, compared with days when that pattern did not appear. This is a measured pattern in public prices. It does not mean one caused the other.”

- [X] is extra_average_percentage_points, shown to two decimals. 0.20 means two-tenths of one percent, not 20 percent.
- [up/down] comes from locked_direction. Do not flip the sign of [X] when the direction is down.
- Companion line: “The price moved at least 1 percent this way in [predicted_big_move_count] of [confirmation_firing_count] of those later days.” Keep this companion line whenever these next-session numbers are shown, including when stronger_connection is false. If the verdict is unclear, also add: “This reading is unclear.”

**Moved together (same day)**

“On those days, [asset] made a large move while the chance of [event] changed by a median of [Y] points that same day, compared with a median of [Z] points on ordinary days (from [N] large-move days in the earlier sample). This describes them moving together that day. It is not a next-day pattern.”

[Y] and [Z] are the same-day odds-change medians the locked method already records for description only (large-move days versus ordinary days). [N] is the number of those large-move days. Do not say “often” unless a measured count supports that word. Do not start a new same-day pair hunt. Write this sentence only when those measured same-day numbers exist.

**Oil footnote, on every oil row that has numbers**

“The official oil print often comes out after the trade date, so this is a statistical link with a delayed official number, not proof someone could have acted on that official number the same day.”

Do not use advice words (buy, sell, should). Do not say the pattern will happen again. Do not state or guess who would pay.

## What the screen should and should not hide

- Do not hide a pair only because it failed the extra-average size bar, the luck check, or the “at least 10 later firing days” bar. Show the basic insight and leave stronger_connection = false.
- Do not turn incomplete history into a number.
- Product chose this layout: show cards for pairs we could describe with numbers, including next-session pairs that failed a strength bar and same-day moved-together pairs. For the rest, the file still lists them with null numbers. The screen uses one quiet line: “Other events do not have enough history yet.” Same-day cards use a “Moved together” display label and never the stronger-connection tag.
- An empty page is used only when no pair has numbers yet, with the headline “Nothing has enough history to describe yet.”
- Nothing from the earlier oil and Netanyahu test is copied onto the map unless this run computes it fresh.

## What does not change

- No edit to the locked TR-007 method or its printed fingerprint.
- No change to any statistical bar.
- The later run still reports every pair and still computes the locked checks.
- Incomplete history still cannot become a number.
- Same-day hour gaps stay parked as Backlog row 30.
