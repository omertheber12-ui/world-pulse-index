/**
 * Backfill saved days from public price history and public trades.
 * Odds come from the CLOB price history. Past rolling 24-hour volume is not
 * on that feed. Volume is the sum of public trade sizes on that UTC date.
 * A failed read stays no update.
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  REPO, SITE, addDays, buildDay, loadRule, loadTracked, noUpdateRow, okRow, renderBackfillTable, withRules,
} from '../lib/dailyOdds.js';
import { writeDay, writeHistory, writeWeeks } from '../lib/dailyStore.js';
import { fetchGammaMarkets, fetchPriceHistory, oddsByDate, volumeByDate, yesToken } from './polymarketPublic.mjs';

const tracked = loadTracked(SITE);
const rule = loadRule(SITE);
const collectedAt = new Date().toISOString();
const today = collectedAt.slice(0, 10);
const firstCompared = addDays(today, -29);
const firstSaved = addDays(firstCompared, -1);
const dates = [];
for (let date = firstSaved; date <= today; date = addDays(date, 1)) dates.push(date);
const startSec = Date.parse(firstSaved + 'T00:00:00Z') / 1000;
const endSec = Date.parse(today + 'T00:00:00Z') / 1000 + 86400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pool(items, limit, fn) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      await fn(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
}

console.error('tracked', tracked.length, 'days', dates[0], 'to', dates[dates.length - 1]);
const gamma = await fetchGammaMarkets(tracked.map((row) => row.market_id));
const reads = new Map();

await pool(tracked, 3, async (meta) => {
  const market = gamma.get(meta.market_id);
  if (!market) {
    reads.set(meta.market_id, { error: 'gamma read failed' });
    console.error('no gamma', meta.market_id);
    return;
  }
  const token = yesToken(market);
  const conditionId = market.conditionId || '';
  if (!token || !conditionId) {
    reads.set(meta.market_id, { error: 'price history read failed' });
    console.error('no token', meta.market_id);
    return;
  }
  let history;
  try {
    history = await fetchPriceHistory(token);
  } catch (err) {
    reads.set(meta.market_id, { error: 'price history read failed' });
    console.error('history failed', meta.market_id, err && err.message ? err.message : err);
    return;
  }
  const odds = oddsByDate(history.points);
  const needed = dates.some((date) => odds.has(date));
  let volume = { buckets: new Map(), source: '', complete: true, pages: 0 };
  if (needed) {
    try {
      volume = await volumeByDate(conditionId, startSec, endSec);
    } catch (err) {
      volume = { buckets: new Map(), source: '', complete: false, pages: 0 };
      console.error('volume failed', meta.market_id, err && err.message ? err.message : err);
    }
  }
  reads.set(meta.market_id, {
    odds,
    historyUrl: history.url,
    volume,
  });
  console.error('read', meta.market_id, 'odds days', odds.size, 'volume pages', volume.pages, 'complete', volume.complete);
  await sleep(40);
});

const volumeGaps = [];
const days = dates.map((date) => {
  const markets = tracked.map((meta) => {
    const read = reads.get(meta.market_id);
    if (!read || read.error) return noUpdateRow(meta, collectedAt, read && read.error ? read.error : 'read failed');
    const point = read.odds.get(date);
    if (!point) return noUpdateRow(meta, collectedAt, 'no price point that day');
    const basis = date === today ? 'utc_calendar_day_share_size_until_fetch' : 'utc_calendar_day_share_size';
    if (!read.volume.complete) {
      volumeGaps.push(meta.market_id + ' ' + date);
      return okRow(meta, {
        odds: point.odds,
        volume: null,
        volumeBasis: basis,
        volumeError: 'trade volume read did not finish',
        sourceUrl: point.source_url || read.historyUrl,
        fetchedAt: collectedAt,
        observedAt: point.observed_at,
      });
    }
    return okRow(meta, {
      odds: point.odds,
      volume: read.volume.buckets.get(date) || 0,
      volumeBasis: basis,
      sourceUrl: point.source_url || read.historyUrl,
      fetchedAt: collectedAt,
      observedAt: point.observed_at,
    });
  });
  return buildDay({ date, collectedAt, markets, readBasis: 'public_history' });
});

const saved = withRules(days, rule);
for (const day of saved) writeDay(SITE, day);
writeHistory(SITE, saved, tracked.map((row) => row.market_id), collectedAt);
writeWeeks(SITE, saved, rule);

const table = renderBackfillTable(saved);
const missingVolume = saved.reduce((sum, day) => sum + (day.rule.fell_out_volume_missing || 0), 0);
const noUpdateRows = saved.reduce((sum, day) => sum + (day.rule.no_update_count || 0), 0);
const doc = [];
doc.push('# Backfill of saved daily odds');
doc.push('');
doc.push('Window: ' + firstCompared + ' through ' + today + ' (30 UTC dates).');
doc.push(firstSaved + ' is also saved. It is the day before that window, so ' + firstCompared + ' has a previous day to subtract.');
doc.push('Collected at ' + collectedAt + '.');
doc.push('');
doc.push(table.quiet + ' saved days are quiet, ' + table.picked + ' have a pick, and ' + table.none + ' are no update.');
doc.push('A quiet day has no eligible move of 3 points or more. A pick is the largest absolute eligible move.');
doc.push('');
doc.push('## What the public feeds did and did not provide');
doc.push('');
doc.push('Odds are the last public CLOB price point on that UTC date for the Yes token (`prices-history`, `interval=1m`, `fidelity=60`). A request with `startTs` returned HTTP 400, so the month interval was used. If that read failed, the same public route with `interval=max` and `fidelity=1440` was tried. A date with no price point is no update for that contract. The price was not carried forward from an earlier day.');
doc.push('');
doc.push('Past 24-hour volume is not on the price history, and Gamma `volume24hr` is only the current rolling window. It was not copied onto past days.');
doc.push('');
doc.push('In its place, each finished UTC date uses the sum of public trade sizes (`data-api` `/v2/trades` for that condition id) whose timestamps fall on that date. Size is in shares. On a spot check during this work, that share sum matched Gamma `volume24hr` when the window was Gamma\'s own last 24 hours (Fed December contract 3215008: 210,935.60 shares against Gamma 210,936.77). Two other contracts were within about 2% and about 10%. Gamma labels that share sum in dollars. It is not the USDC paid (size times price), which is smaller. A day with no trades is a real zero, not a missing figure.');
doc.push('');
doc.push(today + ' is not a finished UTC day. Its odds are the latest price point so far, and its volume is trades from 00:00 UTC until this fetch. That is a shorter window than a full day.');
doc.push('');
doc.push('If the trade pages stopped before the window was covered, that contract\'s volume for the affected days is empty. The empty volume is counted in the under $10,000 column and is not replaced with a guess. Price-history misses stay no update and are left out of both filter columns.');
doc.push('');
doc.push('Trade pages that did not finish: ' + (volumeGaps.length ? volumeGaps.length + ' contract-days.' : 'none.'));
doc.push('Contract-days with no odds: ' + noUpdateRows + '.');
doc.push('Ok readings whose volume figure is missing: ' + missingVolume + '.');
doc.push('');
doc.push('The tracked contracts are the ' + tracked.length + ' markets stored on the site events in site/data/fallback.json. The TR-016 files in site/data/correlations/ do not list those market ids. They list historical event ids on busy-trading runs. Those events are closed, so they are not this daily set. Those three files were not edited.');
doc.push('');
doc.push('## Table');
doc.push('');
doc.push('Under $10,000 counts readings that are below the floor and readings that have odds but no volume figure. The number in parentheses, when present, is how many of that count had no volume figure. Outside 3% to 97% counts readings whose odds are under 3% or over 97%. A contract can be in both counts. No-update rows are in neither count.');
doc.push('');
doc.push(table.markdown);
doc.push('');

const out = path.join(REPO, 'docs', 'td013', 'backfill-table.md');
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, doc.join('\n'));
console.log('wrote', saved.length, 'days', table.quiet, 'quiet', table.picked, 'picked');
console.error('volume gap rows', volumeGaps.length, 'no update rows', noUpdateRows);
