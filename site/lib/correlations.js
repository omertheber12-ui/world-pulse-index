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
  sameDayHeader: 'Moved together the same day (description only, not a lead)',
  leadHeader: 'One moved first',
  sameDayLag: 'same day',
  oddsLead1d: 'Odds moved first, 1 day before the asset',
  oddsLead5d: 'Odds moved first, 5 days before the asset',
  assetLead1d: 'Asset moved first, 1 day before the odds',
  assetLead5d: 'Asset moved first, 5 days before the odds',
  timingUnknown: 'Timing not available',
  strictFail: 'Does not pass the strict pick-from-many check',
  strictPass: 'Passes the strict pick-from-many check',
  researchNotice: 'Research\'s TR-016 run. Internal, and not proven.',
  pageLead: 'Which event odds and prices moved together.',
  seePicks: 'See all 21 top picks',
  seeEvery: 'See every link tested',
  allLinksTitle: 'All links tested',
  tierStrict: 'Strong link',
  tierStronger: 'Medium link',
  tierWeaker: 'Weak link',
  showWeaker: 'Show weak links',
  sameWay: 'moved the same way',
  oppositeWay: 'opposite way',
};

export const LAG_TEXT = {
  same_day: COPY.sameDayLag,
  odds_lead_1d: COPY.oddsLead1d,
  odds_lead_5d: COPY.oddsLead5d,
  asset_lead_1d: COPY.assetLead1d,
  asset_lead_5d: COPY.assetLead5d,
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
  if (lag === 0 || lag === '0' || lag === 'same_day') return COPY.sameDayLag;
  if (lag == null || lag === '') return COPY.timingUnknown;
  return LAG_TEXT[lag] || COPY.timingUnknown;
}

export function lagDisplay(row) {
  const label = clean(row && row.lag_label);
  if (label) return label;
  return lagLine(row && row.lag);
}

/** timing_group wins. A missing group treats lag 0, and the same_day lag, as same day. */
export function timingGroup(row) {
  const group = row && row.timing_group;
  if (group === 'same_day' || group === 'lead') return group;
  const lag = row && row.lag;
  if (lag === 0 || lag === '0' || lag === 'same_day') return 'same_day';
  return 'lead';
}

function beatsFlag(row) {
  if (!row) return null;
  if (typeof row.beats_pick_line === 'boolean') return row.beats_pick_line;
  if (typeof row.beats_best_of_many === 'boolean') return row.beats_best_of_many;
  if (typeof row.beats_pick_from_many === 'boolean') return row.beats_pick_from_many;
  return null;
}

export function strictPickLine(row) {
  const beats = beatsFlag(row);
  if (beats === true) return COPY.strictPass;
  if (beats === false) return COPY.strictFail;
  return '';
}

function extraLine(flag, name) {
  if (flag !== true && flag !== false) return '';
  return 'Extra check, not a verdict: the ' + name + ' check ' + (flag ? 'passes.' : 'does not pass.');
}

export function extraCheckLines(row) {
  const lines = [
    extraLine(row && row.passes_consistent_raw, 'raw correlation'),
    extraLine(row && row.passes_consistent_z, 'spread-adjusted'),
  ];
  return lines.filter(Boolean);
}

export function summaryLine(summary) {
  const row = summary || {};
  const tested = numeric(row.shown_rows) != null ? row.shown_rows : row.pairs_tested;
  const expected = numeric(row.expected_strong_by_luck_shown) != null
    ? row.expected_strong_by_luck_shown
    : row.expected_strong_by_luck;
  const observed = numeric(row.observed_strong_shown) != null
    ? row.observed_strong_shown
    : row.observed_strong;
  let line = 'We tested ' + formatPlain(tested)
    + ' links. Luck alone would make about ' + formatPlain(expected)
    + ' look this strong; we saw ' + formatPlain(observed) + '.';
  const universe = numeric(row.rows_tested) != null ? row.rows_tested : row.pairs_tested;
  if (numeric(row.shown_rows) != null && numeric(universe) != null && universe >= row.shown_rows) {
    const hidden = universe - row.shown_rows;
    line += ' ' + formatPlain(hidden) + ' tested rows are hidden because they had under 10 episodes.';
  }
  return line;
}

