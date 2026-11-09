"""TR-002 market selection by the pre-registered rule (Polymarket Gamma metadata only, no prices)."""
import json, re, time, pathlib, requests
D = pathlib.Path(__file__).resolve().parent.parent / "data"; D.mkdir(exist_ok=True)
G = "https://gamma-api.polymarket.com"
TAGS = ["elections", "world-elections", "global-elections", "politics", "tariffs", "economy", "fed-chair", "courts", "scotus"]
WIN = ("2024-06-01T00:00:00Z", "2026-10-31T23:59:59Z")

# Election country -> (primary asset, secondary list). Order matters (first match wins).
ELECTIONS = [
    (r"presidential election winner 2024", ("BTCUSDT", ["SPY_D", "MXN=X_D"])),
    (r"romania presidential election winner$", ("EURRON=X", [])),
    (r"next president of south korea", ("KRW=X", ["EWY"])),
    (r"^poland presidential election$", ("PLN=X", [])),
    (r"next prime minist(er|er) of canada|next prime minster of canada", ("CAD=X", [])),
    (r"hungary", ("HUF=X", [])),
    (r"^chile presidential election$", ("CLP=X", [])),
    (r"^peru presidential election winner$", ("PEN=X", [])),
    (r"^colombia presidential election$", ("COP=X", [])),
    (r"^brazil presidential election$", ("BRL=X", [])),
    (r"israel", ("ILS=X", [])),
    (r"czech", ("CZK=X", [])),
    (r"argentina", ("ARS=X", ["ARGT"])),
    (r"japan", ("JPY=X", [])),
    (r"thailand|thai ", ("THB=X", [])),
    (r"australia", ("AUD=X", [])),
    (r"norway", ("NOK=X", [])),
    (r"denmark", ("DKK=X", [])),
    (r"serbia", ("RSD=X", [])),
]
ELEC_EXCLUDE = re.compile(r"margin|turnout|2nd place|3rd place|% of vote|over 50|seats|mayor|governor|senate|house|state|nominee|nomination|primary|by-election|tipping|popular vote|college|closest|drop out|out as president|1st round|first round|advance|vp|who will win (pennsylvania|michigan|georgia|nevada|arizona|wisconsin|north carolina)|ethiopia|vietnam|russia|honduras|belarus|bolivia|venezuela|tunisia|tamil|bengal|seoul|bucharest|ireland|portugal|germany|netherlands|dutch|chancellor|croatia", re.I)
ELEC_INCLUDE = re.compile(r"election|next (prime minist|president)|prime minster", re.I)

def policy_asset(t):
    t = t.lower()
    if "fed chair" in t or "powell" in t: return ("ZT=F", ["DX-Y.NYB"])
    if "shutdown" in t: return ("SPY", ["ZN=F"])
    if "china" in t and ("tariff" in t or "trade deal" in t): return ("FXI", ["CNH=X"])
    return ("SPY", ["XRT"])

def court_asset(q):
    if re.search(r"tariff", q, re.I): return ("XRT", ["SPY"])
    if re.search(r"tiktok", q, re.I): return ("META", ["SPY"])
    return None

def events():
    seen = {}
    for tag in TAGS:
        for closed in ("true", "false"):
            off = 0
            while True:
                r = requests.get(G + "/events", params=dict(tag_slug=tag, limit=100, offset=off, closed=closed, order="volume", ascending="false", volume_min=300000,
                                 end_date_min=WIN[0], end_date_max=WIN[1]), timeout=60)
                if r.status_code == 422: break  # offset limit reached
                r.raise_for_status(); b = r.json()
                for e in b:
                    seen.setdefault(e["id"], dict(e, _tags=set()))["_tags"].add(tag)
                if len(b) < 100 or float(b[-1].get("volume") or 0) < 3e5: break
                off += 100; time.sleep(0.2)
    return list(seen.values())

def top_market(e):
    ms = [m for m in e.get("markets", []) if m.get("clobTokenIds")]
    if not ms: return None
    return max(ms, key=lambda m: float(m.get("volumeNum") or m.get("volume") or 0))

if __name__ == "__main__":
    evs = events(); sel, log = [], []
    for e in evs:
        title, vol, tags = e.get("title", ""), float(e.get("volume") or 0), e["_tags"]
        etype = asset = None
        if ELEC_INCLUDE.search(title) and not ELEC_EXCLUDE.search(title) and vol >= 20e6 and tags & {"elections", "world-elections", "global-elections", "politics"}:
            for pat, a in ELECTIONS:
                if re.search(pat, title, re.I): etype, asset = "E", a; break
            if etype is None: log.append(("E-nopair", title, vol)); continue
        elif re.search(r"tariff|shutdown|fed chair|trade deal", title, re.I) and vol >= 5e6 and not (tags & {"courts", "scotus"}):
            etype, asset = "P", policy_asset(title)
        elif tags & {"courts", "scotus"} and vol >= 3e5:
            a = court_asset(title)
            if a and re.search(r"court|scotus|rule|ruling", title, re.I): etype, asset = "C", a
        if not etype: continue
        mins = 2.5e5 if etype == "C" else 1e6
        ms = [m for m in e.get("markets", []) if m.get("clobTokenIds") and float(m.get("volumeNum") or m.get("volume") or 0) >= mins]
        if not ms: log.append((etype + "-lowvol", title, vol)); continue
        for m in ms:
            mv = float(m.get("volumeNum") or m.get("volume") or 0)
            sel.append(dict(type=etype, event_id=e["id"], event_title=title, event_volume=vol, market_id=m["id"], question=m["question"],
                        market_volume=mv, startDate=m.get("startDate") or e.get("startDate"), endDate=m.get("endDate") or e.get("endDate"),
                        closedTime=m.get("closedTime"), closed=m.get("closed"), outcomePrices=m.get("outcomePrices"), clobTokenIds=m["clobTokenIds"],
                        primary=asset[0], secondary=asset[1], description=(m.get("description") or "")[:600]))
    # Deviation 1: one event per election (keep the highest-volume event per election pairing)
    best = {}
    for s_ in sel:
        if s_["type"] == "E":
            k = s_["primary"]; best[k] = max(best.get(k, 0), s_["event_volume"])
    dropped = {s_["event_title"] for s_ in sel if s_["type"] == "E" and s_["event_volume"] < best[s_["primary"]]}
    log += [("E-duplicate-election", t, 0) for t in dropped]
    sel = [s_ for s_ in sel if not (s_["type"] == "E" and s_["event_title"] in dropped)]
    sel.sort(key=lambda s: (s["type"], s["endDate"] or ""))
    json.dump(dict(rule="PREREGISTRATION.md section 4-5", selected=sel, excluded_log=log), open(D / "markets.json", "w"), indent=1)
    for s in sel: print(s["type"], (s["endDate"] or "")[:10], (s["closedTime"] or "")[:10], int(s["market_volume"]), s["primary"], "|", s["event_title"][:50], "|", s["question"][:60])
    print("excluded:", log)
