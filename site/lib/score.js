/**
 * Exposure is the weight of related holdings.
 * Personal rank = exposure × change factor × quality.
 * change factor = 0.5 + 0.5 × min(|24-hour change in points| / 10, 1)
 * quality = 1 when the leading contract traded at least $10,000 in a day
 *   and the bid-ask gap is 3 points or less (or the gap is not reported);
 *   0.5 when the day volume is under $10,000, the gap is wider than 3 points,
 *   or both volume and gap are missing.
 * A missing 24-hour change is treated as 0, so the change factor is 0.5.
 */

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
    const shared = {
      question: m.question || '',
      endDate: m.endDate || null,
      volume24hr: m.volume24hr == null ? null : Number(m.volume24hr),
      liquidity: m.liquidityNum == null ? null : Number(m.liquidityNum),
      updatedAt: m.updatedAt || null,
      spread,
      thin,
    };
    if (oc.length === 2 && String(oc[0]).toLowerCase() === 'yes') {
      out.push({ ...shared, label: m.groupItemTitle || m.question || 'Yes', pct: pr[0] * 100, move: odc, token: tk[0], market: m.id, volume: Number(m.volumeNum || 0) });
    } else {
      oc.forEach((o, i) => {
        out.push({
          ...shared,
          label: (m.groupItemTitle ? m.groupItemTitle + ': ' : '') + o,
          pct: pr[i] * 100,
          move: odc == null ? null : (i === 0 ? odc : -odc),
          token: tk[i],
          market: m.id,
          volume: Number(m.volumeNum || 0),
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
  const p = lead ? lead.pct / 100 : null;
  const unc = p == null ? 0 : 4 * p * (1 - p);
  const move = lead ? lead.move : null;
  const meaningful = move != null && Math.abs(move) >= 5;
  const moveAbs = move == null ? 0 : Math.abs(move);
  const exposure = exposureOf(ev, lead, holdings, rules);
  const scaled = moveScore(moveAbs);
  const quality = qualityScore(lead, ev);
  const attention = Math.min(exposure.total * unc + (meaningful ? exposure.total * 0.5 : 0), exposure.total);
  const score = 0.5 * scaled.move + 0.35 * exposure.score + 0.15 * quality;
  return {
    ev, opts, lead, parts: exposure.rows, touch: exposure.total,
    exposure, moveAbs,
    high: exposure.total > (rules.scoring.high_effect_threshold || 30),
    unc, move, meaningful, attention,
    quality, score, rank: score,
  };
}

/** Sample fund mix. Not a live fund file. */
export const FUND_MIX = {
  SPY: { asOf: '30 June 2026', note: 'Sample fund mix, not a live fund file.', weights: { nvidia: 0.07 } },
};

const SUBJECTS = [
  { key: 'nvidia', label: 'Nvidia', words: ['nvidia', 'nvda'], tickers: [] },
  { key: 'intel', label: 'Intel', words: ['intel'], tickers: ['INTC'] },
  { key: 'bitcoin', label: 'Bitcoin', words: ['bitcoin'], tickers: ['BTC'] },
  { key: 'ethereum', label: 'Ethereum', words: ['ethereum'], tickers: ['ETH'] },
  { key: 'jpmorgan', label: 'JPMorgan', words: ['jpmorgan', 'jp morgan'], tickers: ['JPM'] },
  { key: 'bofa', label: 'Bank of America', words: ['bank of america'], tickers: ['BAC'] },
];

export function subjectOf(ev, lead) {
  const blob = ((ev.title || '') + ' ' + (ev.plain || '') + ' ' + ((lead && lead.question) || '')).toLowerCase();
  return SUBJECTS.find((s) => s.words.some((w) => blob.includes(w))) || null;
}

function guessReason(ticker, subject, ev) {
  if (subject && subject.key === 'nvidia' && ticker === 'INTC') return 'Guess: we assume chip makers tend to move with news about Nvidia';
  if (String(ev.strength_key || '').includes('central_bank') && (ticker === 'JPM' || ticker === 'BAC')) return 'Guess: we assume bank stocks tend to move with this rate decision';
  if (ticker === 'SPY') return 'Guess: we assume this fund tends to move with ' + (subject ? subject.label : 'this event');
  return 'Guess: we assume this holding tends to move with ' + (subject ? subject.label : 'this event');
}

export function exposureOf(ev, lead, holdings, rules) {
  const subject = subjectOf(ev, lead);
  const st = rules.group_strengths[ev.strength_key] || {};
  const rows = [];
  const used = new Set();
  for (const h of holdings.rows) {
    if (subject && subject.tickers.includes(h.ticker)) {
      rows.push({ kind: 'direct', ticker: h.ticker, name: h.name, weight: h.weight, reason: 'You hold ' + h.name + '; the bet is about that asset.' });
      used.add(h.ticker);
    }
  }
  if (subject) {
    for (const h of holdings.rows) {
      const mix = FUND_MIX[h.ticker];
      const inner = mix && mix.weights[subject.key];
      if (!inner) continue;
      used.add(h.ticker);
      rows.push({
        kind: 'fund', ticker: h.ticker, name: h.name, weight: h.weight * inner, inner, fundWeight: h.weight, asOf: mix.asOf,
        reason: 'The fund holds ' + subject.label + '. Fund holdings as of ' + mix.asOf + '. ' + mix.note,
      });
    }
  }
  for (const h of holdings.rows) {
    if (used.has(h.ticker)) continue;
    const sector = sectorOf(h.ticker, rules);
    const strength = Number(st[sector] || 0);
    if (strength < 0.5) continue;
    rows.push({ kind: 'estimated', ticker: h.ticker, name: h.name, weight: h.weight, strength, reason: guessReason(h.ticker, subject, ev) });
  }
  const sum = (k) => rows.filter((r) => r.kind === k).reduce((a, r) => a + r.weight, 0);
  const direct = sum('direct');
  const funds = sum('fund');
  const estimated = sum('estimated');
  const total = Math.min(100, direct + funds + estimated);
  const weighted = direct * 1 + funds * 0.7 + estimated * 0.3;
  return { rows, direct, funds, estimated, total, weighted, subject, score: Math.min(weighted / 50, 1) * 100 };
}

export function moveScore(moveAbs) {
  const move = Math.min(moveAbs / 20, 1) * 100;
  return { move };
}

export function qualityScore(lead, ev, now = Date.now()) {
  const vol = lead && lead.volume24hr;
  const liq = (lead && lead.liquidity != null) ? lead.liquidity : ev.liquidity;
  const thin = (vol != null && vol < 50000) || (liq != null && liq < 10000);
  const updated = Date.parse((lead && lead.updatedAt) || ev.updatedAt || '');
  const stale = !Number.isNaN(updated) && (now - updated) > 60 * 60 * 1000;
  return (thin || stale) ? 50 : 100;
}

export function homeEligible(s, now = Date.now()) {
  if (!s.lead || !(s.exposure && s.exposure.total > 0)) return false;
  const vol = s.lead.volume24hr;
  if (vol == null || vol < 10000) return false;
  const end = Date.parse(s.lead.endDate || s.ev.endDate || '');
  if (!Number.isNaN(end) && end < now) return false;
  const updated = Date.parse(s.lead.updatedAt || s.ev.updatedAt || '');
  if (!Number.isNaN(updated) && (now - updated) > 6 * 60 * 60 * 1000) return false;
  return true;
}

function byRank(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if ((b.moveAbs || 0) !== (a.moveAbs || 0)) return (b.moveAbs || 0) - (a.moveAbs || 0);
  const da = (a.exposure && a.exposure.direct) || 0;
  const db = (b.exposure && b.exposure.direct) || 0;
  if (db !== da) return db - da;
  const va = (a.lead && a.lead.volume24hr) || 0;
  const vb = (b.lead && b.lead.volume24hr) || 0;
  if (vb !== va) return vb - va;
  const ea = Date.parse((a.lead && a.lead.endDate) || a.ev.endDate || '') || 8.64e15;
  const eb = Date.parse((b.lead && b.lead.endDate) || b.ev.endDate || '') || 8.64e15;
  return ea - eb;
}

export function rankScored(rows) {
  return rows.slice().sort(byRank);
}

export function rankOpen(events, ctx) {
  return rankScored(events.map((ev) => scoreEvent(ev, ctx, false))).filter((s) => s.lead);
}
