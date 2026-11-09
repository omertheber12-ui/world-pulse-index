#!/usr/bin/env python3
"""World Pulse Index multi-page site build.

One command: python3 build_site.py
- reads live public Polymarket Gamma figures (no key, free)
- reuses the read-only eToro holdings snapshot (Development task 5, 16:44 read)
- writes site/assets/snapshot.js (built-in figures + rules + holdings)
- runs checks into site/checks.json and takes headless screenshots into site/shots/
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import build as B  # shared helpers from the single-page build

DIR = Path(__file__).resolve().parent
SITE = DIR / "site"
KEEP = ["id", "question", "groupItemTitle", "outcomes", "outcomePrices", "clobTokenIds",
        "oneDayPriceChange", "volumeNum", "closed", "slug"]


def trim_market(m):
    return {k: m.get(k) for k in KEEP}


def fetch_event_snapshot(spec, group_key):
    eid = spec["event_id"]
    status, ev = B.fetch_event(eid)
    markets = ev.get("markets") or []
    wanted = [str(x) for x in (spec.get("market_ids") or [])]
    by_id = {str(m.get("id")): m for m in markets}
    if wanted:
        use = []
        for mid in wanted:
            if mid in by_id:
                use.append(by_id[mid])
            else:
                try:
                    st, md = B.fetch_market(mid)
                    if st == 200:
                        use.append(md)
                except Exception:
                    pass
        if not use:
            use = markets
    else:
        use = markets
    if spec.get("top_n"):
        priced = [m for m in use if not m.get("closed") and B.parse_json_list(m.get("outcomePrices"))]
        priced.sort(key=lambda m: -float(B.parse_json_list(m.get("outcomePrices"))[0]))
        use = priced[: int(spec["top_n"])]
        wanted = [str(m.get("id")) for m in use]
    vol = float(ev.get("volume") or 0) or sum(float(m.get("volumeNum") or 0) for m in use)
    slug = ev.get("slug") or ""
    return status, {
        "event_id": eid,
        "group": group_key,
        "strength_key": spec["strength_key"],
        "title": ev.get("title") or spec.get("title_hint") or eid,
        "slug": slug,
        "polymarket_url": f"https://polymarket.com/event/{slug}" if slug else f"{B.GAMMA}/events/{eid}",
        "source_url": f"{B.GAMMA}/events/{eid}",
        "market_ids": wanted,
        "plain": spec.get("plain") or spec.get("title_hint"),
        "rate": spec.get("rate"),
        "outcomes_plain": spec.get("outcomes") or {},
        "outcome_template": spec.get("outcome_template"),
        "volume": vol,
        "markets": [trim_market(m) for m in use],
    }


def chrome(args, timeout=40):
    cmd = ["google-chrome", "--headless=new", "--no-sandbox", "--disable-gpu",
           "--hide-scrollbars", "--virtual-time-budget=4000"] + args
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def run_checks(snap, statuses):
    checks = {"run_at": B.fmt_time(B.now_jer()), "items": []}

    def add(name, ok, detail=""):
        checks["items"].append({"check": name, "pass": bool(ok), "detail": detail})

    add("Gamma HTTP 200 for all events", all(s == 200 for s in statuses.values()),
        ", ".join(f"{k}:{v}" for k, v in statuses.items()))
    groups = {}
    for e in snap["events"]:
        groups.setdefault(e["group"], []).append(e["event_id"])
    add("Each of four groups has at least one event",
        all(len(groups.get(g, [])) >= 1 for g in snap["group_order"]),
        json.dumps({g: len(v) for g, v in groups.items()}))
    ids = [e["event_id"] for e in snap["events"]]
    add("No duplicate events", len(ids) == len(set(ids)), f"{len(ids)} events")
    bad = []
    for e in snap["events"]:
        for m in e["markets"]:
            for p in B.parse_json_list(m.get("outcomePrices")):
                if not (0 <= float(p) * 100 <= 100):
                    bad.append(e["event_id"])
    add("All percentages between 0 and 100", not bad, ",".join(bad))

    pages = ["today.html", "events.html", "event.html", "portfolio.html", "how.html", "index.html"]
    doms = {}
    for p in pages:
        url = (SITE / p).as_uri() + ("?id=770450" if p == "event.html" else "")
        try:
            r = chrome(["--dump-dom", url])
            doms[p] = r.stdout
        except Exception as ex:
            doms[p] = ""
    for p in pages:
        if p == "index.html":
            continue
        d = doms[p]
        add(f"{p}: nav + time line + 'Insights only, not advice'",
            ('class="tab' in d) and ("ures at" in d) and ("Insights only, not advice" in d))
    import html as _h
    hm = re.search(r'<h1[^>]*>(.*?)</h1>', doms.get("today.html", ""), re.S)
    htxt = _h.unescape(re.sub(r"<[^>]+>", "", hm.group(1))).strip() if hm else ""
    checks["headline"] = htxt
    add("Today headline is 12 words or fewer", bool(htxt) and len(htxt.split()) <= 12, f"{len(htxt.split())} words: {htxt}")
    # every link between event and holding labeled Guess (rendered link rows)
    link_rows = 0
    unlabeled = 0
    for p, d in doms.items():
        for row in re.findall(r'<[^>]*class="[^"]*linkrow[^"]*"[^>]*>(.*?)</(?:li|tr|div)>', d, re.S):
            link_rows += 1
            if "Guess" not in row:
                unlabeled += 1
    add("Every event-to-holding link labeled Guess", link_rows > 0 and unlabeled == 0,
        f"{link_rows} link rows, {unlabeled} without Guess")
    advice = []
    for p, d in doms.items():
        text = re.sub(r"<script.*?</script>|<style.*?</style>|<[^>]+>", " ", d, flags=re.S)
        if re.search(r"\b(buy|sell|should (buy|sell|hold)|we recommend)\b", text, re.I):
            advice.append(p)
    add("No buy/sell advice wording on pages", not advice, ",".join(advice))
    secret_re = re.compile(r"((api[_-]?key|secret|password|passwd|auth[_-]?token)\s*[:=]\s*['\"]?\w{6,}|bearer\s+\w{10,}|ghp_\w{10,}|sk-[A-Za-z0-9]{10,})", re.I)
    hits = []
    for f in list(SITE.rglob("*.html")) + list(SITE.rglob("*.js")) + list(SITE.rglob("*.css")) + [DIR / "build_site.py"]:
        t = f.read_text(errors="ignore")
        if f.name == "build_site.py":
            continue
        if secret_re.search(t):
            hits.append(str(f.relative_to(DIR)))
    add("No secrets or keys in site files", not hits, ",".join(hits))
    missing = []
    for f in SITE.glob("*.html"):
        t = f.read_text()
        for href in re.findall(r'(?:href|src)="([^"#?]+)', t):
            if href.startswith("http") or href.startswith("mailto") or "'" in href:
                continue
            if not (f.parent / href).exists():
                missing.append(f"{f.name}->{href}")
    js = (SITE / "assets" / "data.js").read_text()
    for href in set(re.findall(r"['\"]([a-z]+\.html)", js)):
        if not (SITE / href).exists():
            missing.append(f"data.js->{href}")
    add("All internal links resolve to files", not missing, ",".join(missing))
    checks["all_pass"] = all(i["pass"] for i in checks["items"])
    return checks


def shots():
    out = []
    for page in ["today", "events", "portfolio"]:
        for w, h in [(390, 1400), (1280, 1100)]:
            path = SITE / "shots" / f"{page}-{w}.png"
            try:
                chrome([f"--screenshot={path}", f"--window-size={w},{h}", (SITE / f"{page}.html").as_uri()])
            except Exception:
                pass
            out.append({"file": str(path.relative_to(DIR)), "exists": path.exists()})
    return out


def main():
    rules = B.load_rules()
    holdings = B.load_holdings()
    receipt = B.now_jer()
    events, statuses = [], {}
    for gkey, specs in rules["events"].items():
        for spec in specs:
            try:
                st, rec = fetch_event_snapshot(spec, gkey)
            except Exception as ex:
                print("FAIL", spec["event_id"], ex)
                st, rec = 0, None
            statuses[spec["event_id"]] = st
            if rec:
                events.append(rec)
    snap = {
        "built_at": B.fmt_time(receipt),
        "built_iso": receipt.isoformat(),
        "built_ms": int(receipt.timestamp() * 1000),
        "group_order": ["central_bank_rates", "big_company_events", "worldwide_elections", "wars"],
        "group_short": {"central_bank_rates": "Central banks", "big_company_events": "Big company",
                        "worldwide_elections": "Elections", "wars": "Wars"},
        "holdings": {"fetched_at": holdings["fetched_at"], "time": "16:44", "source": holdings["source"],
                     "total": holdings["total"], "cash": holdings["cash"], "cash_weight": holdings["cash_weight"],
                     "rows": holdings["rows"]},
        "rules": {k: rules[k] for k in ["source", "holdings_sectors", "strength_levels", "group_strengths",
                                          "scoring", "group_display", "gaps", "rate_wording"]},
        "links": {"architecture": "https://docs.google.com/document/d/1LXe3vWDLnm02pKvsWNFDbCpzQO7ObTqLVF9YM4VKEzA/edit",
                  "product_rules": rules["source"]["doc_url"]},
        "events": events,
    }
    (SITE / "assets" / "snapshot.js").write_text(
        "// Built by build_site.py. Public Polymarket figures + read-only holdings snapshot. No keys.\n"
        "window.WPI_SNAPSHOT = " + json.dumps(snap, indent=1) + ";\n")
    print(f"snapshot.js written at {snap['built_at']} with {len(events)} events")
    if "--no-checks" in sys.argv:
        return 0
    checks = run_checks(snap, statuses)
    checks["screenshots"] = shots()
    (SITE / "checks.json").write_text(json.dumps(checks, indent=2))
    for i in checks["items"]:
        print(("PASS " if i["pass"] else "FAIL ") + i["check"] + ("  " + i["detail"] if i["detail"] and not i["pass"] else ""))
    print("all_pass", checks["all_pass"])
    return 0 if checks["all_pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