export function formatTwo(value) {
  const number = numeric(value);
  if (number == null) return COPY.notAvailable;
  return number.toFixed(2);
}

export function directionWords(spearman) {
  const number = numeric(spearman);
  if (number == null || number === 0) return COPY.notAvailable;
  return number > 0 ? COPY.sameWay : COPY.oppositeWay;
}

export function shortAsset(label) {
  const text = clean(label);
  const rules = [
    ['2-year government bond yield', '2-year yield'],
    ['10-year government bond yield', '10-year yield'],
    ['3-month Treasury bill', '3-month bill rate'],
    ['Bitcoin', 'Bitcoin'],
    ['oil price', 'oil'],
    ['Gold price', 'gold'],
    ['S&P 500', 'S&P 500'],
    ['Nasdaq 100', 'Nasdaq 100'],
    ['Inflation expected over 5 years', '5-year inflation expectations'],
    ['Inflation expected over 10 years', '10-year inflation expectations'],
    ['Japanese yen', 'dollar vs yen'],
    ['Israeli shekel', 'dollar vs shekel'],
  ];
  for (const [needle, name] of rules) {
    if (text.includes(needle)) return name;
  }
  const cut = text.split(':')[0].trim();
  return cut || COPY.notAvailable;
}

export function shortEvent(label) {
  const text = clean(label);
  if (text.includes('Federal Reserve') && text.includes('rate cut')) return 'Fed rate-cut odds';
  if (text.includes('Federal Reserve')) return 'Fed odds';
  if (text.includes('Other central bank') && text.includes('rate cut')) return 'other central-bank rate-cut odds';
  if (text.includes('Other central bank')) return 'other central-bank odds';
  if (text.includes('National elections')) return 'election odds';
  if (text.includes('peace minus')) return 'war and peace odds';
  if (text.includes('Wars and ceasefires')) return 'war and ceasefire odds';
  if (text.toLowerCase().includes('inflation report')) return 'inflation-report odds';
  const cut = text.split(':')[0].trim();
  return cut || COPY.notAvailable;
}

function leadDays(row) {
  const lag = row && row.lag;
  if (lag === 'odds_lead_1d' || lag === 'asset_lead_1d') return 1;
  if (lag === 'odds_lead_5d' || lag === 'asset_lead_5d') return 5;
  const label = clean(row && row.lag_label);
  if (label.includes('5')) return 5;
  if (label.includes('next day')) return 1;
  return null;
}

function oddsMovedFirst(row) {
  const lag = String((row && row.lag) || '');
  if (lag.startsWith('odds_lead')) return true;
  if (lag.startsWith('asset_lead')) return false;
  return clean(row && row.lag_label).startsWith('odds');
}

function dayPhrase(days) {
  if (days === 1) return '1 day';
  if (days === 5) return '5 days';
  return 'the recorded lead';
}

