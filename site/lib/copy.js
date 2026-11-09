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

export const HOLD = { INTC: 'Intel', BTC: 'Bitcoin', SPY: 'State Street fund', JPM: 'JPMorgan', BAC: 'Bank of America', ETH: 'Ethereum' };

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

function trim0(n) {
  const x = String(n).replace(/0+$/, '').replace(/\.$/, '');
  return x || '0';
}

export function endLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export function moneyWords(v) {
  if (v == null || !Number.isFinite(Number(v)) || Number(v) <= 0) return '';
  const n = Number(v);
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + ' billion';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + ' million';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + ' thousand';
  return '$' + Math.round(n);
}

function oneDec(n) {
  return (Math.round(Number(n) * 10) / 10).toFixed(1);
}

function meetingPhrase(q) {
  const m = q.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i);
  return m ? m[0] : '';
}

export function chancePhrase(question, endDate) {
  let q = String(question || '').replace(/\u2019/g, "'").replace(/\u2018/g, "'").trim();
  q = q.replace(/\?+$/g, '').trim();
  q = q.replace(/\s*\([A-Z]{2,5}\)/g, '');
  q = q.replace(/\bNVIDIA\b/g, 'Nvidia').replace(/\bNVDA\b/g, 'Nvidia');
  q = q.replace(/\$(\d+(?:\.\d+)?)T\b/g, (_, n) => '$' + trim0(n) + ' trillion');
  q = q.replace(/\$(\d+(?:\.\d+)?)B\b/g, (_, n) => '$' + trim0(n) + ' billion');
  q = q.replace(/market capitalization/gi, 'market value');
  q = q.replace(/\sx\s/gi, ' and ');
  const meeting = meetingPhrase(q);
  const amount = /50\+|0\.50|50 bps/i.test(q) ? '0.50 points or more' : '0.25 points';
  if (/no change in .*interest rates/i.test(q)) return 'the US central bank keeps rates unchanged at its ' + (meeting || 'next') + ' meeting';
  if (/increase interest rates|raises rates/i.test(q)) return 'the US central bank raises rates by ' + amount + ' at its ' + (meeting || 'next') + ' meeting';
  if (/decrease interest rates|cuts rates/i.test(q)) return 'the US central bank cuts rates by ' + amount + ' at its ' + (meeting || 'next') + ' meeting';
  const cap = q.match(/market value is less than (\$[0-9.]+ trillion)/i) || q.match(/less than (\$[0-9.]+ trillion)/i);
  if (cap && /nvidia/i.test(q)) {
    const year = (q.match(/\b20\d\d\b/) || [''])[0];
    return "Nvidia's market value is below " + cap[1] + (year ? ' at the end of ' + year : '');
  }
  if (/ceasefire/i.test(q)) {
    let rest = q.replace(/^will\s+/i, '').replace(/\bbe\b/i, 'is').replace(/\s+/g, ' ').trim();
    const end = endLabel(endDate);
    if (end && !/20\d\d/.test(rest)) rest = rest.replace(/(?:through|by)\s+.+$/i, (m) => m.split(' ')[0] + ' ' + end);
    if (!/^the\s/i.test(rest)) rest = 'the ' + rest;
    rest = rest.replace(/\bhold\b/i, 'holds').replace(/\bcontinue\b/i, 'continues');
    return rest;
  }
  q = q.replace(/^will there be\b/i, 'there is');
  if (/^will (.+?) win\b/i.test(q)) q = q.replace(/^will (.+?) win\b/i, (_, who) => who + ' wins');
  else q = q.replace(/^will\s+/i, '');
  q = q.replace(/\bbe\b/i, 'is');
  q = q.replace(/\bbps\b/gi, 'points');
  const end = endLabel(endDate);
  if (end && !/20\d\d/.test(q)) q = q + ' at ' + end;
  return q.replace(/\s+/g, ' ').trim();
}

export function changeVerb(move) {
  if (move == null || Math.abs(move) < 1) return 'held steady';
  return move > 0 ? 'rose' : 'fell';
}

export function changeLine(pct, move) {
  if (pct == null || Number.isNaN(pct)) return 'A 24-hour change was not in the public figures.';
  if (move == null) return 'A 24-hour change was not in the public figures.';
  if (Math.abs(move) < 1) return 'at ' + oneDec(pct) + '%, less than 1 point change in 24 hours';
  const prev = pct - move;
  return 'from ' + oneDec(prev) + '% to ' + oneDec(pct) + '% in 24 hours, ' + (move > 0 ? 'up' : 'down') + ' ' + oneDec(Math.abs(move)) + ' points';
}

