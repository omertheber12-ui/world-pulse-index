# TR-007 Data-quality audit

Task: TR-007 (Task Ledger row 36), audit step only. Written 10 Nov 2026, Israel time (Asia/Jerusalem).
Method followed: TR-007 locked method, https://docs.google.com/document/d/1dWymJYMHR7BbwhtRYgBurC9S082YU-4sBm0kuCmUnko/edit (lock fingerprint 149a7c2b6e2d4e812c8612281a478272c69a0d03a3dc9ae960446f1802d4b953; it matched the local file when this audit started at 16:22 Israel time). Note (fact): at 16:24:27 Israel time the local method file and its copy were changed by another process, not by this audit: a display-only output field (predicted_big_move_count) was added to the field list and a matching Deviations entry was appended. No statistical bar changed. Because the new field line sits above the fingerprint line, the sha256 of the text above that line is now 0def65a8a5976879faa8264665c5d84ffec32c80cf8791c417fd8a73a4b684e2; the original locked text is preserved in this audit's local git history (commit fb4402f). Nothing in this audit depends on that field. TR-006 was not edited.

Research finding only, not investment advice. Who would pay is unknown. This audit did not score any pair, did not compute any extra average, discovery score, locked pattern, hit rate, or luck check, and did not compare odds changes with later asset returns. It uses only dates, counts, and coverage.

## The answer first

**Fact (counts from dates and coverage only):** out of 32 possible asset-and-event pairs (16 frozen app events x 2 assets, none set aside), **3 pairs can genuinely be tested later**:

- **Main US oil price: 2 events, both windows (4 pair-windows).** "Next French Presidential Election" (79987, market 679018) and "Will China invade Taiwan by end of 2026?" (34044, market 567621).
- **Bitcoin: 1 event, both windows (2 pair-windows).** "Will China invade Taiwan by end of 2026?" (34044, market 567621).
- Every other pair is **not enough history**: the event's market started trading too late to have 10 independent discovery large-move days with a fresh odds change.

