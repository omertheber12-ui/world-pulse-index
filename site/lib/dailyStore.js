/** Read and write the saved daily files. No network. */
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { dailyPaths, historyFromDays, weeksFromDays } from './dailyOdds.js';

function writeJson(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

export function readDayFiles(site) {
  const dir = dailyPaths(site).dir;
  let names = [];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .sort()
    .map((name) => JSON.parse(readFileSync(path.join(dir, name), 'utf8')));
}

export function writeDay(site, day) {
  writeJson(path.join(dailyPaths(site).dir, day.date + '.json'), day);
}

export function writeHistory(site, days, trackedIds, updatedAt) {
  writeJson(dailyPaths(site).history, historyFromDays(days, trackedIds, updatedAt));
}

export function writeWeeks(site, days, rule) {
  const dir = dailyPaths(site).weekly;
  mkdirSync(dir, { recursive: true });
  const weeks = weeksFromDays(days, rule);
  const keep = new Set();
  for (const week of weeks) {
    const name = week.week + '.json';
    keep.add(name);
    writeJson(path.join(dir, name), week);
  }
  for (const name of readdirSync(dir)) {
    if (/^\d{4}-W\d{2}\.json$/.test(name) && !keep.has(name)) unlinkSync(path.join(dir, name));
  }
  return weeks;
}

export function readWeekFiles(site) {
  const dir = dailyPaths(site).weekly;
  let names = [];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((name) => /^\d{4}-W\d{2}\.json$/.test(name))
    .sort()
    .map((name) => JSON.parse(readFileSync(path.join(dir, name), 'utf8')));
}