export function storyOf(scored) {
  const lead = scored.lead || {};
  const phrase = chancePhrase(lead.question || scored.ev.title || '', lead.endDate || scored.ev.endDate) || 'this event';
  const verb = changeVerb(scored.move);
  return {
    headline: 'Chance that ' + phrase + ' ' + verb,
    line: changeLine(lead.pct, scored.move),
    endText: endLabel(lead.endDate || scored.ev.endDate),
  };
}

function topicOf(ev) {
  const blob = ((ev.title || '') + ' ' + (ev.plain || '')).toLowerCase();
  const k = ev.strength_key || '';
  if (k === 'big_company_events') return /nvidia/.test(blob) ? 'Nvidia' : 'this large company';
  if (k === 'central_bank_rates_fed') return 'the Federal Reserve rate decision';
  if (k === 'central_bank_rates_ecb') return 'the European Central Bank rate decision';
  if (k === 'central_bank_rates_china') return 'the China central bank rate decision';
  if (k === 'election_france') return 'the French election';
  if (k === 'election_israel') return 'the Israel election';
  if (k === 'worldwide_elections') return 'this election';
  if (k === 'wars') return 'this conflict';
  return 'this event';
}

export function linkKind(ticker, ev, lead) {
  if (ticker === 'SPY') return 'through a fund';
  const blob = ((ev.title || '') + ' ' + (ev.plain || '') + ' ' + ((lead && lead.question) || '')).toLowerCase();
  const words = {
    INTC: ['intel'],
    BTC: ['bitcoin'],
    ETH: ['ethereum'],
    JPM: ['jpmorgan', 'jp morgan'],
    BAC: ['bank of america'],
  }[ticker] || [];
  if (words.some((w) => blob.includes(w))) return 'direct holding';
  return 'estimated link';
}

export function guessWords(ticker, ev) {
  const topic = topicOf(ev);
  if (ticker === 'INTC' && /nvidia/i.test(topic + (ev.title || '') + (ev.plain || ''))) return 'we assume chip makers tend to move with news about Nvidia';
  if (ticker === 'SPY') return 'we assume this fund tends to move with ' + topic;
  if (ticker === 'JPM' || ticker === 'BAC') return 'we assume bank stocks tend to move with ' + topic;
  return 'we assume this holding tends to move with ' + topic;
}

export function whyMatters(exposure) {
  const rows = (exposure && exposure.rows) || [];
  const subject = exposure && exposure.subject && exposure.subject.label;
  const hasD = rows.some((r) => r.kind === 'direct');
  const hasF = rows.some((r) => r.kind === 'fund');
  const est = rows.filter((r) => r.kind === 'estimated');
  if (hasD && hasF) return 'You hold ' + subject + ' directly and also through funds.';
  if (hasD) return 'You hold ' + subject + ' directly.';
  if (hasF) return 'You hold ' + (subject || 'the related asset') + ' through a fund.';
  const names = est.slice(0, 2).map((r) => holdName(r.ticker, r.name)).join(' and ') || 'holdings you have';
  return 'You hold no ' + (subject || 'matching asset') + '; this is an estimated link through ' + names + '.';
}

export function splitText(exposure) {
  const n = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '');
  return n(exposure.direct) + '% direct · ' + n(exposure.funds) + '% funds · ' + n(exposure.estimated) + '% estimated';
}

export function shortDate(iso) {
  const full = endLabel(iso);
  if (!full) return '';
  return full.replace(/January/g, 'Jan').replace(/February/g, 'Feb').replace(/March/g, 'Mar').replace(/April/g, 'Apr').replace(/June/g, 'Jun').replace(/July/g, 'Jul').replace(/August/g, 'Aug').replace(/September/g, 'Sep').replace(/October/g, 'Oct').replace(/November/g, 'Nov').replace(/December/g, 'Dec');
}

export function moneyCompact(v) {
  if (v == null || !Number.isFinite(Number(v)) || Number(v) <= 0) return '';
  const n = Number(v);
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + Math.round(n);
}

export function strengthWords(v) {
  if (v >= 1) return 'full link, strength 1';
  if (v >= 0.5) return 'some link, strength 0.5';
  if (v > 0) return 'weak link, strength 0.25';
  return 'no link, strength 0';
}

export const LINK_GROUPS = ['direct holding', 'through a fund', 'estimated link'];
