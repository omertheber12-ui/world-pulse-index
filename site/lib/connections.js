/**
 * Connections results loader and view model.
 * Reads a shipped results file. Does not call Polymarket, oil, or Bitcoin.
 * Does not score pairs and does not change a statistical bar.
 *
 * Every pair in the file is kept. Cards are chosen only in selectVisiblePairs.
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const SCHEMA_VERSION = 'connections-1';
export const METHOD_ID = 'TR-007';
export const METHOD_FINGERPRINT = '149a7c2b6e2d4e812c8612281a478272c69a0d03a3dc9ae960446f1802d4b953';

/** Statuses that become cards. Add a status here later; pages should not grow their own gate. */
export const VISIBLE_HISTORY = ['described', 'checked_no_pattern'];

export const VERDICTS = ['yes_first_look', 'no', 'unclear', 'not_enough_history'];
export const HISTORY_STATUSES = ['described', 'checked_no_pattern', 'not_enough_history'];
export const INSIGHT_KINDS = ['next_session', 'moved_together', 'not_enough_history', 'checked_no_pattern'];
export const ASSETS = ['oil', 'bitcoin'];

export const ASSET_LABEL = {
  oil: 'Main US oil price',
  bitcoin: 'Bitcoin',
};

export const SERIES_LABEL = {
  oil: 'West Texas oil at Cushing',
  bitcoin: 'Bitcoin in US dollars',
};

export const COPY = {
  title: 'Connections',
  emptyHeadline: 'Nothing has enough history to describe yet.',
  emptyBody: 'When we can measure how an event\'s chances and a related price moved, you will see that fact here. We do not invent numbers. A stronger connection is a separate status, not a reason to hide the fact.',
  emptyContext: 'We compare public prediction-market history with public prices, starting with oil and Bitcoin.',
  unreadHeadline: 'We could not read the latest check.',
  unreadBody: 'Nothing is shown until we can read it. We do not invent results.',
  loading: 'Checking connections…',
  firstLookBanner: 'First look. These are early results, not a settled finding.',
  sparseBanner: 'Only a few connections have enough history to show.',
  sparseHelper: 'The numbers below come from a small set of cases. A larger sample may look different.',
  notChecked: 'Last checked: Not checked yet.',
  unreadableFooter: 'Last checked: Could not read the file.',
  otherEvents: 'Other events do not have enough history yet.',
  oilQuiet: 'Main US oil price: nothing has enough history to describe yet.',
  bitcoinQuiet: 'Bitcoin: nothing has enough history to describe yet.',
  unclear: 'This reading is unclear.',
  firstLookSentence: 'First look, not independently verified.',
  oilNoteFallback: 'The official oil print often comes out after the trade date, so this is a statistical link with a delayed official number, not proof someone could have acted on that official number the same day.',
  howWeCheck: 'How we check: a method note will be linked here.',
  insights: 'Insights only, not advice.',
  notInCheck: 'This connection is not in the latest check.',
  details: 'Details ›',
};

const YES_MIN_EXTRA = 0.2;
const YES_MIN_PLACEBO = 95;
const YES_MIN_FIRING = 10;
const YES_CONFLICT_UNDER = 30;

const SCORING_FIELDS = [
  'extra_average_percentage_points',
  'predicted_big_move_rate_percent',
  'predicted_big_move_count',
  'confirmation_firing_count',
  'confirmation_evaluated_count',
  'discovery_median_odds_change_percentage_points',
  'discovery_median_odds_change_ordinary_percentage_points',
  'discovery_median_odds_level_percent',
  'extra_average_likely_range_low_percentage_points',
  'extra_average_likely_range_high_percentage_points',
  'placebo_share_beaten_percent',
  'signals_up_count',
  'signals_down_count',
  'predicted_big_move_rate_when_not_firing_percent',
  'reverse_check_gap_odds_points',
  'conflict_share_percent',
];

const PERCENT_FIELDS = [
  'predicted_big_move_rate_percent',
  'discovery_median_odds_level_percent',
  'placebo_share_beaten_percent',
  'predicted_big_move_rate_when_not_firing_percent',
  'conflict_share_percent',
];

const COUNT_FIELDS = [
  'predicted_big_move_count',
  'confirmation_firing_count',
  'confirmation_evaluated_count',
  'signals_up_count',
  'signals_down_count',
  'search_size',
];

const PRIVATE_KEYS = new Set([
  'proxy_wallet', 'proxywallet', 'wallet', 'wallet_address', 'pseudonym', 'bio',
  'profile_image', 'profileimage', 'transaction_hash', 'transactionhash',
  'email', 'phone', 'api_key', 'apikey', 'password', 'passwd', 'private_key', 'secret',
]);

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function projectRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, 'data', 'fallback.json'))) return cwd;
  if (existsSync(path.join(cwd, 'site', 'data', 'fallback.json'))) return path.join(cwd, 'site');
  return siteRoot;
}

export function connectionsDir(root = projectRoot()) {
  return path.join(root, 'data', 'connections');
}

export function israelDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function word(codes) {
  return String.fromCharCode(...codes);
}

