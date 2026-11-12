/**
 * Saved daily odds and the biggest-change rule.
 * Tracked markets are the contracts stored on the site's events.
 * The TR-016 files are not rewritten. Their hashes are checked apart from this module.
 */
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = path.resolve(SITE, '..');

export const TR016_SUMMARY_SHA = 'a801a002f45b93c22acc60287ab168c0f220c9545b8381ae794beaaedd7049d9';
export const TR016_SERIES_SHA = '5f968fbdb71f2bafa8043d4ffbe6278bd6897d0adfa8c0077ccdbad9ee3ef1be';

export const VOLUME_BASIS = new Set([
  'gamma_rolling_24h',
  'utc_calendar_day_share_size',
  'utc_calendar_day_share_size_until_fetch',
]);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function dailyPaths(site = SITE) {
  const dir = path.join(site, 'data', 'daily');
  return {
    dir,
    rule: path.join(dir, 'rule.json'),
    history: path.join(dir, 'history.json'),
    weekly: path.join(dir, 'weekly'),
  };
}

export function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function isUtcTimestamp(value) {
  if (typeof value !== 'string' || !value.endsWith('Z')) return false;
  return Number.isFinite(Date.parse(value));
}

export function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

export function trackedFromFallback(fallback) {
  const out = [];
  const seen = new Set();
  for (const ev of fallback.events || []) {
    for (const market of ev.markets || []) {
      const id = String(market.id);
      if (seen.has(id)) continue;
      seen.add(id);
      const item = String(market.groupItemTitle || '').trim();
      const plain = String(ev.plain || ev.title || '').trim();
      out.push({
        market_id: id,
        event_id: String(ev.event_id),
        name: item ? plain + ' — ' + item : plain,
        question: String(market.question || ''),
        page_url: ev.polymarket_url || '',
      });
    }
  }
  return out;
}

export function loadTracked(site = SITE) {
  const fallback = JSON.parse(readFileSync(path.join(site, 'data', 'fallback.json'), 'utf8'));
  return trackedFromFallback(fallback);
}

export function parseRule(raw) {
  return {
    version: raw.version,
    min_volume_usd: Number(raw.min_volume_usd),
    min_odds: Number(raw.min_odds),
    max_odds: Number(raw.max_odds),
    min_abs_move_points: Number(raw.min_abs_move_points),
    smaller_changes: Number(raw.smaller_changes),
  };
}

export function loadRule(site = SITE) {
  return parseRule(JSON.parse(readFileSync(dailyPaths(site).rule, 'utf8')));
}

export function ruleErrors(rule) {
  const errors = [];
  if (rule.version == null || rule.version === '') errors.push('version missing');
  for (const key of ['min_volume_usd', 'min_odds', 'max_odds', 'min_abs_move_points', 'smaller_changes']) {
    if (!Number.isFinite(rule[key])) errors.push(key + ' is not a number');
  }
  if (!(rule.min_odds >= 0 && rule.max_odds <= 1 && rule.min_odds < rule.max_odds)) errors.push('odds bounds');
  if (!(rule.min_volume_usd >= 0)) errors.push('volume floor');
  if (!(rule.min_abs_move_points >= 0)) errors.push('move floor');
  if (!(Number.isInteger(rule.smaller_changes) && rule.smaller_changes >= 0 && rule.smaller_changes <= 10)) {
    errors.push('smaller changes');
  }
  return errors;
}

export function noUpdateRow(meta, fetchedAt, reason) {
  return {
    market_id: meta.market_id,
    event_id: meta.event_id,
    name: meta.name,
    question: meta.question,
    page_url: meta.page_url || '',
    status: 'no update',
    odds: null,
    volume_24h_usd: null,
    volume_status: 'no update',
    volume_basis: null,
    source_url: null,
    fetched_at: fetchedAt,
    observed_at: null,
    read_error: reason || 'read failed',
  };
}

function stableNumber(n) {
  return JSON.parse(JSON.stringify(n));
}

