/** Fixture checks for strongest links. Fixtures stay here and are never written to data/correlations/latest.json. */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { textProblem } from '../lib/connections.js';
import {
  COPY, buildCard, buildPageState, loadCorrelations, validateFile, visibleText,
} from '../lib/correlations.js';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
}

export async function correlationPageChecks(add, page) {
  const loaded = loadCorrelations(path.join(siteRoot, 'data/correlations'));
  const state = buildPageState(loaded);
  const view = await page('/strongest-links');
  const html = view.html || '';
  const visible = textOf(html);
  const cards = [...(state.sameDay || []), ...(state.lead || [])];
  const nav = (html.match(/<nav id="tabs">[\s\S]*?<\/nav>/) || [''])[0];
  const home = await page('/');
  const homeNav = ((home.html || '').match(/<nav id="tabs">[\s\S]*?<\/nav>/) || [''])[0];
  add('strongest links page renders the preview banner, research notice, and noindex',
    view.status === 200
    && html.includes(COPY.previewBanner)
    && html.includes(COPY.researchNotice)
    && !html.includes(COPY.exampleNotice)
    && /noindex/i.test(html)
    && html.includes('data-page="strongest-links"')
    && html.includes(state.summary)
    && html.includes(state.footer));
  add('every strongest card is on the page with the chance line beside the correlation',
    cards.length > 0
    && cards.every((card) => html.includes(card.chance)
      && html.includes(card.sample)
      && html.includes(card.pick)
      && html.includes(card.label)
      && html.includes(card.correlation)
      && html.includes(card.lag)
      && (!card.strictPick || html.includes(card.strictPick))
      && html.includes(card.manyTests))
    && html.includes('Moved together the same day (description only, not a lead)')
    && html.includes('One moved first')
    && html.includes('Does not pass the strict pick-from-many check')
    && html.includes('Passes the strict pick-from-many check')
    && html.includes('Extra check, not a verdict:')
    && !visible.includes('not stronger than picking the best of many by luck')
    && (html.match(/class="corr-split"/g) || []).length === cards.length
    && html.includes('rank correlation')
    && !visible.includes(COPY.exampleNotice));
  add('the rendered page shows the real groups and the hidden-row count',
    visible.includes('Moved together the same day (description only, not a lead)')
    && visible.includes('One moved first')
    && visible.includes('23 tested rows are hidden because they had under 10 episodes.')
    && !visible.includes('(0 trading days)'));
  add('the rendered page is not in the tab bar',
    !nav.includes('/strongest-links')
    && !nav.includes('Strongest links')
    && !homeNav.includes('/strongest-links')
    && !homeNav.includes('Strongest links')
    && existsSync(path.join(siteRoot, 'app/strongest-links/page.js')));
  add('the strongest links page has no advice wording', textProblem(visible) === '');
}
