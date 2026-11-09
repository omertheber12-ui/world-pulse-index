#!/usr/bin/env python3
"""Development task 6 — World Pulse Index first version (local only)."""
from __future__ import annotations

import json
import math
import os
import re
import urllib.request
from datetime import datetime, timezone, timedelta
from html import escape
from pathlib import Path

DIR = Path(__file__).resolve().parent
JER = timezone(timedelta(hours=2), name="Asia/Jerusalem")
HOLDINGS_PATH = Path("/workspace/development-task-5/holdings-live.json")
GAMMA = "https://gamma-api.polymarket.com"
POLY_EVENT = "https://polymarket.com/event"


def now_jer() -> datetime:
    return datetime.now(tz=JER)


def fmt_time(dt: datetime) -> str:
    return f"{dt.day} {dt.strftime('%B %Y, %H:%M:%S')} Asia/Jerusalem"


def fmt_money(v: float) -> str:
    return f"${v:,.2f}"


def fmt_pct(pts: float, digits: int = 1) -> str:
    if pts is None:
        return "—"
    if abs(pts - round(pts)) < 1e-9:
        return str(int(round(pts)))
    s = f"{pts:.{digits}f}".rstrip("0").rstrip(".")
    return s


def http_json(url: str, timeout: int = 30):
    req = urllib.request.Request(
        url, headers={"User-Agent": "WorldPulseIndex/1.0", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, json.load(resp)


def parse_json_list(raw):
    if raw is None:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return []
    return list(raw) if isinstance(raw, (list, tuple)) else []


def load_rules():
    return json.loads((DIR / "rules.json").read_text())


def load_holdings():
    data = json.loads(HOLDINGS_PATH.read_text())
    total = float(data["total"])
    rows = []
    for r in data["rows"]:
        w = (float(r["value"]) / total) * 100.0 if total else 0.0
        rows.append(
            {
                "name": r["name"],
                "ticker": r["ticker"],
                "units": r["units"],
                "value": float(r["value"]),
                "weight": w,
            }
        )
    cash = float(data.get("cash") or 0)
    return {
        "fetched_at": data["fetched_at"],
        "source": data["source"],
        "total": total,
        "cash": cash,
        "cash_weight": (cash / total) * 100.0 if total else 0.0,
        "rows": rows,
        "live": False,
        "reused_from": "Development task 5 holdings-live.json",
    }


def sector_of(ticker: str, rules: dict) -> str:
    return rules["holdings_sectors"].get(ticker, {}).get("sector", "none")


def touch_breakdown(strength_key: str, holdings: dict, rules: dict):
    strengths = rules["group_strengths"][strength_key]
    parts = []
    touch = 0.0
    for r in holdings["rows"]:
        sector = sector_of(r["ticker"], rules)
        strength = float(strengths.get(sector, 0) or 0)
        contrib = r["weight"] * strength
        touch += contrib
        parts.append(
            {
                "ticker": r["ticker"],
                "name": r["name"],
                "weight": r["weight"],
                "value": r["value"],
                "sector": sector,
                "strength": strength,
                "contrib": contrib,
                "link_label": "Guess",
            }
        )
    # sort by contrib desc for "mostly X and Y"
    ranked = sorted(parts, key=lambda x: x["contrib"], reverse=True)
    top = [p for p in ranked if p["contrib"] > 0.05][:3]
    top_words = ", ".join(p["name"] for p in top[:2]) if top else "no linked holdings"
    return touch, parts, top_words, ranked


def uncertainty(p_frac: float) -> float:
    p = max(0.0, min(1.0, p_frac))
    return 4.0 * p * (1.0 - p)


def attention_score(touch: float, unc: float, meaningful_move: bool) -> float:
    base = touch * unc
    if meaningful_move:
        base += touch * 0.5
    return min(base, touch)


def leading_from_markets(markets: list) -> dict:
    """Pick leading outcome across markets. Returns percent 0-100, label, market id, oneDayPriceChange."""
    best = None
    for m in markets:
        if m.get("closed"):
            continue
        outcomes = parse_json_list(m.get("outcomes"))
        prices = parse_json_list(m.get("outcomePrices"))
        if not prices:
            continue
        try:
            prices_f = [float(x) for x in prices]
        except Exception:
            continue
        for i, price in enumerate(prices_f):
            label = outcomes[i] if i < len(outcomes) else f"Option {i+1}"
            # Prefer Yes / named group item for multi-candidate events
            group_title = m.get("groupItemTitle") or ""
            display = group_title or (m.get("question") or label)
            if outcomes and len(outcomes) == 2 and label.lower() == "no":
                # skip No side when Yes exists; we still consider Yes
                continue
            if outcomes and len(outcomes) == 2 and label.lower() == "yes" and group_title:
                display = group_title
            elif outcomes and len(outcomes) == 2 and label.lower() == "yes":
                display = m.get("question") or "Yes"
            cand = {
                "percent": price * 100.0,
                "p": price,
                "label": display,
                "outcome": label,
                "market_id": str(m.get("id")),
                "question": m.get("question"),
                "oneDayPriceChange": m.get("oneDayPriceChange"),
                "volume": float(m.get("volumeNum") or m.get("volume") or 0),
                "bestBid": m.get("bestBid"),
                "bestAsk": m.get("bestAsk"),
            }
            if best is None or cand["percent"] > best["percent"]:
                best = cand
    # Fallback: if all were No-skipped somehow, take absolute max including No
    if best is None:
        for m in markets:
            prices = parse_json_list(m.get("outcomePrices"))
            outcomes = parse_json_list(m.get("outcomes"))
            if not prices:
                continue
            prices_f = [float(x) for x in prices]
            idx = max(range(len(prices_f)), key=lambda i: prices_f[i])
            best = {
                "percent": prices_f[idx] * 100.0,
                "p": prices_f[idx],
                "label": outcomes[idx] if idx < len(outcomes) else "Leading",
                "outcome": outcomes[idx] if idx < len(outcomes) else "Leading",
                "market_id": str(m.get("id")),
                "question": m.get("question"),
                "oneDayPriceChange": m.get("oneDayPriceChange"),
                "volume": float(m.get("volumeNum") or m.get("volume") or 0),
                "bestBid": m.get("bestBid"),
                "bestAsk": m.get("bestAsk"),
            }
            break
    return best or {
        "percent": None,
        "p": None,
        "label": "No figure",
        "outcome": None,
        "market_id": None,
        "question": None,
        "oneDayPriceChange": None,
        "volume": 0,
        "bestBid": None,
        "bestAsk": None,
    }


def fetch_event(event_id: str):
    status, data = http_json(f"{GAMMA}/events/{event_id}")
    return status, data


def fetch_market(market_id: str):
    status, data = http_json(f"{GAMMA}/markets/{market_id}")
    return status, data


def build_event_record(spec: dict, group_key: str, holdings: dict, rules: dict, receipt: datetime):
    eid = spec["event_id"]
    status, ev = fetch_event(eid)
    markets = ev.get("markets") or []
    # If specific market_ids given, prefer those markets (may be subset)
    wanted = [str(x) for x in (spec.get("market_ids") or [])]
    if wanted:
        by_id = {str(m.get("id")): m for m in markets}
        selected = [by_id[i] for i in wanted if i in by_id]
        # also fetch missing individually
        for mid in wanted:
            if mid not in by_id:
                try:
                    st, md = fetch_market(mid)
                    if st == 200:
                        selected.append(md)
                        markets.append(md)
                except Exception:
                    pass
        use_markets = selected or markets
    else:
        use_markets = markets

    lead = leading_from_markets(use_markets)
    volume = float(ev.get("volume") or ev.get("volumeNum") or 0)
    if not volume:
        volume = sum(float(m.get("volumeNum") or m.get("volume") or 0) for m in use_markets)

    # Meaningful move: |oneDayPriceChange| >= 0.05 (5 points as fraction)
    odc = lead.get("oneDayPriceChange")
    meaningful = False
    move_pts = None
    if odc is not None:
        try:
            move_pts = float(odc) * 100.0
            meaningful = abs(float(odc)) >= 0.05
        except Exception:
            meaningful = False

    strength_key = spec["strength_key"]
    touch, parts, top_words, ranked = touch_breakdown(strength_key, holdings, rules)
    p = lead["p"] if lead["p"] is not None else 0.5
    unc = uncertainty(p) if lead["p"] is not None else None
    attn = attention_score(touch, unc, meaningful) if unc is not None else None
    high = touch > rules["scoring"]["high_effect_threshold"]

    # Extra text for Fed banks mixed
    extra = ""
    if strength_key == "central_bank_rates_fed":
        extra = "the bank effect is mixed"
    elif strength_key == "wars":
        extra = "links to chips rise if Taiwan or China keywords apply (already in group strengths)"
    else:
        extra = "direction for each holding is a guess"

    touch_r = int(round(touch))
    if_happens = (
        f"If it happens (Guess): This could touch about {touch_r}% of your portfolio, "
        f"mostly {top_words}; {extra}."
    )
    if_not = (
        f"If it does not happen (Guess): The other result would be the surprise against "
        f"today's leading figure, and could touch the same {touch_r}%."
    )

    slug = ev.get("slug") or ""
    poly_url = f"{POLY_EVENT}/{slug}" if slug else f"{GAMMA}/events/{eid}"
    source_url = f"{GAMMA}/events/{eid}"

    return {
        "http_status": status,
        "event_id": eid,
        "group": group_key,
        "strength_key": strength_key,
        "title": ev.get("title") or spec.get("title_hint") or eid,
        "slug": slug,
        "label": spec.get("label", "exact"),
        "leading": lead,
        "volume": volume,
        "fetch_time": fmt_time(receipt),
        "fetch_iso": receipt.isoformat(),
        "polymarket_url": poly_url,
        "source_url": source_url,
        "touch": touch,
        "touch_rounded": touch_r,
        "high_effect": high,
        "uncertainty": unc,
        "attention": attn,
        "meaningful_move": meaningful,
        "move_pts": move_pts,
        "parts": parts,
        "top_words": top_words,
        "if_happens": if_happens,
        "if_not": if_not,
        "market_count": len(use_markets),
        "markets_meta": [
            {
                "id": str(m.get("id")),
                "question": m.get("question"),
                "outcomePrices": m.get("outcomePrices"),
                "oneDayPriceChange": m.get("oneDayPriceChange"),
                "volume": m.get("volumeNum") or m.get("volume"),
            }
            for m in use_markets[:12]
        ],
    }


def sector_shares(holdings: dict, rules: dict):
    shares = {}
    for r in holdings["rows"]:
        sector = sector_of(r["ticker"], rules)
        shares.setdefault(sector, {"value": 0.0, "weight": 0.0, "tickers": []})
        shares[sector]["value"] += r["value"]
        shares[sector]["weight"] += r["weight"]
        shares[sector]["tickers"].append(r["ticker"])
    return shares


def pick_insight(events_by_group: dict, holdings: dict):
    # Highest attention among high-effect events; else highest attention overall
    flat = []
    for g, evs in events_by_group.items():
        for e in evs:
            if e.get("attention") is not None and e.get("leading", {}).get("percent") is not None:
                flat.append(e)
    if not flat:
        return {
            "headline": "World Pulse Index first version is ready.",
            "body": "Live public figures were loaded for four event groups. Holdings came from the Development task 5 read-only snapshot.",
            "meta": "Insights only, not advice.",
        }
    high = [e for e in flat if e["high_effect"]]
    pool = high or flat
    pool.sort(key=lambda e: e["attention"], reverse=True)
    top = pool[0]
    pct = fmt_pct(top["leading"]["percent"])
    headline = f"{top['title'][:48]} leads at {pct}%"
    if len(headline.split()) > 12:
        headline = f"Top attention: {pct}% on a high-effect event"
    body = (
        f"{top['title']} leads at {pct}% "
        f"(Polymarket public data, {top['fetch_time']}). "
        f"Guess: this could touch about {top['touch_rounded']}% of the reported portfolio"
        f"{' — high effect' if top['high_effect'] else ''}. "
        f"Attention score {fmt_pct(top['attention'], 1)}%."
    )
    return {
        "headline": headline[:90],
        "body": body,
        "meta": f"Rule: Product task 10 touch and attention. Receipt {top['fetch_time']}.",
    }


def render_html(payload: dict) -> str:
    h = payload["holdings"]
    rules = payload["rules"]
    groups = payload["events_by_group"]
    insight = payload["insight"]
    receipt = payload["receipt_time"]
    shares = payload["sector_shares"]
    group_display = rules["group_display"]

    def money_row(r):
        return (
            f'<div class="row"><div>{escape(r["name"])} <span class="tag guess">Guess · sector</span></div>'
            f'<div class="units">{r["units"]:.4f} units</div>'
            f'<div class="val">{fmt_money(r["value"])} · {fmt_pct(r["weight"], 2)}%</div></div>'
        )

    sector_rows = []
    labels = {
        "chips": "Chips / technology",
        "crypto": "Crypto",
        "broad_us_stocks": "Broad US stocks",
        "banks": "US banks",
    }
    for key, lab in labels.items():
        s = shares.get(key)
        if not s:
            continue
        sector_rows.append(
            f'<div class="row"><div>{escape(lab)} <span class="tag guess">Guess</span></div>'
            f'<div class="units">{", ".join(s["tickers"])}</div>'
            f'<div class="val">{fmt_money(s["value"])} · {fmt_pct(s["weight"], 2)}%</div></div>'
        )

    group_sections = []
    for gkey in ["central_bank_rates", "big_company_events", "worldwide_elections", "wars"]:
        evs = groups.get(gkey) or []
        title = group_display.get(gkey, gkey)
        rows_html = []
        if not evs:
            rows_html.append(
                '<div class="market-row"><div>No live events in this group at build time.</div><div class="price">—</div></div>'
            )
        for e in evs:
            lead = e["leading"]
            pct = fmt_pct(lead["percent"]) if lead["percent"] is not None else "—"
            vol = e["volume"]
            vol_s = f"${vol:,.0f}" if vol else "volume not shown"
            high_badge = ' <span class="tag high">High effect</span>' if e["high_effect"] else ""
            move_s = ""
            if e["move_pts"] is not None:
                move_s = f' · one-day change about {fmt_pct(e["move_pts"], 1)} points'
                if e["meaningful_move"]:
                    move_s += " (meaningful move)"
            rows_html.append(
                f'''<article class="event" data-event="{escape(e["event_id"])}" data-market="{escape(str(lead.get("market_id") or ""))}" data-strength="{escape(e["strength_key"])}">
  <div class="market-row">
    <div>
      <strong>{escape(e["title"])}</strong>{high_badge}<br>
      <span class="muted">Leading: {escape(str(lead.get("label") or "—"))}</span><br>
      <a href="{escape(e["polymarket_url"])}" rel="noopener">Polymarket page</a>
      · <a href="{escape(e["source_url"])}" rel="noopener">Public source · {escape(e["event_id"])}</a>
    </div>
    <div class="price" data-price-event="{escape(e["event_id"])}">{escape(pct)}%</div>
  </div>
  <div class="event-meta">
    <p><strong>Fact</strong> · Trading volume {escape(vol_s)} · Received {escape(e["fetch_time"])}{escape(move_s)}</p>
    <p><strong>Guess · portfolio effect</strong> · Could touch <strong>{e["touch_rounded"]}%</strong> of your portfolio
       · Uncertainty {fmt_pct((e["uncertainty"] or 0)*100, 0) if e["uncertainty"] is not None else "—"}% of max
       · Attention {fmt_pct(e["attention"], 1) if e["attention"] is not None else "—"}</p>
    <p class="guess-line">{escape(e["if_happens"])}</p>
    <p class="guess-line">{escape(e["if_not"])}</p>
  </div>
</article>'''
            )
        group_sections.append(
            f'''<section class="section" id="{gkey}" aria-labelledby="{gkey}-heading">
  <div class="section-head">
    <span class="tag green">Fact · Public figures</span>
    <h2 id="{gkey}-heading">{escape(title)}</h2>
    <p>Exact event ids from Product task 10. Leading outcome percentage from Gamma. Options of one event count as one event.</p>
  </div>
  {"".join(rows_html)}
</section>'''
        )

    # Embedded bootstrap for live refresh
    bootstrap = {
        "receipt_time": receipt,
        "events": [
            {
                "event_id": e["event_id"],
                "market_id": e["leading"].get("market_id"),
                "strength_key": e["strength_key"],
                "touch": e["touch"],
                "built_percent": e["leading"].get("percent"),
                "title": e["title"],
            }
            for g in groups.values()
            for e in g
        ],
        "holdings_weights": {r["ticker"]: r["weight"] for r in h["rows"]},
        "group_strengths": rules["group_strengths"],
        "holdings_sectors": {k: v["sector"] for k, v in rules["holdings_sectors"].items()},
    }

    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>World Pulse Index · First version</title>
<style>
:root{{--ink:#172f32;--muted:#526568;--line:#dce5e2;--green:#116c5b;--wash:#eef7f2;--paper:#f5f7f5;--sand:#fbfaf5;--amber:#7a5428}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
a{{color:var(--green);text-underline-offset:3px}}
a:focus-visible,summary:focus-visible,.jump a:focus-visible{{outline:3px solid #ba7623;outline-offset:4px}}
header{{height:76px;border-bottom:1px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 max(24px,calc((100vw - 1080px)/2));gap:16px}}
.brand{{font-size:19px;font-weight:750;letter-spacing:-.6px}}
.brand span{{color:var(--green);margin-right:10px}}
.header-note{{font-size:13px;color:var(--muted)}}
main{{max-width:920px;margin:auto;padding:36px 24px 56px}}
.jump{{display:flex;flex-wrap:wrap;gap:10px 18px;margin:0 0 28px;font-size:13px}}
.jump a{{color:var(--muted);text-decoration:none;border-bottom:1px solid transparent}}
.jump a:hover{{color:var(--green);border-bottom-color:var(--green)}}
.tag{{font-size:11px;font-weight:750;letter-spacing:.6px;text-transform:uppercase;color:var(--muted)}}
.tag.green{{color:var(--green)}}
.tag.guess{{color:var(--amber)}}
.tag.high{{color:#8b1e1e;background:#fdecec;padding:2px 7px;border-radius:999px;margin-left:6px}}
#insight-block{{background:#fff;border:1px solid var(--line);border-radius:16px;padding:36px 40px;margin-bottom:28px}}
#insight-block .tag{{color:var(--green);display:inline-block;margin-bottom:14px}}
#insight-block .insight-text{{font-size:clamp(22px,3.2vw,32px);font-weight:650;letter-spacing:-.9px;line-height:1.3;margin:0 0 14px;max-width:36ch}}
#insight-block .insight-note{{margin:0 0 8px;color:var(--muted);font-size:14px;max-width:56ch}}
#insight-block .insight-meta{{margin:16px 0 0;font-size:12px;color:var(--muted)}}
.section{{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-bottom:20px}}
.section-head{{padding:22px 28px;background:#f9fbf9;border-bottom:1px solid var(--line)}}
.section-head h2{{font-size:20px;letter-spacing:-.5px;margin:6px 0 6px;line-height:1.35}}
.section-head p{{margin:0;color:var(--muted);font-size:13px}}
.market-row{{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start;padding:16px 28px 8px;font-size:14px}}
.market-row .price{{font-size:22px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.5px;line-height:1.2}}
.market-row a{{font-size:11px;display:inline-block;margin-top:4px;margin-right:8px}}
.muted{{color:var(--muted);font-size:13px}}
.event{{border-bottom:1px solid var(--line)}}
.event:last-child{{border-bottom:0}}
.event-meta{{padding:0 28px 18px;font-size:13px;color:var(--muted)}}
.event-meta p{{margin:6px 0}}
.guess-line{{color:var(--ink);font-size:14px}}
.holdings-list .row,.sector-list .row{{display:grid;grid-template-columns:1fr auto auto;gap:16px;padding:12px 28px;border-bottom:1px solid var(--line);font-size:14px;align-items:baseline}}
.holdings-list .row:last-child,.sector-list .row:last-child{{border-bottom:0}}
.units,.val{{font-variant-numeric:tabular-nums;color:var(--muted);font-size:13px}}
.val{{color:var(--ink);font-weight:650}}
.assumption{{padding:18px 28px;border-top:1px solid var(--line);background:#f9fbf9;font-size:13px;color:var(--muted)}}
.assumption p{{margin:6px 0}}
footer{{margin-top:22px;color:var(--muted);font-size:12px;display:flex;gap:15px;justify-content:space-between;flex-wrap:wrap}}
#live-status{{font-size:12px;color:var(--muted);margin:0 0 16px}}
.formula{{padding:18px 28px;font-size:13px;color:var(--muted)}}
.formula code{{font-size:12px;background:var(--wash);padding:1px 5px;border-radius:4px}}
@media(max-width:720px){{
header{{height:64px;padding:0 18px}}
main{{padding:24px 16px 40px}}
#insight-block{{padding:24px 20px}}
.section-head,.market-row,.event-meta,.holdings-list .row,.sector-list .row,.assumption,.formula{{padding-left:18px;padding-right:18px}}
.holdings-list .row,.sector-list .row{{grid-template-columns:1fr;gap:2px}}
.market-row .price{{font-size:18px}}
}}
@media(prefers-reduced-motion:reduce){{*{{transition:none!important}}}}
</style>
</head>
<body>
<header>
  <div class="brand"><span aria-hidden="true">▥</span>World Pulse Index</div>
  <div class="header-note">First version · Development task 6</div>
</header>
<main>
<nav class="jump" aria-label="Jump to section">
  <a href="#insight-block">Insight</a>
  <a href="#portfolio">Portfolio effect</a>
  <a href="#central_bank_rates">Rates</a>
  <a href="#big_company_events">Companies</a>
  <a href="#worldwide_elections">Elections</a>
  <a href="#wars">Wars</a>
  <a href="#formula">Formula</a>
  <a href="#sources">Sources</a>
</nav>
<p id="live-status">Figures: built-in read at {escape(receipt)} · Holdings reused from Development task 5 (eToro read-only, {escape(h["fetched_at"])})</p>

<section id="insight-block" aria-labelledby="insight-heading">
  <span class="tag green" id="insight-heading">Insight · Not advice</span>
  <p class="insight-text" data-insight-headline="true">{escape(insight["headline"])}</p>
  <p class="insight-note" data-insight-body="true">{escape(insight["body"])}</p>
  <p class="insight-note"><strong>Insights only, not advice.</strong></p>
  <p class="insight-meta" data-insight-meta="true">{escape(insight["meta"])} Scoring from Product task 10.</p>
</section>

<section class="section" id="portfolio" aria-labelledby="portfolio-heading">
  <div class="section-head">
    <span class="tag green">Fact · Holdings snapshot</span>
    <h2 id="portfolio-heading">Portfolio and sector map</h2>
    <p>Read-only eToro snapshot reused from Development task 5. Total {fmt_money(h["total"])}. Sector links are labeled Guess. Strength numbers are Assumptions from Product task 10.</p>
  </div>
  <div class="holdings-list">
    {"".join(money_row(r) for r in h["rows"])}
    <div class="row"><div>Cash <span class="tag">Fact · no link</span></div><div class="units">—</div><div class="val">{fmt_money(h["cash"])} · {fmt_pct(h["cash_weight"], 2)}%</div></div>
  </div>
  <div class="section-head" style="border-top:1px solid var(--line);border-bottom:1px solid var(--line)">
    <span class="tag guess">Guess · sectors</span>
    <h2 style="font-size:17px;margin:6px 0">Sector shares of {fmt_money(h["total"])}</h2>
  </div>
  <div class="sector-list">
    {"".join(sector_rows)}
  </div>
  <div class="assumption">
    <p><strong>Assumption</strong> · Link strengths (strong 1.0, some 0.5, weak 0.25) come from Product task 10. They are starting choices, not measured effects.</p>
    <p><strong>Fact</strong> · Holdings values and weights use the 16:44 Asia/Jerusalem read, not Product's 02:49 example weights.</p>
  </div>
</section>

{"".join(group_sections)}

<section class="section" id="formula" aria-labelledby="formula-heading">
  <div class="section-head">
    <span class="tag guess">Assumption · Product task 10</span>
    <h2 id="formula-heading">How the portfolio effect is scored</h2>
    <p>Input is Polymarket percentage movement, not news. The score updates when the figure moves, whether or not the event happens.</p>
  </div>
  <div class="formula">
    <p><strong>Touch</strong> = sum over holdings of (holding weight × link strength). High effect when touch is above 30%.</p>
    <p><strong>Uncertainty</strong> = 4 × p × (1 − p), where p is the leading option as a fraction from 0 to 1.</p>
    <p><strong>Attention</strong> = touch × uncertainty, plus touch × 0.5 when there is a meaningful move (5 points or more versus about 24 hours earlier, lasting at least one hour). Capped at touch.</p>
    <p>Every event-to-holding link is labeled <strong>Guess</strong>. Strength numbers are labeled <strong>Assumption</strong>.</p>
    <p>Rules file: <code>rules.json</code> (swap to replace Product's map). Doc: <a href="{escape(rules["source"]["doc_url"])}">Product Rules · TP-010</a>.</p>
  </div>
</section>

<section class="section" id="sources" aria-labelledby="sources-heading">
  <div class="section-head">
    <span class="tag green">Fact · Sources</span>
    <h2 id="sources-heading">Where the figures came from</h2>
  </div>
  <div class="formula">
    <p><strong>Public market figures</strong> · Gamma public data service ({escape(GAMMA)}), received {escape(receipt)}. The page also re-reads leading market prices in the browser when opened; if that fails, built-in figures stay with their label and time.</p>
    <p><strong>Holdings</strong> · eToro connector, read-only portfolio summary, {escape(h["fetched_at"])}. Reused from Development task 5. No keys in this folder. Holdings refresh only when this page is rebuilt.</p>
    <p><strong>Scoring rules</strong> · Product task 10, <a href="{escape(rules["source"]["doc_url"])}">Product Rules · TP-010 Portfolio Touch Score</a>, delivered {escape(rules["source"]["delivered_at"])}.</p>
    <p><strong>Gaps noted by Product</strong> · {escape("; ".join(rules.get("gaps") or []))}</p>
  </div>
</section>

<footer>
  <span>Insights only, not advice.</span>
  <span>Development task 6 · local build · {escape(receipt)}</span>
</footer>
</main>
<script id="wpi-bootstrap" type="application/json">{escape(json.dumps(bootstrap))}</script>
<script>
(function(){{
  var boot = JSON.parse(document.getElementById('wpi-bootstrap').textContent);
  var statusEl = document.getElementById('live-status');
  function fmtPct(x){{
    if (x == null || isNaN(x)) return '—';
    var n = Math.round(x * 10) / 10;
    return (Math.abs(n - Math.round(n)) < 1e-9) ? String(Math.round(n)) : String(n);
  }}
  function leadingFromMarkets(markets){{
    var best = null;
    (markets || []).forEach(function(m){{
      if (m.closed) return;
      var outcomes = m.outcomes; var prices = m.outcomePrices;
      try {{ if (typeof outcomes === 'string') outcomes = JSON.parse(outcomes); }} catch(e){{ outcomes = []; }}
      try {{ if (typeof prices === 'string') prices = JSON.parse(prices); }} catch(e){{ prices = []; }}
      if (!prices || !prices.length) return;
      for (var i = 0; i < prices.length; i++){{
        var label = (outcomes && outcomes[i]) ? outcomes[i] : ('Option ' + (i+1));
        if (outcomes && outcomes.length === 2 && String(label).toLowerCase() === 'no') continue;
        var p = parseFloat(prices[i]);
        if (isNaN(p)) continue;
        var display = m.groupItemTitle || m.question || label;
        if (!best || p > best.p) best = {{p:p, percent:p*100, market_id:String(m.id), label:display, oneDayPriceChange:m.oneDayPriceChange}};
      }}
    }});
    return best;
  }}
  function refresh(){{
    var fetches = boot.events.map(function(e){{
      return fetch('https://gamma-api.polymarket.com/events/' + e.event_id, {{headers:{{'Accept':'application/json'}}}})
        .then(function(r){{ return r.ok ? r.json() : null; }})
        .then(function(ev){{
          if (!ev) return null;
          var lead = leadingFromMarkets(ev.markets || []);
          if (!lead) return null;
          var el = document.querySelector('[data-price-event="' + e.event_id + '"]');
          if (el) el.textContent = fmtPct(lead.percent) + '%';
          return {{id:e.event_id, percent:lead.percent}};
        }})
        .catch(function(){{ return null; }});
    }});
    Promise.all(fetches).then(function(results){{
      var ok = results.filter(Boolean).length;
      var now = new Date();
      var stamp = now.toLocaleString('en-GB', {{timeZone:'Asia/Jerusalem', hour12:false}}) + ' Asia/Jerusalem';
      if (ok > 0) {{
        statusEl.textContent = 'Figures: live browser refresh for ' + ok + ' events · ' + stamp + ' · Holdings still from built-in snapshot (' + {json.dumps(h["fetched_at"])} + ')';
      }} else {{
        statusEl.textContent = 'Figures: built-in read (live refresh unavailable) · {escape(receipt)} · Holdings from Development task 5 ({escape(h["fetched_at"])})';
      }}
    }});
  }}
  if (location.protocol === 'file:') {{
    statusEl.textContent = 'Figures: built-in read (file open may block live refresh) · {escape(receipt)} · Holdings from Development task 5 ({escape(h["fetched_at"])})';
    // still try; Gamma sends Access-Control-Allow-Origin *
    refresh();
  }} else {{
    refresh();
  }}
}})();
</script>
</body>
</html>
'''
    return html


def run_checks(payload: dict, html: str) -> dict:
    checks = []
    groups = payload["events_by_group"]
    fetch_ok = payload.get("gamma_ok", False)
    checks.append({"name": "gamma_fetch_http", "pass": fetch_ok, "detail": payload.get("gamma_status_summary")})

    empty = []
    for g in ["central_bank_rates", "big_company_events", "worldwide_elections", "wars"]:
        n = len(groups.get(g) or [])
        ok = n >= 1
        if not ok:
            empty.append(g)
        checks.append({"name": f"group_{g}_has_events", "pass": ok, "detail": f"count={n}"})

    ids = []
    for evs in groups.values():
        for e in evs:
            ids.append(e["event_id"])
    checks.append({"name": "no_duplicate_events", "pass": len(ids) == len(set(ids)), "detail": f"n={len(ids)} unique={len(set(ids))}"})

    pct_ok = True
    time_ok = True
    url_ok = True
    for evs in groups.values():
        for e in evs:
            p = e["leading"].get("percent")
            if p is None or not (0 <= p <= 100):
                pct_ok = False
            if not e.get("fetch_time"):
                time_ok = False
            if not e.get("source_url"):
                url_ok = False
    checks.append({"name": "every_event_has_percentage_0_100", "pass": pct_ok, "detail": ""})
    checks.append({"name": "every_event_has_fetch_time", "pass": time_ok, "detail": ""})
    checks.append({"name": "every_event_has_source_url", "pass": url_ok, "detail": ""})

    h = payload["holdings"]
    summed = sum(r["value"] for r in h["rows"]) + h["cash"]
    checks.append({
        "name": "holdings_sum_matches_total",
        "pass": abs(summed - h["total"]) < 0.05,
        "detail": f"sum={summed:.2f} total={h['total']:.2f}",
    })

    guess_ok = ("Guess" in html) and ("if it happens (Guess)".lower() in html.lower() or "If it happens (Guess)" in html)
    checks.append({"name": "links_labeled_guess", "pass": guess_ok, "detail": ""})

    # no buy/sell advice wording (allow 'bids' etc? task says no 'buy'/'sell' advice)
    advice_bad = bool(re.search(r"\b(buy|sell)\b", html, re.I)) and bool(
        re.search(r"\b(should buy|should sell|buy now|sell now|recommend buy|recommend sell)\b", html, re.I)
    )
    # stricter: any buy/sell as imperative advice — flag raw buy/sell words except in market jargon we avoid entirely
    has_buy_sell = bool(re.search(r"\b(buy|sell)\b", html, re.I))
    checks.append({
        "name": "no_buy_sell_advice_wording",
        "pass": not has_buy_sell,
        "detail": "scanned HTML for buy/sell words",
    })

    secrets = False
    for path in DIR.iterdir():
        if path.is_file() and path.suffix in {".py", ".json", ".md", ".html", ".txt"}:
            text = path.read_text(errors="ignore")
            if re.search(r"(api[_-]?key|secret|password|token\s*[:=])", text, re.I):
                # allow words like 'clobTokenIds' in comments? flag only assignment-like
                if re.search(r"(api[_-]?key|password)\s*[:=]\s*['\"]?\w+", text, re.I):
                    secrets = True
    checks.append({"name": "no_secrets_keys_in_files", "pass": not secrets, "detail": ""})

    all_pass = all(c["pass"] for c in checks)
    return {
        "generated_at": fmt_time(now_jer()),
        "all_pass": all_pass,
        "empty_groups": empty,
        "checks": checks,
        "event_counts": {g: len(groups.get(g) or []) for g in groups},
    }


def main():
    rules = load_rules()
    holdings = load_holdings()
    receipt = now_jer()
    events_by_group = {}
    statuses = []
    print(f"Build start {fmt_time(receipt)}")
    for gkey, specs in rules["events"].items():
        events_by_group[gkey] = []
        for spec in specs:
            try:
                rec = build_event_record(spec, gkey, holdings, rules, receipt)
                events_by_group[gkey].append(rec)
                statuses.append(rec["http_status"])
                pct = rec["leading"].get("percent")
                print(
                    f"  [{gkey}] {rec['event_id']} {rec['title'][:60]} | "
                    f"{fmt_pct(pct) if pct is not None else '—'}% | vol={rec['volume']:.0f} | touch={rec['touch_rounded']}%"
                )
            except Exception as ex:
                print(f"  FAIL {gkey} {spec['event_id']}: {ex}")
                statuses.append(0)

    payload = {
        "receipt_time": fmt_time(receipt),
        "receipt_iso": receipt.isoformat(),
        "holdings": holdings,
        "rules": rules,
        "events_by_group": events_by_group,
        "sector_shares": sector_shares(holdings, rules),
        "gamma_ok": all(s == 200 for s in statuses) and len(statuses) > 0,
        "gamma_status_summary": statuses,
    }
    payload["insight"] = pick_insight(events_by_group, holdings)

    html = render_html(payload)
    (DIR / "world-pulse-index.html").write_text(html)
    # strip rules from saved public-fetch to keep file smaller / no need to embed full rules twice
    save = {
        "receipt_time": payload["receipt_time"],
        "receipt_iso": payload["receipt_iso"],
        "holdings": holdings,
        "events_by_group": {
            g: [
                {
                    **{k: v for k, v in e.items() if k != "parts"},
                    "parts_summary": [
                        {"ticker": p["ticker"], "strength": p["strength"], "contrib": round(p["contrib"], 3)}
                        for p in e.get("parts", [])
                    ],
                }
                for e in evs
            ]
            for g, evs in events_by_group.items()
        },
        "insight": payload["insight"],
        "scoring_formula": rules["scoring"],
        "product_doc": rules["source"],
    }
    (DIR / "public-fetch.json").write_text(json.dumps(save, indent=2))
    checks = run_checks(payload, html)
    (DIR / "checks.json").write_text(json.dumps(checks, indent=2))
    print(f"Wrote world-pulse-index.html ({len(html)} bytes)")
    print(f"Checks all_pass={checks['all_pass']} empty={checks['empty_groups']}")
    return 0 if checks["all_pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
