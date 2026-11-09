#!/usr/bin/env bash
# Backup only: rebuild the site every 60 seconds (pages already re-read Polymarket live in the browser).
# Not started automatically. Run: ./rebuild-loop.sh   Stop: Ctrl+C
cd "$(dirname "$0")"
while true; do
  python3 build_site.py --no-checks || echo "build failed $(date)"
  sleep 60
done
