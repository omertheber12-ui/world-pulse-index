"""Pre-registered selection: Bitcoin price-target markets with target within 10% of Bitcoin at listing."""
import json, re, time, random, requests, pathlib, datetime as dt
import pandas as pd
D = pathlib.Path(__file__).resolve().parent.parent / "data"
G = "https://gamma-api.polymarket.com/markets"
BTCQ = re.compile(r"\b(bitcoin|btc)\b", re.I)
EXCL = re.compile(r"up or down|between|range|\bor\b.*\$", re.I)
KIND = [("above", re.compile(r"\babove\b|\bgreater than\b|\bover\b", re.I)),
        ("dip", re.compile(r"\bdip\b|\bfall\b|\bdrop\b|\bbelow\b|\bunder\b", re.I)),
        ("reach", re.compile(r"\breach\b|\bhit\b", re.I))]
STRIKE = re.compile(r"\$\s?([\d,]+(?:\.\d+)?)\s?([kKmM])?")

def months():
    d = dt.date(2025, 1, 1)
    while d <= dt.date(2026, 10, 1):
        n = dt.date(d.year + (d.month == 12), d.month % 12 + 1, 1)
        yield d.isoformat() + "T00:00:00Z", (n - dt.timedelta(days=1)).isoformat() + "T23:59:59Z"; d = n

def pull():
    out = []
    for closed in ["false", "true"]:
        for a, b in months():
            off = 0
            while True:
                r = requests.get(G, params=dict(limit=100, offset=off, closed=closed, end_date_min=a, end_date_max=b, volume_num_min=50000), timeout=60)
                if r.status_code == 422: break
                r.raise_for_status(); bb = r.json(); out += bb; off += len(bb); time.sleep(0.15)
                if len(bb) < 100: break
    return out

def parse(m):
    q = m.get("question", "")
    if not BTCQ.search(q) or EXCL.search(q): return None
    kind = next((k for k, rx in KIND if rx.search(q)), None)
    s = STRIKE.search(q)
    if not kind or not s: return None
    k = float(s.group(1).replace(",", "")) * {"k": 1e3, "m": 1e6}.get((s.group(2) or "").lower(), 1)
    if k < 1000: return None
    lst = m.get("startDate") or m.get("createdAt")
    return dict(id=str(m["id"]), question=q, kind=kind, strike=k, listed=lst, endDate=m["endDate"], closed=m.get("closed"),
                volume=float(m.get("volumeNum") or 0), token=json.loads(m["clobTokenIds"])[0], outcomePrices=m.get("outcomePrices"))

if __name__ == "__main__":
    raw = pull(); cands = [c for c in (parse(m) for m in raw) if c]
    cands = list({c["id"]: c for c in cands}.values())
    b = pd.read_csv(D / "btc_hourly.csv.gz"); b["time"] = pd.to_datetime(b.t, unit="s", utc=True); b = b.set_index("time").close
    sel = []
    for c in cands:
        L = pd.Timestamp(c["listed"]).tz_convert("UTC") if pd.Timestamp(c["listed"]).tzinfo else pd.Timestamp(c["listed"], tz="UTC")
        E = pd.Timestamp(c["endDate"]).tz_convert("UTC")
        if (E - L) < pd.Timedelta(hours=48): continue
        s0 = b[b.index >= L.ceil("h")]
        if s0.empty: continue
        c["S0"] = float(s0.iloc[0]); c["dist"] = c["strike"] / c["S0"] - 1
        if abs(c["dist"]) <= 0.10: sel.append(c)
    sel.sort(key=lambda c: c["id"]); random.Random(20261110).shuffle(sel)
    chosen = sel[:60]
    json.dump(dict(n_raw=len(raw), n_parsed=len(cands), n_qualifying=len(sel), selected=chosen), open(D / "markets.json", "w"), indent=1)
    print("raw", len(raw), "parsed", len(cands), "qualifying", len(sel), "selected", len(chosen))
    from collections import Counter; print(Counter(c["kind"] for c in chosen))
    for c in chosen[:12]: print(c["endDate"][:10], c["kind"], c["strike"], round(c["dist"], 3), int(c["volume"]), c["question"][:70])