function sentenceCase(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildHeadline(row) {
  const item = row || {};
  const event = shortEvent(item.event_label);
  const asset = shortAsset(item.asset_label);
  const opposite = numeric(item.spearman) != null && numeric(item.spearman) < 0;
  let line;
  if (timingGroup(item) === 'same_day') {
    line = event + ' and ' + asset + (opposite ? ' move opposite ways on the same day' : ' move together on the same day');
  } else {
    const within = ' within ' + dayPhrase(leadDays(item));
    if (oddsMovedFirst(item)) {
      line = event + ' move first, ' + asset + (opposite ? ' moves the other way' : ' follows') + within;
    } else {
      line = asset + ' moves first, ' + event + (opposite ? ' move the other way' : ' follow') + within;
    }
  }
  return sentenceCase(line);
}

export function linkTier(row) {
  if (row && row.bh_flag === true) return 'strict';
  if (row && row.passes_chance_line === true && row.bh_flag === false) return 'stronger';
  return 'weaker';
}

const TIER_LABEL = {
  strict: COPY.tierStrict,
  stronger: COPY.tierStronger,
  weaker: COPY.tierWeaker,
};

function byStrength(a, b) {
  const aSpear = numeric(a.spearman);
  const bSpear = numeric(b.spearman);
  const aAbs = aSpear == null ? -1 : Math.abs(aSpear);
  const bAbs = bSpear == null ? -1 : Math.abs(bSpear);
  if (aAbs !== bAbs) return bAbs - aAbs;
  const aZ = numeric(a.z_vs_shuffle);
  const bZ = numeric(b.z_vs_shuffle);
  const aRank = aZ == null ? -Infinity : aZ;
  const bRank = bZ == null ? -Infinity : bZ;
  if (aRank !== bRank) return bRank - aRank;
  return 0;
}

export function buildLinkRow(row) {
  const item = row || {};
  const tier = linkTier(item);
  const episodes = numeric(item.independent_episodes);
  return {
    eventLabel: clean(item.event_label) || COPY.notAvailable,
    assetLabel: clean(item.asset_label) || COPY.notAvailable,
    headline: buildHeadline(item),
    lagLabel: lagDisplay(item),
    strength: formatTwo(item.spearman),
    direction: directionWords(item.spearman),
    episodes: episodes == null ? COPY.notAvailable : String(episodes),
    tier,
    tierLabel: TIER_LABEL[tier],
    timingGroup: timingGroup(item),
    eventFamily: clean(item.event_family),
    assetId: clean(item.asset),
    lag: item.lag || '',
  };
}

function splitByTier(rows) {
  const ordered = rows.slice().sort(byStrength);
  const built = ordered.map(buildLinkRow);
  return {
    rows: built,
    shown: built.filter((row) => row.tier !== 'weaker'),
    weaker: built.filter((row) => row.tier === 'weaker'),
  };
}

export function allLinksNote(summary) {
  const row = summary || {};
  return 'Weaker links may be luck. By luck alone about ' + formatPlain(row.expected_strong_by_luck)
    + ' of ' + formatPlain(row.rows_tested)
    + ' tested rows would look stronger than chance; ' + formatPlain(row.observed_strong_shown)
    + ' of the ' + formatPlain(row.shown_rows)
    + ' shown do. These are leads to look into, not findings.';
}

export function tierLegend(summary) {
  const row = summary || {};
  return [
    'Strong link: passes the strictest check across all ' + formatPlain(row.rows_tested) + ' tested rows.',
    'Medium link: as a group there are more of these than luck alone gives (' + formatPlain(row.observed_strong_shown) + ' against about ' + formatPlain(row.expected_strong_by_luck) + '), but any single one may be luck.',
    'Weak link: may well be luck, kept to watch.',
  ];
}

export function strictCheckNote(summary) {
  const tested = formatPlain(summary && summary.rows_tested);
  return 'This strict check corrects for testing all ' + tested
    + ' rows at once; it is not the same as the pick-from-many check on the cards above.';
}

export function buildAllLinks(file) {
  const pairs = (file && file.pairs) || [];
  const sameDay = splitByTier(pairs.filter((row) => timingGroup(row) === 'same_day'));
  const lead = splitByTier(pairs.filter((row) => timingGroup(row) !== 'same_day'));
  return {
    title: COPY.allLinksTitle,
    note: allLinksNote(file && file.chance_summary),
    legend: tierLegend(file && file.chance_summary),
    strictNote: strictCheckNote(file && file.chance_summary),
    sameDayTitle: COPY.sameDayHeader,
    leadTitle: COPY.leadHeader,
    showWeaker: COPY.showWeaker,
    sameDay,
    lead,
  };
}

export function footerLine(file) {
  return 'method ' + (clean(file.method_id) || METHOD_ID)
    + ', run ' + (clean(file.run_id) || COPY.notAvailable)
    + ', window ' + formatDay(file.window_start) + ' to ' + formatDay(file.window_end)
    + ', generated ' + formatDay(file.generated_at);
}

function runnerLine(row) {
  const runner = row && row.runner_up;
  if (!runner || typeof runner !== 'object') return '';
  return 'Runner-up: ' + shortEvent(runner.event_label) + ' and ' + shortAsset(runner.asset_label)
    + ', ' + formatTwo(runner.spearman) + ', ' + lagDisplay(runner);
}

function absSpearman(row) {
  const number = numeric(row && row.spearman);
  return number == null ? -1 : Math.abs(number);
}

export function chooseMainRow(rows) {
  const eligible = (rows || []).filter((row) => linkTier(row) === 'strict' && beatsFlag(row) === true);
  return eligible.slice().sort((a, b) => absSpearman(b) - absSpearman(a))[0] || null;
}

export function buildChartCard(row, section) {
  const item = row || {};
  const tier = linkTier(item);
  const episodes = numeric(item.independent_episodes);
  return {
    section,
    headline: buildHeadline(item),
    tier,
    tierLabel: TIER_LABEL[tier],
    strength: formatTwo(item.spearman),
    episodes: episodes == null ? COPY.notAvailable : String(episodes) + ' separate episodes',
    chance: chanceLine(item),
    pick: pickLine(item),
    strictPick: strictPickLine(item),
    runner: runnerLine(item),
    timingGroup: timingGroup(item),
    eventFamily: clean(item.event_family),
    assetId: clean(item.asset),
    lag: item.lag || '',
  };
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
    strictPick: missingCorrelation ? '' : strictPickLine(item),
    extraChecks: missingCorrelation ? [] : extraCheckLines(item),
    manyTests: manyTestsLine(item.bh_flag),
    lag: missingCorrelation ? COPY.notEnough : lagDisplay(item),
    timingGroup: timingGroup(item),
    label: COPY.label,
  };
}

