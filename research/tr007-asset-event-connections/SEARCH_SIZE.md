# TR-007 search size (written right after the freeze, before any trade or price download)

Written: 10 Nov 2026 16:24 Israel time (Asia/Jerusalem); 2026-11-10T14:24:07Z UTC.
Freeze commit: db8a9616bd1c70b93bec7d6d0d3541f95e7bc8cd (omertheber12-ui/world-pulse-index, site/data/fallback.json).

- Frozen app events: 16. Assets: 2 (oil, bitcoin).
- Set aside for oil: 0. Set aside for bitcoin: 0. (No frozen event is a bet on the oil price or the Bitcoin price; see set_aside_review.csv.)
- Raw discovery search size = 2 assets x 16 events x 2 lead windows x 2 directions = 128.
- Per asset after set-asides: oil = 16 x 2 x 2 = 64; bitcoin = 16 x 2 x 2 = 64. Sum = 128.
