#!/usr/bin/env python3
"""Product task 10 attention ranking, recomputed from site/data JSON. Prints event ids, best first."""
import json
from pathlib import Path

DIR = Path(__file__).resolve().parents[1] / "data"


def parse_list(raw):
    if raw is None:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return []
    return list(raw) if isinstance(raw, (list, tuple)) else []


def main():
    fallback = json.loads((DIR / "fallback.json").read_text())
    rules = json.loads((DIR / "rules.json").read_text())
    holdings = json.loads((DIR / "holdings.json").read_text())
    out = []
    for ev in fallback["events"]:
        opts = []
        for m in ev["markets"]:
            if m.get("closed") or not m.get("outcomePrices"):
                continue
            oc = parse_list(m.get("outcomes"))
            pr = [float(x) for x in parse_list(m.get("outcomePrices"))]
            odc = None if m.get("oneDayPriceChange") is None else float(m["oneDayPriceChange"]) * 100
            if len(oc) == 2 and str(oc[0]).lower() == "yes":
                opts.append((pr[0] * 100, odc))
            else:
                for i, _ in enumerate(oc):
                    opts.append((pr[i] * 100, None if odc is None else (odc if i == 0 else -odc)))
        if not opts:
            continue
        opts.sort(key=lambda x: -x[0])
        pct, mv = opts[0]
        st = rules["group_strengths"][ev["strength_key"]]
        touch = sum(
            r["weight"] * float(st.get(rules["holdings_sectors"].get(r["ticker"], {}).get("sector", "none"), 0) or 0)
            for r in holdings["rows"]
        )
        p = pct / 100
        att = min(touch * 4 * p * (1 - p) + (touch * 0.5 if mv is not None and abs(mv) >= 5 else 0), touch)
        out.append((ev["event_id"], att, touch))
    out.sort(key=lambda x: (-x[1], -x[2]))
    print(json.dumps([x[0] for x in out]))


if __name__ == "__main__":
    main()
