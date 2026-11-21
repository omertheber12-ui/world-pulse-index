"""Fetch hourly odds (Yes token) from Polymarket CLOB prices-history for selected markets."""
import json, time, requests, pathlib, datetime as dt
import pandas as pd
D = pathlib.Path(__file__).resolve().parent.parent / "data"
URL = "https://clob.polymarket.com/prices-history"
CHUNK = 14 * 86400

def ts(s): return int(pd.Timestamp(s).tz_convert("UTC").timestamp()) if pd.Timestamp(s).tzinfo else int(pd.Timestamp(s, tz="UTC").timestamp())

def fetch(token, start, end):
    pts = []
    a = start
    while a < end:
        b = min(a + CHUNK, end)
        r = requests.get(URL, params=dict(market=token, startTs=a, endTs=b, fidelity=60), timeout=60)
        if r.ok: pts += r.json().get("history", [])
        a = b; time.sleep(0.15)
    return pts

if __name__ == "__main__":
    for name in ["fed", "btc"]:
        sel = json.load(open(D / f"markets_{name}.json"))["selected"]
        rows = []
        for m in sel:
            tok = json.loads(m["clobTokenIds"])[0]
            start = ts(m["startDate"]) if m.get("startDate") else ts(m["endDate"]) - 120 * 86400
            end = min(ts(m["endDate"]) + 86400, int(time.time()))
            pts = fetch(tok, start, end)
            for p in pts: rows.append((m["id"], p["t"], p["p"]))
            print(name, m["id"], m["question"][:60], len(pts))
        df = pd.DataFrame(rows, columns=["market_id", "t", "p"]).drop_duplicates(["market_id", "t"]).sort_values(["market_id", "t"])
        df.to_csv(D / f"odds_{name}.csv.gz", index=False)
