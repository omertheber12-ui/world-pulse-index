/** Plain wording for Simplified v2. Insights only. */

const SHORT = {
  770450: 'Fed December', 770451: 'Fed January', 1025305: 'ECB December', 1280521: 'ECB February',
  1123963: 'China rates', 1194143: 'Nvidia revenue', 1194144: 'Nvidia margin', 800884: 'Nvidia value',
  79987: 'French election', 81557: 'Israel election', 31552: 'US election',
  711714: 'Israel-Iran ceasefire', 478472: 'Russia-Ukraine ceasefire', 160366: 'US-Iran war',
  34044: 'Taiwan invasion', 1337182: 'US-Iran ceasefire',
};

const RATE = {
  'No change': { full: 'No change', compact: 'No change', lean: 'no change' },
  '25 bps increase': { full: '0.25 point increase', compact: '0.25 increase', lean: 'a small increase' },
  '50+ bps increase': { full: '0.50+ point increase', compact: '0.50+ increase', lean: 'a larger increase' },
  '25 bps decrease': { full: '0.25 point decrease', compact: '0.25 decrease', lean: 'a small cut' },
  '50+ bps decrease': { full: '0.50+ point decrease', compact: '0.50+ decrease', lean: 'a larger cut' },
};

export const HOLD = { INTC: 'Intel', BTC: 'Bitcoin', SPY: 'SPY', JPM: 'JPMorgan', BAC: 'Bank of America', ETH: 'Ethereum' };

export const CHIPS = [
  ['all', 'All'],
  ['central_bank_rates', 'Central banks'],
  ['big_company_events', 'Big companies'],
  ['worldwide_elections', 'Elections'],
  ['wars', 'Wars'],
];

export function fig(v) {
  if (v == null || Number.isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a > 0 && a < 1) return v.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
  const r = Math.round(v * 10) / 10;
  if (Math.abs(r - Math.round(r)) < 0.001) return String(Math.round(r));
  return r.toFixed(1);
}

export function pctInt(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return (v >= 10 || v === 0) ? v.toFixed(0) : v.toFixed(1);
}

export function usd(v) {
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function weightText(w) {
  if (w < 0.1) return w.toFixed(2);
  return (Math.round(w * 10) / 10).toFixed(1);
}

export function clock(ms) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(ms));
}

export function plainOutcome(ev, label, rules) {
  if (ev.rate && rules.rate_wording && rules.rate_wording[label]) {
    return rules.rate_wording[label].replace('{bank}', ev.rate.bank).replace('{when}', ev.rate.when);
  }
  if (ev.outcomes_plain && ev.outcomes_plain[label]) return ev.outcomes_plain[label];
  if (ev.outcome_template) return ev.outcome_template.replace('{label}', label);
  return (ev.plain || ev.title) + ': ' + label;
}

export function optionLine(ev, label, rules, compact) {
  if (ev.rate && RATE[label]) return compact ? RATE[label].compact : RATE[label].full;
  return plainOutcome(ev, label, rules);
}

export function eventName(ev) { return ev.plain || ev.title; }
export function shortName(ev) { return SHORT[ev.event_id] || SHORT[String(ev.event_id)] || ev.plain || ev.title; }
export function holdName(ticker, name) { return HOLD[ticker] || name; }

export function isClosed(ev) {
  return (ev.markets || []).length > 0 && ev.markets.every((m) => m.closed);
}

function wordsOf(s) { return String(s).replace(/[.]/g, '').split(/\s+/).filter(Boolean); }

export function insightLine(t, rules) {
  if (!t || !t.lead || t.move == null) return 'No meaningful move today.';
  const opt = optionLine(t.ev, t.lead.label, rules, false);
  const shown = /^[0-9]/.test(opt) ? 'A ' + opt : opt;
  const n = Math.abs(t.move);
  if (n < 0.05) return shown + ' shows ' + fig(t.lead.pct) + '%. No meaningful move today.';
  const nTxt = (Math.abs(n - Math.round(n)) < 0.05) ? String(Math.round(n)) : n.toFixed(1);
  const pts = nTxt === '1' ? 'point' : 'points';
  const dir = (t.move > 0 ? 'up ' : 'down ') + nTxt + ' ' + pts;
  return shown + ' shows ' + fig(t.lead.pct) + '%, ' + dir + ' today.' + (t.meaningful ? '' : ' No meaningful move.');
}

export function headline(ranked, rules) {
  const mv = ranked.filter((x) => x.meaningful);
  const t = mv.length ? mv[0] : ranked[0];
  if (!t) return { top: null, text: 'No events to show right now', insight: 'No meaningful move today.' };
  const name = shortName(t.ev);
  let text;
  if (t.meaningful) {
    const n = Math.abs(t.move);
    const nTxt = (Math.abs(n - Math.round(n)) < 0.05) ? String(Math.round(n)) : n.toFixed(1);
    text = name + ' figures moved ' + nTxt + ' points to ' + fig(t.lead.pct) + '%.';
  } else if (t.ev.rate && t.lead && RATE[t.lead.label]) {
    let further = '';
    const lab = t.lead.label;
    if (t.move != null && Math.abs(t.move) >= 1) {
      if ((lab.indexOf('increase') >= 0 && t.move > 0) || (lab.indexOf('decrease') >= 0 && t.move < 0)) further = ' further';
    }
    text = name + ' figures lean' + further + ' toward ' + RATE[lab].lean + '.';
  } else {
    text = name + ' leads at ' + fig(t.lead.pct) + '%.';
  }
  if (wordsOf(text).length > 12) text = name + ' leads at ' + fig(t.lead.pct) + '%.';
  return { top: t, text, insight: insightLine(t, rules) };
}

export function mostly(parts) {
  const top = parts.filter((p) => p.contrib >= 1).sort((a, b) => b.contrib - a.contrib);
  const banks = top.filter((p) => p.ticker === 'JPM' || p.ticker === 'BAC');
  const items = [];
  let usedBank = false;
  for (const p of top) {
    if (p.ticker === 'JPM' || p.ticker === 'BAC') {
      if (banks.length >= 2) { if (!usedBank) { items.push('the banks'); usedBank = true; } }
      else items.push(holdName(p.ticker, p.name));
    } else items.push(holdName(p.ticker, p.name));
  }
  const pick = items.slice(0, 3);
  if (!pick.length) return '';
  if (pick.length === 1) return 'Mostly ' + pick[0];
  if (pick.length === 2) return 'Mostly ' + pick[0] + ' and ' + pick[1];
  return 'Mostly ' + pick[0] + ', ' + pick[1] + ' and ' + pick[2];
}

export function forHolding(ticker, ranked) {
  const rows = [];
  for (const s of ranked) {
    const p = s.parts.find((x) => x.ticker === ticker);
    if (p && p.strength > 0) rows.push({ s, p });
  }
  rows.sort((a, b) => (b.s.attention * b.p.strength) - (a.s.attention * a.p.strength));
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    if (seen.has(row.s.ev.event_id)) continue;
    seen.add(row.s.ev.event_id);
    out.push(row);
    if (out.length === 2) break;
  }
  return out;
}

export function chipLabel(key) {
  const hit = CHIPS.find((c) => c[0] === key);
  return hit ? hit[1] : 'All';
}
