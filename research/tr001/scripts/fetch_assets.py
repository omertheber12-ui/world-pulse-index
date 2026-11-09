"""Fetch public asset data with fixed dates: Bitcoin hourly (Binance), 2-year yield (FRED DGS2), KRE daily (Yahoo chart API)."""
import io, time, requests, pathlib
import pandas as pd
D = pathlib.Path(__file__).resolve().parent.parent / "data"
START, END = "2024-10-01", "2026-11-01"

def btc():
    s = int(pd.Timestamp(START, tz="UTC").timestamp() * 1000); e = int(pd.Timestamp(END, tz="UTC").timestamp() * 1000)
    rows = []
    while s < e:
        r = requests.get("https://api.binance.com/api/v3/klines", params=dict(symbol="BTCUSDT", interval="1h", startTime=s, limit=1000), timeout=60)
        r.raise_for_status(); b = r.json()
        if not b: break
        rows += b; s = b[-1][0] + 3600_000; time.sleep(0.1)
    df = pd.DataFrame(rows).iloc[:, [0, 4, 5]]; df.columns = ["open_ms", "close", "volume"]
    df["t"] = (df.open_ms // 1000 + 3600).astype(int)  # bar-close convention: stamp = end of hour
    df = df[df.open_ms < e][["t", "close", "volume"]].astype({"close": float, "volume": float})
    df.to_csv(D / "btc_hourly.csv.gz", index=False); print("btc rows", len(df))

def dgs2():
    r = requests.get("https://fred.stlouisfed.org/graph/fredgraph.csv", params=dict(id="DGS2", cosd=START, coed=END), timeout=60)
    df = pd.read_csv(io.StringIO(r.text)); df.columns = ["date", "dgs2"]
    df["dgs2"] = pd.to_numeric(df.dgs2, errors="coerce"); df = df.dropna()
    df.to_csv(D / "dgs2_daily.csv", index=False); print("dgs2 rows", len(df))

def kre():
    p1 = int(pd.Timestamp(START, tz="UTC").timestamp()); p2 = int(pd.Timestamp(END, tz="UTC").timestamp())
    r = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/KRE", params=dict(period1=p1, period2=p2, interval="1d"),
                     headers={"User-Agent": "Mozilla/5.0"}, timeout=60)
    j = r.json()["chart"]["result"][0]
    df = pd.DataFrame({"t": j["timestamp"], "close": j["indicators"]["adjclose"][0]["adjclose"], "volume": j["indicators"]["quote"][0]["volume"]})
    df["date"] = pd.to_datetime(df.t, unit="s").dt.tz_localize("UTC").dt.tz_convert("America/New_York").dt.date.astype(str)
    df[["date", "close", "volume"]].dropna().to_csv(D / "kre_daily.csv", index=False); print("kre rows", len(df))

if __name__ == "__main__":
    btc(); dgs2(); kre()
