/**
 * Read today's public odds and 24-hour volume for the site's tracked contracts.
 * A failed read is stored as no update. Nothing is filled in.
 * A --no-update run does not replace a saved day that already has odds.
 *
 *   node scripts/collect-daily.mjs
 *   node scripts/collect-daily.mjs --no-update
 */
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SITE, addDays, applyRule, buildDay, isUtcTimestamp, loadRule, loadTracked, noUpdateRow, okRow,
} from '../lib/dailyOdds.js';
import { readDayFiles, writeDay, writeHistory, writeWeeks } from '../lib/dailyStore.js';
import { fetchGammaMarkets, yesOdds } from './polymarketPublic.mjs';

export function dayHasSavedOdds(day) {
  return !!(day && (day.markets || []).some((row) => row && typeof row.odds === 'number'));
}

function finish(site, day, tracked, rule) {
  const previous = readDayFiles(site).find((item) => item.date === addDays(day.date, -1)) || null;
  const saved = { ...day, rule: applyRule(day, previous, rule) };
  writeDay(site, saved);
  const days = readDayFiles(site);
  writeHistory(site, days, tracked.map((row) => row.market_id), saved.collected_at);
  writeWeeks(site, days, rule);
  return saved;
}

export function recordNoUpdate({ site, date, collectedAt, tracked, rule }) {
  const existing = readDayFiles(site).find((day) => day.date === date) || null;
  if (dayHasSavedOdds(existing)) {
    return { skipped: true, line: date + ' skipped; saved day already has odds' };
  }
  const markets = tracked.map((meta) => noUpdateRow(meta, collectedAt, 'no update'));
  const saved = finish(site, buildDay({ date, collectedAt, markets, readBasis: 'none' }), tracked, rule);
  return { skipped: false, line: saved.date + ' ' + saved.status, saved };
}

async function main() {
  const tracked = loadTracked(SITE);
  const rule = loadRule(SITE);
  const noUpdateOnly = process.argv.includes('--no-update');

  if (noUpdateOnly) {
    const collectedAt = new Date().toISOString();
    const date = collectedAt.slice(0, 10);
    const result = recordNoUpdate({ site: SITE, date, collectedAt, tracked, rule });
    console.log(result.line);
    process.exit(0);
  }

  const collectedAt = new Date().toISOString();
  const date = collectedAt.slice(0, 10);
  let gamma;
  try {
    gamma = await fetchGammaMarkets(tracked.map((row) => row.market_id));
  } catch (err) {
    console.error('gamma read failed', err && err.message ? err.message : err);
    const markets = tracked.map((meta) => noUpdateRow(meta, collectedAt, 'gamma read failed'));
    const saved = finish(SITE, buildDay({ date, collectedAt, markets, readBasis: 'none' }), tracked, rule);
    console.log(saved.date, saved.status);
    process.exit(1);
  }

  const markets = tracked.map((meta) => {
    const market = gamma.get(meta.market_id);
    if (!market) return noUpdateRow(meta, collectedAt, 'gamma read failed');
    const odds = yesOdds(market);
    if (odds == null || odds < 0 || odds > 1) return noUpdateRow(meta, collectedAt, 'odds missing');
    const volume = market.volume24hr == null ? null : Number(market.volume24hr);
    const volumeOk = volume != null && Number.isFinite(volume) && volume >= 0;
    const observed = isUtcTimestamp(market.updatedAt) ? market.updatedAt : collectedAt;
    return okRow(meta, {
      odds,
      volume: volumeOk ? volume : null,
      volumeBasis: 'gamma_rolling_24h',
      volumeError: volumeOk ? null : 'volume missing',
      sourceUrl: 'https://gamma-api.polymarket.com/markets/' + meta.market_id,
      fetchedAt: collectedAt,
      observedAt: observed,
    });
  });

  const day = finish(SITE, buildDay({ date, collectedAt, markets, readBasis: 'gamma_live' }), tracked, rule);
  console.log(day.date, day.status);
  process.exit(day.status === 'no update' ? 1 : 0);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) await main();
