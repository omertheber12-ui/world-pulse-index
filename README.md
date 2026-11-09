# World Pulse Index

A first version page that shows live public Polymarket figures for four event groups (elections, big company events, central bank rate decisions, wars) and a guess of how much of a portfolio each event could touch. Insights only, not advice.

## Run it locally

1. You need Python 3.
2. In this folder, run `python3 -m http.server 8765`
3. Open http://127.0.0.1:8765/world-pulse-index.html in a browser. The page fetches fresh Polymarket figures each time it opens. If it can't reach them, it shows the built-in figures and labels them.

## Rebuild

`python3 build.py` fetches the public Polymarket events, applies the scoring rules in `rules.json`, rewrites `world-pulse-index.html`, and writes `checks.json`.

To change the sector map or scoring, edit `rules.json` only.

## Files

- `world-pulse-index.html`: the page
- `build.py`: fetch, score and page writer
- `rules.json`: event list, sector links and strengths (from Product task 10)
- `architecture.md`: how it works, in plain words
- `how-to-open.md`: short open note
- `checks.json`: results of the last automated checks

## Safety

No keys or tokens are stored here. Holdings come from a read-only eToro read made outside this repository, and they refresh only on a rebuild.
