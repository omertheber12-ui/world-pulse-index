/**
 * Read today's public odds and 24-hour volume for the site's tracked contracts.
 * A failed read is stored as no update. Nothing is filled in.
 *
 *   node scripts/collect-daily.mjs
 *   node scripts/collect-daily.mjs --no-update
 */
import {
  SITE, addDays, applyRule, buildDay, isUtcTimestamp, loadRule, loadTracked, noUpdateRow, okRow,
} from '../lib/dailyOdds.js';
import { readDayFiles, writeDay, writeHistory, writeWeeks } from '../lib/dailyStore.js';
import { fetchGammaMarkets, yesOdds } from './polymarketPublic.mjs';

const tracked = loadTracked(SITE);
const rule = loadRule(SITE);
const noUpdateOnly = process.argv.includes('--no-update');

function previousDay(date) {
  const want = addDays(date, -1);
  return readDayFiles(SITE).find((day) => day.date === want) || null;
}

function finish(day) {
  const saved = { ...day, rule: applyRule(day, previousDay(day.date), rule) };
  writeDay(SITE, saved);
  const days = readDayFiles(SITE);
  const updatedAt = saved.collected_at;
  writeHistory(SITE, days, tracked.map((row) => row.market_id), updatedAt);
  writeWeeks(SITE, days, rule);
  console.log(saved.date, saved.status);
  return saved;
}

if (noUpdateOnly) {
  const collectedAt = new Date().toISOString();
  const date = collectedAt.slice(0, 10);
  const markets = tracked.map((meta) => noUpdateRow(meta, collectedAt, 'no update'));
  finish(buildDay({ date, collectedAt, markets, readBasis: 'none' }));
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
  finish(buildDay({ date, collectedAt, markets, readBasis: 'none' }));
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

const day = finish(buildDay({ date, collectedAt, markets, readBasis: 'gamma_live' }));
process.exit(day.status === 'no update' ? 1 : 0);
