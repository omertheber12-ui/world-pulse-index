/** Checks for saved daily odds, the biggest-change rule, and the TR-016 file hashes. */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  REPO, SITE, TR016_SERIES_SHA, TR016_SUMMARY_SHA, applyRule, dayErrors, historyFromDays,
  isUtcTimestamp, loadRule, loadTracked, noUpdateRow, okRow, parseRule, ruleErrors, sha256File,
  summaryProblem, weeksFromDays, withRules,
} from '../lib/dailyOdds.js';
import { readDayFiles, readWeekFiles } from '../lib/dailyStore.js';

function fixtureRule() {
  return parseRule({
    version: 1,
    min_volume_usd: 10000,
    min_odds: 0.03,
    max_odds: 0.97,
    min_abs_move_points: 3,
    smaller_changes: 2,
  });
}

function row(id, odds, volume, name) {
  return okRow(
    { market_id: id, event_id: '1', name: name || id, question: '', page_url: 'https://polymarket.com/event/example' },
    {
      odds,
      volume,
      volumeBasis: 'gamma_rolling_24h',
      sourceUrl: 'https://gamma-api.polymarket.com/markets/' + id,
      fetchedAt: '2026-11-12T00:00:00.000Z',
      observedAt: '2026-11-12T00:00:00.000Z',
    },
  );
}

function day(date, markets) {
  return {
    schema_version: 'daily-odds-1',
    date,
    status: 'ok',
    collected_at: date + 'T00:00:00.000Z',
    read_basis: 'gamma_live',
    markets,
  };
}

export function ruleFixtureErrors() {
  const rule = fixtureRule();
  const errors = [];
  const prev = day('2026-11-11', [row('a', 0.4, 20000), row('b', 0.5, 20000), row('c', 0.2, 50000), row('d', 0.5, 80000)]);
  const today = day('2026-11-12', [
    row('a', 0.46, 20000),
    row('b', 0.44, 50000),
    row('c', 0.24, 12000),
    row('d', 0.02, 90000),
    row('e', 0.4, 9000),
  ]);
  const tied = applyRule(today, prev, rule);
  if (!tied.pick || tied.pick.market_id !== 'b') errors.push('tie did not keep the higher volume');
  if (!tied.smaller_changes[0] || tied.smaller_changes[0].market_id !== 'a') errors.push('smaller changes out of order');
  if (tied.fell_out_odds !== 1 || tied.fell_out_volume < 1) errors.push('gates were not counted');
  const quiet = applyRule(day('2026-11-12', [row('a', 0.42, 20000)]), prev, rule);
  if (quiet.status !== 'quiet' || quiet.pick) errors.push('a 2 point move was not quiet');
  const exact = applyRule(day('2026-11-12', [row('a', 0.43, 10000)]), prev, rule);
  if (exact.status !== 'picked' || exact.pick.move_points !== 3) errors.push('a 3 point move on $10,000 was dropped');
  const edgeOdds = applyRule(day('2026-11-12', [row('a', 0.03, 10000, 'low')]), day('2026-11-11', [row('a', 0.2, 10000, 'low')]), rule);
  if (edgeOdds.status !== 'picked') errors.push('odds of 3% were excluded');
  const missing = applyRule(
    day('2026-11-12', [noUpdateRow({ market_id: 'a', event_id: '1', name: 'a', question: '', page_url: '' }, '2026-11-12T00:00:00.000Z', 'read failed')]),
    prev,
    rule,
  );
  if (missing.status !== 'quiet' || missing.pick || missing.no_update_count !== 1) errors.push('a failed read was treated as a number');
  return errors;
}