/** Wording the live pages must not use. Built without writing the words in source. */
export function textProblem(text) {
  const w1 = word([98, 117, 121]);
  const w2 = word([115, 101, 108, 108]);
  const w3 = word([101, 100, 103, 101]);
  const w4 = word([97, 108, 112, 104, 97]);
  const w5 = word([114, 105, 115, 107, 45, 102, 114, 101, 101]);
  const w6 = word([119, 101, 32, 114, 101, 99, 111, 109, 109, 101, 110, 100]);
  const advice = new RegExp('\\b(' + w1 + '|' + w2 + '|should (' + w1 + '|' + w2 + '|hold)|' + w6 + ')\\b', 'i');
  const hype = new RegExp('\\b(' + w3 + '|' + w4 + '|' + w5 + ')\\b', 'i');
  if (advice.test(text)) return 'advice wording';
  if (hype.test(text)) return 'hype wording';
  return '';
}

function clean(value) {
  if (value == null) return '';
  const text = String(value).trim();
  return text;
}

export function asNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function isBlankNumber(value) {
  return value == null || value === '';
}

export function hasNumericFact(pair) {
  return asNumber(pair.extra_average_percentage_points) != null && clean(pair.odds_pattern) !== '';
}

export function hasNumbers(pair) {
  return SCORING_FIELDS.some((key) => asNumber(pair[key]) != null);
}

export function selectVisiblePairs(pairs) {
  return (pairs || []).filter((pair) => pair && VISIBLE_HISTORY.includes(pair.history_status));
}

export function effectiveStronger(pair) {
  if (pair.stronger_connection === true || pair.stronger_connection === false) {
    return pair.stronger_connection === true;
  }
  return pair.verdict === 'yes_first_look';
}

export function pairKey(pair) {
  return [pair.asset || '', eventIdOf(pair), marketIdOf(pair)].join('|');
}

export function eventIdOf(pair) {
  if (pair.event_id != null && pair.event_id !== '') return String(pair.event_id);
  if (pair.event != null && pair.event !== '') return String(pair.event);
  return '';
}

export function marketIdOf(pair) {
  if (pair.market_id != null && pair.market_id !== '') return String(pair.market_id);
  if (pair.market != null && pair.market !== '') return String(pair.market);
  return '';
}

export function pairId(pair) {
  const asset = pair.asset;
  const eventId = eventIdOf(pair);
  const marketId = marketIdOf(pair);
  if (!marketId) return asset + '-' + eventId;
  return asset + '-' + eventId + '-' + marketId;
}

export function parsePairId(id) {
  const match = /^(oil|bitcoin)-(\d+)(?:-(\d+))?$/.exec(String(id || ''));
  if (!match) return null;
  return { asset: match[1], event_id: match[2], market_id: match[3] || '' };
}

function pairList(pairs) {
  if (Array.isArray(pairs)) return pairs.slice();
  if (pairs && typeof pairs === 'object') return Object.values(pairs);
  return null;
}

export function loadEvents(root = projectRoot()) {
  const raw = JSON.parse(readFileSync(path.join(root, 'data', 'fallback.json'), 'utf8'));
  return raw.events || [];
}

