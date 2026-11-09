# How to open World Pulse Index (Development task 6)

1. Open `world-pulse-index.html` in a desktop browser (Chrome or Firefox work well).
2. The page ships with built-in figures and their receipt time in Asia/Jerusalem.
3. When the browser can reach the public Gamma service, it re-reads leading percentages on open. If that fails, the built-in figures stay, clearly labeled.
4. Holdings on the page are a read-only snapshot from Development task 5 (9 November 2026, 16:44:57 Asia/Jerusalem). They do not refresh until someone runs `python3 build.py` again.
5. To regenerate: from this folder run `python3 build.py`. That rewrites the HTML, `public-fetch.json`, and `checks.json`.

Insights only, not advice.
