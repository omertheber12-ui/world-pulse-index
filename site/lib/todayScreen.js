/**
 * View model for Today and the shared weekly page.
 * Reads saved daily files through the daily lib. Does not invent a missing number.
 */
import { clock } from './copy.js';
import { linkId, loadCorrelations, pageHeadline } from './correlations.js';
import { addDays, formatDay, formatPoints, listDates, loadRule, withRules } from './dailyOdds.js';
import { readDayFiles, readWeekFiles } from './dailyStore.js';
import {
  SAME_DAY_LESSON,
  chartCaption,
  directionOf,
  displayName,
  formatOddsPercent,
  moveSentence,
  shortDay,
  smallerLabel,
} from './screenCopy.js';

export function demoAllowed(env = {}) {
  const vercelEnv = env.VERCEL_ENV;
  if (vercelEnv === 'production') return false;
  return vercelEnv === 'preview' || vercelEnv === 'development' || env.VERCEL !== '1';
}

export function demoMode(value, allowed) {
  if (!allowed) return '';
  const text = String(value || '');
  if (text === 'quiet') return 'quiet';
  if (text === 'noupdate' || text === 'no-update' || text === 'no update') return 'no update';
  if (text === 'nobaseline' || text === 'no-baseline' || text === 'no baseline') return 'no baseline';
  return '';
}

export function nextUpdateClock(now = new Date()) {
  const next = new Date(now.getTime());
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(5, 0, 0, 0);
  return clock(next.getTime());
}

function pairsOf() {
  try {
    const loaded = loadCorrelations();
    return (loaded && loaded.file && loaded.file.pairs) || [];
  } catch {
    return [];
  }
}

export function connectionHref(marketId, pairs) {
  const id = String(marketId || '');
  if (!id) return '';
  const hit = (pairs || []).find((row) => row && row.market_id != null && String(row.market_id) === id);
  if (!hit) return '';
  return { href: '/connections/' + linkId(hit), headline: pageHeadline(hit) };
}

function classify(day) {
  if (!day || day.status === 'no update') return 'no update';
  const status = day.rule && day.rule.status;
  if (status === 'no baseline') return 'no baseline';
  if (status === 'quiet') return 'quiet';
  if (status === 'picked' && day.rule && day.rule.pick) return 'picked';
  if (status === 'no update') return 'no update';
  return 'no update';
}

function stamp(day) {
  const raw = day && day.collected_at;
  const ms = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(ms) ? ms : null;
}

function seriesFor(days, marketId, dates) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  return dates.map((date) => {
    const day = byDate.get(date);
    const row = day && (day.markets || []).find((item) => String(item.market_id) === String(marketId));
    const odds = row && row.status === 'ok' && typeof row.odds === 'number' ? row.odds : null;
    return {
      date,
      dateLabel: formatDay(date),
      odds,
      oddsLabel: odds == null ? '' : formatOddsPercent(odds),
    };
  });
}

function last7(days, marketId, endDate) {
  const dates = [];
  for (let i = 6; i >= 0; i -= 1) dates.push(addDays(endDate, -i));
  return seriesFor(days, marketId, dates);
}

function whenPhrase(date, previous) {
  if (previous && addDays(previous, 1) === date) return 'since yesterday';
  if (previous) return 'since ' + formatDay(previous);
  return 'since the earlier saved day';
}

function moveLine(row, when) {
  const name = displayName(row.name);
  const direction = directionOf(row.move_points);
  const points = formatPoints(row.move_points);
  return moveSentence(name, direction, points, when);
}

function chartBlock(points, startLabel, endLabel) {
  return {
    points,
    startLabel,
    endLabel,
    caption: chartCaption(points),
  };
}

function pulseFrom(ms) {
  const at = ms || Date.now();
  return { liveOk: true, gammaAt: at, builtMs: at };
}

function lastGood(days, beforeDate) {
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i];
    if (beforeDate && day.date >= beforeDate) continue;
    const mode = classify(day);
    if (mode === 'picked' || mode === 'quiet') return day;
  }
  return null;
}

function unread(days, latest, mode) {
  const good = lastGood(days, latest && latest.date);
  return {
    mode,
    title: 'What changed today',
    dateLabel: latest && latest.date ? formatDay(latest.date) : '',
    updatedLabel: '',
    hint: false,
    message: mode === 'no baseline'
      ? "The latest data can't be compared yet."
      : 'The latest data could not be read.',
    lastGoodLabel: good ? formatDay(good.date) : '',
    pick: null,
    smaller: null,
    caughtUp: '',
    weekHref: '/week',
    pulse: pulseFrom(stamp(good) || stamp(latest)),
  };
}

