"""Hourly odds (Yes token) from Polymarket CLOB prices-history for the selected markets."""
import json, time, requests, pathlib
import pandas as pd
D = pathlib.Path(__file__).resolve().parent.parent / "data"
def ts(s):
    x = pd.Timestamp(s); x = x.tz_convert("UTC") if x.tzinfo else x.tz_localize("UTC"); return int(x.timestamp())
if __name__ == "__main__":
    sel = json.load(open(D / "markets.json"))["selected"]; rows = []
    for m in sel:
        a, end = ts(m["listed"]), min(ts(m["endDate"]) + 3600, int(time.time()))
        n = 0
        while a < end:
            b = min(a + 14 * 86400, end)
            r = requests.get("https://clob.polymarket.com/prices-history", params=dict(market=m["token"], startTs=a, endTs=b, fidelity=60), timeout=60)
            if r.ok:
                for p in r.json().get("history", []): rows.append((m["id"], p["t"], p["p"])); n += 1
            a = b; time.sleep(0.12)
        print(m["id"], n)
    pd.DataFrame(rows, columns=["market_id", "t", "p"]).drop_duplicates(["market_id", "t"]).to_csv(D / "odds.csv.gz", index=False)
