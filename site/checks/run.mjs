#!/usr/bin/env node
/** Ported checks: data, duplicates, ranges, ranking, no advice, no secrets, and the rendered pages. */
import { execSync, spawn, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chancePhrase, changeLine, changeVerb, strayTitleCase, thinMarketNote, whyMatters } from '../lib/copy.js';
import { runConnectionChecks, connectionPageChecks } from './connectionsCheck.mjs';
import { runCorrelationChecks, correlationPageChecks } from './correlationsCheck.mjs';
import { homeEligible, moveScore, qualityScore, rankOpen } from '../lib/score.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
function add(name, ok, detail = '') {
  checks.push({ check: name, pass: Boolean(ok), detail: detail || '' });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail && !ok ? '  ' + detail : ''));
}

const fallback = JSON.parse(readFileSync(path.join(root, 'data/fallback.json'), 'utf8'));
const rules = JSON.parse(readFileSync(path.join(root, 'data/rules.json'), 'utf8'));
const holdings = JSON.parse(readFileSync(path.join(root, 'data/holdings.json'), 'utf8'));
const ctx = { holdings, rules };

const ids = fallback.events.map((e) => e.event_id);
add('No duplicate events', ids.length === new Set(ids).size, ids.length + ' events');
const groups = {};
for (const e of fallback.events) groups[e.group] = (groups[e.group] || 0) + 1;
add('Each of four groups has at least one event',
  ['central_bank_rates', 'big_company_events', 'worldwide_elections', 'wars'].every((g) => groups[g] >= 1),
  JSON.stringify(groups));

const bad = [];
for (const e of fallback.events) {
  for (const m of e.markets) {
    for (const p of (Array.isArray(m.outcomePrices) ? m.outcomePrices : JSON.parse(m.outcomePrices || '[]'))) {
      const n = Number(p) * 100;
      if (!(n >= 0 && n <= 100)) bad.push(e.event_id);
    }
  }
}
add('All percentages between 0 and 100', bad.length === 0, bad.join(','));

const jsIds = rankOpen(fallback.events, ctx).map((s) => s.ev.event_id);
const py = spawnSync('python3', [path.join(root, 'checks/rank.py')], { encoding: 'utf8' });
let pyIds = [];
try { pyIds = JSON.parse(py.stdout || '[]'); } catch { pyIds = []; }
add('Built-in ranking matches Python recompute of Product task 10 scoring',
  py.status === 0 && JSON.stringify(jsIds) === JSON.stringify(pyIds),
  'js=' + jsIds.slice(0, 5).join(',') + ' py=' + pyIds.slice(0, 5).join(','));

const sampleQ = "Will Nvidia's market capitalization be less than $4.00T at the end of 2026?";
const phrase = chancePhrase(sampleQ, '2026-12-31T23:59:00Z');
const sampleHead = 'Chance that ' + phrase + ' ' + changeVerb(12.4);
const sampleLine = changeLine(25.7, 12.4);
add('Headline is built from the question, end date, and change',
  sampleHead.startsWith('Chance that ') && sampleHead.includes('2026') && sampleHead.endsWith(' rose')
  && sampleHead.toLowerCase().includes('market value') && sampleHead.includes('$4 trillion')
  && sampleLine === 'from 13.3% to 25.7% in 24 hours, up 12.4 points',
  sampleHead + ' | ' + sampleLine);
const fedEv = fallback.events.find((e) => e.strength_key === 'central_bank_rates_fed');
const fedScore = fedEv ? rankOpen([fedEv], ctx)[0] : null;
const fedTickers = fedScore ? fedScore.exposure.rows.map((r) => r.ticker) : [];
add('A rate decision does not count every holding as an estimated link',
  fedScore && fedScore.exposure.total < 90 && fedScore.exposure.total > 0
  && !fedTickers.includes('BTC') && !fedTickers.includes('ETH') && !fedTickers.includes('INTC')
  && fedTickers.includes('JPM') && fedTickers.includes('BAC')
  && whyMatters(fedScore.exposure).includes('estimated link through'),
  fedScore ? fedScore.exposure.total.toFixed(1) + ' ' + fedTickers.join(',') + ' | ' + whyMatters(fedScore.exposure) : 'missing');