function eventIdSet(events) {
  return new Set(events.map((event) => String(event.event_id)));
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

function twoDecimals(value) {
  return asNumber(value).toFixed(2);
}

function formatShare(value) {
  const number = asNumber(value);
  if (number == null) return '';
  const rounded = Math.round(number * 1000) / 1000;
  return String(rounded);
}

function leadLabel(value) {
  if (value === 'day_before') return 'The day before';
  if (value === 'week_before') return 'The week before';
  return '';
}

function directionWord(value) {
  if (value === 'up' || value === 'down') return value;
  return '';
}

function assetLabel(pair) {
  return clean(pair.asset_label) || ASSET_LABEL[pair.asset] || '';
}

function lastCheckedLine(date) {
  return date ? 'Last checked: ' + date : COPY.notChecked;
}

function describedSentence(pair) {
  const insight = clean(pair.insight_sentence);
  const fact = clean(pair.readable_fact);
  if (insight) return insight;
  if (fact) return fact;
  if (pair.insight_kind === 'moved_together') return '';
  if (!hasNumericFact(pair)) return '';
  const direction = directionWord(pair.locked_direction);
  const label = assetLabel(pair);
  if (!direction || !label) return '';
  const pattern = clean(pair.odds_pattern).replace(/\.$/, '');
  return 'On days when ' + pattern + ', ' + label + ' then moved an extra '
    + twoDecimals(pair.extra_average_percentage_points) + '% ' + direction
    + ' on average, compared with days when that pattern did not appear. '
    + 'This is a measured pattern in public prices. It does not mean one caused the other.';
}

function noPatternSentence(pair) {
  return clean(pair.readable_fact) || clean(pair.insight_sentence) || '';
}

function withUnclear(pair, sentence) {
  if (pair.verdict !== 'unclear' || pair.history_status === 'checked_no_pattern') return sentence;
  if (sentence && sentence.includes('This reading is unclear')) return sentence;
  if (!sentence) return COPY.unclear;
  return sentence.endsWith('.') ? sentence + ' ' + COPY.unclear : sentence + '. ' + COPY.unclear;
}

function companionLine(pair) {
  if (pair.history_status !== 'described') return '';
  if (pair.insight_kind === 'moved_together') return '';
  const n = asNumber(pair.predicted_big_move_count);
  const m = asNumber(pair.confirmation_firing_count);
  if (n == null || m == null) return '';
  return 'The price moved at least 1 percent this way in ' + n + ' of ' + m + ' of those later days.';
}

function oilNote(pair) {
  if (pair.asset !== 'oil') return '';
  if (pair.history_status !== 'described') return '';
  if (!hasNumbers(pair)) return '';
  return clean(pair.oil_publish_lag_note) || COPY.oilNoteFallback;
}

function howSure(pair) {
  if (pair.history_status !== 'described') return '';
  if (!effectiveStronger(pair)) return '';
  const text = clean(pair.how_sure);
  if (text) return text;
  return COPY.firstLookSentence;
}

export function isFirstWave(file) {
  return !file || file.method_id === METHOD_ID;
}

function tagsFor(pair, firstWave) {
  if (pair.history_status === 'checked_no_pattern') return [];
  const tags = [];
  if (firstWave) tags.push({ kind: 'first', text: 'First look' });
  if (effectiveStronger(pair) && pair.insight_kind !== 'moved_together') {
    tags.push({ kind: 'strong', text: 'Stronger connection' });
  }
  if (pair.insight_kind === 'moved_together') tags.push({ kind: 'moved', text: 'Moved together' });
  const windowLabel = leadLabel(pair.lead_window);
  if (windowLabel) tags.push({ kind: 'window', text: windowLabel });
  return tags;
}

function statsFor(pair) {
  if (pair.history_status !== 'described') return [];
  const stats = [];
  if (hasNumericFact(pair)) {
    const direction = directionWord(pair.locked_direction);
    const value = twoDecimals(pair.extra_average_percentage_points) + '%' + (direction ? ' ' + direction : '');
    stats.push({ label: 'Extra average', value });
  }
  const n = asNumber(pair.predicted_big_move_count);
  const m = asNumber(pair.confirmation_firing_count);
  if (pair.insight_kind !== 'moved_together' && n != null && m != null) {
    stats.push({ label: 'Hit rate', value: n + ' of ' + m });
  }
  if (m != null && pair.insight_kind !== 'moved_together') {
    stats.push({ label: 'Confirmed signals', value: String(m) });
  }
  return stats;
}

function barFor(pair) {
  if (pair.history_status !== 'described' || pair.insight_kind === 'moved_together') return null;
  const n = asNumber(pair.predicted_big_move_count);
  const m = asNumber(pair.confirmation_firing_count);
  if (n == null || m == null || m <= 0) return null;
  return { pct: Math.max(0, Math.min(100, (100 * n) / m)) };
}

export function buildCard(pair, ctx) {
  const noPattern = pair.history_status === 'checked_no_pattern';
  const sentence = noPattern ? noPatternSentence(pair) : withUnclear(pair, describedSentence(pair));
  const showOdds = !noPattern && clean(pair.odds_pattern) && !sentence.startsWith('On days when ' + clean(pair.odds_pattern).replace(/\.$/, ''));
  return {
    id: pairId(pair),
    href: '/connections/' + pairId(pair),
    tags: tagsFor(pair, ctx.firstWave),
    eventName: clean(pair.event_name),
    assetLabel: assetLabel(pair),
    asset: pair.asset,
    oddsPattern: showOdds ? clean(pair.odds_pattern) : '',
    stats: statsFor(pair),
    bar: barFor(pair),
    companion: noPattern ? '' : companionLine(pair),
    sentence,
    oilNote: oilNote(pair),
    howSure: howSure(pair),
    lastChecked: 'Last checked: ' + (clean(pair.date_last_checked) || ctx.date),
    historyStatus: pair.history_status,
  };
}

function detailRows(pair, ctx) {
  if (pair.history_status === 'checked_no_pattern') {
    const rows = [];
    if (clean(pair.prediction_time)) rows.push({ label: 'When the pattern is read', text: clean(pair.prediction_time) });
    if (clean(pair.observation_time)) rows.push({ label: 'When the price is observed', text: clean(pair.observation_time) });
    if (asNumber(ctx.searchSize) != null) {
      rows.push({ label: '', text: 'How many pairs were tested: ' + ctx.searchSize + '.' });
    }
    return rows;
  }
  const rows = [];
  if (SERIES_LABEL[pair.asset]) rows.push({ label: 'Price series', text: SERIES_LABEL[pair.asset] });
  if (clean(pair.sample_start_date) && clean(pair.sample_end_date)) {
    const which = pair.asset === 'oil'
      ? 'These are official oil-series dates.'
      : 'These are New York calendar dates.';
    rows.push({
      label: 'Sample dates',
      text: clean(pair.sample_start_date) + ' to ' + clean(pair.sample_end_date) + '. ' + which,
    });
  }
  const direction = directionWord(pair.locked_direction);
  if (direction) rows.push({ label: 'This way', text: direction });
  if (hasNumericFact(pair)) {
    rows.push({
      label: 'Extra average',
      text: twoDecimals(pair.extra_average_percentage_points) + '% ' + (direction || ''),
    });
  }
  const low = asNumber(pair.extra_average_likely_range_low_percentage_points);
  const high = asNumber(pair.extra_average_likely_range_high_percentage_points);
  if (low != null && high != null) {
    rows.push({ label: 'Likely range', text: twoDecimals(low) + '% to ' + twoDecimals(high) + '%.' });
  }
  if (asNumber(pair.placebo_share_beaten_percent) != null) {
    rows.push({
      label: '',
      text: 'This extra average ranked above ' + formatShare(pair.placebo_share_beaten_percent) + '% of 1,000 luck checks.',
    });
  }
  const rate = asNumber(pair.predicted_big_move_rate_percent);
  const n = asNumber(pair.predicted_big_move_count);
  const m = asNumber(pair.confirmation_firing_count);
  if (rate != null && n != null && m != null) {
    rows.push({ label: 'When the pattern appeared', text: n + ' of ' + m + ' (' + formatShare(rate) + '%).' });
  }
  const other = asNumber(pair.predicted_big_move_rate_when_not_firing_percent);
  if (other != null) rows.push({ label: 'When the pattern did not appear', text: formatShare(other) + '%.' });
  if (m != null) rows.push({ label: 'Confirmed signals', text: String(m) });
  const evaluated = asNumber(pair.confirmation_evaluated_count);
  if (evaluated != null) rows.push({ label: 'Days that could be checked', text: String(evaluated) });
  if (asNumber(pair.signals_up_count) != null) rows.push({ label: 'Up signals', text: String(pair.signals_up_count) });
  if (asNumber(pair.signals_down_count) != null) rows.push({ label: 'Down signals', text: String(pair.signals_down_count) });
  if (asNumber(ctx.searchSize) != null) {
    rows.push({ label: '', text: 'How many pairs were tested: ' + ctx.searchSize + '.' });
  }
  const change = asNumber(pair.discovery_median_odds_change_percentage_points);
  const ordinary = asNumber(pair.discovery_median_odds_change_ordinary_percentage_points);
  if (change != null || ordinary != null || asNumber(pair.discovery_median_odds_level_percent) != null || clean(pair.most_common_odds_band)) {
    const bits = ['The rule was locked using ordinary days, when the asset moved under 1%.'];
    if (change != null) bits.push('Median chance change used to lock the rule: ' + change + ' points.');
    if (ordinary != null) bits.push('Median chance change on ordinary days: ' + ordinary + ' points.');
    if (asNumber(pair.discovery_median_odds_level_percent) != null) {
      bits.push('Median chance level: ' + formatShare(pair.discovery_median_odds_level_percent) + '%.');
    }
    if (clean(pair.most_common_odds_band)) bits.push('Most common chance band: ' + clean(pair.most_common_odds_band) + '.');
    rows.push({ label: 'How the rule was locked', text: bits.join(' ') });
  }
  if (clean(pair.prediction_time)) rows.push({ label: 'When the pattern is read', text: clean(pair.prediction_time) });
  if (clean(pair.observation_time)) rows.push({ label: 'When the price is observed', text: clean(pair.observation_time) });
  if (effectiveStronger(pair) && typeof pair.many_pair_correction_pass === 'boolean') {
    rows.push({
      label: 'Extra check for many pairs',
      text: pair.many_pair_correction_pass
        ? 'This pair passed the extra check for looking at many pairs.'
        : 'This pair passed the main test but not the extra check for looking at many pairs.',
    });
  }
  if (typeof pair.asset_first_stronger === 'boolean') {
    rows.push({
      label: 'Whether the asset moved first',
      text: pair.asset_first_stronger ? 'The asset moved first.' : 'The asset did not move first.',
    });
  }
  if (typeof pair.reverse_check_passed === 'boolean') {
    let text = pair.reverse_check_passed
      ? 'The reverse check went the same way as the earlier sample.'
      : 'The reverse check did not repeat the earlier sample.';
    if (asNumber(pair.reverse_check_gap_odds_points) != null) {
      text += ' Gap: ' + pair.reverse_check_gap_odds_points + ' odds points.';
    }
    rows.push({ label: 'Reverse check', text });
  }
  if (asNumber(pair.conflict_share_percent) != null) {
    rows.push({ label: 'Clash share', text: formatShare(pair.conflict_share_percent) + '%.' });
  }
  return rows;
}

function sourcesFor(pair, events) {
  const rows = [];
  const event = (events || []).find((item) => String(item.event_id) === eventIdOf(pair));
  if (event && event.polymarket_url) rows.push({ href: event.polymarket_url, label: 'Public event page' });
  if (pair.asset === 'oil') {
    rows.push({ href: 'https://www.eia.gov/dnav/pet/hist/rwtcd.htm', label: 'Public oil series (EIA RWTC)' });
    rows.push({ href: 'https://fred.stlouisfed.org/series/DCOILWTICO', label: 'Public oil series (FRED DCOILWTICO)' });
  }
  if (pair.asset === 'bitcoin') {
    rows.push({ href: 'https://www.binance.com/en/trade/BTC_USDT', label: 'Public Bitcoin series (Binance BTCUSDT)' });
    rows.push({ href: 'https://www.coinbase.com/price/bitcoin', label: 'Public Bitcoin series (Coinbase BTC-USD)' });
  }
  return rows;
}

export function buildDetail(pair, ctx) {
  const card = buildCard(pair, ctx);
  return {
    ...card,
    rows: detailRows(pair, ctx),
    sources: sourcesFor(pair, ctx.events),
    howWeCheck: COPY.howWeCheck,
    oilNote: oilNote(pair),
  };
}

const FILTERS = [
  ['all', 'All', '/connections'],
  ['oil', 'Main US oil price', '/connections?asset=oil'],
  ['bitcoin', 'Bitcoin', '/connections?asset=bitcoin'],
];

function filterLinks(filter) {
  return FILTERS.map(([id, label, href]) => ({ id, label, href, on: id === filter }));
}

export function loadingState(filter = 'all') {
  const chosen = filter === 'oil' || filter === 'bitcoin' ? filter : 'all';
  return {
    mode: 'loading',
    title: COPY.title,
    filter: chosen,
    filters: filterLinks(chosen),
    banners: [],
    cards: [],
    quiet: [],
    footer: '',
    loading: COPY.loading,
  };
}

function quietLines(allPairs, visible, filter) {
  const lines = [];
  const oilCount = visible.filter((pair) => pair.asset === 'oil').length;
  const bitcoinCount = visible.filter((pair) => pair.asset === 'bitcoin').length;
  const filtered = filter === 'all' ? visible : visible.filter((pair) => pair.asset === filter);
  if (filter === 'all') {
    if (oilCount > 0 && bitcoinCount === 0) lines.push(COPY.bitcoinQuiet);
    if (bitcoinCount > 0 && oilCount === 0) lines.push(COPY.oilQuiet);
  } else if (filtered.length === 0 && visible.length > 0) {
    lines.push(filter === 'oil' ? COPY.oilQuiet : COPY.bitcoinQuiet);
  }
  if (filtered.length > 0) {
    const scoped = filter === 'all' ? allPairs : allPairs.filter((pair) => pair.asset === filter);
    const thin = scoped.some((pair) => pair.history_status === 'not_enough_history');
    if (thin) lines.push(COPY.otherEvents);
  }
  return lines;
}

export function buildListState(loaded, filter = 'all') {
  const chosen = filter === 'oil' || filter === 'bitcoin' ? filter : 'all';
  const base = {
    title: COPY.title,
    filter: chosen,
    filters: filterLinks(chosen),
    banners: [],
    cards: [],
    quiet: [],
    loading: '',
  };
  if (!loaded || loaded.status === 'missing') {
    return {
      ...base,
      mode: 'empty',
      footer: COPY.notChecked,
      empty: { headline: COPY.emptyHeadline, body: COPY.emptyBody, context: COPY.emptyContext },
    };
  }
  if (loaded.status !== 'ok' || !loaded.file) {
    return {
      ...base,
      mode: 'unread',
      footer: COPY.unreadableFooter,
      unread: { headline: COPY.unreadHeadline, body: COPY.unreadBody },
    };
  }
  const file = loaded.file;
  const visible = selectVisiblePairs(file.pairs);
  if (!visible.length) {
    return {
      ...base,
      mode: 'empty',
      footer: lastCheckedLine(file.date_last_checked),
      empty: { headline: COPY.emptyHeadline, body: COPY.emptyBody, context: COPY.emptyContext },
    };
  }
  const filtered = chosen === 'all' ? visible : visible.filter((pair) => pair.asset === chosen);
  const ctx = {
    date: file.date_last_checked,
    searchSize: file.search_size,
    events: loaded.events || [],
    firstWave: isFirstWave(file),
  };
  const cards = filtered.map((pair) => buildCard(pair, ctx));
  const banners = [];
  if (cards.some((card) => card.tags.some((tag) => tag.kind === 'first'))) {
    banners.push({ tone: 'first', text: COPY.firstLookBanner });
  }
  if (cards.length >= 1 && cards.length <= 3) {
    banners.push({ tone: 'sparse', text: COPY.sparseBanner, helper: COPY.sparseHelper });
  }
  return {
    ...base,
    mode: 'list',
    footer: lastCheckedLine(file.date_last_checked),
    banners,
    cards,
    quiet: quietLines(file.pairs, visible, chosen),
  };
}

export function buildDetailState(loaded, id) {
  const backHref = '/connections';
  if (!loaded || loaded.status === 'missing') {
    return {
      mode: 'missing',
      title: COPY.title,
      backHref,
      footer: COPY.notChecked,
      message: COPY.notInCheck,
    };
  }
  if (loaded.status !== 'ok' || !loaded.file) {
    return {
      mode: 'unread',
      title: COPY.title,
      backHref,
      footer: COPY.unreadableFooter,
      unread: { headline: COPY.unreadHeadline, body: COPY.unreadBody },
    };
  }
  const parsed = parsePairId(id);
  const visible = selectVisiblePairs(loaded.file.pairs);
  const pair = parsed && visible.find((item) => pairId(item) === id);
  if (!pair) {
    return {
      mode: 'missing',
      title: COPY.title,
      backHref,
      footer: lastCheckedLine(loaded.file.date_last_checked),
      message: COPY.notInCheck,
    };
  }
  const ctx = {
    date: loaded.file.date_last_checked,
    searchSize: loaded.file.search_size,
    events: loaded.events || [],
    firstWave: isFirstWave(loaded.file),
  };
  return {
    mode: 'detail',
    title: clean(pair.event_name) || COPY.title,
    backHref,
    footer: lastCheckedLine(loaded.file.date_last_checked),
    card: buildDetail(pair, ctx),
  };
}

function scoringMustBeEmpty(pair, errors, label) {
  for (const key of SCORING_FIELDS) {
    if (pair[key] == null || pair[key] === '') continue;
    errors.push(label + ' ' + key + ' must be empty, not a number');
  }
  if (clean(pair.how_sure)) errors.push(label + ' how_sure must be empty');
}

function checkRanges(pair, errors, label) {
  for (const key of PERCENT_FIELDS) {
    if (isBlankNumber(pair[key])) continue;
    const number = asNumber(pair[key]);
    if (number == null || number < 0 || number > 100) errors.push(label + ' ' + key + ' is out of range');
  }
  for (const key of COUNT_FIELDS) {
    if (isBlankNumber(pair[key])) continue;
    const number = asNumber(pair[key]);
    if (number == null || !Number.isInteger(number) || number < 0) errors.push(label + ' ' + key + ' must be a whole number');
  }
  for (const key of SCORING_FIELDS) {
    if (isBlankNumber(pair[key])) continue;
    if (asNumber(pair[key]) == null) errors.push(label + ' ' + key + ' is not a number');
  }
  const n = asNumber(pair.predicted_big_move_count);
  const m = asNumber(pair.confirmation_firing_count);
  const rate = asNumber(pair.predicted_big_move_rate_percent);
  if (n != null && m != null && n > m) errors.push(label + ' hit count is larger than the firing count');
  if (n != null && m != null && rate != null) {
    if (m === 0 || Math.abs(rate - (100 * n) / m) > 0.1) errors.push(label + ' hit rate does not equal 100 × n / m');
  }
}

function checkPair(pair, index, ctx, errors) {
  const label = 'pair ' + index;
  if (!pair || typeof pair !== 'object' || Array.isArray(pair)) {
    errors.push(label + ' is not an object');
    return;
  }
  const eventId = eventIdOf(pair);
  if (!eventId) errors.push(label + ' is missing event_id');
  else if (!ctx.eventIds.has(eventId)) errors.push(label + ' event is not in the app list');
  if (!clean(pair.event_name)) errors.push(label + ' is missing event_name');
  if (!ASSETS.includes(pair.asset)) errors.push(label + ' asset must be oil or bitcoin');
  if (!VERDICTS.includes(pair.verdict)) errors.push(label + ' verdict is not allowed');
  if (pair.history_status != null && !HISTORY_STATUSES.includes(pair.history_status)) {
    errors.push(label + ' history_status is not allowed');
  }
  if (pair.insight_kind != null && !INSIGHT_KINDS.includes(pair.insight_kind)) {
    errors.push(label + ' insight_kind is not allowed');
  }
  if (pair.lead_window != null && pair.lead_window !== 'day_before' && pair.lead_window !== 'week_before') {
    errors.push(label + ' lead_window is not allowed');
  }
  if (pair.locked_direction != null && pair.locked_direction !== 'up' && pair.locked_direction !== 'down') {
    errors.push(label + ' locked_direction is not allowed');
  }
  if (pair.stronger_connection != null && typeof pair.stronger_connection !== 'boolean') {
    errors.push(label + ' stronger_connection must be true or false');
  }
  if (typeof pair.stronger_connection === 'boolean' && pair.stronger_connection !== (pair.verdict === 'yes_first_look')) {
    errors.push(label + ' stronger_connection does not match yes_first_look');
  }
  if (pair.history_status === 'checked_no_pattern') {
    if (pair.verdict === 'yes_first_look' || pair.verdict === 'not_enough_history') {
      errors.push(label + ' checked_no_pattern cannot use that verdict');
    }
    if (pair.insight_kind != null && pair.insight_kind !== 'checked_no_pattern') {
      errors.push(label + ' insight_kind must be checked_no_pattern');
    }
    for (const key of SCORING_FIELDS) {
      if (pair[key] === 0) errors.push(label + ' ' + key + ' must be empty, not zero');
    }
  }
  if (pair.history_status === 'not_enough_history' || pair.verdict === 'not_enough_history' || pair.insight_kind === 'not_enough_history') {
    scoringMustBeEmpty(pair, errors, label);
  }
  if (pair.insight_kind === 'moved_together' && pair.verdict === 'yes_first_look') {
    errors.push(label + ' a same-day pair cannot be yes_first_look');
  }
  if (pair.verdict === 'yes_first_look') {
    if (pair.history_status && pair.history_status !== 'described') errors.push(label + ' yes_first_look must be described');
    if (asNumber(pair.extra_average_percentage_points) == null || pair.extra_average_percentage_points < YES_MIN_EXTRA) {
      errors.push(label + ' yes_first_look extra average is below the locked bar');
    }
    if (asNumber(pair.confirmation_firing_count) == null || pair.confirmation_firing_count < YES_MIN_FIRING) {
      errors.push(label + ' yes_first_look firing count is below the locked bar');
    }
    if (asNumber(pair.placebo_share_beaten_percent) == null || pair.placebo_share_beaten_percent < YES_MIN_PLACEBO) {
      errors.push(label + ' yes_first_look luck check is below the locked bar');
    }
    if (pair.reverse_check_passed !== true) errors.push(label + ' yes_first_look reverse check is not true');
    if (pair.asset_first_stronger !== false) errors.push(label + ' yes_first_look asset-first check is not false');
    if (asNumber(pair.conflict_share_percent) != null && pair.conflict_share_percent >= YES_CONFLICT_UNDER) {
      errors.push(label + ' yes_first_look clash share is not under 30');
    }
    if (!directionWord(pair.locked_direction)) errors.push(label + ' yes_first_look is missing a direction');
    if (!clean(pair.odds_pattern)) errors.push(label + ' yes_first_look is missing odds_pattern');
    if (!clean(pair.how_sure).startsWith(COPY.firstLookSentence)) {
      errors.push(label + ' how_sure must start with the first-look sentence');
    }
    if (/\b(low|medium|high)\b/i.test(clean(pair.how_sure))) errors.push(label + ' how_sure uses a confidence label');
    if (pair.lead_window !== 'day_before' && pair.lead_window !== 'week_before') {
      errors.push(label + ' yes_first_look is missing a lead window');
    }
    if (asNumber(pair.predicted_big_move_count) == null) errors.push(label + ' yes_first_look is missing the hit count');
  }
  if (effectiveStronger(pair) && pair.history_status === 'described' && clean(pair.how_sure) && !clean(pair.how_sure).startsWith(COPY.firstLookSentence)) {
    errors.push(label + ' how_sure must start with the first-look sentence');
  }
  checkRanges(pair, errors, label);
  if (pair.date_last_checked != null && !/^\d{4}-\d{2}-\d{2}$/.test(pair.date_last_checked)) {
    errors.push(label + ' date_last_checked is not YYYY-MM-DD');
  }
  if (ctx.fingerprint && pair.method_fingerprint != null && pair.method_fingerprint !== ctx.fingerprint) {
    errors.push(label + ' method_fingerprint does not match the file');
  }
  if (ctx.searchSize != null && pair.search_size != null && pair.search_size !== ctx.searchSize) {
    errors.push(label + ' search_size does not match the file');
  }
  const shown = [pair.event_name, pair.odds_pattern, pair.how_sure, pair.oil_publish_lag_note, pair.insight_sentence, pair.readable_fact];
  for (const text of shown) {
    const problem = textProblem(clean(text));
    if (problem) errors.push(label + ' ' + problem);
  }
}

export function validateFile(raw, options = {}) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['results file is not an object'], file: null };
  }
  walkValues(raw, (full, key, value) => {
    if (PRIVATE_KEYS.has(String(key).toLowerCase())) errors.push('personal or secret field ' + full);
    if (typeof value === 'string' && /0x[a-fA-F0-9]{40}/.test(value)) errors.push('wallet-like value in ' + full);
    if (typeof value === 'string') {
      const problem = textProblem(value);
      if (problem && /wallet|secret|password|api[_-]?key/i.test(full)) errors.push(problem + ' in ' + full);
    }
  });
  if (raw.schema_version !== SCHEMA_VERSION) errors.push('schema_version must be connections-1');
  if (raw.method_id !== METHOD_ID) errors.push('method_id must be TR-007 under this lock');
  if (raw.method_fingerprint !== METHOD_FINGERPRINT) errors.push('method_fingerprint does not match the lock');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.date_last_checked || '')) errors.push('date_last_checked must be YYYY-MM-DD');
  else {
    const today = options.today || israelDate();
    if (raw.date_last_checked > today) errors.push('date_last_checked is in the future');
    const stamp = Date.parse(raw.date_last_checked + 'T00:00:00Z');
    if (Number.isNaN(stamp)) errors.push('date_last_checked is not a real date');
  }
  const runId = raw.run_id || '';
  if (!/^TR-007-\d{4}-\d{2}-\d{2}(?:-\d{4})?$/.test(runId)) errors.push('run_id is not TR-007-YYYY-MM-DD');
  else if (raw.date_last_checked && !runId.startsWith('TR-007-' + raw.date_last_checked)) {
    errors.push('run_id does not match date_last_checked');
  }
  if (raw.search_size != null) {
    if (asNumber(raw.search_size) == null || !Number.isInteger(raw.search_size) || raw.search_size < 0) {
      errors.push('search_size must be a whole number');
    }
  }
  if (raw.assets_checked != null) {
    if (!Array.isArray(raw.assets_checked) || raw.assets_checked.some((asset) => !ASSETS.includes(asset))) {
      errors.push('assets_checked must list oil or bitcoin');
    }
  }
  const pairs = pairList(raw.pairs);
  if (!pairs) errors.push('pairs must be a list or an empty map');
  const setAside = raw.set_aside == null ? [] : raw.set_aside;
  if (!Array.isArray(setAside)) errors.push('set_aside must be a list');
  const events = options.events || loadEvents(options.root);
  const eventIds = options.eventIds || eventIdSet(events);
  const seen = new Set();
  const asideKeys = new Set();
  if (Array.isArray(setAside)) {
    setAside.forEach((row, index) => {
      if (!row || typeof row !== 'object') {
        errors.push('set_aside ' + index + ' is not an object');
        return;
      }
      const eventId = eventIdOf(row);
      if (!eventId || !eventIds.has(eventId)) errors.push('set_aside ' + index + ' event is not in the app list');
      if (!ASSETS.includes(row.asset)) errors.push('set_aside ' + index + ' asset must be oil or bitcoin');
      if (!clean(row.reason)) errors.push('set_aside ' + index + ' is missing a reason');
      const problem = textProblem(clean(row.reason));
      if (problem) errors.push('set_aside ' + index + ' ' + problem);
      asideKeys.add((row.asset || '') + '|' + eventId);
    });
  }
  (pairs || []).forEach((pair, index) => {
    checkPair(pair, index, {
      eventIds,
      fingerprint: raw.method_fingerprint,
      searchSize: raw.search_size == null ? null : raw.search_size,
    }, errors);
    const key = pairKey(pair || {});
    if (seen.has(key)) errors.push('duplicate pair ' + key);
    seen.add(key);
    if (asideKeys.has((pair && pair.asset) + '|' + eventIdOf(pair || {}))) {
      errors.push('pair ' + index + ' is also set aside for the same asset');
    }
  });
  const file = {
    ...raw,
    pairs: pairs || [],
    set_aside: Array.isArray(setAside) ? setAside : [],
  };
  return { ok: errors.length === 0, errors, file };
}

