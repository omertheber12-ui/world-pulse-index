/**
 * Strongest-links loader.
 * Reads the research summary. Does not re-rank, filter, or recompute a correlation.
 * A bad or missing file fails soft and the page says there are no results yet.
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { textProblem } from './connections.js';

export const SCHEMA_VERSION = 'correlations-1';
export const METHOD_ID = 'TR-016';

export const LAGS = ['same_day', 'odds_lead_1d', 'odds_lead_5d', 'asset_lead_1d', 'asset_lead_5d'];

export const LAG_TEXT = {
  same_day: 'same day',
  odds_lead_1d: 'odds moved 1 day before the asset',
  odds_lead_5d: 'odds moved 5 days before the asset',
  asset_lead_1d: 'asset moved 1 day before the odds',
  asset_lead_5d: 'asset moved 5 days before the odds',
};

export const COPY = {
  title: 'Strongest links',
  previewBanner: 'Internal preview. Not on the live site.',
  exampleNotice: 'Example data, not real results',
  empty: 'No results yet.',
  perAsset: 'Per asset',
  perEvent: 'Per event',
  label: 'Description only, not proven',
  notAvailable: 'not available',
  notEnough: 'Not enough data',
  rankCaption: 'rank correlation',
  stands: 'Still stands after correcting for many tests',
  doesNotStand: 'Does not stand after correcting for many tests',
  insights: 'Insights only, not advice.',
};

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PRIVATE_KEYS = new Set([
  'proxy_wallet', 'proxywallet', 'wallet', 'wallet_address', 'pseudonym', 'bio',
  'profile_image', 'profileimage', 'transaction_hash', 'transactionhash',
  'email', 'phone', 'api_key', 'apikey', 'password', 'passwd', 'private_key', 'secret',
]);

export function projectRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, 'data', 'fallback.json'))) return cwd;
  if (existsSync(path.join(cwd, 'site', 'data', 'fallback.json'))) return path.join(cwd, 'site');
  return siteRoot;
}

export function correlationsDir(root = projectRoot()) {
  return path.join(root, 'data', 'correlations');
}

function numeric(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

export function formatNumber(value) {
  const number = numeric(value);
  if (number == null) return COPY.notAvailable;
  return String(Math.round(number * 1000) / 1000);
}

/** A share from 0 to 1 is shown as a percent. A larger number is already a percent. */
export function formatShare(value) {
  const number = numeric(value);
  if (number == null) return COPY.notAvailable;
  const percent = Math.abs(number) <= 1 ? number * 100 : number;
  return String(Math.round(percent * 10) / 10) + '%';
}

function formatPlain(value) {
  return formatNumber(value);
}

function clean(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function formatDay(value) {
  const text = clean(value);
  const day = text.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return text || COPY.notAvailable;
  const [year, month, date] = day.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, date));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== date) return text;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utc);
}

export function isExampleRun(file) {
  if (!file) return false;
  if (file.is_example === true) return true;
  return clean(file.run_id).toUpperCase() === 'EXAMPLE';
}

function pickedCount(row) {
  if (numeric(row.picked_from_n) != null) return numeric(row.picked_from_n);
  if (numeric(row.number_of_pairs_searched) != null) return numeric(row.number_of_pairs_searched);
  return null;
}

export function chanceLine(row) {
  return 'Chance alone reaches about ±' + formatNumber(row.chance_p95_abs)
    + ' in 95% of shuffles; ' + formatShare(row.chance_share_as_strong)
    + ' of shuffles were this strong';
}

export function sampleLine(row) {
  return formatPlain(row.independent_episodes) + ' separate episodes ('
    + formatPlain(row.trading_days) + ' trading days)';
}

export function pickLine(row) {
  return 'Picked as the strongest of ' + formatPlain(pickedCount(row))
    + ' links. The top of a long list looks strong partly by luck.';
}

export function manyTestsLine(flag) {
  if (flag === true) return COPY.stands;
  if (flag === false) return COPY.doesNotStand;
  return COPY.notAvailable;
}

export function lagLine(lag) {
  if (lag == null || lag === '') return COPY.notAvailable;
  return LAG_TEXT[lag] || COPY.notAvailable;
}

export function summaryLine(summary) {
  const row = summary || {};
  return 'We tested ' + formatPlain(row.pairs_tested)
    + ' links. Luck alone would make about ' + formatPlain(row.expected_strong_by_luck)
    + ' look this strong; we saw ' + formatPlain(row.observed_strong) + '.';
}

export function footerLine(file) {
  return 'method ' + (clean(file.method_id) || METHOD_ID)
    + ', run ' + (clean(file.run_id) || COPY.notAvailable)
    + ', window ' + formatDay(file.window_start) + ' to ' + formatDay(file.window_end)
    + ', generated ' + formatDay(file.generated_at);
}

