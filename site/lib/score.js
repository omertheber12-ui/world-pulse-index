/** Product task 10 scoring. Attention sorts lists and is never shown. */

function parse(x) {
  if (Array.isArray(x)) return x;
  try { return JSON.parse(x || '[]'); } catch { return []; }
}

export function sectorOf(ticker, rules) {
  const h = rules.holdings_sectors[ticker];
  return h ? h.sector : 'none';
}

export function optionsOf(ev, includeClosed = false) {
  const out = [];
  for (const m of ev.markets || []) {
    if ((m.closed && !includeClosed) || !m.outcomePrices) continue;
    const oc = parse(m.outcomes);
    const pr = parse(m.outcomePrices).map(Number);
    const tk = parse(m.clobTokenIds);
    const odc = m.oneDayPriceChange == null ? null : Number(m.oneDayPriceChange) * 100;
    const spread = m.spread != null ? Number(m.spread) : (m.bestBid != null && m.bestAsk != null ? Number(m.bestAsk) - Number(m.bestBid) : null);
    const thin = (m.volume24hr != null && Number(m.volume24hr) < 10000) || (spread != null && spread > 0.03);
    if (oc.length === 2 && String(oc[0]).toLowerCase() === 'yes') {
      out.push({ label: m.groupItemTitle || m.question || 'Yes', pct: pr[0] * 100, move: odc, token: tk[0], market: m.id, volume: Number(m.volumeNum || 0), thin });
    } else {
      oc.forEach((o, i) => {
        out.push({
          label: (m.groupItemTitle ? m.groupItemTitle + ': ' : '') + o,
          pct: pr[i] * 100,
          move: odc == null ? null : (i === 0 ? odc : -odc),
          token: tk[i],
          market: m.id,
          volume: Number(m.volumeNum || 0),
          thin,
        });
      });
    }
  }
  out.sort((a, b) => b.pct - a.pct);
  return out;
}

export function scoreEvent(ev, ctx, includeClosed = false) {
  const { holdings, rules } = ctx;
  const opts = optionsOf(ev, includeClosed);
  const lead = opts[0] || null;
  const st = rules.group_strengths[ev.strength_key] || {};
  const parts = holdings.rows.map((r) => {
    const strength = Number(st[sectorOf(r.ticker, rules)] || 0);
    return { ticker: r.ticker, name: r.name, weight: r.weight, strength, contrib: r.weight * strength };
  });
  const touch = parts.reduce((a, p) => a + p.contrib, 0);
  const p = lead ? lead.pct / 100 : null;
  const unc = p == null ? 0 : 4 * p * (1 - p);
  const move = lead ? lead.move : null;
  const meaningful = move != null && Math.abs(move) >= 5;
  const attention = Math.min(touch * unc + (meaningful ? touch * 0.5 : 0), touch);
  return {
    ev, opts, lead, parts, touch,
    high: touch > rules.scoring.high_effect_threshold,
    unc, move, meaningful, attention,
  };
}

export function rankScored(rows) {
  return rows.slice().sort((a, b) => b.attention - a.attention || b.touch - a.touch);
}

export function rankOpen(events, ctx) {
  return rankScored(events.map((ev) => scoreEvent(ev, ctx, false))).filter((s) => s.lead);
}