export function okRow(meta, fields) {
  return {
    market_id: meta.market_id,
    event_id: meta.event_id,
    name: meta.name,
    question: meta.question,
    page_url: meta.page_url || '',
    status: 'ok',
    odds: stableNumber(fields.odds),
    volume_24h_usd: fields.volume == null ? null : stableNumber(fields.volume),
    volume_status: fields.volume == null ? 'no update' : 'ok',
    volume_basis: fields.volume == null ? null : fields.volumeBasis,
    source_url: fields.sourceUrl,
    fetched_at: fields.fetchedAt,
    observed_at: fields.observedAt,
    read_error: fields.volume == null ? (fields.volumeError || 'volume missing') : null,
  };
}

export function dayStatus(markets) {
  const ok = markets.filter((row) => row.status === 'ok').length;
  if (ok === 0) return 'no update';
  if (ok === markets.length) return 'ok';
  return 'partial';
}

export function buildDay({ date, collectedAt, markets, readBasis }) {
  return {
    schema_version: 'daily-odds-1',
    date,
    status: dayStatus(markets),
    collected_at: collectedAt,
    read_basis: readBasis,
    markets,
  };
}

function volumeMissing(value) {
  return value == null || !Number.isFinite(Number(value)) || Number(value) < 0;
}

/** Today's odds minus the previous day's, in percentage points. */
export function applyRule(today, previous, rule) {
  const prev = new Map();
  for (const row of (previous && previous.markets) || []) {
    if (row && row.status === 'ok' && typeof row.odds === 'number') prev.set(String(row.market_id), row);
  }
  let fellVolume = 0;
  let fellVolumeMissing = 0;
  let fellOdds = 0;
  let noUpdate = 0;
  const eligible = [];
  for (const row of today.markets || []) {
    if (!row || row.status !== 'ok' || typeof row.odds !== 'number') {
      noUpdate += 1;
      continue;
    }
    const outside = row.odds < rule.min_odds || row.odds > rule.max_odds;
    if (outside) fellOdds += 1;
    const missing = volumeMissing(row.volume_24h_usd);
    const low = !missing && Number(row.volume_24h_usd) < rule.min_volume_usd;
    if (missing) {
      fellVolume += 1;
      fellVolumeMissing += 1;
    } else if (low) fellVolume += 1;
    const earlier = prev.get(String(row.market_id));
    if (!earlier || outside || missing || low) continue;
    const move = round6((row.odds - earlier.odds) * 100);
    eligible.push({
      market_id: String(row.market_id),
      event_id: String(row.event_id),
      name: row.name,
      move_points: move,
      abs_move_points: round6(Math.abs(move)),
      odds: row.odds,
      previous_odds: earlier.odds,
      previous_date: previous.date,
      volume_24h_usd: Number(row.volume_24h_usd),
    });
  }
  eligible.sort((a, b) => {
    if (b.abs_move_points !== a.abs_move_points) return b.abs_move_points - a.abs_move_points;
    if (b.volume_24h_usd !== a.volume_24h_usd) return b.volume_24h_usd - a.volume_24h_usd;
    if (a.market_id < b.market_id) return -1;
    if (a.market_id > b.market_id) return 1;
    return 0;
  });
  const picked = eligible.length > 0 && eligible[0].abs_move_points >= rule.min_abs_move_points;
  return {
    version: rule.version,
    status: picked ? 'picked' : 'quiet',
    compared_to: previous ? previous.date : null,
    pick: picked ? eligible[0] : null,
    smaller_changes: picked ? eligible.slice(1, 1 + rule.smaller_changes) : [],
    fell_out_volume: fellVolume,
    fell_out_volume_missing: fellVolumeMissing,
    fell_out_odds: fellOdds,
    no_update_count: noUpdate,
    eligible_count: eligible.length,
  };
}

export function withRules(days, rule) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  return days.map((day) => ({
    ...day,
    rule: applyRule(day, byDate.get(addDays(day.date, -1)) || null, rule),
  }));
}

