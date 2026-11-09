import { cache } from 'react';
import fallback from '../data/fallback.json';
import holdings from '../data/holdings.json';
import rules from '../data/rules.json';
import { rankOpen } from './score.js';

const ctx = { holdings, rules };

function parseList(x) {
  if (Array.isArray(x)) return x;
  try { return JSON.parse(x || '[]'); } catch { return []; }
}

function firstPrice(m) {
  const pr = parseList(m.outcomePrices);
  return pr.length ? Number(pr[0]) : -1;
}

function trimMarket(m) {
  return {
    id: m.id,
    question: m.question,
    groupItemTitle: m.groupItemTitle,
    outcomes: m.outcomes,
    outcomePrices: m.outcomePrices,
    clobTokenIds: m.clobTokenIds,
    oneDayPriceChange: m.oneDayPriceChange,
    volumeNum: m.volumeNum,
    volume24hr: m.volume24hr,
    bestBid: m.bestBid,
    bestAsk: m.bestAsk,
    spread: m.spread,
    closed: m.closed,
  };
}

function selectMarkets(ev, markets) {
  let use = markets || [];
  if (ev.top_n) {
    use = use.filter((m) => !m.closed && parseList(m.outcomePrices).length);
    use.sort((a, b) => firstPrice(b) - firstPrice(a));
    use = use.slice(0, Number(ev.top_n));
  } else if (ev.market_ids && ev.market_ids.length) {
    const byId = new Map(use.map((m) => [String(m.id), m]));
    const picked = ev.market_ids.map((id) => byId.get(String(id))).filter(Boolean);
    if (picked.length) use = picked;
  }
  return use.map(trimMarket);
}

async function fetchEvent(ev) {
  const res = await fetch('https://gamma-api.polymarket.com/events/' + ev.event_id, {
    next: { revalidate: 60 },
    headers: { accept: 'application/json', 'user-agent': 'WorldPulseIndex/1.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(String(res.status));
  const j = await res.json();
  const markets = selectMarkets(ev, j.markets || []);
  if (!markets.length) throw new Error('no markets');
  const slug = j.slug || ev.slug || '';
  return {
    ...ev,
    title: j.title || ev.title,
    slug,
    polymarket_url: slug ? 'https://polymarket.com/event/' + slug : ev.polymarket_url,
    volume: Number(j.volume || ev.volume || 0),
    markets,
    fallback: false,
  };
}

export const loadPulse = cache(async function loadPulse(mode) {
  const forceFallback = mode === 'error';
  let liveOk = !forceFallback;
  let gammaAt = null;
  const events = await Promise.all(fallback.events.map(async (ev) => {
    if (forceFallback) return { ...ev, fallback: true };
    try {
      const live = await fetchEvent(ev);
      gammaAt = Date.now();
      return live;
    } catch {
      liveOk = false;
      return { ...ev, fallback: true };
    }
  }));
  if (!gammaAt) liveOk = false;
  return {
    events: rankOpen(events, ctx),
    liveOk,
    gammaAt,
    builtMs: fallback.built_ms,
    builtAt: fallback.built_at,
    holdings,
    rules,
  };
});

export async function loadHistory(token) {
  if (!token) return null;
  try {
    const res = await fetch(
      'https://clob.polymarket.com/prices-history?market=' + encodeURIComponent(token) + '&interval=1d&fidelity=30',
      {
        next: { revalidate: 60 },
        headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 WorldPulseIndex' },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const j = await res.json();
    const hist = (j && j.history) || [];
    return hist.length >= 2 ? hist : null;
  } catch {
    return null;
  }
}

export function chartPath(hist) {
  const now = Date.now() / 1000;
  let pts = hist.filter((p) => p && p.t >= now - 86400 && p.p != null && !Number.isNaN(Number(p.p)));
  if (pts.length < 2) pts = hist.filter((p) => p && p.p != null && !Number.isNaN(Number(p.p)));
  if (pts.length < 2) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const p of pts) {
    const v = Number(p.p);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!(max > min)) { min -= 0.01; max += 0.01; }
  else if (max - min < 0.004) { min -= 0.008; max += 0.008; }
  const w = 640;
  const h = 140;
  const pad = 6;
  const t0 = Number(pts[0].t);
  let t1 = Number(pts[pts.length - 1].t);
  if (t1 <= t0) t1 = t0 + 1;
  let d = '';
  pts.forEach((p, i) => {
    const x = pad + (w - pad * 2) * ((Number(p.t) - t0) / (t1 - t0));
    const y = pad + (h - pad * 2) * (1 - (Number(p.p) - min) / (max - min));
    d += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
  });
  return d;
}
