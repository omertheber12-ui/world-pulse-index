/** Fixture checks for strongest links. Fixtures stay here and are never written to data/correlations/latest.json. */
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { textProblem } from '../lib/connections.js';
import {
  COPY, buildCard, buildHeadline, buildPageState, isSizeRow, linkTier, loadCorrelations, timingGroup, validateFile, visibleText,
} from '../lib/correlations.js';
import { BRAND_HEADLINES, STANDING_LINE } from '../lib/brandHeadlines.js';
import { ODDS_AXIS, SIZE_ODDS_AXIS, chartModel, hasBothLines, loadChartSeries, oddsPointsAfterHoldBack, seriesPath } from '../lib/chartSeries.js';
import { buildHome, strengthCopy } from '../lib/linkScreen.js';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH_SHA = 'a801a002f45b93c22acc60287ab168c0f220c9545b8381ae794beaaedd7049d9';
const SERIES_SHA = '5f968fbdb71f2bafa8043d4ffbe6278bd6897d0adfa8c0077ccdbad9ee3ef1be';

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function row(over = {}) {
  return {
    asset: 'bitcoin',
    asset_label: 'Example: Bitcoin',
    event_family: 'example_ceasefire',
    event_label: 'Example: a ceasefire chance',
    lag: 'same_day',
    spearman: 0.22,
    chance_p95_abs: 0.31,
    chance_share_as_strong: 0.11,
    independent_episodes: 18,
    trading_days: 140,
    bh_flag: false,
    picked_from_n: 9,
    ...over,
  };
}

function file(over = {}) {
  return {
    schema_version: 'correlations-1',
    method_id: 'TR-016',
    run_id: 'TR-016-2026-11-11',
    is_example: false,
    generated_at: '2026-11-11T12:00:00Z',
    window_start: '2024-01-02',
    window_end: '2026-11-10',
    chance_method: 'Shuffle the days many times and measure how large a correlation appears from luck alone.',
    label: 'description only, not proven',
    pairs: [],
    strongest_per_asset: [row()],
    strongest_per_event: [],
    chance_summary: { pairs_tested: 4, expected_strong_by_luck: 0.2, observed_strong: 1 },
    ...over,
  };
}

function stateFrom(raw) {
  const checked = validateFile(raw);
  return { checked, state: buildPageState({ status: checked.ok ? 'ok' : 'invalid', file: checked.file }) };
}

