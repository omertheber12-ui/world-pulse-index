"""Bitcoin hourly close (Binance BTCUSDT) and Deribit public volatility index (DVOL), fixed dates."""
import time, requests, pathlib
import pandas as pd
D = pathlib.Path(__file__).resolve().parent.parent / "data"
START, END = "2024-11-01", "2026-11-01"
s0 = int(pd.Timestamp(START, tz="UTC").timestamp() * 1000); e0 = int(pd.Timestamp(END, tz="UTC").timestamp() * 1000)

def btc():
    s, rows = s0, []
    while s < e0:
        b = requests.get("https://api.binance.com/api/v3/klines", params=dict(symbol="BTCUSDT", interval="1h", startTime=s, limit=1000), timeout=60).json()
        if not b: break
        rows += b; s = b[-1][0] + 3600_000; time.sleep(0.1)
    df = pd.DataFrame(rows).iloc[:, [0, 4]]; df.columns = ["open_ms", "close"]
    df = df[df.open_ms < e0]; df["t"] = (df.open_ms // 1000 + 3600).astype(int)  # stamp = end of hour
    df[["t", "close"]].astype({"close": float}).to_csv(D / "btc_hourly.csv.gz", index=False); print("btc", len(df))

def dvol():
    rows, end = [], e0
    while end > s0:
        r = requests.get("https://www.deribit.com/api/v2/public/get_volatility_index_data",
                         params=dict(currency="BTC", start_timestamp=s0, end_timestamp=end, resolution=3600), timeout=60).json()["result"]
        d = r["data"]
        if not d: break
        rows += d; nxt = r.get("continuation")
        if not nxt or nxt >= end: break
        end = nxt; time.sleep(0.2)
    df = pd.DataFrame(rows, columns=["ms", "open", "high", "low", "close"]).drop_duplicates("ms").sort_values("ms")
    df["t"] = (df.ms // 1000 + 3600).astype(int)  # treat candle close as known at end of hour
    df[["t", "close"]].rename(columns={"close": "dvol"}).to_csv(D / "dvol_hourly.csv.gz", index=False); print("dvol", len(df))

if __name__ == "__main__":
    btc(); dvol()
