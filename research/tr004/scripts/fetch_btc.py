"""Bitcoin 1-minute bars (Binance BTCUSDT, public) covering every decision window; stamped at bar close (open + 60 s)."""
import json, time, pathlib, requests
import pandas as pd
D = pathlib.Path(__file__).resolve().parent.parent / "data"

def ts(s): t = pd.Timestamp(str(s).replace(" ", "T")); t = t.tz_convert("UTC") if t.tzinfo else t.tz_localize("UTC"); return int(t.timestamp())

if __name__ == "__main__":
    ev = json.load(open(D / "events.json"))["selected"]; spans = set()
    for e in ev:
        for m in e["markets"]:
            end = ts(m["closedTime"]) if m.get("closedTime") else ts(m["endDate"])
            spans.add((end - 73 * 3600, end + 2 * 3600))
    rows = []
    for a, b in sorted(spans):
        s = a * 1000
        while s < b * 1000:
            r = requests.get("https://api.binance.com/api/v3/klines", params=dict(symbol="BTCUSDT", interval="1m", startTime=s, limit=1000), timeout=60)
            r.raise_for_status(); k = r.json()
            if not k: break
            rows += [(x[0] // 1000 + 60, float(x[4])) for x in k]; s = k[-1][0] + 60_000; time.sleep(0.05)
    df = pd.DataFrame(rows, columns=["t", "close"]).drop_duplicates("t").sort_values("t")
    df.to_csv(D / "btc_1m.csv.gz", index=False); print("btc minutes", len(df))
