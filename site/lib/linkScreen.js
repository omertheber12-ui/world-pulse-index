/**
 * View model for the Connections screens. Reads the summary and the series.
 * Does not compute a new correlation. Spark smoothing is drawing only.
 */
import { loadChartSeries, chartModel, sparkSeries } from './chartSeries.js';
import {
  COPY,
  assetPhrase,
  beatsFlag,
  buildHeadline,
  buildPageState,
  eventPhrase,
  formatDay,
  formatNumber,
  formatShare,
  isSizeRow,
  linkId,
  linkTier,
  loadCorrelations,
  pageHeadline,
  parseLinkId,
  timingGroup,
} from './correlations.js';

const TIER_WORD = { strict: 'Strong link', stronger: 'Medium link', weaker: 'Weak link' };
const TIER_GROUP = {
  strict: 'Strong links',
  stronger: 'medium links',
  weaker: 'weaker links',
};

function timingLabel(row) {
  return timingGroup(row) === 'same_day' ? 'Same day' : 'One moved first';
}

function timingNote(row) {
  if (timingGroup(row) === 'same_day') return 'neither moved first';
  const lag = String(row.lag || '');
  if (lag.startsWith('odds_lead')) return 'odds moved first';
  if (lag.startsWith('asset_lead')) return 'the asset moved first';
  return 'one moved first';
}

function roundOdds(value) {
  if (typeof value !== 'number') return '';
  const rounded = Math.round(value);
  const text = String(Math.abs(rounded));
  return rounded < 0 ? '−' + text : text;
}

function roundLevel(value, unit) {
  if (typeof value !== 'number') return '';
  if (unit === 'percent') return value.toFixed(2) + '%';
  if (Math.abs(value) >= 100) return String(Math.round(value));
  return value.toFixed(2);
}

function lastPair(points) {
  for (let i = points.length - 1; i >= 0; i--) {
    if (typeof points[i].odds === 'number' && typeof points[i].asset === 'number') return points[i];
  }
  return points[points.length - 1] || null;
}

function monthLabel(iso) {
  if (!iso) return '';
  const [year, month] = iso.split('-').map(Number);
  const name = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
  return name + ' ' + year;
}

function linePath(points, pick, width, height, pad) {
  let min = Infinity;
  let max = -Infinity;
  points.forEach((point) => {
    const value = pick(point);
    if (typeof value !== 'number') return;
    if (value < min) min = value;
    if (value > max) max = value;
  });
  if (!Number.isFinite(min)) return '';
  if (min === max) { min -= 1; max += 1; }
  const inner = height - pad * 2;
  let d = '';
  let drawing = false;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  points.forEach((point, index) => {
    const value = pick(point);
    if (typeof value !== 'number') { drawing = false; return; }
    const x = (index * step).toFixed(1);
    const y = (pad + (1 - (value - min) / (max - min)) * inner).toFixed(1);
    d += (drawing ? 'L' : 'M') + x + ' ' + y + ' ';
    drawing = true;
  });
  return d.trim();
}

function oddsPhrase(row) {
  const text = String(row.event_label || '');
  if (text.includes('rate cut')) return 'the chance of a rate cut';
  if (text.includes('peace')) return 'the chance of peace over war';
  if (text.toLowerCase().includes('inflation report') && !isSizeRow(row)) return 'the inflation-report odds';
  if (isSizeRow(row)) return "each day's odds swing";
  return 'the odds';
}

export function chartNote(row, model) {
  const asset = (model && model.assetName) || 'asset';
  const unit = (model && model.assetUnit) ? ', in ' + model.assetUnit : '';
  if (model && model.measure === 'size') {
    return 'The odds line is the size of each day\'s odds swing. The ' + asset + ' line is the size of that day\'s move, up or down.';
  }
  const close = String(asset).includes('yield') ? 'shows the yield at each day\'s close' : 'shows its level at each day\'s close';
  return 'The odds line adds up each day\'s change in ' + oddsPhrase(row) + ', starting at 0. The ' + asset + ' line ' + close + unit + '.';
}

function signedTwo(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  const text = Math.abs(number).toFixed(2);
  return number < 0 ? '−' + text : text;
}