const ceaseHead = 'Chance that ' + chancePhrase('US x Iran Effective Ceasefire by November 15?', '2026-11-15T12:00:00Z') + ' rose';
const caseHits = [];
for (const e of fallback.events) {
  const m = (e.markets || []).find((x) => !x.closed) || (e.markets || [])[0];
  if (!m) continue;
  const head = 'Chance that ' + chancePhrase(m.question, m.endDate) + ' rose';
  const stray = strayTitleCase(head);
  if (stray.length) caseHits.push(head + ' [' + stray.join(', ') + ']');
}
add('Headlines use sentence case, not the market title case',
  ceaseHead === 'Chance that the US and Iran reach an effective ceasefire by 15 November 2026 rose'
  && strayTitleCase(ceaseHead).length === 0
  && caseHits.length === 0
  && strayTitleCase('Chance that Nvidia Q3 Data Center revenue is above $100 billion rose').includes('Data'),
  ceaseHead + (caseHits.length ? ' | ' + caseHits.join(' | ') : ''));
add('A move under 1 point reads held steady',
  changeVerb(0.4) === 'held steady' && changeLine(80.5, 0.4) === 'at 80.5%, less than 1 point change in 24 hours' && changeVerb(-4) === 'fell');

runConnectionChecks(add);
runCorrelationChecks(add);

let gammaOk = true;
const gammaDetail = [];
for (const id of ids) {
  try {
    const res = await fetch('https://gamma-api.polymarket.com/events/' + id, {
      headers: { accept: 'application/json', 'user-agent': 'WorldPulseIndex/1.0' },
      signal: AbortSignal.timeout(12000),
    });
    gammaDetail.push(id + ':' + res.status);
    if (res.status !== 200) gammaOk = false;
    else {
      const j = await res.json();
      for (const m of j.markets || []) {
        const prices = Array.isArray(m.outcomePrices) ? m.outcomePrices : JSON.parse(m.outcomePrices || '[]');
        for (const p of prices) {
          const n = Number(p) * 100;
          if (!(n >= 0 && n <= 100)) gammaOk = false;
        }
      }
    }
  } catch (err) {
    gammaOk = false;
    gammaDetail.push(id + ':' + err.message);
  }
}
add('Gamma HTTP 200 for all events', gammaOk, gammaDetail.join(', '));

const css = readFileSync(path.join(root, 'app/globals.css'), 'utf8').toUpperCase();
const specColors = ['#172F32', '#116C5B', '#E8F3F0', '#CFE6DF', '#F7F9F9', '#FFFFFF', '#E3E8E8', '#6B7C7E', '#3E5254', '#B4532A', '#8A5A00', '#FFF4DB', '#5B4B8A', '#EFEBFA', '#A3262A', '#FDECEC'];
const miss = specColors.filter((c) => !css.includes(c));
add('Spec colors present in layout.css', miss.length === 0, miss.join(','));
add('Inter font with tabular numbers', css.includes('INTER') && css.includes('TNUM'));

