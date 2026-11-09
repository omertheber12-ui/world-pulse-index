"""Fetch public asset prices: Yahoo chart API (60m for last ~729 days, 1d since 2024-01-01) and Binance BTCUSDT hourly."""
import time, pathlib, requests
import pandas as pd
D = pathlib.Path(__file__).resolve().parent.parent / "data"
HOURLY = ["CAD=X","PLN=X","KRW=X","CZK=X","CLP=X","EURRON=X","HUF=X","PEN=X","COP=X","BRL=X","ILS=X","SPY","FXI","ZT=F","XRT","META","EWY","DX-Y.NYB","ZN=F","CNH=X"]
DAILY = HOURLY + ["MXN=X"]
FETCHED_AT = "2026-11-10"
H = {"User-Agent": "Mozilla/5.0"}

def yahoo(sym, interval, p1, p2):
    r = requests.get(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}", params=dict(period1=p1, period2=p2, interval=interval), headers=H, timeout=60)
    j = r.json()["chart"]
    if not j["result"]: print(sym, interval, j["error"]); return None
    j = j["result"][0]; q = j["indicators"]["quote"][0]
    return pd.DataFrame({"t_open": j["timestamp"], "close": q["close"], "volume": q.get("volume")}).dropna(subset=["close"])

if __name__ == "__main__":
    now = int(pd.Timestamp(FETCHED_AT, tz="UTC").timestamp()) + 86400
    out = []
    for s in HOURLY:
        df = yahoo(s, "60m", now - 729 * 86400, now)
        if df is not None: df["sym"] = s; out.append(df); print(s, "60m", len(df))
        time.sleep(0.3)
    pd.concat(out).to_csv(D / "assets_hourly.csv.gz", index=False)
    out = []
    for s in DAILY:
        df = yahoo(s, "1d", int(pd.Timestamp("2024-01-01", tz="UTC").timestamp()), now)
        if df is not None: df["sym"] = s; out.append(df); print(s, "1d", len(df))
        time.sleep(0.3)
    pd.concat(out).to_csv(D / "assets_daily.csv.gz", index=False)
    # Bitcoin hourly for the US 2024 election window (bar-close stamps)
    s = int(pd.Timestamp("2024-05-01", tz="UTC").timestamp() * 1000); e = int(pd.Timestamp("2024-11-09", tz="UTC").timestamp() * 1000); rows = []
    while s < e:
        r = requests.get("https://api.binance.com/api/v3/klines", params=dict(symbol="BTCUSDT", interval="1h", startTime=s, limit=1000), timeout=60)
        r.raise_for_status(); b = r.json()
        if not b: break
        rows += b; s = b[-1][0] + 3600_000; time.sleep(0.1)
    df = pd.DataFrame(rows).iloc[:, [0, 4, 5]]; df.columns = ["open_ms", "close", "volume"]
    df = df[df.open_ms < e]; df["t"] = (df.open_ms // 1000 + 3600).astype(int)
    df[["t", "close", "volume"]].astype({"close": float, "volume": float}).to_csv(D / "btc_hourly.csv.gz", index=False); print("btc", len(df))
