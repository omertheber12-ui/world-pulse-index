#!/usr/bin/env node
/** Ported checks: data, duplicates, ranges, ranking, no advice, no secrets, and the rendered pages. */
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { headline } from '../lib/copy.js';
import { rankOpen } from '../lib/score.js';

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

const h = headline(rankOpen(fallback.events, ctx), rules);
add('Fallback headline is 12 words or fewer', h.text.split(/\s+/).filter(Boolean).length <= 12, h.text);

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
  if (adviceRe.test(t) && !f.endsWith('run.mjs')) adviceHits.push(path.relative(root, f));
}
add('No secrets or keys in site files', secretHits.length === 0, secretHits.join(','));
add('No buy/sell advice wording in source', adviceHits.length === 0, adviceHits.join(','));

let server;
let base = process.env.BASE_URL || '';
if (!base) {
  server = spawn('npx', ['next', 'start', '-p', '3456', '-H', '127.0.0.1'], { cwd: root, stdio: 'inherit' });
  base = 'http://127.0.0.1:3456';
  const started = Date.now();
  let ready = false;
  while (Date.now() - started < 30000) {
    try {
      const r = await fetch(base + '/');
      if (r.status) { ready = true; break; }
    } catch { /* wait */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  add('Next server started', ready);
}

async function page(urlpath) {
  const res = await fetch(base + urlpath, { redirect: 'follow' });
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
  add('Today headline is 12 words or fewer', h1 && h1.split(/\s+/).length <= 12, h1);
  const rankAttr = (today.match(/data-ranking="([^"]*)"/) || [, ''])[1];
  const ranking = rankAttr ? rankAttr.split(',').map((x) => x.split(':')) : [];
  const rowIds = [...today.matchAll(/data-id="(\d+)"/g)].map((m) => m[1]);
  const att = ranking.map((x) => Number(x[1]));
  add('Today top 5 rows are the first 5 of the attention ranking',
    ranking.length >= 5 && rowIds.slice(0, 5).join(',') === ranking.slice(0, 5).map((x) => x[0]).join(',')
    && att.every((n, i) => i === 0 || att[i - 1] >= n - 1e-9),
    'rows=' + rowIds.slice(0, 5).join(',') + ' top=' + ranking.slice(0, 5).map((x) => x[0]).join(','));
  add('Today shows the touch line and All events link',
    today.includes('of your portfolio could be touched') && today.includes('All events'));
  const err = await page('/?state=error');
  add('Error state shows a short message and keeps figures',
    err.html.includes('Live read failed') && err.html.includes('data-id='));
  const loading = await page('/?state=loading');
  add('Loading state shows grey blocks', (loading.html.match(/class="sk/g) || []).length >= 5);
  const empty = await page('/?state=empty');
  add("Empty state shows 'No events to show right now'", empty.html.includes('No events to show right now'));
  const ev = doms['/event/770450'].html;
  add('Event detail keeps the figure, holdings fold, and Polymarket link',
    ev.includes('Show holdings') && ev.includes('Could touch') && ev.includes('Open on Polymarket') && ev.includes('If it happens') && ev.includes('Guess'));
  const ee = await page('/events?state=empty&g=worldwide_elections');
  add('Events empty chip names the group', ee.html.includes('No open events in Elections right now.'));
  const pe = await page('/portfolio?state=empty');
  add('Portfolio empty state is short', pe.html.includes('No holdings to show yet.'));
  const port = doms['/portfolio'].html;
  const linkRows = [...port.matchAll(/class="linkrow[^"]*"[\s\S]*?<\/div>/g)];
  const unlabeled = linkRows.filter((m) => !m[0].includes('Guess'));
  const evRows = [...ev.matchAll(/class="linkrow[^"]*"[\s\S]*?<\/div>/g)];
  const evUn = evRows.filter((m) => !m[0].includes('Guess'));
  add('Every event-to-holding link labeled Guess',
    linkRows.length + evRows.length > 0 && unlabeled.length === 0 && evUn.length === 0,
    'portfolio ' + linkRows.length + ' event ' + evRows.length + ' unlabeled ' + (unlabeled.length + evUn.length));
  const advicePages = [];
  for (const [p, r] of Object.entries(doms)) {
    if (adviceRe.test(textOf(r.html))) advicePages.push(p);
  }
  add('No buy/sell advice wording on pages', advicePages.length === 0, advicePages.join(','));
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
