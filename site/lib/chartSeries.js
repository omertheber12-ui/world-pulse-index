/**
 * Draws the shipped daily series. Does not compute a new correlation.
 * The odds line is a running total of the daily odds change, starting at 0.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { correlationsDir } from './correlations.js';

export const SERIES_FILE = 'TR-016-2026-11-11.series.json';
export const ODDS_AXIS = 'Odds change since start';
export const ODDS_AXIS_INFLATION = 'Inflation odds change since start';
export const SIZE_ODDS_AXIS = 'Size of daily odds swing';
export const DIRECTION_NOTE = 'For a direction link, the odds line adds up the daily odds changes, starting at 0 (odds points, or basis points for inflation), and the other line is the asset\'s closing level.';
export const SIZE_NOTE = 'For a size link, the odds line is that day\'s odds swing and the other line is the size of that day\'s asset move.';
export const ODDS_LINE_NOTE = DIRECTION_NOTE;

const MOVE_NAME = {
  bitcoin: 'Bitcoin',
  gold: 'gold',
  oil: 'oil',
  nasdaq100: 'Nasdaq 100',
  sp500: 'S&P 500',
  usd_jpy: 'dollar vs yen',
  usd_ils: 'dollar vs shekel',
  us_2y_yield: '2-year yield',
  us_10y_yield: '10-year yield',
  us_3m_bill: '3-month bill',
  inflation_expectation_5y: '5-year inflation',
  inflation_expectation_10y: '10-year inflation',
};

const LEVEL_UNIT = {
  bitcoin: 'US dollars',
  gold: 'US dollars',
  oil: 'US dollars',
  nasdaq100: 'index points',
  sp500: 'index points',
  usd_jpy: 'yen per dollar',
  usd_ils: 'shekels per dollar',
  us_2y_yield: 'percent',
  us_10y_yield: 'percent',
  us_3m_bill: 'percent',
  inflation_expectation_5y: 'percent',
  inflation_expectation_10y: 'percent',
};

let cached = null;

export function seriesPath(root) {
  const base = root ? path.join(root, 'data', 'correlations') : correlationsDir();
  return path.join(base, 'series', SERIES_FILE);
}

export function loadChartSeries(root) {
  if (cached) return cached;
  const file = seriesPath(root);
  if (!existsSync(file)) return null;
  cached = JSON.parse(readFileSync(file, 'utf8'));
  return cached;
}

function leadDays(lag) {
  if (lag === 'odds_lead_1d' || lag === 'asset_lead_1d') return 1;
  if (lag === 'odds_lead_5d' || lag === 'asset_lead_5d') return 5;
  return null;
}

export function leadChartNote(lag) {
  const days = leadDays(lag);
  if (days == null) return '';
  const word = days === 1 ? 'day' : 'days';
  return 'The test compares odds with the asset ' + days + ' trading ' + word + ' later; the chart shows both on their own dates.';
}

function dailyChanges(odds) {
  if (odds.odds_measure === 'size' && Array.isArray(odds.raw_odds_points)) return odds.raw_odds_points;
  return odds.values || [];
}

function isSize(odds) {
  return odds && odds.odds_measure === 'size';
}

function oddsAxis(odds) {
  if (isSize(odds)) return SIZE_ODDS_AXIS;
  if (odds.family === 'INF_us_cpi' || String(odds.what || '').includes('basis points')) return ODDS_AXIS_INFLATION;
  return ODDS_AXIS;
}

function assetAxis(assetId, asset, size) {
  if (size) return 'Size of daily ' + (MOVE_NAME[assetId] || 'asset') + ' move';
  const name = MOVE_NAME[assetId] || 'Asset';
  const unit = LEVEL_UNIT[assetId] || asset.unit || '';
  return unit ? name + ' (' + unit + ')' : name;
}

export function oddsPointsAfterHoldBack(series) {
  const bad = [];
  if (!series) return bad;
  for (const [key, odds] of Object.entries(series.odds || {})) {
    const dates = series.assets && series.assets[odds.asset] && series.assets[odds.asset].dates;
    if (!dates) continue;
    const start = dates.indexOf(odds.first_date);
    if (start < 0) continue;
    const changes = dailyChanges(odds);
    const limit = odds.hold_back_boundary || '';
    for (let i = 0; i < changes.length; i++) {
      if (changes[i] == null) continue;
      const day = dates[start + i];
      if (day && limit && day > limit) bad.push(key + ' ' + day);
    }
  }
  return bad;
}

function geometry(series, eventFamily, assetId) {
  const key = eventFamily + '|' + assetId;
  const odds = series.odds[key];
  const asset = series.assets[assetId];
  if (!odds || !asset) return null;
  const dates = asset.dates || [];
  const start = dates.indexOf(odds.first_date);
  const end = dates.indexOf(odds.last_date);
  const changes = dailyChanges(odds);
  if (start < 0 || end < start || changes.length !== end - start + 1) return null;
  const limit = odds.hold_back_boundary || odds.last_date;
  const size = isSize(odds);
  const points = [];
  let total = 0;
  for (let i = start; i <= end; i++) {
    const day = dates[i];
    if (limit && day > limit) break;
    const change = changes[i - start];
    const finite = typeof change === 'number' && Number.isFinite(change);
    let oddsValue = null;
    if (size) oddsValue = finite ? change : null;
    else if (finite) {
      total += change;
      oddsValue = total;
    } else oddsValue = total;
    const rawAsset = size ? asset.move[i] : asset.level[i];
    const assetValue = typeof rawAsset === 'number' && Number.isFinite(rawAsset)
      ? (size ? Math.abs(rawAsset) : rawAsset)
      : null;
    points.push({ date: day, odds: oddsValue, asset: assetValue });
  }
  if (!points.length) return null;
  return {
    points,
    measure: size ? 'size' : 'direction',
    oddsAxis: oddsAxis(odds),
    assetAxis: assetAxis(assetId, asset, size),
    oddsName: size ? 'Odds swing' : 'Odds',
    assetName: MOVE_NAME[assetId] || 'Asset',
    assetUnit: LEVEL_UNIT[assetId] || asset.unit || '',
    source: asset.source || '',
  };
}

const geomCache = new Map();

export function chartModel(row) {
  const series = loadChartSeries();
  if (!series || !row || !row.eventFamily || !row.assetId) return null;
  const key = row.eventFamily + '|' + row.assetId;
  if (!geomCache.has(key)) geomCache.set(key, geometry(series, row.eventFamily, row.assetId));
  const geom = geomCache.get(key);
  if (!geom) return null;
  const lead = row.timingGroup && row.timingGroup !== 'same_day' ? leadChartNote(row.lag) : '';
  return { ...geom, leadNote: lead };
}

function rollingAverage(values, width) {
  const out = [];
  const window = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (typeof value !== 'number') {
      out.push(null);
      continue;
    }
    window.push(value);
    sum += value;
    if (window.length > width) sum -= window.shift();
    out.push(sum / window.length);
  }
  return out;
}

function sampleIndexes(length, count) {
  if (length <= count) return Array.from({ length }, (_, index) => index);
  const indexes = [];
  for (let i = 0; i < count; i++) indexes.push(Math.round((i * (length - 1)) / (count - 1)));
  return indexes;
}

/** Drawing only: a 10-day average, then enough points to read at spark size. */
export function sparkSeries(model) {
  if (!model || !model.points) return [];
  const odds = rollingAverage(model.points.map((point) => point.odds), 10);
  const asset = rollingAverage(model.points.map((point) => point.asset), 10);
  return sampleIndexes(model.points.length, 44).map((index) => ({
    odds: odds[index],
    asset: asset[index],
  }));
}

export function hasBothLines(model) {
  if (!model || !model.points) return false;
  const odds = model.points.some((point) => typeof point.odds === 'number');
  const asset = model.points.some((point) => typeof point.asset === 'number');
  return odds && asset;
}
