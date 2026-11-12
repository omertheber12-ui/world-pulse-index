# Biggest change

This rule picks the saved Polymarket contract that moved the most from one day to the next. It describes saved readings. It does not say what happens next.

The numbers live in `site/data/daily/rule.json`. That file has a `version` field. These are starting numbers. The COO approves changes later. To change them, edit that file. The scripts read the file. They do not keep a second copy of the numbers.

## Move

A contract's move is today's odds minus the previous day's odds, in percentage points.

Odds are a probability from 0 to 1. Percentage points are that difference times 100. Odds of 0.40, then 0.46, is a move of 6 points.

The previous day is the saved file for the UTC date before today. If that file is missing, or that contract has no odds in it, there is no move. The missing number is left empty. It is not filled in.

## Who can be picked

A contract is eligible only when both of these are true on today's saved reading:

- its 24-hour traded volume is at least the `min_volume_usd` in the config (starting value: $10,000)
- its odds are between `min_odds` and `max_odds` (starting values: 0.03 and 0.97, which is 3% and 97%)

The bounds are inclusive. Odds of exactly 3% or exactly 97% can be picked. Volume of exactly $10,000 can be picked. A missing volume does not clear the floor.

## The pick

Among eligible contracts, the pick is the largest absolute move. A move of 6 points up and a move of 6 points down are the same size.

If two eligible moves are the same size, the higher 24-hour volume is the pick. If the volume is also the same, the smaller market id is listed first, so the result stays put.

The next eligible contracts, in that same order, are the smaller changes. The config field `smaller_changes` says how many (starting value: 2).

## A quiet day

If no eligible move is at least `min_abs_move_points` (starting value: 3), the day is quiet. A quiet day has no pick and no smaller changes.

A day where every read failed is `no update`. That is a failed read, not a quiet day. Failed reads stay empty.

## Where the volume number comes from

The daily collector stores Gamma's current `volume24hr` for each contract. That is a rolling 24-hour figure from the public market read.

The backfill of past days cannot read that rolling figure for a past date. What was used instead, and its limits, is written in `docs/td013/backfill-table.md`.