Close call to flag (fact): "Prime Minister of Israel after the next election?" (81557, market 682708) with oil, day-before window, has **8** independent discovery days under the main reading of the independence rule, but **11** if the fresh-odds filter is applied before the spacing rule. The locked text does not say which order is meant. This audit uses the main reading (spacing on the asset's own large-move days first, then require a fresh odds change), so this pair is **not enough history**. Changing the reading would be a method clarification for the COO, not something this audit decides. Le Pen / oil week-before sits exactly at 10 under both readings.

Reminder (fact, from the method): passing this audit is not a pass. The run also needs at least 10 independent confirmation firing days per pair, which cannot be known until a pattern is locked. With only 27 independent week-before confirmation days for oil, and 50 for Bitcoin, some eligible pairs may end as unclear for too few firing days (guess).

## Freeze (done before any trade or price download)

- **Assets:** main US oil price (West Texas at Cushing) and Bitcoin in US dollars only.
- **App events:** omertheber12-ui/world-pulse-index, file site/data/fallback.json, **commit db8a9616bd1c70b93bec7d6d0d3541f95e7bc8cd** (committed 10 Nov 2026 00:55 Israel time; file built 9 Nov 2026 18:35 Israel time). Frozen at 10 Nov 2026 16:23 Israel time (14:23 UTC). This is the file the app loads (site/lib/pulse.js imports it). It is the same commit used in TR-005. **16 events.**
- **Market per event (fact):** for the 11 single-market events, the only market. For the 5 multi-market events, the app itself picks one "lead" option to show on the card: site/lib/score.js sorts open markets by their listed price and shows the top one. This audit reproduced that rule on the frozen file. No market was picked by lifetime volume.
  - Fed December: 3215008 (25 bps increase). Fed January: 3215012 (no change). French election: 679018 (Le Pen). Israel prime minister: 682708 (Gadi Eizenkot; note TR-005 used the Netanyahu market 682705, picked by lifetime volume, and that rule is now retired). US 2028: 561261 (Jon Ossoff).
- **Set aside (fact):** none. No frozen event is a bet on the oil price or the Bitcoin price (the three Nvidia events are bets on Nvidia figures). File: set_aside.csv (header only) and set_aside_review.csv (all 32 rows with the reason).
- **Search size (written right after the freeze, before any download):** raw = 2 assets x 16 events x 2 lead windows x 2 directions = **128**. Per asset after set-asides: oil 64, Bitcoin 64 (sum 128).

Local git log (research/tr007-audit branch, local only): fb4402f freeze + search size (16:24 Israel time); 8ba0af4 catalog metadata; f0a33fb raw downloads and audit counts.

## Asset days and the split

### Main US oil price

- **Source (fact):** US Energy Information Administration daily Cushing spot file (series RWTC, https://www.eia.gov/dnav/pet/hist_xls/RWTCd.xls), downloaded 10 Nov 2026 16:26 Israel time. File says Release Date 11/4/2026, Next Release Date 11/12/2026, latest data 11/3/2026.
- **First-release values (fact):** the Federal Reserve archive of past versions (ALFRED, series DCOILWTICO) is free and was used, one version per calendar day from 15 Dec 2023 to 10 Nov 2026. As the method requires, the counts below use **first-release values**. Only 3 dates were later revised (12, 13, 14 Oct 2026), and those 3 change the large/ordinary label, so the current file gives 433 large-move days instead of 434.
- **Sample:** 2 Jan 2024 to **3 Nov 2026** (last complete published day; nothing after it is used). 709 oil days.
- **Share meeting the 1 percent cut:** **61.2 percent** (434 of 709; 232 up, 202 down, 275 ordinary). Current-file version: 61.1 percent. The cut stays at 1 percent.
- **Split:** 434 large-move days; discovery = first 303; last discovery large-move day B = 3 Mar 2026; unused gap 4 to 10 Mar 2026; confirmation from 11 Mar 2026.

| | Discovery | Unused gap | Confirmation |
|---|---|---|---|
| Dates | 2024-01-02 to 2026-03-03 | 2026-03-04 to 2026-03-10 | 2026-03-11 to 2026-11-03 |
| Asset days | 539 | 5 | 165 |
| Large-move days, raw (up / down) | 303 (158 / 145) | 4 (3 / 1) | 127 (71 / 56) |
| Ordinary days | 236 | 1 | 38 |
| Independent large-move days, day-before spacing (2 asset days) (up / down) | 142 (71 / 71) | not used | 50 (24 / 26) |
| Independent large-move days, week-before spacing (5 asset days) (up / down) | 78 (46 / 32) | not used | 27 (14 / 13) |

Current-file version differs only in confirmation: 126 raw (69 up / 57 down), 39 ordinary, 51 independent day-before, 27 independent week-before.

### Bitcoin

- **Source (fact):** Binance BTCUSDT public 1-hour candles. Daily price for New York date D = close of the hour ending exactly at 00:00 New York on D+1 (last trade before that cut). Coinbase BTC-USD 1-hour candles downloaded as fallback and cross-check. Downloaded 10 Nov 2026 16:26 Israel time.
- **Sample:** 2 Jan 2024 to **9 Nov 2026** (last complete New York day at download). 1,043 days. Every day came from Binance; Coinbase fallback was needed on 0 days.
- **Share meeting the 1 percent cut:** **56.1 percent** (585 of 1,043; 300 up, 285 down, 458 ordinary). The cut stays at 1 percent.
- **Split:** 585 large-move days; discovery = first 409; B = 2 Dec 2025; unused gap 3 to 9 Dec 2025; confirmation from 10 Dec 2025.

| | Discovery | Unused gap | Confirmation |
|---|---|---|---|
| Dates | 2024-01-02 to 2025-12-02 | 2025-12-03 to 2025-12-09 | 2025-12-10 to 2026-11-09 |
| Asset days | 701 | 7 | 335 |
| Large-move days, raw (up / down) | 409 (216 / 193) | 5 (2 / 3) | 171 (82 / 89) |
| Ordinary days | 292 | 2 | 164 |
| Independent large-move days, day-before spacing (2 asset days) (up / down) | 185 (100 / 85) | not used | 85 (40 / 45) |
| Independent large-move days, week-before spacing (5 asset days) (up / down) | 104 (60 / 44) | not used | 50 (28 / 22) |

Both assets clear the method's floor of at least 30 raw confirmation large-move days (oil 127, Bitcoin 171).

## Oil: when the price is observed versus when it is published

- **Fact:** the official daily oil price for a date usually becomes public about a week later. Using the first date each value appeared in the Federal Reserve archive: median delay **7 calendar days**, middle 80 percent between 2 and 13 days, mean 7.7, shortest 1, longest 40. 413 of 709 first appearances fell on a Wednesday (weekly batches). Counts by delay: 1 days: 8, 2 days: 88, 3 days: 10, 4 days: 7, 5 days: 82, 6 days: 100, 7 days: 106, 8 days: 95, 9 days: 41, 10 days: 34, 11 days: 27, 12 days: 29, 13 days: 26, 14 days: 21, 15 days: 13, 16 days: 7, and 15 dates above 16 days.
- **Fact:** the 15 longest delays (19 to 40 days) are the dates 31 May to 21 Jun 2024, which all first appeared on 10 Jul 2024 in the Federal Reserve copy.
- **Assumption:** the Federal Reserve copy is updated the same day as the US Energy Information Administration file or slightly later (both showed 4 Nov 2026 for the latest release), so the agency's own delay may be a little shorter. This was not checked day by day.
- **Limit (stated as the method asks):** any oil connection would be a statistical association with a delayed official print. It is not proof that anyone could have acted on that official number on the same day. Also (assumption from the method): part of an oil day's move may already show in oil futures by the prediction time (00:00 New York), so oil results lean toward "moved together".
- Other oil checks (fact): no gap between oil days longer than 4 calendar days in the sample; 3 dates (14 Oct 2024, 11 Nov 2024, 13 Oct 2025, US federal holidays) appear in the Federal Reserve copy but not in the agency file and are not used.

## Bitcoin series quality

- Fact: Binance had 33,830 hourly candles from 1 Jan 2023; 1 missing hour and 1 zero-trade hour, both on 24 Mar 2023 (before the sample). None of the needed cut hours (one per day from 31 Dec 2023 to 9 Nov 2026) were missing.
- Fact: Binance and Coinbase closes at the same cut differ by a median of 0.04 percent (99th percentile 0.19 percent, max 0.28 percent). On 6 of the 1,043 days that difference flips the large/ordinary label. The method uses Binance, so this is a small source limit, not a blocker.
- Coinbase had 10 missing hours out of 25,239 expected since 25 Dec 2023.

## Polymarket trade coverage and timestamps

- **Source (fact):** public trades feed data-api.polymarket.com/v2/trades by condition id, downloaded 10 Nov 2026 16:24 to 16:26 Israel time. Kept only market id, trade time (unix seconds, UTC), price, outcome index, side, size. No wallet fields.
- **Complete history (fact):** all 16 markets were paged until the feed said no more pages, back to each market's first trade (397,282 rows fetched; 382,076 after removing exact duplicate rows). A second public source (the Polymarket price-history service) never starts earlier than the first downloaded trade's calendar day for any of the 16 markets, so the early history is not cut off (assumption: that service would show earlier prices if earlier trading existed).
- **Fact:** "Presidential Election Winner 2028" lead market (Jon Ossoff, 561261) was created 8 Jul 2025 but its first trade was 11 Feb 2026; it genuinely did not trade before then (the price-history service agrees).
- **Timestamps (fact):** all times are whole seconds in UTC. No trades before a market's creation time. No odds outside 0 to 100. Trades stamped exactly on a 00:00 New York cut count as at-or-before (2 such trades); trades stamped 1 to 59 seconds after a cut belong to the next window (217 such trades in total; 139 in the Taiwan market, 21 Russia-Ukraine, 19 Israel prime minister). This is how the TR-003 trap is avoided.
- **Freshness rule:** a window end is fresh only if there is a trade in the 24 hours before it. No odds are carried forward.
- **Market start dates decide almost everything (fact):** oil discovery ends 3 Mar 2026 and Bitcoin discovery ends 2 Dec 2025. Only 5 lead markets traded before 3 Mar 2026 (Taiwan Jul 2025, Le Pen and Eizenkot Nov 2025, US war on Iran Jan 2026, Ossoff Feb 2026), and only 3 before 2 Dec 2025 (Taiwan, Le Pen, Eizenkot). The other 11 started trading between May and Nov 2026.

| Event (id) | Market | Trades | First trade (UTC) | Last trade (UTC) | Fetched to first trade? | Longest gap between trades (days) | Prints 1-59 s after a midnight cut | Fresh day-before change, share of oil days since first trade | Fresh day-before change, share of Bitcoin days since first trade |
|---|---|---|---|---|---|---|---|---|---|
| Fed Decision in December? (770450) | 3215008 | 8066 | 2026-07-30 02:41 | 2026-11-10 14:22 | yes | 1.4 | 0 | 98.5% | 99.0% |
| Fed Decision in January? (770451) | 3215012 | 1673 | 2026-07-30 14:42 | 2026-11-10 14:11 | yes | 6.11 | 2 | 64.7% | 64.1% |
| ECB Interest Rates: December 2026 (1025305) | 4570943 | 148 | 2026-09-15 00:00 | 2026-11-10 13:22 | yes | 6.38 | 0 | 30.6% | 35.7% |
| ECB Interest Rates: February 2027 (1280521) | 6404226 | 57 | 2026-10-30 10:43 | 2026-11-10 09:02 | yes | 6.59 | 0 | 66.7% | 27.3% |
| People's Bank of China rate change by December 31? (1123963) | 5230123 | 293 | 2026-10-03 12:45 | 2026-11-10 11:04 | yes | 8.2 | 0 | 27.3% | 28.9% |
| Will NVIDIA (NVDA) Q3 Data Center Revenue be above __? (1194143) | 5730325 | 18 | 2026-10-15 14:21 | 2026-10-24 20:04 | yes | 3.22 | 0 | 0.0% | 11.5% |
| NVIDIA (NVDA) Q3 adjusted gross margin (non-GAAP)? (1194144) | 5730329 | 32 | 2026-10-16 12:46 | 2026-11-06 11:16 | yes | 7.02 | 0 | 15.4% | 24.0% |
| Nvidia’s Market Cap end of 2026? (800884) | 3358974 | 230 | 2026-08-05 14:25 | 2026-11-10 13:11 | yes | 9.51 | 0 | 31.2% | 35.1% |
| Next French Presidential Election (79987) | 679018 | 20619 | 2025-11-14 02:17 | 2026-11-10 14:00 | yes | 3.53 | 5 | 98.4% | 98.1% |
| Prime Minister of Israel after the next election? (81557) | 682708 | 37676 | 2025-11-15 04:01 | 2026-11-10 14:20 | yes | 5.5 | 19 | 83.5% | 83.9% |
| Presidential Election Winner 2028 (31552) | 561261 | 20472 | 2026-02-11 20:28 | 2026-11-10 13:36 | yes | 0.78 | 13 | 98.9% | 99.3% |
| Israel x Iran ceasefire continues through...? (711714) | 3399468 | 5879 | 2026-08-07 20:35 | 2026-11-10 14:01 | yes | 0.59 | 5 | 98.4% | 97.9% |
| Russia x Ukraine ceasefire agreement by...? (478472) | 2243897 | 31357 | 2026-05-13 04:44 | 2026-11-10 14:19 | yes | 0.99 | 21 | 98.3% | 98.9% |
| Will the US officially declare war on Iran by...? (160366) | 1170144 | 4800 | 2026-01-13 01:05 | 2026-11-10 13:33 | yes | 3.24 | 12 | 86.8% | 86.4% |
| Will China invade Taiwan by end of 2026? (34044) | 567621 | 249959 | 2025-07-25 01:01 | 2026-11-10 14:01 | yes | 0.76 | 139 | 99.7% | 99.8% |
| US x Iran Effective Ceasefire begins by...? (2 week pause) (1337182) | 6831494 | 797 | 2026-11-08 03:32 | 2026-11-10 14:20 | yes | 0.05 | 1 | no oil day yet | 50.0% |

(Fresh share = share of asset days, from the market's first trade on, where both ends of the day-before window had a trade in the previous 24 hours. Full per-window numbers are in coverage_by_market.csv.)

## Every frozen event, per asset and window

Status uses only dates and coverage. Not ranked. "Up / down" = independent discovery large-move days split by direction (needed later: at least one in the scored direction).

### Main US oil price

| Event (id) | Market used | Window | Indep. discovery large-move days with fresh change (need 10) | Up / down | Ordinary days fresh | Indep. confirmation large-move days with fresh change | Status |
|---|---|---|---|---|---|---|---|
| Fed Decision in December? (770450) | 3215008 | day before | 0 | 0 / 0 | 0 | 19 | Not enough history |
| Fed Decision in December? (770450) | 3215008 | week before | 0 | 0 / 0 | 0 | 10 | Not enough history |
| Fed Decision in January? (770451) | 3215012 | day before | 0 | 0 / 0 | 0 | 10 | Not enough history |
| Fed Decision in January? (770451) | 3215012 | week before | 0 | 0 / 0 | 0 | 7 | Not enough history |
| ECB Interest Rates: December 2026 (1025305) | 4570943 | day before | 0 | 0 / 0 | 0 | 4 | Not enough history |
| ECB Interest Rates: December 2026 (1025305) | 4570943 | week before | 0 | 0 / 0 | 0 | 2 | Not enough history |
| ECB Interest Rates: February 2027 (1280521) | 6404226 | day before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| ECB Interest Rates: February 2027 (1280521) | 6404226 | week before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| People's Bank of China rate change by December 31? (1123963) | 5230123 | day before | 0 | 0 / 0 | 0 | 3 | Not enough history |
| People's Bank of China rate change by December 31? (1123963) | 5230123 | week before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| Will NVIDIA (NVDA) Q3 Data Center Revenue be above __? (1194143) | 5730325 | day before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| Will NVIDIA (NVDA) Q3 Data Center Revenue be above __? (1194143) | 5730325 | week before | 0 | 0 / 0 | 0 | 1 | Not enough history |
| NVIDIA (NVDA) Q3 adjusted gross margin (non-GAAP)? (1194144) | 5730329 | day before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| NVIDIA (NVDA) Q3 adjusted gross margin (non-GAAP)? (1194144) | 5730329 | week before | 0 | 0 / 0 | 0 | 1 | Not enough history |
| Nvidia’s Market Cap end of 2026? (800884) | 3358974 | day before | 0 | 0 / 0 | 0 | 6 | Not enough history |
| Nvidia’s Market Cap end of 2026? (800884) | 3358974 | week before | 0 | 0 / 0 | 0 | 1 | Not enough history |
| Next French Presidential Election (79987) | 679018 | day before | 19 | 12 / 7 | 27 | 50 | Eligible to be tested later |
| Next French Presidential Election (79987) | 679018 | week before | 10 | 3 / 7 | 26 | 27 | Eligible to be tested later |
| Prime Minister of Israel after the next election? (81557) | 682708 | day before | 8 | 5 / 3 | 13 | 50 | Not enough history |
| Prime Minister of Israel after the next election? (81557) | 682708 | week before | 4 | 2 / 2 | 9 | 27 | Not enough history |
| Presidential Election Winner 2028 (31552) | 561261 | day before | 3 | 2 / 1 | 6 | 50 | Not enough history |
| Presidential Election Winner 2028 (31552) | 561261 | week before | 1 | 0 / 1 | 4 | 27 | Not enough history |
| Israel x Iran ceasefire continues through...? (711714) | 3399468 | day before | 0 | 0 / 0 | 0 | 17 | Not enough history |
| Israel x Iran ceasefire continues through...? (711714) | 3399468 | week before | 0 | 0 / 0 | 0 | 9 | Not enough history |
| Russia x Ukraine ceasefire agreement by...? (478472) | 2243897 | day before | 0 | 0 / 0 | 0 | 36 | Not enough history |
| Russia x Ukraine ceasefire agreement by...? (478472) | 2243897 | week before | 0 | 0 / 0 | 0 | 19 | Not enough history |
| Will the US officially declare war on Iran by...? (160366) | 1170144 | day before | 6 | 3 / 3 | 7 | 43 | Not enough history |
| Will the US officially declare war on Iran by...? (160366) | 1170144 | week before | 3 | 1 / 2 | 7 | 23 | Not enough history |
| Will China invade Taiwan by end of 2026? (34044) | 567621 | day before | 40 | 21 / 19 | 63 | 50 | Eligible to be tested later |
| Will China invade Taiwan by end of 2026? (34044) | 567621 | week before | 20 | 9 / 11 | 63 | 27 | Eligible to be tested later |
| US x Iran Effective Ceasefire begins by...? (2 week pause) (1337182) | 6831494 | day before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| US x Iran Effective Ceasefire begins by...? (2 week pause) (1337182) | 6831494 | week before | 0 | 0 / 0 | 0 | 0 | Not enough history |

### Bitcoin

| Event (id) | Market used | Window | Indep. discovery large-move days with fresh change (need 10) | Up / down | Ordinary days fresh | Indep. confirmation large-move days with fresh change | Status |
|---|---|---|---|---|---|---|---|
| Fed Decision in December? (770450) | 3215008 | day before | 0 | 0 / 0 | 0 | 25 | Not enough history |
| Fed Decision in December? (770450) | 3215008 | week before | 0 | 0 / 0 | 0 | 13 | Not enough history |
| Fed Decision in January? (770451) | 3215012 | day before | 0 | 0 / 0 | 0 | 14 | Not enough history |
| Fed Decision in January? (770451) | 3215012 | week before | 0 | 0 / 0 | 0 | 9 | Not enough history |
| ECB Interest Rates: December 2026 (1025305) | 4570943 | day before | 0 | 0 / 0 | 0 | 4 | Not enough history |
| ECB Interest Rates: December 2026 (1025305) | 4570943 | week before | 0 | 0 / 0 | 0 | 2 | Not enough history |
| ECB Interest Rates: February 2027 (1280521) | 6404226 | day before | 0 | 0 / 0 | 0 | 1 | Not enough history |
| ECB Interest Rates: February 2027 (1280521) | 6404226 | week before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| People's Bank of China rate change by December 31? (1123963) | 5230123 | day before | 0 | 0 / 0 | 0 | 1 | Not enough history |
| People's Bank of China rate change by December 31? (1123963) | 5230123 | week before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| Will NVIDIA (NVDA) Q3 Data Center Revenue be above __? (1194143) | 5730325 | day before | 0 | 0 / 0 | 0 | 1 | Not enough history |
| Will NVIDIA (NVDA) Q3 Data Center Revenue be above __? (1194143) | 5730325 | week before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| NVIDIA (NVDA) Q3 adjusted gross margin (non-GAAP)? (1194144) | 5730329 | day before | 0 | 0 / 0 | 0 | 1 | Not enough history |
| NVIDIA (NVDA) Q3 adjusted gross margin (non-GAAP)? (1194144) | 5730329 | week before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| Nvidia’s Market Cap end of 2026? (800884) | 3358974 | day before | 0 | 0 / 0 | 0 | 8 | Not enough history |
| Nvidia’s Market Cap end of 2026? (800884) | 3358974 | week before | 0 | 0 / 0 | 0 | 3 | Not enough history |
| Next French Presidential Election (79987) | 679018 | day before | 4 | 1 / 3 | 6 | 83 | Not enough history |
| Next French Presidential Election (79987) | 679018 | week before | 2 | 1 / 1 | 4 | 48 | Not enough history |
| Prime Minister of Israel after the next election? (81557) | 682708 | day before | 2 | 0 / 2 | 2 | 71 | Not enough history |
| Prime Minister of Israel after the next election? (81557) | 682708 | week before | 1 | 1 / 0 | 0 | 41 | Not enough history |
| Presidential Election Winner 2028 (31552) | 561261 | day before | 0 | 0 / 0 | 0 | 67 | Not enough history |
| Presidential Election Winner 2028 (31552) | 561261 | week before | 0 | 0 / 0 | 0 | 38 | Not enough history |
| Israel x Iran ceasefire continues through...? (711714) | 3399468 | day before | 0 | 0 / 0 | 0 | 22 | Not enough history |
| Israel x Iran ceasefire continues through...? (711714) | 3399468 | week before | 0 | 0 / 0 | 0 | 12 | Not enough history |
| Russia x Ukraine ceasefire agreement by...? (478472) | 2243897 | day before | 0 | 0 / 0 | 0 | 44 | Not enough history |
| Russia x Ukraine ceasefire agreement by...? (478472) | 2243897 | week before | 0 | 0 / 0 | 0 | 25 | Not enough history |
| Will the US officially declare war on Iran by...? (160366) | 1170144 | day before | 0 | 0 / 0 | 0 | 70 | Not enough history |
| Will the US officially declare war on Iran by...? (160366) | 1170144 | week before | 0 | 0 / 0 | 0 | 37 | Not enough history |
| Will China invade Taiwan by end of 2026? (34044) | 567621 | day before | 32 | 16 / 16 | 65 | 85 | Eligible to be tested later |
| Will China invade Taiwan by end of 2026? (34044) | 567621 | week before | 18 | 9 / 9 | 60 | 50 | Eligible to be tested later |
| US x Iran Effective Ceasefire begins by...? (2 week pause) (1337182) | 6831494 | day before | 0 | 0 / 0 | 0 | 0 | Not enough history |
| US x Iran Effective Ceasefire begins by...? (2 week pause) (1337182) | 6831494 | week before | 0 | 0 / 0 | 0 | 0 | Not enough history |

Summary (fact):

| Asset | Frozen | Set aside | Not enough history (day before / week before) | Eligible (day before / week before) |
|---|---|---|---|---|
| Main US oil price | 16 | 0 | 14 / 14 | 2 / 2 |
| Bitcoin | 16 | 0 | 15 / 15 | 1 / 1 |

## Problems that could block or weaken a later run

1. **Short histories (fact):** most app events are too new. Only 3 of 32 pairs pass. This is a data limit, not a reason to loosen any bar.
2. **Independence order is ambiguous (fact):** the locked text does not say whether the fresh-odds filter comes before or after the spacing rule. It changes one pair (Israel prime minister / oil / day before: 8 versus 11). Needs a written COO clarification before the run; this audit used spacing first.
3. **Firing count unknown (fact):** the 10-firing-day minimum can only be checked after a pattern is locked. Oil week-before has only 27 independent confirmation days, so a pattern that fires on fewer than about a third of them would end as unclear (guess).
4. **Lead market chosen by price at freeze (assumption, a mild look-ahead risk):** the app shows the option with the highest price on 9 Nov 2026. That is a choice made with today's knowledge, similar in spirit to the retired lifetime-volume rule. It follows the method, but it should be stated in the run report.
5. **Very low odds (fact):** for the eligible pairs, the share of fresh discovery window ends with odds below 3 or above 97 percent is 0 percent (Taiwan, both assets), 1.4 percent (Le Pen, oil) and 5.3 percent (Le Pen, Bitcoin). The method has no filter for this; low concern.
6. **Exact duplicate trade rows (fact):** 15,206 rows with the same time, price, side, outcome and size were dropped. Some may be real separate fills. This does not change freshness (timestamps are kept), only volume totals, which this method does not use.
7. **Oil timing (fact plus assumption):** official print about 7 days late; futures may move before the prediction time. Any oil result is an association, leaning toward "moved together".
8. **Israel prime minister market end date (fact):** the catalog lists an end date of 28 Oct 2026 but the market is still open and trading. It is not eligible here, so no effect now.

## Accidental extra values seen

- While testing the Binance connection, the end of one current hourly candle was printed on screen. It is part of the intended Bitcoin source; it was not saved separately and not used as a finding.
- The Federal Reserve archive page was read only for dates; price values were masked when printed.
- The frozen app file contains each market's listed price on 9 Nov 2026 (catalog field). It was used only to reproduce the app's own lead-option choice.

## Files

Local folder: /workspace/research/tr007-asset-event-connections/
- AUDIT.md (this report), SEARCH_SIZE.md, PREREG.md (locked method copy, unchanged)
- frozen_app_events.csv, set_aside.csv, set_aside_review.csv
- coverage_by_market.csv, eligibility_by_pair.csv, audit_summary.json
- oil_days_audit.csv, bitcoin_days_audit.csv (asset days, slice, independence flags only)
- raw/ (app file, commit record, trades, oil agency file, Federal Reserve first-release table, Bitcoin candles) and code/ (freeze_events.py, fetch_meta.py, fetch_trades.py, fetch_alfred.py, fetch_btc.py, fetch_coinbase.py, audit.py)

Key file fingerprints (sha256): app_fallback.json e0928383...649f5a; trades.csv.gz 48750937...b6f6f; eia_RWTCd.xls d14bf481...1e1b36; alfred first release 0a445e83...38fbe8; btc_binance_1h.csv.gz 81281efe...d8191; eligibility_by_pair.csv (see local folder).

## Labels used

- Fact: counted from the saved files.
- Assumption: a reasoned belief not checked directly (marked where used).
- Guess: a forecast about the later run (marked where used).