function textOf(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

export function runCorrelationChecks(add) {
  const loaded = loadCorrelations(path.join(siteRoot, 'data/correlations'));
  const state = buildPageState(loaded);
  const cards = [...(state.sameDay || []), ...(state.lead || [])];
  const text = visibleText(state);
  add('the research file parses',
    loaded.status === 'ok' && loaded.errors.length === 0 && loaded.file.schema_version === 'correlations-1'
    && loaded.file.method_id === 'TR-016' && loaded.file.run_id === 'TR-016-2026-11-11' && loaded.file.is_example !== true,
    loaded.errors.join('; '));

  const latestPath = path.join(siteRoot, 'data/correlations/latest.json');
  const runPath = path.join(siteRoot, 'data/correlations/runs/TR-016-2026-11-11.json');
  const latestRaw = JSON.parse(readFileSync(latestPath, 'utf8'));
  const runRaw = JSON.parse(readFileSync(runPath, 'utf8'));
  add('the run copy matches the research file',
    readFileSync(latestPath).equals(readFileSync(runPath)) && JSON.stringify(latestRaw) === JSON.stringify(runRaw)
    && !existsSync(path.join(siteRoot, 'data/correlations/runs/EXAMPLE.json')));
  add('the shipped file is the research run, not example data',
    latestRaw.run_id === 'TR-016-2026-11-11'
    && latestRaw.example_label == null
    && latestRaw.is_example !== true
    && state.exampleNotice === ''
    && state.researchNotice === COPY.researchNotice);
  add('shown strongest rows have at least 10 episodes',
    [...latestRaw.strongest_per_asset, ...latestRaw.strongest_per_event].every((item) => item.independent_episodes >= 10));

  add('every strongest card renders the chance line, sample size, pick-from-many warning and the label',
    cards.length === 21
    && cards.every((card) => card.chance.startsWith('Chance alone reaches about ±')
      && card.chance.includes('in 95% of shuffles; ')
      && card.chance.includes(' of shuffles were this strong')
      && card.sample.includes(' separate episodes (')
      && card.sample.includes(' trading days)')
      && card.sample.indexOf('separate episodes') < card.sample.indexOf('trading days')
      && card.pick.startsWith('Picked as the strongest of ')
      && card.pick.includes('The top of a long list looks strong partly by luck.')
      && card.label === COPY.label
      && card.rankCaption === COPY.rankCaption));
  add('sample size leads with separate episodes',
    state.perAsset[0].sample === '55 separate episodes (852 trading days)'
    && state.perAsset[0].sample.indexOf('separate episodes') < state.perAsset[0].sample.indexOf('trading days'));
  const nullCard = buildCard(row({ chance_p95_abs: null, chance_share_as_strong: null, bh_flag: null, trading_days: null }), 'asset');
  add('nulls render as not available',
    nullCard.chance.includes('±not available')
    && nullCard.chance.includes('not available of shuffles were this strong')
    && nullCard.manyTests === COPY.notAvailable
    && nullCard.sample === '18 separate episodes (not available trading days)'
    && !nullCard.chance.includes('±0')
    && !nullCard.chance.includes('0%')
    && !text.includes('(0 trading days)')
    && !text.includes('±0 in')
    && !text.includes('±0%'));
  add('cards stay in file order and are not re-ranked',
    state.perAsset.map((card) => card.subject).join('|') === latestRaw.strongest_per_asset.map((item) => item.asset_label).join('|')
    && state.perEvent.map((card) => card.subject).join('|') === latestRaw.strongest_per_event.map((item) => item.event_label).join('|')
    && state.sameDay.map((card) => card.correlation).join() === [...state.perAsset, ...state.perEvent].filter((card) => card.timingGroup === 'same_day').map((card) => card.correlation).join());
  add('number_of_pairs_searched fills in when picked_from_n is absent',
    buildCard(row({ picked_from_n: undefined, number_of_pairs_searched: 17 }), 'asset').pick === 'Picked as the strongest of 17 links. The top of a long list looks strong partly by luck.');
  const both = buildCard(row({ picked_from_n: 3, number_of_pairs_searched: 17 }), 'asset');
  add('picked_from_n wins when both count fields are present',
    both.pick.startsWith('Picked as the strongest of 3 links.'));
  add('the top line uses the shown counts when they are present',
    state.summary === 'We tested 517 links. Luck alone would make about 25.9 look this strong; we saw 44. 23 tested rows are hidden because they had under 10 episodes.');
  const plainSummary = stateFrom(file());
  add('the top line keeps the all-rows counts when the shown counts are absent',
    plainSummary.checked.ok
    && plainSummary.state.summary === 'We tested 4 links. Luck alone would make about 0.2 look this strong; we saw 1.'
    && !plainSummary.state.summary.includes('hidden'));
  add('the research notice shows for the research run',
    state.researchNotice === COPY.researchNotice
    && state.exampleNotice === ''
    && state.previewBanner === COPY.previewBanner);

  const byId = stateFrom(file({ run_id: 'EXAMPLE', is_example: false }));
  const byFlag = stateFrom(file({ is_example: true }));
  const real = stateFrom(file());
  add('the example notice follows the run id or the example flag',
    byId.checked.ok && byId.state.exampleNotice === COPY.exampleNotice
    && byFlag.checked.ok && byFlag.state.exampleNotice === COPY.exampleNotice
    && real.checked.ok && real.state.exampleNotice === ''
    && real.state.footer.startsWith('method TR-016, run TR-016-2026-11-11, window '));

  const missingCorrelation = buildCard(row({
    spearman: null,
    chance_p95_abs: 0.4,
    chance_share_as_strong: 0.2,
    lag: 'odds_lead_5d',
  }), 'asset');
  const kept = stateFrom(file({
    strongest_per_asset: [
      row({ spearman: null, chance_p95_abs: 0.4, lag: 'same_day' }),
      row({ asset: 'oil', asset_label: 'Example: the main oil price', spearman: 0.47 }),
    ],
  }));
  add('a missing correlation says not enough data and the row stays',
    missingCorrelation.correlation === COPY.notEnough
    && missingCorrelation.chance === COPY.notEnough
    && missingCorrelation.lag === COPY.notEnough
    && missingCorrelation.label === COPY.label
    && missingCorrelation.subject === 'Example: Bitcoin'
    && missingCorrelation.sample === '18 separate episodes (140 trading days)'
    && !missingCorrelation.chance.includes('0.4')
    && !missingCorrelation.lag.includes('odds moved')
    && kept.checked.ok
    && kept.state.perAsset.length === 2
    && kept.state.perAsset[0].correlation === COPY.notEnough
    && kept.state.perAsset[1].correlation === '0.47');

  const few = buildCard(row({ independent_episodes: 4, spearman: 0.33, status: 'not_enough_data' }), 'asset');
  const fewFile = stateFrom(file({
    strongest_per_asset: [row({ independent_episodes: 4, spearman: 0.33, status: 'not_enough_data' })],
  }));
  add('fewer than 10 episodes is not a special rule',
    few.correlation === '0.33'
    && few.sample === '4 separate episodes (140 trading days)'
    && few.chance.startsWith('Chance alone reaches about ±')
    && few.lag === 'same day'
    && fewFile.checked.ok
    && fewFile.state.perAsset.length === 1
    && fewFile.state.perAsset[0].correlation === '0.33');

  const blankDays = buildCard(row({ trading_days: null, chance_p95_abs: null, bh_flag: null }), 'asset');
  add('a null sample or chance field is not shown as zero',
    blankDays.sample === '18 separate episodes (not available trading days)'
    && blankDays.chance.includes('±not available')
    && blankDays.manyTests === COPY.notAvailable
    && blankDays.correlation === '0.22'
    && !blankDays.sample.includes('0 trading days'));

  const badSchema = validateFile({ schema_version: 'correlations-0' });
  const badState = buildPageState({ status: 'invalid', file: null });
  add('a file that fails validation fails soft',
    !badSchema.ok && badSchema.file == null && badState.mode === 'empty' && badState.empty === COPY.empty && badState.perAsset.length === 0);

  const missingDir = mkdtempSync(path.join(tmpdir(), 'wpi-corr-missing-'));
  const missing = loadCorrelations(missingDir);
  const missingState = buildPageState(missing);
  add('a missing file shows no results yet',
    missing.status === 'missing' && missingState.mode === 'empty' && missingState.empty === COPY.empty && missingState.perAsset.length === 0);
  rmSync(missingDir, { recursive: true, force: true });

  const badDir = mkdtempSync(path.join(tmpdir(), 'wpi-corr-bad-'));
  writeFileSync(path.join(badDir, 'latest.json'), '{');
  let threw = false;
  let bad;
  try { bad = loadCorrelations(badDir); } catch { threw = true; }
  const badPage = buildPageState(bad);
  add('an unreadable file does not crash and shows no results yet',
    !threw && bad.status === 'invalid' && badPage.empty === COPY.empty && badPage.perAsset.length === 0);
  rmSync(badDir, { recursive: true, force: true });

  const runDir = mkdtempSync(path.join(tmpdir(), 'wpi-corr-run-'));
  mkdirSync(path.join(runDir, 'runs'));
  writeFileSync(path.join(runDir, 'runs', 'TR-016-2026-11-11.json'), readFileSync(runPath));
  const fromRun = loadCorrelations(runDir);
  add('a missing latest file can fall back to the run copy',
    fromRun.status === 'ok' && fromRun.source === 'runs' && fromRun.file.run_id === 'TR-016-2026-11-11');
  rmSync(runDir, { recursive: true, force: true });

  const chrome = readFileSync(path.join(siteRoot, 'app/components/Chrome.js'), 'utf8');
  const tabs = chrome.slice(chrome.indexOf('const TABS'), chrome.indexOf('];'));
  add('the page does not appear in the tab bar',
    !tabs.includes('strongest-links') && !tabs.includes('Strongest links'));

  const sameDay = buildCard(row({ lag: 'same_day', lag_label: 'same day', timing_group: 'same_day' }), 'asset');
  add('same day lag label is just same day and the card does not say not a lead',
    sameDay.lag === 'same day'
    && sameDay.timingGroup === 'same_day'
    && !sameDay.lag.includes('not a lead')
    && state.sameDayTitle === 'Moved together the same day (description only, not a lead)'
    && state.sameDay.length === 11
    && state.lead.length === 10
    && state.sameDay.every((card) => card.lag === 'same day')
    && state.sameDay.every((card) => !card.lag.includes('not a lead')));
  add('odds moved first, 1 day before the asset',
    buildCard(row({ lag: 'odds_lead_1d', timing_group: 'lead' }), 'asset').lag === 'Odds moved first, 1 day before the asset');
  add('odds moved first, 5 days before the asset',
    buildCard(row({ lag: 'odds_lead_5d', timing_group: 'lead' }), 'asset').lag === 'Odds moved first, 5 days before the asset');
  add('asset moved first, 1 day before the odds',
    buildCard(row({ lag: 'asset_lead_1d', timing_group: 'lead' }), 'asset').lag === 'Asset moved first, 1 day before the odds');
  add('asset moved first, 5 days before the odds',
    buildCard(row({ lag: 'asset_lead_5d', timing_group: 'lead' }), 'asset').lag === 'Asset moved first, 5 days before the odds');
  add('the research lag label is shown as written',
    state.perAsset.every((card, index) => card.lag === latestRaw.strongest_per_asset[index].lag_label)
    && state.perEvent.every((card, index) => card.lag === latestRaw.strongest_per_event[index].lag_label));
  const unknown = buildCard(row({ lag: null, timing_group: 'lead' }), 'asset');
  const unrecognized = buildCard(row({ lag: 'later' }), 'asset');
  add('unknown lag says timing not available',
    unknown.lag === 'Timing not available'
    && unrecognized.lag === 'Timing not available');
  const zeroLag = stateFrom(file({
    strongest_per_asset: [row({ lag: 0 })],
    strongest_per_event: [row({
      asset: 'oil',
      asset_label: 'Example: the main oil price',
      event_label: 'Example: a central bank meeting',
      lag: 'odds_lead_1d',
    })],
  }));
  const forcedLead = buildCard(row({ lag: 'same_day', timing_group: 'lead' }), 'asset');
  add('rows group by timing group and lag 0 means same day',
    zeroLag.checked.ok
    && zeroLag.state.sameDay.length === 1
    && zeroLag.state.sameDay[0].lag === 'same day'
    && zeroLag.state.lead.length === 1
    && zeroLag.state.lead[0].lag === 'Odds moved first, 1 day before the asset'
    && forcedLead.timingGroup === 'lead'
    && state.sameDay.length === 11
    && state.lead.length === 10);
  add('a pick that does not beat the best of many says it does not pass',
    state.perAsset[0].strictPick === 'Does not pass the strict pick-from-many check'
    && buildCard(row({ beats_pick_line: false }), 'asset').strictPick === 'Does not pass the strict pick-from-many check');
  add('a pick that passes the strict check uses the pass wording',
    state.perEvent.filter((card) => card.strictPick === 'Passes the strict pick-from-many check').length === 2
    && buildCard(row({ beats_pick_line: true }), 'asset').strictPick === 'Passes the strict pick-from-many check'
    && !text.includes('not stronger than picking the best of many by luck'));

  add('the research data hash is unchanged',
    sha256(latestPath) === RESEARCH_SHA && sha256(runPath) === RESEARCH_SHA);
  const links = state.allLinks;
  const sameRows = links.sameDay.shown.concat(links.sameDay.weaker);
  const leadRows = links.lead.shown.concat(links.lead.weaker);
  const allRows = sameRows.concat(leadRows);
  const tierCount = (list, tier) => list.filter((item) => item.tier === tier).length;
  const fileSame = loaded.file.pairs.filter((item) => timingGroup(item) === 'same_day').length;
  add('517 tested links render',
    loaded.file.pairs.length === 517
    && allRows.length === 517
    && links.sameDay.shown.length + links.sameDay.weaker.length + links.lead.shown.length + links.lead.weaker.length === 517);
  add('tier counts are 3, 41, and 473',
    tierCount(allRows, 'strict') === 3
    && tierCount(allRows, 'stronger') === 41
    && tierCount(allRows, 'weaker') === 473
    && tierCount(sameRows, 'strict') === 3
    && tierCount(leadRows, 'strict') === 0
    && tierCount(sameRows, 'stronger') === 15
    && tierCount(leadRows, 'stronger') === 26);
  add('timing groups of tested links sum to every row',
    sameRows.length + leadRows.length === 517
    && sameRows.length === fileSame
    && leadRows.length === loaded.file.pairs.length - fileSame
    && allRows.filter((item) => item.tier === 'strict').every((item) => item.tierLabel === 'Strong link')
    && allRows.filter((item) => item.tier === 'stronger').every((item) => item.tierLabel === 'Medium link')
    && allRows.filter((item) => item.tier === 'weaker').every((item) => item.tierLabel === 'Weak link'));
  add('the weaker-links note uses the summary counts',
    links.note === 'Weaker links may be luck. By luck alone about 27 of 540 tested rows would look stronger than chance; 44 of the 517 shown do. These are leads to look into, not findings.'
    && links.strictNote === 'This strict check corrects for testing all 540 rows at once; it is not the same as the pick-from-many check on the cards above.'
    && links.legend[0] === 'Strong link: passes the strictest check across all 540 tested rows.'
    && links.legend[1] === 'Medium link: as a group there are more of these than luck alone gives (44 against about 27), but any single one may be luck.'
    && links.legend[2] === 'Weak link: may well be luck, kept to watch.'
    && links.showWeaker === 'Show weak links'
    && linkTier({ bh_flag: true, passes_chance_line: false }) === 'strict'
    && linkTier({ bh_flag: false, passes_chance_line: true }) === 'stronger'
    && linkTier({ bh_flag: false, passes_chance_line: false }) === 'weaker');
  const absOf = (item) => {
    const number = Number(item.strength);
    return Number.isFinite(number) ? Math.abs(number) : -1;
  };
  const strengthOrder = (list) => list.every((item, index) => index === 0 || absOf(item) <= absOf(list[index - 1]) + 0.001);
  add('each tested group is ordered by strength',
    strengthOrder(links.sameDay.shown)
    && strengthOrder(links.sameDay.weaker)
    && strengthOrder(links.lead.shown)
    && strengthOrder(links.lead.weaker));
  const featuredLine = 'On the same day, a rise in Fed rate-cut odds often lined up with a fall in the US 2-year yield.';
  add('a headline is one line from the labels, timing, and sign',
    buildHeadline({
      event_label: 'US Federal Reserve rate decision: chance of a rate cut, change in odds points',
      asset_label: 'US 2-year government bond yield',
      lag: 'same_day',
      lag_label: 'same day',
      timing_group: 'same_day',
      spearman: 0.22,
      bh_flag: false,
      passes_chance_line: true,
    }) === 'A rise in Fed rate-cut odds often lined up with a rise in the 2-year yield.'
    && buildHeadline({
      event_label: 'US Federal Reserve rate decision: chance of a rate cut, change in odds points',
      asset_label: 'US 2-year government bond yield',
      lag: 'odds_lead_5d',
      lag_label: 'odds change first, asset move over the next 5 trading days',
      timing_group: 'lead',
      spearman: -0.2,
      bh_flag: false,
      passes_chance_line: true,
    }) === 'A rise in Fed rate-cut odds often lined up with a fall in the 2-year yield over the next week.'
    && state.mainChart
    && state.mainChart.tier === 'strict'
    && state.mainChart.strictPick === 'Passes the strict pick-from-many check'
    && state.mainChart.eventFamily === 'F1_fed/direction'
    && state.mainChart.assetId === 'us_2y_yield'
    && state.mainChart.timingGroup === 'same_day'
    && state.mainChart.headline === featuredLine);
  add('the featured headline uses the spec sign wording', state.mainChart.headline === featuredLine && !state.mainChart.headline.includes('moved together'));
  const livePairs = loadCorrelations(path.join(siteRoot, 'data/correlations')).file.pairs;
  const weakHeads = livePairs.filter((row) => linkTier(row) === 'weaker').map(buildHeadline);
  const sizeNotes = livePairs.filter(isSizeRow).map((row) => strengthCopy(row).way + ' ' + buildHeadline(row));
  add('weak headlines say sometimes and none say a opposite',
    weakHeads.length === 473
    && weakHeads.every((line) => line.includes('sometimes lined up') && !line.includes('often lined up'))
    && livePairs.every((row) => !buildHeadline(row).includes('a opposite')));
  add('size sentences do not say same way',
    sizeNotes.length > 0 && sizeNotes.every((line) => !line.includes('same way') && !line.includes('moved the same way')));
  add('Only starts the shuffle sentence only outside the chance band',
    livePairs.every((row) => {
      const way = strengthCopy(row).way;
      return row.passes_chance_line === true ? way.includes('Only ') : !way.includes('Only');
    }));
  const pairHeads = {};
  for (const card of state.chartCards) {
    const pair = card.eventFamily + '|' + card.assetId;
    if (!pairHeads[pair]) pairHeads[pair] = [];
    pairHeads[pair].push(card.headline);
  }
  const shared = Object.values(pairHeads).filter((list) => list.length > 1);
  const sizeCard = state.chartCards.find((card) => String(card.eventFamily).endsWith('/size'));
  const sizeModel = chartModel(sizeCard);
  let sizeFalls = false;
  for (let i = 1; sizeModel && i < sizeModel.points.length; i++) {
    const prev = sizeModel.points[i - 1].odds;
    const next = sizeModel.points[i].odds;
    if (typeof prev === 'number' && typeof next === 'number' && next < prev) sizeFalls = true;
  }
  add('the featured pick matches the rule and the brand map is kept',
    Object.keys(BRAND_HEADLINES).length === 21
    && state.mainChart.headline === featuredLine
    && shared.length === 4
    && !state.mainChart.headline.includes('This is the strongest link on the page.'));
  add('a size chart shows the daily swing, not a running total',
    sizeModel
    && sizeModel.measure === 'size'
    && sizeModel.oddsAxis === SIZE_ODDS_AXIS
    && sizeModel.assetAxis.startsWith('Size of daily ')
    && sizeModel.assetAxis.endsWith(' move')
    && sizeFalls
    && chartModel(state.mainChart).measure === 'direction'
    && chartModel(state.mainChart).oddsAxis === ODDS_AXIS);
  const brandCss = readFileSync(path.join(siteRoot, 'app/globals.css'), 'utf8');
  const connCss = readFileSync(path.join(siteRoot, 'app/connections/connections.css'), 'utf8');
  const brandHex = (connCss.match(/#[0-9a-fA-F]{3,8}/g) || []).map((color) => color.toLowerCase());
  const allowed = new Set(['#f5f7f5', '#172f32', '#116c5b', '#fff', '#ffffff']);
  const layout = readFileSync(path.join(siteRoot, 'app/layout.js'), 'utf8');
  const families = [...brandCss.matchAll(/font-family\s*:\s*([^;}{]+)/gi)].map((match) => match[1].trim());
  add('only the three allowed colors appear in the connections CSS',
    connCss.includes('#f5f7f5')
    && connCss.includes('#172f32')
    && connCss.includes('#116c5b')
    && brandHex.length > 0
    && brandHex.every((color) => allowed.has(color))
    && !/\b(red|grey|gray|amber|orange)\b/i.test(connCss));
  add('a single font family is used',
    layout.includes("next/font/google")
    && layout.includes('Inter')
    && layout.includes('--font-inter')
    && brandCss.includes('--font:var(--font-inter),ui-sans-serif,system-ui,sans-serif')
    && layout.includes("fallback: ['ui-sans-serif', 'system-ui', 'sans-serif']")
    && families.length > 0
    && families.every((family) => family === 'var(--font)' || family === 'var(--font-inter)'));
  add('the series file hash is unchanged', sha256(seriesPath(siteRoot)) === SERIES_SHA);
  add('the main chart has data for both lines', hasBothLines(chartModel(state.mainChart)));
  const liveHome = buildHome(loadCorrelations(path.join(siteRoot, 'data/correlations')));
  const viewFiles = [
    'lib/linkScreen.js',
    'app/components/connections/ConnectionsHome.js',
    'app/components/connections/LinkDetailView.js',
    'app/components/connections/LinkChart.js',
  ].map((name) => readFileSync(path.join(siteRoot, name), 'utf8')).join('\n');
  const typed = ['517', '540', '473', '−188', '3.94%', '-0.274'].filter((token) => viewFiles.includes(token));
  add('no figure is typed by hand in the connections view', typed.length === 0, typed.join(','));
  add('every list row has a spark and a lead filter has no strong links',
    liveHome.rows.length === 517
    && liveHome.rows.every((row) => row.sparkOdds && row.sparkAsset)
    && liveHome.rows.filter((row) => row.timing !== 'same_day' && row.tier === 'strict').length === 0
    && liveHome.counts.strong === 3
    && liveHome.counts.medium === 41
    && liveHome.counts.weak === 473);
  add('all 20 list lines have a trend line',
    state.otherPicks.length === 20 && state.otherPicks.every((card) => hasBothLines(chartModel(card))));
  add('no odds point falls after its family hold-back date', oddsPointsAfterHoldBack(loadChartSeries()).length === 0);
}

async function measurePages(jobs) {
  const dir = mkdtempSync(path.join(tmpdir(), 'cx-chrome-'));
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=9225',
    '--user-data-dir=' + dir,
    'about:blank',
  ], { stdio: 'ignore' });
  const callOn = (ws) => {
    let seq = 0;
    return (method, params = {}) => {
      const id = ++seq;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout ' + method)), 30000);
        const onMessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.id !== id) return;
          clearTimeout(timer);
          ws.removeEventListener('message', onMessage);
          if (message.error) reject(new Error(JSON.stringify(message.error)));
          else resolve(message.result);
        };
        ws.addEventListener('message', onMessage);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };
  };
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9225/json/version');
        if (res.ok) { ready = true; break; }
      } catch { /* starting */ }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw new Error('chrome did not start');
    const created = await fetch('http://127.0.0.1:9225/json/new?about:blank', { method: 'PUT' });
    const tab = created.ok ? await created.json() : (await (await fetch('http://127.0.0.1:9225/json')).json())[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve) => { ws.addEventListener('open', resolve); });
    const call = callOn(ws);
    await call('Page.enable');
    const out = [];
    for (const job of jobs) {
      await call('Emulation.setDeviceMetricsOverride', {
        width: job.width,
        height: job.height,
        deviceScaleFactor: 1,
        mobile: job.width < 700,
      });
      await call('Page.navigate', { url: job.url });
      await new Promise((r) => setTimeout(r, 1200));
      await call('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
      const result = await call('Runtime.evaluate', { expression: job.expression, returnByValue: true });
      out.push(result.result && result.result.value);
    }
    ws.close();
    return out;
  } finally {
    chrome.kill('SIGKILL');
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function correlationPageChecks(add, page) {
  const loaded = loadCorrelations(path.join(siteRoot, 'data/correlations'));
  const state = buildPageState(loaded);
  const view = await page('/connections');
  const html = view.html || '';
  const visible = textOf(html);
  const home = await page('/');
  const homeNav = ((home.html || '').match(/<nav id="tabs">[\s\S]*?<\/nav>/) || [''])[0];
  const connNav = (html.match(/<nav id="tabs">[\s\S]*?<\/nav>/) || [''])[0];
  const featuredLine = 'On the same day, a rise in Fed rate-cut odds often lined up with a fall in the US 2-year yield.';
  const ready = html.split('data-mode="ready"')[1] || '';
  add('connections page renders the preview banner, standing line, and noindex',
    view.status === 200
    && ready.includes(COPY.previewBanner)
    && ready.indexOf(COPY.previewBanner) < ready.indexOf(STANDING_LINE)
    && ready.includes(STANDING_LINE)
    && !html.includes(COPY.exampleNotice)
    && /noindex/i.test(html)
    && html.includes('data-page="connections"')
    && html.includes(featuredLine)
    && html.includes('See how strong this is')
    && html.includes('All ' + loaded.file.chance_summary.shown_rows + ' links we can show'));
  add('the first screen shows the tier bar and not the old long list',
    (html.match(/data-main-chart="1"/g) || []).length === 1
    && (html.split('data-main-chart="1"')[1] || '').includes('data-odds-line="1"')
    && (html.split('data-main-chart="1"')[1] || '').includes('data-asset-line="1"')
    && html.includes(ODDS_AXIS)
    && html.includes('3 Strong')
    && html.includes('41 Medium')
    && html.includes('473 Weak')
    && html.includes('Passed the strict check')
    && html.includes('41 medium links')
    && html.includes('473 weaker links')
    && (html.match(/data-link-row="1" data-tier="strict"/g) || []).length === 3
    && !html.includes('See every link tested')
    && html.includes('No strong links with one moving first') === false
    && html.includes('Earlier checks')
    && html.includes('23 more tested links are not shown')
    && html.includes('540 links were tested in all'));
  const detail = await page('/connections/link-F1_fed-direction-us_2y_yield-same_day');
  const oldDetail = await page('/connections/oil-79987-679018');
  add('a correlation id renders the new detail and a TR-007 id renders the old one',
    detail.status === 200
    && detail.html.includes('How strong is this?')
    && detail.html.includes(featuredLine)
    && detail.html.includes('It still passes the strict pick-from-many check.')
    && oldDetail.status === 200
    && oldDetail.html.includes('data-page="connection"')
    && !oldDetail.html.includes('How strong is this?'));
  const hasBottomBar = (pageHtml) => {
    const nav = (pageHtml.match(/<nav id="tabs">[\s\S]*?<\/nav>/) || [''])[0];
    return nav.includes('href="/connections"')
      && nav.includes('Connections')
      && !pageHtml.includes('class="cx-top"')
      && !pageHtml.includes('cx-tabs');
  };
  add('Connections pages render the bottom tab bar and no top bar',
    hasBottomBar(html) && hasBottomBar(detail.html));
  add('the connections tab points at /connections',
    connNav.includes('href="/connections"')
    && connNav.includes('Connections')
    && !connNav.includes('/strongest-links')
    && homeNav.includes('href="/connections"')
    && !homeNav.includes('/strongest-links')
    && !homeNav.includes('Strongest links'));
  const word = (codes) => String.fromCharCode.apply(null, codes);
  const extra = new RegExp('\\b(' + [
    [109, 117, 115, 116],
    [115, 105, 103, 110, 97, 108],
    [111, 112, 112, 111, 114, 116, 117, 110, 105, 116, 121],
    [116, 97, 114, 103, 101, 116],
    [112, 114, 111, 102, 105, 116],
    [103, 117, 97, 114, 97, 110, 116, 101, 101, 100],
  ].map(word).join('|') + '|beat the market)\\b', 'i');
  add('the strongest links page has no advice wording', textProblem(visible) === '' && !extra.test(visible));
  const unknown = await page('/connections/no-such-pair');
  const missingLink = await page('/connections/link-F1_fed-direction-not_an_asset-same_day');
  add('an unknown connection id returns 404', unknown.status === 404 && missingLink.status === 404);
  const origin = 'http://127.0.0.1:3461';
  const featuredUrl = origin + '/connections/link-F1_fed-direction-us_2y_yield-same_day';
  const sizeUrl = origin + '/connections/link-F1_fed-size-us_2y_yield-same_day';
  const weakUrl = origin + '/connections/link-F1_fed-direction-bitcoin-same_day';
  const labelExpr = `(() => {
    const link = document.querySelector('.cx-scale-link');
    const chance = document.querySelector('.cx-scale-chance');
    if (!link || !chance) return null;
    const a = link.getBoundingClientRect();
    const b = chance.getBoundingClientRect();
    return { text: link.textContent + '|' + chance.textContent, separate: a.bottom <= b.top + 0.5 && a.top < b.top };
  })()`;
  const homeExpr = `(() => {
    const link = document.querySelector('a.cx-quiet');
    const bar = document.querySelector('#tabs');
    if (!link || !bar) return null;
    return { scroll: window.scrollY, linkBottom: link.getBoundingClientRect().bottom, barTop: bar.getBoundingClientRect().top };
  })()`;
  const measured = await measurePages([
    { url: origin + '/connections', width: 390, height: 844, expression: homeExpr },
    { url: featuredUrl, width: 390, height: 844, expression: labelExpr },
    { url: sizeUrl, width: 390, height: 844, expression: labelExpr },
    { url: weakUrl, width: 390, height: 844, expression: labelExpr },
    { url: featuredUrl, width: 699, height: 900, expression: labelExpr },
    { url: sizeUrl, width: 699, height: 900, expression: labelExpr },
    { url: weakUrl, width: 699, height: 900, expression: labelExpr },
  ]);
  const homeBox = measured[0];
  const labels = measured.slice(1);
  const expected = [
    'This link −0.27|Chance alone ±0.13',
    'This link 0.22|Chance alone ±0.09',
    'This link 0.06|Chance alone ±0.10',
  ];
  add('the two labels sit on separate rows below desktop width',
    labels.length === 6
    && labels.every((item) => item && item.separate)
    && expected.every((text, index) => labels[index].text === text && labels[index + 3].text === text));
  add('the link bottom plus 8 is at most the bar top at 390x844',
    !!homeBox
    && homeBox.scroll === 0
    && homeBox.linkBottom + 8 <= homeBox.barTop);
}