export function strengthCopy(row) {
  const share = formatShare(row.chance_share_as_strong);
  const outside = row.passes_chance_line === true;
  const band = 'Chance alone stays inside the band in 95 of 100 shuffles. This link is ' + (outside ? 'outside' : 'inside') + ' it.';
  const sign = typeof row.spearman === 'number' ? row.spearman : null;
  const asset = assetPhrase(row, false);
  const event = eventPhrase(row);
  const tail = outside
    ? ' Only ' + share + ' of shuffles were this strong.'
    : '';
  let way = '';
  if (!outside) {
    way = 'This link is inside it, so chance alone could explain it. ' + share + ' of shuffles were this strong.';
  } else if (isSizeRow(row) && sign != null && sign < 0) {
    way = 'Below zero means bigger swings in the odds came with smaller moves in ' + asset + '.' + tail;
  } else if (isSizeRow(row)) {
    way = 'Above zero means bigger swings in the odds came with bigger moves in ' + asset + ', whichever way each went.' + tail;
  } else if (sign != null && sign < 0) {
    const odds = String(row.event_label || '').includes('rate cut') ? 'the odds of a cut' : 'the odds';
    way = 'Below zero means the two moved opposite ways: when ' + odds + ' went up, ' + asset + ' went down.' + tail;
  } else if (sign != null && sign > 0) {
    const oddsFirst = String(row.lag || '').startsWith('odds_lead');
    way = oddsFirst
      ? 'Above zero means the two moved the same way: when the odds went up, ' + asset + ' tended to go up too.' + tail
      : 'Above zero means the two moved the same way: when ' + asset + ' went up, ' + event + ' tended to go up too.' + tail;
  }
  return {
    band,
    way,
    share,
    outside,
    size: isSizeRow(row),
    bandAbs: formatNumber(row.chance_p95_abs),
    bandText: signedTwo(row.chance_p95_abs),
    value: formatNumber(row.spearman),
    valueText: signedTwo(row.spearman),
    raw: sign,
  };
}

function pickRows(file, row) {
  const lists = []
    .concat((file && file.strongest_per_asset) || [])
    .concat((file && file.strongest_per_event) || []);
  return lists.filter((item) => item.event_family === row.event_family && item.asset === row.asset && item.lag === row.lag);
}

export function checksCopy(row, summary, file) {
  const tested = formatNumber(summary && summary.rows_tested);
  const picks = pickRows(file, row);
  const passing = picks.find((item) => beatsFlag(item) === true) || picks[0];
  const subject = eventPhrase(row);
  const lines = [];
  if (passing && passing.picked_from_n != null) {
    lines.push('Picked as the strongest of ' + formatNumber(passing.picked_from_n) + ' links for ' + subject + '. The top of a long list looks strong partly by luck.');
  }
  if (picks.length) {
    lines.push(picks.some((item) => beatsFlag(item) === true)
      ? 'It still passes the strict pick-from-many check.'
      : 'It does not pass the strict pick-from-many check.');
  }
  lines.push(row.bh_flag === true
    ? 'It still stands after correcting for all ' + tested + ' tests.'
    : 'It does not stand after correcting for all ' + tested + ' tests.');
  return lines;
}

export function sourcesLine(row, model, file) {
  const source = (model && model.source) || '';
  const run = (file && file.run_id) || '';
  const day = formatDay(file && file.generated_at);
  return 'Sources: Polymarket public trades, with trades before 12 Nov 2023 from the Envio export (CC BY 4.0). '
    + ((model && model.assetName) || 'The asset') + (source ? ' from ' + source : '') + '. Research run ' + run + ', ' + day + '.';
}

function rowView(row, file, includeChart) {
  const tier = linkTier(row);
  const model = chartModel({
    eventFamily: row.event_family,
    assetId: row.asset,
    timingGroup: timingGroup(row),
    lag: row.lag,
  });
  const spark = sparkSeries(model);
  const end = model ? lastPair(model.points) : null;
  return {
    id: linkId(row),
    href: '/connections/' + linkId(row),
    headline: buildHeadline(row),
    tier,
    tierLabel: TIER_WORD[tier],
    timing: timingGroup(row),
    timingLabel: timingLabel(row),
    episodes: formatNumber(row.independent_episodes),
    sparkOdds: linePath(spark, (point) => point.odds, 88, 32, 2),
    sparkAsset: linePath(spark, (point) => point.asset, 88, 32, 2),
    chart: model && includeChart ? {
      points: model.points.map((point) => ({ date: point.date, odds: point.odds, asset: point.asset })),
      measure: model.measure,
      oddsName: model.measure === 'size' ? 'Odds swing' : 'Odds change since start',
      assetName: model.assetName,
      assetUnit: model.assetUnit,
      oddsEnd: end ? roundOdds(end.odds) + ' points' : '',
      assetEnd: end ? roundLevel(end.asset, model.measure === 'size' ? '' : model.assetUnit) : '',
      startLabel: model.points.length ? monthLabel(model.points[0].date) : '',
      endLabel: model.points.length ? monthLabel(model.points[model.points.length - 1].date) : '',
      windowStart: formatDay(row.window_start),
      windowEnd: formatDay(row.window_end),
    } : null,
    detail: {
      pageHeadline: pageHeadline(row),
      meta: formatDay(row.window_start) + ' to ' + formatDay(row.window_end) + ' · ' + formatNumber(row.independent_episodes) + ' separate episodes',
      note: chartNote(row, model),
      strength: strengthCopy(row),
      facts: [
        { value: formatNumber(row.independent_episodes), label: 'separate episodes' },
        { value: formatNumber(row.trading_days), label: 'trading days' },
        { value: timingLabel(row), label: timingNote(row) },
      ],
      checks: checksCopy(row, file && file.chance_summary, file),
      sources: sourcesLine(row, model, file),
    },
  };
}