export function buildPageState(loaded) {
  const base = {
    title: COPY.title,
    previewBanner: COPY.previewBanner,
    exampleNotice: '',
    researchNotice: '',
    summary: '',
    sameDayTitle: COPY.sameDayHeader,
    leadTitle: COPY.leadHeader,
    perAsset: [],
    perEvent: [],
    sameDay: [],
    lead: [],
    chartCards: [],
    mainChart: null,
    otherPicks: [],
    allLinks: null,
    footer: '',
    empty: '',
  };
  if (!loaded || loaded.status !== 'ok' || !loaded.file) {
    return { ...base, mode: 'empty', empty: COPY.empty };
  }
  const file = loaded.file;
  const perAsset = (file.strongest_per_asset || []).map((row) => buildCard(row, 'asset'));
  const perEvent = (file.strongest_per_event || []).map((row) => buildCard(row, 'event'));
  const ordered = perAsset.concat(perEvent);
  const picks = (file.strongest_per_asset || []).map((row) => ({ row, section: 'asset' }))
    .concat((file.strongest_per_event || []).map((row) => ({ row, section: 'event' })));
  const chartCards = picks.map((item) => buildChartCard(item.row, item.section));
  const mainRow = chooseMainRow(picks.map((item) => item.row));
  const mainIndex = picks.findIndex((item) => item.row === mainRow);
  return {
    ...base,
    mode: 'ready',
    exampleNotice: isExampleRun(file) ? COPY.exampleNotice : '',
    researchNotice: isExampleRun(file) ? '' : COPY.researchNotice,
    summary: summaryLine(file.chance_summary),
    perAsset,
    perEvent,
    sameDay: ordered.filter((card) => card.timingGroup === 'same_day'),
    lead: ordered.filter((card) => card.timingGroup !== 'same_day'),
    chartCards,
    mainChart: mainIndex >= 0 ? chartCards[mainIndex] : null,
    otherPicks: chartCards.filter((_, index) => index !== mainIndex),
    allLinks: buildAllLinks(file),
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
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (!LAGS.includes(value)) errors.push(label + ' lag is not allowed');
}

function checkTiming(value, errors, label) {
  if (value == null) return;
  if (value !== 'same_day' && value !== 'lead') errors.push(label + ' timing_group is not allowed');
}

function checkRunner(row, errors, label) {
  if (row == null) return;
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    errors.push(label + ' is not an object');
    return;
  }
  checkTiming(row.timing_group, errors, label);
  checkLag(row.lag, errors, label);
  if (row.lag_label != null) checkText(row.lag_label, errors, label + ' lag_label');
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
  checkTiming(row.timing_group, errors, label);
  checkLag(row.lag, errors, label);
  if (row.lag_label != null) checkText(row.lag_label, errors, label + ' lag_label');
  checkNumber(row.spearman, errors, label + ' spearman');
  checkNumber(row.pearson, errors, label + ' pearson');
  checkNumber(row.trading_days, errors, label + ' trading_days');
  checkNumber(row.independent_episodes, errors, label + ' independent_episodes');
  checkNumber(row.chance_p95_abs, errors, label + ' chance_p95_abs');
  checkNumber(row.chance_share_as_strong, errors, label + ' chance_share_as_strong');
  checkFlag(row.bh_flag, errors, label + ' bh_flag');
  checkNumber(row.trades_corr, errors, label + ' trades_corr');
  checkRunner(row.runner_up, errors, label + ' runner_up');
  if (row.runner_ups != null && !Array.isArray(row.runner_ups)) errors.push(label + ' runner_ups must be a list');
  if (Array.isArray(row.runner_ups)) {
    row.runner_ups.forEach((item, runnerIndex) => checkRunner(item, errors, label + ' runner_ups ' + runnerIndex));
  }
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
  checkTiming(row.timing_group, errors, label);
  checkLag(row.lag, errors, label);
  if (row.lag_label != null) checkText(row.lag_label, errors, label + ' lag_label');
  checkNumber(row.spearman, errors, label + ' spearman');
  checkNumber(row.chance_p95_abs, errors, label + ' chance_p95_abs');
  checkNumber(row.chance_share_as_strong, errors, label + ' chance_share_as_strong');
  checkNumber(row.independent_episodes, errors, label + ' independent_episodes');
  checkNumber(row.trading_days, errors, label + ' trading_days');
  checkFlag(row.bh_flag, errors, label + ' bh_flag');
  checkNumber(row.picked_from_n, errors, label + ' picked_from_n');
  checkNumber(row.number_of_pairs_searched, errors, label + ' number_of_pairs_searched');
  checkFlag(row.beats_best_of_many, errors, label + ' beats_best_of_many');
  checkFlag(row.beats_pick_from_many, errors, label + ' beats_pick_from_many');
  checkRunner(row.runner_up, errors, label + ' runner_up');
  if (row.runner_ups != null && !Array.isArray(row.runner_ups)) errors.push(label + ' runner_ups must be a list');
  if (Array.isArray(row.runner_ups)) {
    row.runner_ups.forEach((item, runnerIndex) => checkRunner(item, errors, label + ' runner_ups ' + runnerIndex));
  }
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
    for (const key of ['shown_rows', 'observed_strong_shown', 'expected_strong_by_luck_shown']) {
      if (Object.prototype.hasOwnProperty.call(raw.chance_summary, key)) {
        checkNumber(raw.chance_summary[key], errors, 'chance_summary.' + key);
      }
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
    state.researchNotice,
    state.summary,
    state.sameDay && state.sameDay.length ? state.sameDayTitle : '',
    state.lead && state.lead.length ? state.leadTitle : '',
    state.allLinks && state.allLinks.title,
    state.allLinks && state.allLinks.note,
    ...(state.allLinks && state.allLinks.legend ? state.allLinks.legend : []),
    state.allLinks && state.allLinks.strictNote,
    state.footer,
    state.empty,
  ];
  for (const card of [...(state.sameDay || []), ...(state.lead || [])]) {
    parts.push(
      card.subject,
      card.other,
      card.correlation,
      card.rankCaption,
      card.chance,
      card.sample,
      card.pick,
      card.strictPick,
      ...(card.extraChecks || []),
      card.manyTests,
      card.lag,
      card.label,
    );
  }
  return parts.filter(Boolean).join('\n');
}