export function runDailyChecks(add, site = SITE) {
  const latest = sha256File(path.join(site, 'data/correlations/latest.json'));
  const run = sha256File(path.join(site, 'data/correlations/runs/TR-016-2026-11-11.json'));
  const series = sha256File(path.join(site, 'data/correlations/series/TR-016-2026-11-11.series.json'));
  add('TR-016 correlation files are unchanged',
    latest === TR016_SUMMARY_SHA && run === TR016_SUMMARY_SHA && series === TR016_SERIES_SHA,
    'latest ' + latest + ' run ' + run + ' series ' + series);

  let rule;
  try { rule = loadRule(site); } catch { rule = null; }
  const ruleProblem = rule ? ruleErrors(rule) : ['rule.json missing'];
  add('Biggest-change numbers are in rule.json with a version', ruleProblem.length === 0, ruleProblem.join('; '));

  const fixture = ruleFixtureErrors();
  add('Biggest-change rule keeps the largest move, then the higher volume', fixture.length === 0, fixture.join('; '));

  const tracked = loadTracked(site);
  const ids = tracked.map((row) => row.market_id);
  const days = readDayFiles(site);
  const schema = [];
  const dup = [];
  const odds = [];
  const times = [];
  for (const day of days) {
    for (const error of dayErrors(day, ids)) {
      const item = day.date + ' ' + error;
      if (error.includes('duplicate')) dup.push(item);
      else if (error.includes('odds')) odds.push(item);
      else if (error.includes('fetched_at') || error.includes('collected_at') || error.includes('observed_at')) times.push(item);
      else schema.push(item);
    }
  }
  add('Daily files use the schema', days.length > 0 && schema.length === 0, schema.slice(0, 4).join('; ') || days.length + ' days');
  add('No duplicate markets in a day', days.length > 0 && dup.length === 0, dup.slice(0, 4).join('; '));
  add('Recorded odds are between 0 and 1', days.length > 0 && odds.length === 0, odds.slice(0, 4).join('; '));
  add('Daily timestamps are present', days.length > 0 && times.length === 0, times.slice(0, 4).join('; '));

  let ruleMatch = rule && schema.length === 0 && dup.length === 0 && odds.length === 0 && times.length === 0;
  const ruleDiff = [];
  if (rule && days.length) {
    const fresh = withRules(days, rule);
    days.forEach((day, i) => {
      if (JSON.stringify(day.rule) !== JSON.stringify(fresh[i].rule)) ruleDiff.push(day.date);
    });
    if (ruleDiff.length) ruleMatch = false;
  } else ruleMatch = false;
  add('Saved biggest-change results match the rule', ruleMatch, ruleDiff.slice(0, 6).join(', '));

  let historyOk = false;
  let historyDetail = '';
  try {
    const stored = JSON.parse(readFileSync(path.join(site, 'data/daily/history.json'), 'utf8'));
    const fresh = historyFromDays(days, ids, stored.updated_at);
    historyOk = stored.schema_version === 'daily-history-1'
      && isUtcTimestamp(stored.updated_at)
      && Array.isArray(stored.tracked_market_ids)
      && stored.tracked_market_ids.join() === ids.join()
      && JSON.stringify(stored.days) === JSON.stringify(fresh.days);
    if (!historyOk) historyDetail = 'history.json does not match the day files';
  } catch (err) {
    historyDetail = err && err.message ? err.message : 'history.json missing';
  }
  add('history.json matches the day files', historyOk, historyDetail);

  let weeksOk = false;
  let weekDetail = '';
  if (rule && days.length) {
    const storedWeeks = readWeekFiles(site);
    const freshWeeks = weeksFromDays(days, rule);
    const prose = freshWeeks.map((week) => summaryProblem(week.summary)).filter(Boolean);
    weeksOk = JSON.stringify(storedWeeks) === JSON.stringify(freshWeeks) && prose.length === 0;
    if (!weeksOk) weekDetail = prose.join('; ') || 'weekly files do not match the saved days';
  }
  add('Weekly summaries match the saved days', weeksOk, weekDetail);

  let tableOk = false;
  let tableDetail = '';
  try {
    const table = readFileSync(path.join(REPO, 'docs/td013/backfill-table.md'), 'utf8');
    const missing = days.map((day) => day.date).filter((date) => !table.includes(date));
    tableOk = table.includes('Under $10,000') && table.includes('Outside 3% to 97%') && missing.length === 0 && days.length > 0;
    if (!tableOk) tableDetail = missing.slice(0, 4).join(', ') || 'table missing';
  } catch (err) {
    tableDetail = err && err.message ? err.message : 'table missing';
  }
  add('Backfill table lists every saved day', tableOk, tableDetail);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const checks = [];
  const add = (name, ok, detail = '') => {
    checks.push({ check: name, pass: Boolean(ok) });
    console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : ''));
  };
  runDailyChecks(add);
  const allPass = checks.every((item) => item.pass);
  console.log('all_pass', allPass);
  process.exit(allPass ? 0 : 1);
}
