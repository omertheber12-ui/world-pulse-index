"""Fetch hourly odds (Yes token) from Polymarket CLOB prices-history for every selected market."""
import json, time, pathlib, requests
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
D = pathlib.Path(__file__).resolve().parent.parent / "data"
URL = "https://clob.polymarket.com/prices-history"; CHUNK = 14 * 86400

def ts(s): return int(pd.Timestamp(s).tz_convert("UTC").timestamp()) if pd.Timestamp(s).tzinfo else int(pd.Timestamp(s, tz="UTC").timestamp())

def window(m):
    end = ts(m["endDate"]); 
    if m.get("closedTime"): end = min(end, ts(m["closedTime"].replace(" ", "T").replace("+00", "+00:00")))
    start = max(ts(m["startDate"]) if m.get("startDate") else end - 180 * 86400, end - 180 * 86400)
    return start, min(end + 2 * 86400, int(time.time()))

def fetch(m):
    tok = json.loads(m["clobTokenIds"])[0]; a, e = window(m); pts = []
    s = requests.Session()
    while a < e:
        b = min(a + CHUNK, e)
        for i in range(4):
            try:
                r = s.get(URL, params=dict(market=tok, startTs=a, endTs=b, fidelity=60), timeout=60)
                if r.ok: pts += r.json().get("history", []); break
            except Exception: pass
            time.sleep(1 + 2 * i)
        a = b
    return [(m["market_id"], p["t"], p["p"]) for p in pts]

if __name__ == "__main__":
    sel = json.load(open(D / "markets.json"))["selected"]
    with ThreadPoolExecutor(6) as ex: res = list(ex.map(fetch, sel))
    rows = [r for x in res for r in x]
    df = pd.DataFrame(rows, columns=["market_id", "t", "p"]).drop_duplicates(["market_id", "t"]).sort_values(["market_id", "t"])
    df.to_csv(D / "odds.csv.gz", index=False)
    print("markets with data:", df.market_id.nunique(), "of", len(sel), "rows", len(df))