const secretRe = /((api[_-]?key|secret|password|passwd|auth[_-]?token)\s*[:=]\s*['"]?\w{6,}|bearer\s+\w{10,}|ghp_\w{10,}|sk-[A-Za-z0-9]{10,})/i;
const adviceRe = /\b(buy|sell|should (buy|sell|hold)|we recommend)\b/i;
const bannedRe = /\b(edge|alpha|risk-free)\b/i;
function visibleCopy(file, text) {
  if (file.endsWith('.css')) return '';
  let t = text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
  t = t.replace(/\b(className|class)\s*=\s*(['"`])(?:\\.|(?!\2)[\s\S])*?\2/g, ' ');
  if (/\.(js|mjs|py|json)$/.test(file)) {
    const parts = [];
    const re = /(['"`])((?:\\.|(?!\1)[\s\S])*)\1/g;
    let m;
    while ((m = re.exec(t))) parts.push(m[2]);
    return parts.join('\n');
  }
  if (file.endsWith('.html')) {
    return t.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  }
  return t;
}
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === 'shots' || name === 'checks.json') continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(js|mjs|css|json|html|py)$/.test(name)) acc.push(p);
  }
  return acc;
}
const files = walk(root);
const secretHits = [];
const adviceHits = [];
for (const f of files) {
  if (f.endsWith('run.mjs') || f.endsWith('rank.py')) continue;
  const t = readFileSync(f, 'utf8');
  if (secretRe.test(t)) secretHits.push(path.relative(root, f));
  if ((adviceRe.test(t) || bannedRe.test(visibleCopy(f, t))) && !f.endsWith('run.mjs')) adviceHits.push(path.relative(root, f));
}
add('No secrets or keys in site files', secretHits.length === 0, secretHits.join(','));
add('No buy/sell, edge, alpha, or risk-free wording in source', adviceHits.length === 0, adviceHits.join(','));

let server;
let base = process.env.BASE_URL || '';
if (!base) {
  try { execSync('fuser -k 3461/tcp', { stdio: 'ignore' }); } catch { /* free */ }
  server = spawn('npx', ['next', 'start', '-p', '3461', '-H', '127.0.0.1'], { cwd: root, stdio: 'inherit' });
  base = 'http://127.0.0.1:3461';
  const started = Date.now();
  let ready = false;
  while (Date.now() - started < 30000) {
    try {
      const r = await fetch(base + '/', { signal: AbortSignal.timeout(4000) });
      if (r.status) { ready = true; break; }
    } catch { /* wait */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  add('Next server started', ready);
}

async function page(urlpath) {
  const res = await fetch(base + urlpath, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
  const html = await res.text();
  return { status: res.status, html, final: res.url };
}
function textOf(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

if (base) {
  const pages = [
    ['/', 'today'],
    ['/events', 'events'],
    ['/event/770450', 'event'],
    ['/portfolio', 'portfolio'],
    ['/how', 'how'],
  ];
  const doms = {};
  for (const [p] of pages) {
    const r = await page(p);
    doms[p] = r;
    add(p + ": nav + footer + 'Insights only, not advice'",
      r.status === 200 && r.html.includes('class="tab') && r.html.includes('Polymarket, public data') && r.html.includes('Insights only, not advice') && r.html.includes('/how'));
  }
  const today = doms['/'].html;
  const h1 = (today.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1].replace(/<[^>]+>/g, '').trim();
  add('Today headline is built from the question, end date, and change',
    /^Chance that /.test(h1) && /(rose|fell|held steady)/.test(h1) && /20\d\d/.test(h1) && today.includes('in 24 hours'),
    h1);
  const liveHeads = [...today.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter((t) => t.startsWith('Chance that '));
  const liveStray = liveHeads.flatMap((t) => strayTitleCase(t).map((w) => t + ' [' + w + ']'));
  add('Live headlines have no mid-sentence Title Case words except proper nouns',
    liveHeads.length > 0 && liveStray.length === 0, liveStray.join(' | ') || liveHeads[0] || '');
  const rankAttr = (today.match(/data-ranking="([^"]*)"/) || [, ''])[1];
  const ranking = rankAttr ? rankAttr.split(',').map((x) => x.split(':')) : [];
  const rowIds = [...today.matchAll(/data-id="(\d+)"/g)].map((m) => m[1]);
  const att = ranking.map((x) => Number(x[1]));
  add('Today top 3 cards are the first 3 of the personal ranking',
    ranking.length >= 3 && rowIds.length === 3 && rowIds.join(',') === ranking.slice(0, 3).map((x) => x[0]).join(',')
    && att.every((n, i) => i === 0 || att[i - 1] >= n - 1e-9),
    'rows=' + rowIds.join(',') + ' top=' + ranking.slice(0, 3).map((x) => x[0]).join(','));
  add('Exposure text says this is not an expected loss',
    today.includes('Share of your portfolio linked to this event. This is not an expected loss.') && today.includes('All events') && today.includes('Sample portfolio'));
  add('Breakdown groups are present',
    today.includes('% direct') && today.includes('% funds') && today.includes('% estimated'));
  const err = await page('/?state=error');
  add('Error state shows a short message and keeps figures',
    err.html.includes('Live read failed') && err.html.includes('data-id='));
  const loading = await page('/?state=loading');
  add('Loading state shows grey blocks', (loading.html.match(/class="sk/g) || []).length >= 5);
  const empty = await page('/?state=empty');
  add("Empty state shows 'No events to show right now'", empty.html.includes('No events to show right now'));
  const ev = doms['/event/770450'].html;
  add('Event detail keeps the exposure breakdown and Polymarket link',
    ev.includes('Show holdings') && ev.includes('Share of your portfolio linked to this event. This is not an expected loss.')
    && ev.includes('Polymarket') && ev.includes('Guess') && ev.includes('% direct'));
  const cardSrc = readFileSync(path.join(root, 'app/components/StoryCard.js'), 'utf8');
  add('Event headline area shows the source, update time, and thin-market note',
    cardSrc.includes('className="headmeta"') && cardSrc.includes('thinMarketNote')
    && thinMarketNote(49999, 20000) === 'Thin market: few trades'
    && thinMarketNote(80000, 9999) === 'Thin market: few trades'
    && thinMarketNote(50000, 10000) === ''
    && thinMarketNote(null, null) === ''
    && /<h1[\s\S]*?<\/h1>[\s\S]*?class="headmeta"[\s\S]*?Polymarket[\s\S]*?updated /.test(ev));
  const how = doms['/how'].html;
  add('How it works states the score formula, caps, and exclusion rules',
    how.includes('Score = 0.5 × Move + 0.35 × Exposure + 0.15 × Quality')
    && how.includes('capped at 20 points') && how.includes('capped at 50%')
    && how.includes('under $10,000') && how.includes('6 hours') && how.includes('Thin market'));
  const move62 = moveScore(12.4).move;
  add('Move score is capped at 20 points', Math.abs(move62 - 62) < 0.05 && moveScore(40).move === 100, String(move62));
  const thinLead = { volume24hr: 1000, liquidity: 100, updatedAt: new Date().toISOString() };
  const freshLead = { volume24hr: 80000, liquidity: 20000, updatedAt: new Date().toISOString() };
  add('Quality is 50 when the market is thin and 100 otherwise', qualityScore(thinLead, {}) === 50 && qualityScore(freshLead, {}) === 100);
  const dropped = homeEligible({ lead: { volume24hr: 100, endDate: '2027-01-01T00:00:00Z' }, exposure: { total: 10 }, ev: {} });
  const kept = homeEligible({ lead: { volume24hr: 20000, endDate: '2027-01-01T00:00:00Z', updatedAt: new Date().toISOString() }, exposure: { total: 10 }, ev: {} });
  const noLink = homeEligible({ lead: { volume24hr: 20000, endDate: '2027-01-01T00:00:00Z' }, exposure: { total: 0 }, ev: {} });
  add('Events under $10k volume, with no linked holdings, or past their end date are left out', dropped === false && kept === true && noLink === false);
  const ee = await page('/events?state=empty&g=worldwide_elections');
  add('Events empty chip names the group', ee.html.includes('No open events in Elections right now.'));
  const pe = await page('/portfolio?state=empty');
  add('Portfolio empty state is short', pe.html.includes('No holdings to show yet.'));
  const port = doms['/portfolio'].html;
  const rowRe = /class="linkrow[^"]*"[^>]*>([\s\S]*?)<\/(?:div|p)>/g;
  const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  const linkRows = [...visible(port).matchAll(rowRe)];
  const labeled = (chunk) => /Guess|how strongly/.test(chunk);
  const unlabeled = linkRows.filter((m) => !labeled(m[0]));
  const evRows = [...visible(ev).matchAll(rowRe)];
  const evUn = evRows.filter((m) => !labeled(m[0]));
  add('Every event-to-holding link labeled Guess',
    linkRows.length + evRows.length > 0 && unlabeled.length === 0 && evUn.length === 0,
    'portfolio ' + linkRows.length + ' event ' + evRows.length + ' unlabeled ' + (unlabeled.length + evUn.length));
  const advicePages = [];
  for (const [p, r] of Object.entries(doms)) {
    const visibleText = textOf(r.html);
    if (adviceRe.test(visibleText) || bannedRe.test(visibleText)) advicePages.push(p);
  }
  add('No buy/sell, edge, alpha, or risk-free wording on pages', advicePages.length === 0, advicePages.join(','));
  await connectionPageChecks(add, page);
  await correlationPageChecks(add, page);
  const redir = await fetch(base + '/today.html', { redirect: 'manual' });
  const loc = redir.headers.get('location') || '';
  add('today.html redirects to the Today page', (redir.status === 307 || redir.status === 308) && (loc === '/' || loc.endsWith('/')));
}

const allPass = checks.every((c) => c.pass);
const out = { run_at: new Date().toISOString(), all_pass: allPass, items: checks };
writeFileSync(path.join(root, 'checks.json'), JSON.stringify(out, null, 2));
console.log('all_pass', allPass);
if (server) server.kill('SIGTERM');
process.exit(allPass ? 0 : 1);
