"""Select markets by the pre-registered rule using Gamma API metadata only (no prices)."""
import json, re, requests, time, pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent / "data"
G = "https://gamma-api.polymarket.com/markets"
END_MIN, END_MAX, VOL_MIN = "2025-01-01T00:00:00Z", "2026-10-31T23:59:59Z", 1_000_000

def months():
    import datetime as dt
    d = dt.date(2025, 1, 1)
    while d <= dt.date(2026, 10, 1):
        n = dt.date(d.year + (d.month == 12), d.month % 12 + 1, 1)
        yield d.isoformat() + "T00:00:00Z", (n - dt.timedelta(days=1)).isoformat() + "T23:59:59Z"
        d = n

def pull(closed):
    out = []
    for a, b in months():
        out += pull_window(closed, a, b)
    return out

def pull_window(closed, a, b_):
    rows, off = [], 0
    while True:
        r = requests.get(G, params=dict(limit=100, offset=off, closed=str(closed).lower(),
                         end_date_min=a, end_date_max=b_, volume_num_min=VOL_MIN), timeout=60)
        r.raise_for_status(); b = r.json()
        if not b: break
        rows += b; off += len(b); time.sleep(0.2)
        if len(b) < 100: break
    return rows

FED = re.compile(r"\bfed\b.*\b(decrease|cut)s?\b.*\b25\b|\b25\s*bps?\b.*\b(decrease|cut)\b.*\bfed\b", re.I)
BTC = re.compile(r"\b(bitcoin|btc)\b.*\b(reach|hit|above|below|dip)\b.*\$?\d", re.I)

def keep(m):
    return {k: m.get(k) for k in ["id","question","slug","endDate","closed","volumeNum","clobTokenIds","outcomes","outcomePrices","conditionId","startDate","description"]}

if __name__ == "__main__":
    allm = pull(False) + pull(True)
    print("markets in window with volume >= 1M:", len(allm))
    fed = sorted([keep(m) for m in allm if FED.search(m.get("question",""))], key=lambda m: -float(m["volumeNum"] or 0))
    btc = sorted([keep(m) for m in allm if BTC.search(m.get("question",""))
                  and not re.search(r"up or down", m.get("question",""), re.I)], key=lambda m: -float(m["volumeNum"] or 0))
    for name, lst in [("fed", fed), ("btc", btc)]:
        sel = lst[:8]
        json.dump({"rule": "see PREREGISTRATION.md", "all_qualifying": len(lst), "selected": sel},
                  open(OUT / f"markets_{name}.json", "w"), indent=1)
        print(name, "qualifying:", len(lst))
        for m in sel: print("  ", m["endDate"][:10], int(float(m["volumeNum"])), m["closed"], m["question"])
