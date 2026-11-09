#!/usr/bin/env python3
"""Personal rank from site/data JSON. Prints event ids, best first.

rank = exposure × change factor × quality
change factor = 0.5 + 0.5 × min(|24-hour change in points| / 10, 1)
quality = 1 or 0.5, matching site/lib/score.js
"""
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


def lead_of(ev):
    opts = []
    for m in ev["markets"]:
        if m.get("closed") or not m.get("outcomePrices"):
            continue
        oc = parse_list(m.get("outcomes"))
        pr = [float(x) for x in parse_list(m.get("outcomePrices"))]
        odc = None if m.get("oneDayPriceChange") is None else float(m["oneDayPriceChange"]) * 100
        spread = m.get("spread")
        if spread is None and m.get("bestBid") is not None and m.get("bestAsk") is not None:
            spread = float(m["bestAsk"]) - float(m["bestBid"])
        vol = None if m.get("volume24hr") is None else float(m["volume24hr"])
        if len(oc) == 2 and str(oc[0]).lower() == "yes":
            opts.append((pr[0] * 100, odc, spread, vol))
        else:
            for i, _ in enumerate(oc):
                mv = None if odc is None else (odc if i == 0 else -odc)
                opts.append((pr[i] * 100, mv, spread, vol))
    if not opts:
        return None
    opts.sort(key=lambda x: -x[0])
    return opts[0]


SUBJECTS = [
    ("nvidia", ["nvidia", "nvda"], []),
    ("intel", ["intel"], ["INTC"]),
    ("bitcoin", ["bitcoin"], ["BTC"]),
    ("ethereum", ["ethereum"], ["ETH"]),
    ("jpmorgan", ["jpmorgan", "jp morgan"], ["JPM"]),
    ("bofa", ["bank of america"], ["BAC"]),
]
FUND = {"SPY": {"nvidia": 0.07}}


def subject(ev, question):
    blob = (str(ev.get("title") or "") + " " + str(ev.get("plain") or "") + " " + str(question or "")).lower()
    for key, words, tickers in SUBJECTS:
        if any(w in blob for w in words):
            return key, tickers
    return None, []


def exposure(ev, question, rules, holdings):
    key, tickers = subject(ev, question)
    st = rules["group_strengths"][ev["strength_key"]]
    used = set()
    direct = funds = estimated = 0.0
    for h in holdings["rows"]:
        if key and h["ticker"] in tickers:
            direct += h["weight"]
            used.add(h["ticker"])
    if key:
        for h in holdings["rows"]:
            inner = FUND.get(h["ticker"], {}).get(key)
            if not inner:
                continue
            funds += h["weight"] * inner
            used.add(h["ticker"])
    for h in holdings["rows"]:
        if h["ticker"] in used:
            continue
        sector = rules["holdings_sectors"].get(h["ticker"], {}).get("sector", "none")
        if float(st.get(sector, 0) or 0) >= 0.5:
            estimated += h["weight"]
    total = min(100.0, direct + funds + estimated)
    weighted = direct + funds * 0.7 + estimated * 0.3
    return total, weighted, direct


def main():
    fallback = json.loads((DIR / "fallback.json").read_text())
    rules = json.loads((DIR / "rules.json").read_text())
    holdings = json.loads((DIR / "holdings.json").read_text())
    out = []
    for ev in fallback["events"]:
        lead = lead_of(ev)
        if lead is None:
            continue
        pct, mv, spread, vol = lead
        # question is not in lead_of; use first open market question
        question = ""
        for m in ev["markets"]:
            if not m.get("closed") and m.get("question"):
                question = m.get("question")
                break
        total, weighted, direct = exposure(ev, question, rules, holdings)
        move_abs = 0 if mv is None else abs(mv)
        move = min(move_abs / 20, 1) * 100
        exposure_score = min(weighted / 50, 1) * 100
        liq = None
        thin = (vol is not None and vol < 50000) or (liq is not None and liq < 10000)
        quality = 50 if thin else 100
        score = 0.5 * move + 0.35 * exposure_score + 0.15 * quality
        out.append((ev["event_id"], score, move_abs, direct, vol or 0))
    out.sort(key=lambda x: (-x[1], -x[2], -x[3], -x[4], x[0]))
    print(json.dumps([x[0] for x in out]))


if __name__ == "__main__":
    main()