export function buildCard(row, section) {
  const item = row || {};
  const subject = section === 'event' ? clean(item.event_label) : clean(item.asset_label);
  const other = section === 'event' ? clean(item.asset_label) : clean(item.event_label);
  const missingCorrelation = numeric(item.spearman) == null;
  return {
    section,
    subject: subject || COPY.notAvailable,
    other: other || COPY.notAvailable,
    correlation: missingCorrelation ? COPY.notEnough : formatNumber(item.spearman),
    rankCaption: missingCorrelation ? '' : COPY.rankCaption,
    chance: missingCorrelation ? COPY.notEnough : chanceLine(item),
    sample: sampleLine(item),
    pick: pickLine(item),
    manyTests: manyTestsLine(item.bh_flag),
    lag: missingCorrelation ? COPY.notEnough : lagLine(item.lag),
    label: COPY.label,
  };
}

export function buildPageState(loaded) {
  const base = {
    title: COPY.title,
    previewBanner: COPY.previewBanner,
    exampleNotice: '',
    summary: '',
    perAssetTitle: COPY.perAsset,
    perEventTitle: COPY.perEvent,
    perAsset: [],
    perEvent: [],
    footer: '',
    empty: '',
  };
  if (!loaded || loaded.status !== 'ok' || !loaded.file) {
    return { ...base, mode: 'empty', empty: COPY.empty };
  }
  const file = loaded.file;
  return {
    ...base,
    mode: 'ready',
    exampleNotice: isExampleRun(file) ? COPY.exampleNotice : '',
    summary: summaryLine(file.chance_summary),
    perAsset: (file.strongest_per_asset || []).map((row) => buildCard(row, 'asset')),
    perEvent: (file.strongest_per_event || []).map((row) => buildCard(row, 'event')),
    footer: footerLine(file),
  };
}

function walkValues(value, visit, pathName = '') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkValues(item, visit, pathName + '[' + index + ']'));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      visit(pathName ? pathName + '.' + key : key, key, item);
      walkValues(item, visit, pathName ? pathName + '.' + key : key);
    }
  }
}

function checkNumber(value, errors, label) {
  if (value == null) return;
  if (typeof value !== 'number' || !Number.isFinite(value)) errors.push(label + ' must be a number or null');
}

function checkText(value, errors, label) {
  if (typeof value !== 'string' || !value.trim()) errors.push(label + ' is missing');
  else {
    const problem = textProblem(value);
    if (problem) errors.push(label + ' ' + problem);
  }
}

function checkLag(value, errors, label) {
  if (value == null) return;
  if (!LAGS.includes(value)) errors.push(label + ' lag is not allowed');
}

function checkFlag(value, errors, label) {
  if (value == null) return;
  if (typeof value !== 'boolean') errors.push(label + ' must be true, false, or null');
}

function checkPair(row, index, errors) {
  const label = 'pair ' + index;
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    errors.push(label + ' is not an object');
    return;
  }
  checkText(row.event_family, errors, label + ' event_family');
  checkText(row.event_label, errors, label + ' event_label');
  checkText(row.asset, errors, label + ' asset');
  checkText(row.asset_label, errors, label + ' asset_label');
  checkLag(row.lag, errors, label);
  checkNumber(row.spearman, errors, label + ' spearman');
  checkNumber(row.pearson, errors, label + ' pearson');
  checkNumber(row.trading_days, errors, label + ' trading_days');
  checkNumber(row.independent_episodes, errors, label + ' independent_episodes');
  checkNumber(row.chance_p95_abs, errors, label + ' chance_p95_abs');
  checkNumber(row.chance_share_as_strong, errors, label + ' chance_share_as_strong');
  checkFlag(row.bh_flag, errors, label + ' bh_flag');
  checkNumber(row.trades_corr, errors, label + ' trades_corr');
}

function checkStrong(row, index, name, errors) {
  const label = name + ' ' + index;
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    errors.push(label + ' is not an object');
    return null;
  }
  checkText(row.event_family, errors, label + ' event_family');
  checkText(row.event_label, errors, label + ' event_label');
  checkText(row.asset, errors, label + ' asset');
  checkText(row.asset_label, errors, label + ' asset_label');
  checkLag(row.lag, errors, label);
  checkNumber(row.spearman, errors, label + ' spearman');
  checkNumber(row.chance_p95_abs, errors, label + ' chance_p95_abs');
  checkNumber(row.chance_share_as_strong, errors, label + ' chance_share_as_strong');
  checkNumber(row.independent_episodes, errors, label + ' independent_episodes');
  checkNumber(row.trading_days, errors, label + ' trading_days');
  checkFlag(row.bh_flag, errors, label + ' bh_flag');
  checkNumber(row.picked_from_n, errors, label + ' picked_from_n');
  checkNumber(row.number_of_pairs_searched, errors, label + ' number_of_pairs_searched');
  return { ...row, picked_from_n: pickedCount(row) };
}