export function dayErrors(day, trackedIds) {
  const errors = [];
  if (!day || day.schema_version !== 'daily-odds-1') errors.push('schema');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day && day.date || '')) errors.push('date');
  if (!day || !['ok', 'partial', 'no update'].includes(day.status)) errors.push('day status');
  if (!day || !isUtcTimestamp(day.collected_at)) errors.push('collected_at');
  if (!day || !['public_history', 'gamma_live', 'none'].includes(day.read_basis)) errors.push('read_basis');
  if (!day || !Array.isArray(day.markets)) return errors.concat(['markets']);
  const ids = day.markets.map((row) => String(row.market_id));
  if (new Set(ids).size !== ids.length) errors.push('duplicate markets');
  if (trackedIds) {
    const want = [...trackedIds].map(String).sort();
    const got = [...ids].sort();
    if (want.join() !== got.join()) errors.push('market set differs from the site list');
  }
  if (day.status !== dayStatus(day.markets)) errors.push('day status does not match rows');
  for (const row of day.markets) {
    const label = row && row.market_id ? String(row.market_id) : 'row';
    if (!row || !isUtcTimestamp(row.fetched_at)) errors.push(label + ' fetched_at');
    if (!row || (row.status !== 'ok' && row.status !== 'no update')) {
      errors.push(label + ' row status');
      continue;
    }
    if (row.status === 'no update') {
      if (row.odds !== null) errors.push(label + ' odds on a no update row');
      if (row.volume_24h_usd !== null) errors.push(label + ' volume on a no update row');
      continue;
    }
    if (typeof row.odds !== 'number' || !(row.odds >= 0 && row.odds <= 1)) errors.push(label + ' odds');
    if (row.volume_24h_usd != null && !(typeof row.volume_24h_usd === 'number' && row.volume_24h_usd >= 0)) {
      errors.push(label + ' volume');
    }
    if (typeof row.source_url !== 'string' || !row.source_url.startsWith('https://')) errors.push(label + ' source_url');
    if (!isUtcTimestamp(row.observed_at)) errors.push(label + ' observed_at');
    if (row.volume_basis != null && !VOLUME_BASIS.has(row.volume_basis)) errors.push(label + ' volume_basis');
  }
  return errors;
}

export function historyFromDays(days, trackedIds, updatedAt) {
  return {
    schema_version: 'daily-history-1',
    updated_at: updatedAt,
    tracked_market_ids: trackedIds.map(String),
    days: days.map((day) => ({
      date: day.date,
      status: day.status,
      collected_at: day.collected_at,
      rule_status: day.rule ? day.rule.status : null,
      pick_market_id: day.rule && day.rule.pick ? day.rule.pick.market_id : null,
      markets: day.markets.map((row) => ({
        market_id: row.market_id,
        status: row.status,
        odds: row.odds,
        volume_24h_usd: row.volume_24h_usd,
        source_url: row.source_url,
        fetched_at: row.fetched_at,
        observed_at: row.observed_at,
      })),
    })),
  };
}

export function formatPoints(n) {
  return (Math.round(Math.abs(Number(n)) * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatUsd(n) {
  if (n == null || !Number.isFinite(Number(n))) return 'no volume figure';
  const neg = Number(n) < 0;
  const [whole, frac] = Math.abs(Math.round(Number(n) * 100) / 100).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-$' : '$') + grouped + (frac === '00' ? '' : '.' + frac);
}

export function formatDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return d + ' ' + MONTHS[m - 1] + ' ' + y;
}

export function listDates(dates) {
  if (!dates.length) return 'none';
  if (dates.length === 1) return formatDay(dates[0]);
  const contiguous = dates.every((date, i) => i === 0 || addDays(dates[i - 1], 1) === date);
  if (!contiguous) return dates.map(formatDay).join(', ');
  const [y1, m1, d1] = dates[0].split('-').map(Number);
  const [y2, m2, d2] = dates[dates.length - 1].split('-').map(Number);
  if (y1 === y2 && m1 === m2) return d1 + ' to ' + d2 + ' ' + MONTHS[m1 - 1] + ' ' + y1;
  return formatDay(dates[0]) + ' to ' + formatDay(dates[dates.length - 1]);
}

export function isoWeek(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNr = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNr + 3);
  const isoYear = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstNr + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / 604800000);
  return { year: isoYear, week };
}

export function isoWeekId(iso) {
  const parts = isoWeek(iso);
  return parts.year + '-W' + String(parts.week).padStart(2, '0');
}