function countsOf(rows) {
  const count = (list, tier) => list.filter((row) => row.tier === tier).length;
  return {
    all: rows.length,
    sameDay: rows.filter((row) => row.timing === 'same_day').length,
    lead: rows.filter((row) => row.timing !== 'same_day').length,
    strong: count(rows, 'strict'),
    medium: count(rows, 'stronger'),
    weak: count(rows, 'weaker'),
  };
}

export function buildHome(loaded) {
  const base = buildPageState(loaded);
  if (!loaded || loaded.status !== 'ok' || !loaded.file) {
    return { mode: 'empty', banner: COPY.previewBanner, standing: 'Past data. Description only, not proven. Not a forecast and not advice.', empty: COPY.empty };
  }
  const file = loaded.file;
  const pairs = (file.pairs || []).slice().sort((a, b) => {
    const aAbs = typeof a.spearman === 'number' ? Math.abs(a.spearman) : -1;
    const bAbs = typeof b.spearman === 'number' ? Math.abs(b.spearman) : -1;
    if (aAbs !== bAbs) return bAbs - aAbs;
    const aZ = typeof a.z_vs_shuffle === 'number' ? a.z_vs_shuffle : -Infinity;
    const bZ = typeof b.z_vs_shuffle === 'number' ? b.z_vs_shuffle : -Infinity;
    return bZ - aZ;
  });
  const rows = pairs.map((row) => rowView(row, file, false));
  const featuredSource = pairs.find((row) => base.mainChart && row.event_family === base.mainChart.eventFamily && row.asset === base.mainChart.assetId && row.lag === base.mainChart.lag);
  const featured = featuredSource ? rowView(featuredSource, file, true) : rows[0];
  const summary = file.chance_summary || {};
  const hidden = (typeof summary.rows_tested === 'number' && typeof summary.shown_rows === 'number')
    ? summary.rows_tested - summary.shown_rows
    : null;
  return {
    mode: 'ready',
    banner: COPY.previewBanner,
    standing: 'Past data. Description only, not proven. Not a forecast and not advice.',
    featured,
    rows,
    counts: countsOf(rows),
    shown: formatNumber(summary.shown_rows),
    tested: formatNumber(summary.rows_tested),
    hidden: formatNumber(hidden),
    groups: TIER_GROUP,
  };
}

export function buildLinkDetail(loaded, id) {
  if (!parseLinkId(id)) return null;
  const standing = 'Past data. Description only, not proven. Not a forecast and not advice.';
  if (!loaded || loaded.status !== 'ok' || !loaded.file) {
    return { mode: 'empty', banner: COPY.previewBanner, standing, empty: COPY.empty };
  }
  const row = (loaded.file.pairs || []).find((item) => linkId(item) === id);
  if (!row) return { mode: 'missing', banner: COPY.previewBanner, standing, message: 'This link is not in the latest check.' };
  return { mode: 'ready', banner: COPY.previewBanner, standing, row: rowView(row, loaded.file, true) };
}

export function loadHome() {
  return buildHome(loadCorrelations());
}

export function loadDetail(id) {
  return buildLinkDetail(loadCorrelations(), id);
}

export function sampleSentences(loaded) {
  const file = loaded && loaded.file;
  const pairs = (file && file.pairs) || [];
  const negative = pairs.find((row) => row.event_family === 'F1_fed/direction' && row.asset === 'us_2y_yield' && row.lag === 'same_day');
  const positive = pairs.find((row) => row.event_family === 'INF_us_cpi/direction' && row.asset === 'inflation_expectation_5y' && row.lag === 'asset_lead_5d');
  const size = pairs.find((row) => row.event_family === 'F1_fed/size' && row.asset === 'us_2y_yield' && row.lag === 'same_day');
  return [negative, positive, size].filter(Boolean).map((row) => {
    const model = chartModel({ eventFamily: row.event_family, assetId: row.asset, timingGroup: timingGroup(row), lag: row.lag });
    return {
      id: linkId(row),
      measure: isSizeRow(row) ? 'size' : 'direction',
      sign: typeof row.spearman === 'number' && row.spearman < 0 ? 'negative' : 'positive',
      headline: buildHeadline(row),
      page: pageHeadline(row),
      note: chartNote(row, model),
      strength: strengthCopy(row),
      checks: checksCopy(row, file.chance_summary, file),
      sources: sourcesLine(row, model, file),
    };
  });
}

export { loadChartSeries };
