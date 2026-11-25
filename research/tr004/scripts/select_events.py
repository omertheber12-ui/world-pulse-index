"""TR-004 event list by the pre-registered rule (Polymarket Gamma metadata only)."""
import json, re, time, pathlib, requests
D = pathlib.Path(__file__).resolve().parent.parent / "data"; D.mkdir(exist_ok=True)
G = "https://gamma-api.polymarket.com/events"
WIN = ("2025-01-01T00:00:00Z", "2026-10-31T23:59:59Z")
ELEC = re.compile(r"election|next (president|prime minist)|prime minster", re.I)
ELEC_X = re.compile(r"margin|turnout|% of|vote share|seats|2nd place|3rd place|mayor|governor|senate|house|state|primary|nominee|nomination|by-election|1st round|first round|advance|over 50|popular vote|drop out|out as|coalition", re.I)
COURT = re.compile(r"court|scotus|ruling|rule on|verdict|guilty|convicted|sentenced", re.I)
STRIKE = re.compile(r"\bstrikes?\b|ceasefire|\bdeal\b|agreement|capture|invade|invasion", re.I)
SHUT = re.compile(r"shutdown", re.I)

def classify(t, v):
    if re.search(r"counter-strike|\(bo\d\)|esports", t, re.I): return None  # D1: esports matches are not strike news
    if SHUT.search(t) and v >= 1e6: return "shutdown"
    if COURT.search(t) and v >= 3e5: return "court"
    if ELEC.search(t) and not ELEC_X.search(t) and v >= 5e6: return "election"
    if STRIKE.search(t) and v >= 5e6: return "strike_deal"
    return None

def pull():
    out, off = {}, 0
    while True:
        r = requests.get(G, params=dict(closed="true", limit=100, offset=off, order="volume", ascending="false", volume_min=300000,
                                        end_date_min=WIN[0], end_date_max=WIN[1]), timeout=60)
        if r.status_code == 422: break
        r.raise_for_status(); b = r.json()
        for e in b: out[e["id"]] = e
        if len(b) < 100: break
        off += 100; time.sleep(0.2)
    # D1: the volume-sorted listing hits the paging cap before small events; also pull the court tags explicitly
    for tag in ("courts", "scotus"):
        for off in range(0, 500, 100):
            r = requests.get(G, params=dict(tag_slug=tag, closed="true", limit=100, offset=off, volume_min=300000,
                                            end_date_min=WIN[0], end_date_max=WIN[1]), timeout=60)
            if not r.ok: break
            b = r.json()
            for e in b: out[e["id"]] = e
            if len(b) < 100: break
    return list(out.values())

if __name__ == "__main__":
    evs = pull(); sel = []
    for e in evs:
        typ = classify(e.get("title", ""), float(e.get("volume") or 0))
        if not typ: continue
        ms = sorted([m for m in e.get("markets", []) if m.get("conditionId") and float(m.get("volumeNum") or 0) >= 2.5e5],
                    key=lambda m: -float(m.get("volumeNum") or 0))[:2]
        if not ms: continue
        sel.append(dict(type=typ, event_id=e["id"], title=e["title"], event_volume=float(e.get("volume") or 0),
                        markets=[dict(market_id=m["id"], conditionId=m["conditionId"], question=m["question"], volume=float(m.get("volumeNum") or 0),
                                      endDate=m.get("endDate"), closedTime=m.get("closedTime"), clobTokenIds=m.get("clobTokenIds"),
                                      outcomes=m.get("outcomes")) for m in ms]))
    sel.sort(key=lambda s: -s["event_volume"]); n_all = len(sel)
    # D1: keep every court and shutdown event (small types), then fill to 80 with the highest-volume remaining events
    small = [s for s in sel if s["type"] in ("court", "shutdown")]; rest = [s for s in sel if s["type"] not in ("court", "shutdown")]
    sel = sorted(small + rest[:max(0, 80 - len(small))], key=lambda s: -s["event_volume"])
    json.dump(dict(rule="PREREGISTRATION.md section 2", qualifying=n_all, selected=sel), open(D / "events.json", "w"), indent=1)
    from collections import Counter
    print("qualifying", n_all, "kept", len(sel), Counter(s["type"] for s in sel))
    for s in sel: print(s["type"], int(s["event_volume"] / 1e6), (s["markets"][0]["closedTime"] or "")[:16], s["title"][:70])
