"""Signal 2 inputs: for each candidate (hashed wallet, time t), the wallet's most recent 1,000 taker trades strictly
before t from the public Data API v2 (user + end filter). Only the count and median cash of those earlier trades are
saved, keyed by the hashed id. The address lookup uses the private map outside the repository."""
import time, pathlib, requests
import numpy as np, pandas as pd
from concurrent.futures import ThreadPoolExecutor
D = pathlib.Path(__file__).resolve().parent.parent / "data"; P = pathlib.Path("/workspace/.tr004_private")
URL = "https://data-api.polymarket.com/v2/trades"

def one(args):
    wh, addr, t = args; s = requests.Session()
    for i in range(5):
        try:
            r = s.get(URL, params=dict(user=addr, start=1, end=int(t) - 1, limit=1000), timeout=60)
            if r.status_code == 429: time.sleep(float(r.headers.get("Retry-After", 2))); continue
            if r.ok:
                d = [x for x in (r.json().get("data") or []) if int(x["timestamp"]) < t]
                cash = [float(x["size"]) * float(x["price"]) for x in d]
                return (wh, int(t), len(cash), float(np.median(cash)) if cash else np.nan, True)
        except Exception: pass
        time.sleep(1 + 2 * i)
    return (wh, int(t), np.nan, np.nan, False)

if __name__ == "__main__":
    c = pd.read_csv(D / "candidates_s1_s3.csv")[["wallet_hash", "t"]].drop_duplicates()
    mp = pd.read_csv(P / "wallet_map.csv").drop_duplicates("wallet_hash").set_index("wallet_hash").addr
    jobs = [(w, mp[w], t) for w, t in c.itertuples(index=False)]
    with ThreadPoolExecutor(6) as ex: res = list(ex.map(one, jobs))
    pd.DataFrame(res, columns=["wallet_hash", "t", "n_prior", "median_prior_cash", "ok"]).to_csv(D / "wallet_history.csv.gz", index=False)
    print("done", len(res), "ok", sum(r[4] for r in res))