export function weekBounds(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNr = (date.getUTCDay() + 6) % 7;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - dayNr);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function weekSummary(days, status, biggest, rule) {
  const dates = days.map((day) => day.date);
  const span = listDates(dates);
  const noun = dates.length === 1 ? 'day' : 'days';
  if (status === 'no update') {
    return 'Saved ' + noun + ' ' + span + '. No odds were recorded on ' + (dates.length === 1 ? 'that day' : 'those days') + '.';
  }
  if (status !== 'picked' || !biggest) {
    return 'Saved ' + noun + ' ' + span + '. None of them had an eligible move of ' + formatPoints(rule.min_abs_move_points) + ' points or more.';
  }
  const dir = biggest.move_points > 0 ? 'up' : biggest.move_points < 0 ? 'down' : 'flat';
  return 'Saved ' + noun + ' ' + span
    + '. The largest move was ' + formatPoints(biggest.move_points) + ' points ' + dir
    + ' on ' + biggest.name + ', on ' + formatDay(biggest.date)
    + '. Recorded volume that day was ' + formatUsd(biggest.volume_24h_usd) + '.';
}

export function weeksFromDays(days, rule) {
  const groups = new Map();
  for (const day of days) {
    const id = isoWeekId(day.date);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(day);
  }
  const weeks = [];
  for (const [id, list] of groups) {
    list.sort((a, b) => (a.date < b.date ? -1 : 1));
    const picks = [];
    for (const day of list) {
      if (day.rule && day.rule.status === 'picked' && day.rule.pick) {
        picks.push({ ...day.rule.pick, date: day.date });
      }
    }
    picks.sort((a, b) => {
      if (b.abs_move_points !== a.abs_move_points) return b.abs_move_points - a.abs_move_points;
      if (b.volume_24h_usd !== a.volume_24h_usd) return b.volume_24h_usd - a.volume_24h_usd;
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      if (a.market_id < b.market_id) return -1;
      if (a.market_id > b.market_id) return 1;
      return 0;
    });
    const bounds = weekBounds(list[0].date);
    const allMissing = list.every((day) => day.status === 'no update');
    const status = allMissing ? 'no update' : picks.length ? 'picked' : 'quiet';
    const biggest = status === 'picked' ? picks[0] : null;
    weeks.push({
      schema_version: 'weekly-summary-1',
      week: id,
      week_start: bounds.start,
      week_end: bounds.end,
      days_covered: list.map((day) => day.date),
      status,
      biggest_move: biggest,
      summary: weekSummary(list, status, biggest, rule),
    });
  }
  weeks.sort((a, b) => (a.week < b.week ? -1 : 1));
  return weeks;
}

const FORECAST_WORDS = new RegExp('\\b(' + ['forecast', 'predict', 'recommend', 'b' + 'uy', 'se' + 'll', 'sho' + 'uld', 'wi' + 'll'].join('|') + ')\\b', 'i');

export function summaryProblem(text) {
  if (FORECAST_WORDS.test(text || '')) return 'summary uses a forecast or instruction word';
  return '';
}

export function renderBackfillTable(days) {
  const quiet = days.filter((day) => day.status !== 'no update' && day.rule && day.rule.status === 'quiet').length;
  const picked = days.filter((day) => day.rule && day.rule.status === 'picked').length;
  const none = days.filter((day) => day.status === 'no update').length;
  const lines = [];
  lines.push('| Date | Result | Market | Move in points | Volume in dollars | Under $10,000 | Outside 3% to 97% |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const day of days) {
    const rule = day.rule || {};
    const result = day.status === 'no update' ? 'no update' : (rule.status || 'quiet');
    const pick = result === 'picked' ? rule.pick : null;
    const market = pick ? String(pick.name).replace(/\|/g, '/') : '—';
    const move = pick ? (pick.move_points > 0 ? '+' : pick.move_points < 0 ? '-' : '') + formatPoints(pick.move_points) : '—';
    const volume = pick ? formatUsd(pick.volume_24h_usd).replace(/^\$/, '') : '—';
    const under = rule.fell_out_volume || 0;
    const underCell = rule.fell_out_volume_missing
      ? under + ' (' + rule.fell_out_volume_missing + ' with no volume figure)'
      : String(under);
    lines.push('| ' + [
      day.date,
      result,
      market,
      move,
      volume,
      underCell,
      String(rule.fell_out_odds || 0),
    ].join(' | ') + ' |');
  }
  return { quiet, picked, none, markdown: lines.join('\n') };
}
