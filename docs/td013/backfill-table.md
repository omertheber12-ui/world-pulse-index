# Backfill of saved daily odds

Window: 2026-10-14 through 2026-11-12 (30 UTC dates).
2026-10-13 is also saved. It is the day before that window, so 2026-10-14 has a previous day to subtract.
Collected at 2026-11-12T11:45:55.862Z.

The 30-day window from 2026-10-14 through 2026-11-12 has 27 picked days and 3 quiet days. 2026-10-13 is no baseline.
A quiet day has no eligible move of 3 points or more. A day with no earlier saved day is no baseline. A pick is the largest absolute eligible move.

## What the public feeds did and did not provide

Odds are the last public CLOB price point on that UTC date for the Yes token (`prices-history`, `interval=1m`, `fidelity=60`). A request with `startTs` returned HTTP 400, so the month interval was used. If that read failed, the same public route with `interval=max` and `fidelity=1440` was tried. A date with no price point is no update for that contract. The price was not carried forward from an earlier day.

Past 24-hour volume is not on the price history, and Gamma `volume24hr` is only the current rolling window. It was not copied onto past days.

In its place, each finished UTC date uses the sum of public trade sizes (`data-api` `/v2/trades` for that condition id) whose timestamps fall on that date. That sum is traded volume in shares. On a spot check during this work, it matched Gamma `volume24hr` when the window was Gamma's own last 24 hours (Fed December contract 3215008: 210,935.60 shares against Gamma 210,936.77). Two other contracts were within about 2% and about 10%. It is not the USDC paid (size times price), which is smaller. A day with no trades is a real zero, not a missing figure.

2026-11-12 is not a finished UTC day. Its odds are the latest price point so far, and its traded volume is trades from 00:00 UTC until this fetch. That is a shorter window than a full day.

If the trade pages stopped before the window was covered, that contract's traded volume for the affected days is empty. The empty volume is counted in the under 10,000 shares column and is not replaced with a guess. Price-history misses stay no update and are left out of both filter columns.

Trade pages that did not finish: none.
Contract-days with no odds: 74.
Ok readings whose volume figure is missing: 0.

The tracked contracts are the 45 markets stored on the site events in site/data/fallback.json. The TR-016 files in site/data/correlations/ do not list those market ids. They list historical event ids on busy-trading runs. Those events are closed, so they are not this daily set. Those three files were not edited.

## Table

Under 10,000 shares counts readings that are below the floor and readings that have odds but no traded volume. The number in parentheses, when present, is how many of that count had no volume figure. Outside 3% to 97% counts readings whose odds are under 3% or over 97%. A contract can be in both counts. No-update rows are in neither count.

| Date | Result | Market | Move in points | Traded volume (shares) | Under 10,000 shares | Outside 3% to 97% |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-10-13 | no baseline | — | — | — | 19 | 20 |
| 2026-10-14 | picked | Fed rate decision in January — 25 bps increase | +10.5 | 20,610.07 | 18 | 19 |
| 2026-10-15 | picked | Israel-Iran ceasefire holds — December 31 | -4.5 | 13,313.92 | 24 | 18 |
| 2026-10-16 | picked | Fed rate decision in January — No change | +5 | 11,961.52 | 19 | 18 |
| 2026-10-17 | picked | Israel next prime minister — Gadi Eizenkot | +4.2 | 47,992.84 | 27 | 18 |
| 2026-10-18 | picked | Israel next prime minister — Gadi Eizenkot | -8.55 | 110,271.25 | 21 | 18 |
| 2026-10-19 | picked | Israel next prime minister — Gadi Eizenkot | +4.35 | 113,395.19 | 19 | 17 |
| 2026-10-20 | picked | Fed rate decision in January — No change | -5.5 | 13,406.96 | 22 | 18 |
| 2026-10-21 | picked | Israel-Iran ceasefire holds — December 31 | -6 | 15,793.06 | 12 | 18 |
| 2026-10-22 | picked | Fed rate decision in January — 25 bps increase | -12 | 45,367.12 | 14 | 18 |
| 2026-10-23 | quiet | — | — | — | 26 | 18 |
| 2026-10-24 | picked | Fed rate decision in December — 25 bps increase | +3.5 | 86,194.15 | 22 | 18 |
| 2026-10-25 | picked | Russia-Ukraine ceasefire deal — December 31 | -3 | 12,336.15 | 18 | 18 |
| 2026-10-26 | picked | French presidential election 2027 — Édouard Philippe | +3 | 46,427.25 | 20 | 18 |
| 2026-10-27 | picked | Israel next prime minister — Benjamin Netanyahu | +12 | 9,472,559.04 | 17 | 18 |
| 2026-10-28 | picked | Israel next prime minister — Gadi Eizenkot | -19.8 | 1,612,350.21 | 15 | 18 |
| 2026-10-29 | picked | Fed rate decision in December — No change | +9 | 542,984.99 | 15 | 16 |
| 2026-10-30 | quiet | — | — | — | 17 | 17 |
| 2026-10-31 | quiet | — | — | — | 21 | 17 |
| 2026-11-01 | picked | Israel next prime minister — Gadi Eizenkot | +9.85 | 190,958.28 | 16 | 18 |
| 2026-11-02 | picked | Israel-Iran ceasefire holds — December 31 | +3 | 30,187.75 | 20 | 18 |
| 2026-11-03 | picked | Fed rate decision in December — No change | -3 | 144,630.53 | 18 | 17 |
| 2026-11-04 | picked | Israel next prime minister — Gadi Eizenkot | +10.05 | 568,370.01 | 10 | 16 |
| 2026-11-05 | picked | Fed rate decision in December — 25 bps increase | -14 | 929,657.25 | 12 | 17 |
| 2026-11-06 | picked | Fed rate decision in December — 25 bps increase | +13 | 889,902.16 | 18 | 17 |
| 2026-11-07 | picked | Israel-Iran ceasefire holds — December 31 | +8.5 | 157,382.03 | 19 | 17 |
| 2026-11-08 | picked | Israel next prime minister — Gadi Eizenkot | -4.65 | 204,305.34 | 21 | 16 |
| 2026-11-09 | picked | Israel-Iran ceasefire holds — December 31 | +10 | 110,550.68 | 15 | 18 |
| 2026-11-10 | picked | Fed rate decision in January — 25 bps increase | +30 | 179,997.64 | 14 | 18 |
| 2026-11-11 | picked | Fed rate decision in January — 25 bps increase | +6 | 149,046.60 | 15 | 18 |
| 2026-11-12 | picked | US presidential election 2028 — JD Vance | -3.8 | 240,416.37 | 26 | 19 |
