#!/bin/sh
# Reproduce TR-007 run from saved raw files (seed 20260007). Main reading, then the raw-price sensitivity.
set -e; cd "$(dirname "$0")"; PY=${PY:-python3}
$PY discovery.py && $PY confirm.py && $PY build_output.py
TR007_RAW_PRICES=1 $PY discovery.py && TR007_RAW_PRICES=1 $PY confirm.py