export function validateFile(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['results file is not an object'], file: null };
  }
  walkValues(raw, (full, key, value) => {
    if (PRIVATE_KEYS.has(String(key).toLowerCase())) errors.push('personal or secret field ' + full);
    if (typeof value === 'string' && /0x[a-fA-F0-9]{40}/.test(value)) errors.push('wallet-like value in ' + full);
  });
  if (raw.schema_version !== SCHEMA_VERSION) errors.push('schema_version must be correlations-1');
  if (raw.method_id !== METHOD_ID) errors.push('method_id must be TR-016');
  checkText(raw.run_id, errors, 'run_id');
  checkText(raw.generated_at, errors, 'generated_at');
  checkText(raw.window_start, errors, 'window_start');
  checkText(raw.window_end, errors, 'window_end');
  checkText(raw.chance_method, errors, 'chance_method');
  checkText(raw.label, errors, 'label');
  if (raw.example_label != null) checkText(raw.example_label, errors, 'example_label');
  if (raw.is_example != null && typeof raw.is_example !== 'boolean') errors.push('is_example must be true or false');
  if (!raw.chance_summary || typeof raw.chance_summary !== 'object' || Array.isArray(raw.chance_summary)) {
    errors.push('chance_summary must be an object');
  } else {
    for (const key of ['pairs_tested', 'expected_strong_by_luck', 'observed_strong']) {
      if (!Object.prototype.hasOwnProperty.call(raw.chance_summary, key)) errors.push('chance_summary is missing ' + key);
      checkNumber(raw.chance_summary[key], errors, 'chance_summary.' + key);
    }
  }
  if (!Array.isArray(raw.pairs)) errors.push('pairs must be a list');
  if (!Array.isArray(raw.strongest_per_asset)) errors.push('strongest_per_asset must be a list');
  if (!Array.isArray(raw.strongest_per_event)) errors.push('strongest_per_event must be a list');
  const pairs = Array.isArray(raw.pairs) ? raw.pairs : [];
  const assets = Array.isArray(raw.strongest_per_asset) ? raw.strongest_per_asset : [];
  const events = Array.isArray(raw.strongest_per_event) ? raw.strongest_per_event : [];
  pairs.forEach((row, index) => checkPair(row, index, errors));
  const strongestPerAsset = assets.map((row, index) => checkStrong(row, index, 'strongest_per_asset', errors));
  const strongestPerEvent = events.map((row, index) => checkStrong(row, index, 'strongest_per_event', errors));
  if (errors.length) return { ok: false, errors, file: null };
  return {
    ok: true,
    errors: [],
    file: {
      ...raw,
      pairs,
      strongest_per_asset: strongestPerAsset,
      strongest_per_event: strongestPerEvent,
    },
  };
}

function readJson(filePath) {
  try {
    return { ok: true, raw: JSON.parse(readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export function loadCorrelations(dir = correlationsDir()) {
  try {
    const latestPath = path.join(dir, 'latest.json');
    if (existsSync(latestPath)) {
      const read = readJson(latestPath);
      if (!read.ok) return { status: 'invalid', file: null, errors: ['could not read latest.json'], source: null };
      const checked = validateFile(read.raw);
      if (!checked.ok) return { status: 'invalid', file: null, errors: checked.errors, source: null };
      return { status: 'ok', file: checked.file, errors: [], source: 'latest' };
    }
    const runsDir = path.join(dir, 'runs');
    if (existsSync(runsDir)) {
      const names = readdirSync(runsDir).filter((name) => name.endsWith('.json')).sort();
      for (let i = names.length - 1; i >= 0; i -= 1) {
        const read = readJson(path.join(runsDir, names[i]));
        if (!read.ok) continue;
        const checked = validateFile(read.raw);
        if (checked.ok) return { status: 'ok', file: checked.file, errors: [], source: 'runs' };
      }
    }
    return { status: 'missing', file: null, errors: [], source: null };
  } catch (error) {
    return { status: 'invalid', file: null, errors: [String(error && error.message ? error.message : error)], source: null };
  }
}

export function visibleText(state) {
  if (!state) return '';
  const parts = [
    state.title,
    state.previewBanner,
    state.exampleNotice,
    state.summary,
    state.perAssetTitle,
    state.perEventTitle,
    state.footer,
    state.empty,
  ];
  for (const card of [...(state.perAsset || []), ...(state.perEvent || [])]) {
    parts.push(
      card.subject,
      card.other,
      card.correlation,
      card.rankCaption,
      card.chance,
      card.sample,
      card.pick,
      card.manyTests,
      card.lag,
      card.label,
    );
  }
  return parts.filter(Boolean).join('\n');
}
