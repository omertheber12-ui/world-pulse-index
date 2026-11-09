# World Pulse Index · Architecture (Development task 6)

Written in plain words for others to follow. Labels: **Fact**, **Assumption**, **Guess**.

## What this is

A first working version of the World Pulse Index: one self-contained web page that shows live public Polymarket figures for four event groups, maps them against a read-only holdings snapshot, and scores how much of the reported portfolio each event could touch. **Insights only, not advice.**

## Data sources

1. **Public market figures (Fact)**  
   Gamma public data service at `https://gamma-api.polymarket.com`. Events are read by id (`/events/{id}`) and markets by id when needed (`/markets/{id}`). The service sends `Access-Control-Allow-Origin: *`, so the page can re-read leading percentages in the browser when opened. If that refresh fails (for example opening from a `file://` path), the built-in figures stay on screen with their label and receipt time.

2. **Holdings (Fact)**  
   Reused from Development task 5 file `holdings-live.json`, which came from an eToro connector read-only portfolio summary at **9 November 2026, 16:44:57 Asia/Jerusalem**. Values: Intel $1,325.91, Bitcoin $1,017.32, SPY $880.96, JPMorgan $522.82, Bank of America $452.30, Ethereum $0.85, cash $2.02, total $4,202.18. This build does **not** call eToro. Holdings refresh only when the page is rebuilt.

3. **Scoring rules (Fact: Product authored them)**  
   Product task 10 document [Product Rules · TP-010 Portfolio Touch Score](https://docs.google.com/document/d/1XptYmlRKxo2JEUm15rodf9RoM8UeWegkX521kMa9Z30/edit), delivered 9 November 2026, 17:55 Asia/Jerusalem. Copied into local `rules.json` so Product can swap rules later by editing that file only.

## How events are picked and grouped

Four groups only:

| Group | Exact event ids used |
| --- | --- |
| Central bank rate decisions | Fed December 770450, Fed January 770451, European Central Bank December 1025305, European Central Bank February 1280521, China central bank by 31 Dec 1123963 |
| Big company events | Nvidia data center revenue 1194143, Nvidia gross margin 1194144, Nvidia end-2026 market value 800884 |
| Worldwide elections | US Senate events 1262243, 1304411, 1224132 (Product found only United States races in time) |
| Wars | Israel–Iran ceasefire 711714, Russia–Ukraine ceasefire 478472, United States declares war on Iran 160366, China invades Taiwan 34044, United States–Iran ceasefire 1337182 |

**Fact:** these ids came from Product task 10. Related options inside one event count as **one** event. For each event the page shows the title, the leading outcome’s current percentage, trading volume when present, fetch time in Asia/Jerusalem, and the Polymarket link.

**Gaps noted by Product (Fact):** no live earnings markets for Apple, Microsoft, Alphabet, Amazon, Meta, Tesla, or Intel at search time; election coverage is United States only so far.

## Holdings-to-sector map

Every holding-to-sector link is a **Guess**. Strength numbers are **Assumptions**.

| Holding | Sector (Guess) |
| --- | --- |
| Intel | Chips, technology |
| Bitcoin, Ethereum | Crypto |
| SPY | Broad US stocks (heavy in big technology) |
| JPMorgan, Bank of America | Banks |
| Cash | No link |

Weights on the page use the **16:44** Asia/Jerusalem read (Fact), not Product’s 02:49 example weights. Product’s worked example used different weights; the formula is the same.

## Scoring formula (Product task 10)

- **Touch** = sum over holdings of (holding weight × link strength).  
  Strengths: strong **1.0**, some **0.5**, weak **0.25**, none **0** (**Assumption**).  
  Shown as “this event could touch X% of your portfolio”. **High effect** when touch is above **30%**.

- Per-group strengths (**Assumption**, from Product):

  | Event group | Chips | Crypto | Broad US stocks | Banks |
  | --- | --- | --- | --- | --- |
  | Federal Reserve rates | 0.5 | 0.5 | 1.0 | 1.0 |
  | European Central Bank rates | 0.25 | 0.25 | 0.25 | 0.25 |
  | China’s central bank rates | 0.5 | 0.25 | 0.25 | 0.25 |
  | Big company events (Nvidia, big technology) | 1.0 | 0 | 0.5 | 0 |
  | US elections | 0.25 | 0.25 | 0.5 | 0.5 |
  | Wars | 0.5 | 0.25 | 0.5 | 0.25 |

- **Uncertainty** = 4 × p × (1 − p), where p is the leading option as a fraction from 0 to 1. Equals 1.0 at 50% and near 0 when one option is near 100%.

- **Attention** = touch × uncertainty, plus touch × 0.5 when there is a meaningful move under Product task 7 (5 points or more versus about 24 hours earlier, lasting at least one hour). Capped at touch. This build uses the market’s one-day price change field as a practical stand-in for the 24-hour move when history is not fetched.

- Every event-to-holding link is labeled **Guess**. Each event shows two Guess lines: “If it happens…” and “If it does not happen…”.

## How scores update when percentages move

**Fact about the design:** the input is Polymarket percentage movement, **not** news. When a leading percentage moves, uncertainty and attention change even if the real-world event has not happened yet. Touch stays the same until holdings or `rules.json` strengths change. The browser refresh updates percentages on open; full touch recalculation with new holdings happens on rebuild.

## Safety choices

- Holdings are read-only. This task did not call the trading connector.
- No keys, tokens, or passwords in shared or local files in this folder.
- No spending, no outreach, no trades, orders, or account changes.
- Insights only. The page never uses “buy” or “sell” as advice.
- Holdings refresh only on rebuild from a known snapshot file.

## What’s built

- `rules.json` — Product task 10 strengths and event ids (swappable).
- `build.py` — fetches the exact events, scores them, writes the page and check results.
- `world-pulse-index.html` — self-contained page (insight → portfolio effect → four groups → formula → sources) with browser re-fetch of percentages.
- `architecture.md` — this file.
- `how-to-open.md` — short open instructions.
- `checks.json` — automated checks.
- Screenshots `shot-1280.png` and `shot-390.png` when the build pass takes them.

## What’s next

- Product may replace strengths or the formula by editing `rules.json` only.
- Scheduled rebuilds so holdings and figures stay fresh without a manual run.
- Stronger 24-hour move tracking (price history with a one-hour hold), matching Product task 7 more closely than the one-day field alone.
- Wider election and Magnificent Seven coverage when live markets appear.
- Drive upload and mission-list updates are intentionally out of this local-only build.

## Credit

Scoring rules and event id list: **Product task 10**, [Product Rules · TP-010 Portfolio Touch Score](https://docs.google.com/document/d/1XptYmlRKxo2JEUm15rodf9RoM8UeWegkX521kMa9Z30/edit). Page layout and live-fetch pattern reuse Development task 5 style.
