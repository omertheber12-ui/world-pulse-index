#!/usr/bin/env bash
# Reproduce TR-005 from saved raw files (raw/). Fixed seed 20261110 is set in code/common.py.
set -e; cd "$(dirname "$0")/code"
python freeze_events.py && python oil.py && python discovery.py && python confirmation.py && python stale.py
