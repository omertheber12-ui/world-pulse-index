"""Signals 1 (size vs market) and 3 (one-sidedness) of the pre-registered screen, using only trades up to time t."""
import json, bisect, pathlib
import numpy as np, pandas as pd
D = pathlib.Path(__file__).resolve().parent.parent / "data"

def load():
    t = pd.read_csv(D / "trades.csv.gz"); t["market_id"] = t.market_id.astype(str)
    cov = pd.read_csv(D / "fetch_coverage.csv"); cov["market_id"] = cov.market_id.astype(str)
    t = t.merge(cov[["market_id", "w0", "w1"]], on="market_id")
    t["cash"] = t["size"] * t.price
    t["p_yes"] = np.where(t.outcome_index == 0, t.price, 1 - t.price)
    # direction of the bet on the Yes price: buy Yes or sell No = +1; buy No or sell Yes = -1
    t["dir"] = np.where((t.outcome_index == 0) == (t.side == "BUY"), 1, -1)
    return t.sort_values(["market_id", "t"]).reset_index(drop=True)

def s1_s3(t):
    out = []
    for mid, g in t.groupby("market_id", sort=False):
        g = g.copy(); prev = []; q99 = np.full(len(g), np.nan); cnt = np.zeros(len(g), int)
        for i, c in enumerate(g.cash.values):
            if len(prev) >= 200: q99[i] = prev[int(np.ceil(0.99 * len(prev))) - 1]
            cnt[i] = len(prev); bisect.insort(prev, c)
        g["q99_before"] = q99; g["n_before"] = cnt
        g["s1"] = (g.cash >= 1000) & (g.cash >= g.q99_before)
        buy = g.side == "BUY"
        g["buy_yes_cash"] = np.where(buy & (g.dir == 1), g.cash, 0.0); g["buy_no_cash"] = np.where(buy & (g.dir == -1), g.cash, 0.0)
        cy = g.groupby("wallet_hash").buy_yes_cash.cumsum(); cn = g.groupby("wallet_hash").buy_no_cash.cumsum()
        same = np.where(g.dir == 1, cy, cn); g["one_sided_share"] = same / (cy + cn).replace(0, np.nan)
        g["s3"] = g.one_sided_share >= 0.9
        out.append(g)
    return pd.concat(out)

if __name__ == "__main__":
    t = s1_s3(load())
    cand = t[(t.side == "BUY") & (t.t >= t.w0) & (t.t <= t.w1) & t.p_yes.between(0.05, 0.95) & t.s1 & t.s3]
    cand[["market_id", "wallet_hash", "t", "cash", "dir", "p_yes"]].to_csv(D / "candidates_s1_s3.csv", index=False)
    print("window buys", int(((t.side == "BUY") & (t.t >= t.w0)).sum()), "candidates", len(cand), "unique wallet-times", cand[["wallet_hash", "t"]].drop_duplicates().shape[0],
          "unique wallets", cand.wallet_hash.nunique())
