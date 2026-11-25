"""Fetch taker trades for each selected market from the public Polymarket Data API v2 (cursor feed, newest first).
Keeps the 72-hour decision window plus a 7-day baseline before it. Wallet ids are hashed with a secret salt kept
OUTSIDE the repository (/workspace/.tr004_private/salt); the hash -> address map needed for the wallet-history step
is also kept there and is never committed. Names, pseudonyms, profile fields and transaction hashes are dropped."""
import json, time, hashlib, pathlib, requests
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
D = pathlib.Path(__file__).resolve().parent.parent / "data"; P = pathlib.Path("/workspace/.tr004_private")
SALT = (P / "salt").read_text().strip() if (P / "salt").exists() else None
URL = "https://data-api.polymarket.com/v2/trades"; MAXPAGES = 400

def h(w): return hashlib.sha256((SALT + w.lower()).encode()).hexdigest()[:16]

def ts(s): t = pd.Timestamp(str(s).replace(" ", "T")); t = t.tz_convert("UTC") if t.tzinfo else t.tz_localize("UTC"); return int(t.timestamp())

def window(m):
    end = ts(m["closedTime"]) if m.get("closedTime") else ts(m["endDate"])
    return end - 72 * 3600, end

def fetch(m):
    w0, w1 = window(m); base0 = w0 - 7 * 86400
    s = requests.Session(); rows, cur, pages, reached = [], None, 0, False
    while pages < MAXPAGES:
        params = dict(condition=m["conditionId"], limit=1000) if cur is None else dict(condition=m["conditionId"], cursor=cur)
        for i in range(5):
            try:
                r = s.get(URL, params=params, timeout=60)
                if r.status_code == 429: time.sleep(float(r.headers.get("Retry-After", 2))); continue
                if r.ok: break
            except Exception: pass
            time.sleep(1 + 2 * i)
        else: break
        j = r.json(); data = j.get("data") or []; pages += 1
        for x in data:
            t = int(x["timestamp"])
            if base0 <= t <= w1 + 3600:
                rows.append((m["market_id"], h(x["proxy_wallet"]), x["side"], int(x["outcome_index"]), float(x["size"]), float(x["price"]), t, x["proxy_wallet"].lower()))
        if data and int(data[-1]["timestamp"]) < base0: reached = True; break
        cur = (j.get("pagination") or {}).get("next_cursor")
        if not cur: reached = True; break
    return rows, dict(market_id=m["market_id"], pages=pages, reached_baseline_start=reached, n=len(rows), w0=w0, w1=w1)

if __name__ == "__main__":
    ev = json.load(open(D / "events.json"))["selected"]
    ms = [dict(mk, event_id=e["event_id"], type=e["type"]) for e in ev for mk in e["markets"]]
    with ThreadPoolExecutor(4) as ex: res = list(ex.map(fetch, ms))
    rows = [r for x, _ in res for r in x]
    df = pd.DataFrame(rows, columns=["market_id", "wallet_hash", "side", "outcome_index", "size", "price", "t", "addr"]).drop_duplicates()
    df[["wallet_hash", "addr"]].drop_duplicates().to_csv(P / "wallet_map.csv", index=False)   # private, not committed
    df.drop(columns="addr").to_csv(D / "trades.csv.gz", index=False)
    pd.DataFrame([i for _, i in res]).to_csv(D / "fetch_coverage.csv", index=False)
    print("trades", len(df), "markets", df.market_id.nunique(), "of", len(ms))