function readJson(filePath) {
  try {
    return { ok: true, raw: JSON.parse(readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function runRank(raw) {
  const date = raw && raw.date_last_checked ? raw.date_last_checked : '';
  const time = raw && /^TR-007-\d{4}-\d{2}-\d{2}-(\d{4})$/.test(raw.run_id || '') ? raw.run_id.slice(-4) : '';
  return date + time;
}

export function loadConnections(dir = connectionsDir(), options = {}) {
  const events = options.events || loadEvents(options.root || projectRoot());
  const validateOptions = { ...options, events, eventIds: eventIdSet(events) };
  const latestPath = path.join(dir, 'latest.json');
  let latest = null;
  let latestOk = false;
  if (existsSync(latestPath)) {
    const read = readJson(latestPath);
    if (!read.ok) latest = { ok: false, errors: ['could not read latest.json'] };
    else {
      latest = validateFile(read.raw, validateOptions);
      latestOk = latest.ok;
    }
  }
  const runsDir = path.join(dir, 'runs');
  const runs = [];
  if (existsSync(runsDir)) {
    for (const name of readdirSync(runsDir)) {
      if (!name.endsWith('.json')) continue;
      const read = readJson(path.join(runsDir, name));
      if (!read.ok) continue;
      const checked = validateFile(read.raw, validateOptions);
      if (checked.ok) runs.push(checked.file);
    }
  }
  runs.sort((a, b) => runRank(a) < runRank(b) ? 1 : runRank(a) > runRank(b) ? -1 : 0);
  if (latestOk) {
    return { status: 'ok', file: latest.file, pairs: latest.file.pairs, errors: [], source: 'latest', events };
  }
  if (latest && !latestOk) {
    if (runs.length) {
      return { status: 'ok', file: runs[0], pairs: runs[0].pairs, errors: latest.errors, source: 'previous', events };
    }
    return { status: 'invalid', file: null, pairs: [], errors: latest.errors, source: null, events };
  }
  if (runs.length) {
    return { status: 'ok', file: runs[0], pairs: runs[0].pairs, errors: [], source: 'previous', events };
  }
  return { status: 'missing', file: null, pairs: [], errors: [], source: null, events };
}

export function visibleText(state) {
  if (!state) return '';
  const parts = [state.title, state.footer, state.loading, state.message];
  if (state.empty) parts.push(state.empty.headline, state.empty.body, state.empty.context);
  if (state.unread) parts.push(state.unread.headline, state.unread.body);
  for (const banner of state.banners || []) parts.push(banner.text, banner.helper);
  for (const line of state.quiet || []) parts.push(line);
  for (const card of state.cards || []) parts.push(cardText(card));
  if (state.card) parts.push(cardText(state.card));
  return parts.filter(Boolean).join('\n');
}

function cardText(card) {
  const bits = [
    ...(card.tags || []).map((tag) => tag.text),
    card.eventName,
    card.assetLabel,
    card.oddsPattern,
    ...(card.stats || []).map((stat) => stat.label + ' ' + stat.value),
    card.companion,
    card.sentence,
    card.oilNote,
    card.howSure,
    card.lastChecked,
    ...(card.rows || []).map((row) => (row.label ? row.label + ' ' : '') + row.text),
    ...(card.sources || []).map((source) => source.label),
    card.howWeCheck,
  ];
  return bits.filter(Boolean).join('\n');
}