export function todayModel(days, pairs, mode) {
  const list = (days || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  const latest = list[list.length - 1] || null;
  if (!latest) return unread([], null, 'no update');
  const actual = classify(latest);
  const shown = mode || actual;
  if (shown === 'no update' || shown === 'no baseline') return unread(list, latest, shown);
  const ms = stamp(latest);
  const caughtUp = 'That is everything that changed today. Next update tomorrow at ' + nextUpdateClock() + ' Israel time.';
  const base = {
    mode: shown,
    title: 'What changed today',
    dateLabel: formatDay(latest.date),
    updatedLabel: ms ? clock(ms) : '',
    hint: true,
    message: '',
    lastGoodLabel: '',
    caughtUp,
    weekHref: '/week',
    pulse: pulseFrom(ms),
  };
  if (shown === 'quiet') {
    return { ...base, hint: false, pick: null, smaller: null, message: 'No meaningful move since yesterday.' };
  }
  const pick = latest.rule.pick;
  const link = connectionHref(pick.market_id, pairs);
  const smallerRows = (latest.rule.smaller_changes || []).filter((row) => row && row.name);
  return {
    ...base,
    pick: {
      name: displayName(pick.name),
      sentence: moveLine(pick, whenPhrase(latest.date, pick.previous_date)),
      href: link ? link.href : '',
      chart: chartBlock(last7(list, pick.market_id, latest.date), 'Last 7 days', 'Today'),
    },
    smaller: smallerRows.length ? {
      label: smallerLabel(smallerRows.length),
      titles: smallerRows.map((row) => displayName(row.name)),
      moves: smallerRows.map((row) => moveLine(row, whenPhrase(latest.date, row.previous_date))),
    } : null,
  };
}

function weekChart(days, move, covered) {
  const dates = (covered || []).slice();
  if (move.previous_date && !dates.includes(move.previous_date)) dates.unshift(move.previous_date);
  dates.sort();
  const points = seriesFor(days, move.market_id, dates);
  const start = points[0] ? shortDay(points[0].date) : '';
  const end = points.length ? shortDay(points[points.length - 1].date) : '';
  return chartBlock(points, start, end);
}

export function weekModel(week, days, pairs, rule) {
  const empty = {
    title: 'This week in one minute',
    range: '',
    saved: '',
    cards: [{ kicker: 'This week', sentence: 'No weekly file is saved yet.' }],
    pulse: pulseFrom(null),
  };
  if (!week) return empty;
  const range = 'Week of ' + formatDay(week.week_start) + ' to ' + formatDay(week.week_end);
  const saved = Array.isArray(week.days_covered) && week.days_covered.length
    ? 'Saved days ' + listDates(week.days_covered) + '.'
    : '';
  const latestMs = stamp((days || [])[days.length - 1]);
  const floor = rule && Number.isFinite(Number(rule.min_abs_move_points))
    ? formatPoints(rule.min_abs_move_points)
    : '';
  if (week.status === 'no update') {
    return {
      title: 'This week in one minute',
      range,
      saved,
      cards: [{ kicker: 'This week', sentence: 'The saved days for this week could not be read.' }],
      pulse: pulseFrom(latestMs),
    };
  }
  const cards = [];
  const move = week.status === 'picked' ? week.biggest_move : null;
  if (move && move.name) {
    const when = move.previous_date && addDays(move.previous_date, 1) === move.date
      ? 'from the day before, on ' + formatDay(move.date)
      : move.previous_date
        ? 'from ' + formatDay(move.previous_date) + ', on ' + formatDay(move.date)
        : 'on ' + formatDay(move.date);
    const link = connectionHref(move.market_id, pairs);
    cards.push({
      kicker: 'The biggest move',
      sentence: moveLine(move, when),
      chart: weekChart(days, move, week.days_covered),
    });
    if (link && link.href) {
      cards.push({
        kicker: 'A link that held',
        sentence: link.headline,
        href: link.href,
        link: 'See the link',
      });
    }
  } else {
    const reason = floor
      ? ' No saved day had an eligible move of ' + floor + ' points or more.'
      : '';
    cards.push({ kicker: 'This week', sentence: 'This week was quiet.' + reason });
  }
  cards.push({ ...SAME_DAY_LESSON, sentence: '' });
  return {
    title: 'This week in one minute',
    range,
    saved,
    cards,
    pulse: pulseFrom(latestMs),
  };
}

export function buildToday(mode = '') {
  try {
    const days = withRules(readDayFiles(), loadRule());
    return todayModel(days, pairsOf(), mode);
  } catch {
    return unread([], null, 'no update');
  }
}

export function buildWeek() {
  try {
    const rule = loadRule();
    const days = withRules(readDayFiles(), rule);
    const weeks = readWeekFiles();
    return weekModel(weeks[weeks.length - 1] || null, days, pairsOf(), rule);
  } catch {
    return weekModel(null, [], [], null);
  }
}
