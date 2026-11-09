# World Pulse Index

Live public Polymarket figures for four event groups (elections, big company events, central bank rate decisions, wars) and a guess of how much of a portfolio each event could touch. Insights only, not advice.

## The site (multi-page, in `site/`)

- `site/today.html` (also `site/index.html`): headline and top 3 events ranked by attention
- `site/events.html`: all events by group (Central banks, Big company, Elections, Wars)
- `site/event.html?id=<event id>`: one event, all options, holdings it could touch (Guess), source
- `site/portfolio.html`: holdings by size with their top two events, sector shares (Guess)
- `site/how.html`: scoring, sources, safety choices
- `site/assets/layout.css`, `site/assets/data.js`: shared layout, scoring, live reads
- `site/assets/snapshot.js`: built-in figures, rules and holdings written by the build

The pages work opened straight from the file. They re-read Polymarket every 60 seconds (Gamma) and order book midpoints every 20 seconds. If reads fail they show the built-in figures and say so.

## Run on your own computer

In the site folder run `python3 -m http.server 8765`, then open http://localhost:8765/today.html

(Opening `site/today.html` directly from the file also works.)

## Rebuild

- `python3 build_site.py` refreshes Gamma figures, writes `site/assets/snapshot.js`, runs checks into `site/checks.json`, and takes screenshots into `site/shots/` (needs google-chrome for checks and screenshots; use `--no-checks` to skip).
- `./rebuild-loop.sh` rebuilds every 60 seconds (backup only; not started automatically).
- `python3 build.py` still builds the old single page `world-pulse-index.html`.

To change the sector map or scoring, edit `rules.json` only.

## Safety

No keys or tokens are stored here. Polymarket data is public and free, no account. Holdings come from a read-only eToro read made outside this repository (9 Nov 2026, 16:44 Asia/Jerusalem) and refresh only on a rebuild. Every event-to-holding link is labeled Guess. No trade suggestions anywhere.

# world-pulse-index
