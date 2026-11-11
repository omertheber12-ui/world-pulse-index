/** Fixture checks for strongest links. Fixtures stay here and are never written to data/correlations/latest.json. */
import { createHash } from 'crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { textProblem } from '../lib/connections.js';
import {
  COPY, buildCard, buildHeadline, buildPageState, linkTier, loadCorrelations, timingGroup, validateFile, visibleText,
} from '../lib/correlations.js';
import { BRAND_HEADLINES, FEATURED_HEADLINE, STANDING_LINE, brandHeadline } from '../lib/brandHeadlines.js';
import { ODDS_AXIS, ODDS_AXIS_INFLATION, ODDS_LINE_NOTE, SIZE_NOTE, SIZE_ODDS_AXIS, chartModel, hasBothLines, leadChartNote, loadChartSeries, oddsPointsAfterHoldBack, seriesPath } from '../lib/chartSeries.js';

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
  add('a headline is one line from the labels, timing, and sign',
    buildHeadline({
      event_label: 'US Federal Reserve rate decision: chance of a rate cut, change in odds points',
      asset_label: 'US 2-year government bond yield',
      lag: 'same_day',
      lag_label: 'same day',
      timing_group: 'same_day',
      spearman: 0.22,
    }) === 'Fed rate-cut odds and 2-year yield move together on the same day'
    && buildHeadline({
      event_label: 'US Federal Reserve rate decision: chance of a rate cut, change in odds points',
      asset_label: 'US 2-year government bond yield',
      lag: 'odds_lead_5d',
      lag_label: 'odds change first, asset move over the next 5 trading days',
      timing_group: 'lead',
      spearman: -0.2,
    }) === 'Fed rate-cut odds move first, 2-year yield moves the other way within 5 days'
    && state.chartCards.length === 21
    && state.otherPicks.length === 20
    && state.mainChart
    && state.mainChart.tier === 'strict'
    && state.mainChart.strictPick === 'Passes the strict pick-from-many check'
    && state.mainChart.eventFamily === 'F1_fed/direction'
    && state.mainChart.assetId === 'us_2y_yield'
    && state.mainChart.timingGroup === 'same_day'
    && state.mainChart.headline === FEATURED_HEADLINE);
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
  add('the featured pick matches the rule and all 21 headlines are mapped',
    Object.keys(BRAND_HEADLINES).length === 21
    && state.chartCards.every((card) => card.headline === brandHeadline(card.section, card.eventFamily, card.assetId) && card.headline)
    && shared.length === 4
    && shared.every((list) => list.every((line) => line === list[0]))
    && !state.chartCards.some((card) => card.headline.includes('This is the strongest link on the page.')));
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
  const brandBlock = brandCss.slice(brandCss.indexOf('/* connections-brand */'), brandCss.indexOf('/* /connections-brand */'));
  const brandHex = (brandBlock.match(/#[0-9a-fA-F]{3,8}/g) || []).map((color) => color.toLowerCase());
  const allowed = new Set(['#f5f7f5', '#172f32', '#116c5b']);
  const layout = readFileSync(path.join(siteRoot, 'app/layout.js'), 'utf8');
  const families = [...brandCss.matchAll(/font-family\s*:\s*([^;}{]+)/gi)].map((match) => match[1].trim());
  add('only the three allowed colors appear in the connections CSS',
    brandBlock.includes('#f5f7f5')
    && brandBlock.includes('#172f32')
    && brandBlock.includes('#116c5b')
    && brandHex.length > 0
    && brandHex.every((color) => allowed.has(color))
    && !/rgb\(|hsl\(|\b(red|grey|gray|amber|orange)\b/i.test(brandBlock));
  add('a single font family is used',
    layout.includes("next/font/google")
    && layout.includes('Inter')
    && layout.includes('--font-inter')
    && brandCss.includes('--font:var(--font-inter)')
    && families.length > 0
    && families.every((family) => family === 'var(--font)' || family === 'var(--font-inter)'));
  add('the series file hash is unchanged', sha256(seriesPath(siteRoot)) === SERIES_SHA);
  add('the main chart has data for both lines', hasBothLines(chartModel(state.mainChart)));
  add('all 20 list lines have a trend line',
    state.otherPicks.length === 20 && state.otherPicks.every((card) => hasBothLines(chartModel(card))));
  add('no odds point falls after its family hold-back date', oddsPointsAfterHoldBack(loadChartSeries()).length === 0);
}

export async function correlationPageChecks(add, page) {
  const loaded = loadCorrelations(path.join(siteRoot, 'data/correlations'));
  const state = buildPageState(loaded);
  const view = await page('/connections');
  const html = view.html || '';
  const visible = textOf(html);
  const nav = (html.match(/<nav id="tabs">[\s\S]*?<\/nav>/) || [''])[0];
  const home = await page('/');
  const homeNav = ((home.html || '').match(/<nav id="tabs">[\s\S]*?<\/nav>/) || [''])[0];
  add('connections page renders the preview banner, research notice, and noindex',
    view.status === 200
    && html.includes(COPY.previewBanner)
    && html.includes(COPY.researchNotice)
    && !html.includes(COPY.exampleNotice)
    && /noindex/i.test(html)
    && html.includes('data-page="connections"')
    && html.includes(state.summary)
    && html.includes(state.footer));
  const charts = state.chartCards || [];
  const inHtml = (text) => html.includes(String(text).replace(/&/g, '&amp;'));
  add('every strongest card is a chart card with one strength number and details',
    charts.length === 21
    && charts.every((card) => inHtml(card.headline)
      && html.includes(card.strength)
      && html.includes(card.tierLabel)
      && html.includes(card.chance)
      && html.includes(card.pick)
      && html.includes(card.episodes))
    && (html.match(/data-main-chart="1"/g) || []).length === 1
    && (html.match(/data-pick-line="1"/g) || []).length === 20
    && (html.split('data-main-chart="1"')[1] || '').includes('data-odds-line="1"')
    && (html.split('data-main-chart="1"')[1] || '').includes('data-asset-line="1"')
    && html.split('data-pick-line="1"').slice(1).every((part) => part.includes('data-trend="1"'))
    && html.includes(ODDS_AXIS)
    && html.includes(ODDS_LINE_NOTE)
    && html.includes(SIZE_NOTE)
    && html.includes(SIZE_ODDS_AXIS)
    && html.includes(STANDING_LINE)
    && html.includes('Time range')
    && html.includes('data-readout="1"')
    && html.includes('class="quiet-tag"')
    && !html.includes('yf-tag')
    && !html.includes('This is the strongest link on the page.')
    && !html.split('Earlier checks')[0].includes('Busy trading periods')
    && !html.split('Earlier checks')[0].includes('class="busy"')
    && !html.split('Earlier checks')[0].includes('large move')
    && html.includes('See every link tested')
    && html.includes('Internal, not proven.')
    && html.includes('How to read this')
    && html.includes('Moved together the same day (description only, not a lead)')
    && html.includes('One moved first')
    && html.includes('Does not pass the strict pick-from-many check')
    && html.includes('Passes the strict pick-from-many check')
    && html.includes('Extra check, not a verdict:')
    && html.includes('rank correlation')
    && html.includes('Description only, not proven')
    && !visible.includes('not stronger than picking the best of many by luck')
    && !visible.includes(COPY.exampleNotice));
  const figures = html.split('<figure').slice(1).map((part) => part.split('</figure>')[0]);
  const leadNotes = [state.mainChart, ...(state.otherPicks || [])]
    .filter((card) => card && card.timingGroup === 'lead')
    .map((card) => leadChartNote(card.lag))
    .filter(Boolean);
  add('charts are two lines, and the lead note sits in the details',
    figures.length >= 1
    && figures.every((figure) => !figure.includes('trading day') && !figure.includes('Busy') && !figure.includes('<rect'))
    && leadNotes.length >= 1
    && leadNotes.every((note) => html.includes(note))
    && (html.match(/data-lead-note="1"/g) || []).length === leadNotes.length
    && html.includes(ODDS_AXIS_INFLATION) === (state.chartCards || []).some((card) => chartModel(card) && chartModel(card).oddsAxis === ODDS_AXIS_INFLATION));
  const allLinkRows = html.match(/data-all-link="1"/g) || [];
  const tierMarks = (tier) => (html.match(new RegExp('data-all-link="1" data-tier="' + tier + '"', 'g')) || []).length;
  add('the rendered page shows the real groups and the hidden-row count',
    visible.includes('Moved together the same day (description only, not a lead)')
    && visible.includes('One moved first')
    && visible.includes('23 tested rows are hidden because they had under 10 episodes.')
    && visible.includes('All links tested')
    && visible.includes('Weaker links may be luck.')
    && (html.match(/data-pick-line="1"/g) || []).length === 20
    && (html.match(/data-main-chart="1"/g) || []).length === 1
    && visible.includes('Strong link: passes the strictest check across all 540 tested rows.')
    && visible.includes('Medium link: as a group there are more of these than luck alone gives (44 against about 27), but any single one may be luck.')
    && visible.includes('Weak link: may well be luck, kept to watch.')
    && !html.includes('>Passes the strict check<')
    && !html.includes('>Stronger than chance<')
    && !html.includes('>Weaker, worth watching<')
    && allLinkRows.length === 517
    && tierMarks('strict') === 3
    && tierMarks('stronger') === 41
    && tierMarks('weaker') === 473
    && !visible.includes('(0 trading days)'));
  const earlier = html.split('<summary>Earlier checks</summary>')[1] || '';
  add('earlier checks keep the old cards behind one click',
    html.includes('<summary>Earlier checks</summary>')
    && !/<details class="earlier-checks"[^>]*\sopen/.test(html)
    && earlier.includes('data-history="'));
  add('the connections tab points at /connections',
    nav.includes('href="/connections"')
    && nav.includes('Connections')
    && !nav.includes('/strongest-links')
    && !nav.includes('Strongest links')
    && homeNav.includes('href="/connections"')
    && !homeNav.includes('/strongest-links')
    && !homeNav.includes('Strongest links'));
  add('the strongest links page has no advice wording', textProblem(visible) === '');
}
