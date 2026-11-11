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
  const cards = [...state.perAsset, ...state.perEvent];
  const text = visibleText(state);
  add('the example file parses',
    loaded.status === 'ok' && loaded.errors.length === 0 && loaded.file.schema_version === 'correlations-1'
    && loaded.file.method_id === 'TR-016' && loaded.file.run_id === 'EXAMPLE' && loaded.file.is_example === true,
    loaded.errors.join('; '));

  const latestRaw = JSON.parse(readFileSync(path.join(siteRoot, 'data/correlations/latest.json'), 'utf8'));
  const runRaw = JSON.parse(readFileSync(path.join(siteRoot, 'data/correlations/runs/EXAMPLE.json'), 'utf8'));
  add('the run copy matches the example file', JSON.stringify(latestRaw) === JSON.stringify(runRaw));
  add('example labels say this is example data',
    latestRaw.example_label === COPY.exampleNotice
    && latestRaw.strongest_per_asset.every((item) => item.asset_label.startsWith('Example:'))
    && latestRaw.strongest_per_event.every((item) => item.event_label.startsWith('Example:')));
  add('the example file has no row under 10 episodes',
    [...latestRaw.strongest_per_asset, ...latestRaw.strongest_per_event].every((item) => item.independent_episodes >= 10));

  add('every strongest card renders the chance line, sample size, pick-from-many warning and the label',
    cards.length === 4
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
    state.perAsset[0].sample === '18 separate episodes (140 trading days)'
    && state.perAsset[1].sample === '21 separate episodes (160 trading days)');
  add('nulls render as not available',
    state.perAsset[1].chance.includes('±not available')
    && state.perEvent[0].chance.includes('not available of shuffles were this strong')
    && state.perEvent[0].manyTests === COPY.notAvailable
    && !state.perAsset[1].chance.includes('±0')
    && !state.perEvent[0].chance.includes('0%')
    && !text.includes('(0 trading days)')
    && !text.includes('±0 in')
    && !text.includes('±0%'));
  add('cards stay in file order and are not re-ranked',
    state.perAsset.map((card) => card.correlation).join() === '0.22,0.47'
    && state.perEvent.map((card) => card.correlation).join() === '-0.18,0.47'
    && state.perAsset[0].subject === 'Example: Bitcoin'
    && state.perAsset[1].subject === 'Example: the main oil price'
    && !text.includes('Example: a decoy link')
    && !text.includes('0.91')
    && !text.includes('0.73')
    && !text.includes('0.64'));
  add('number_of_pairs_searched fills in when picked_from_n is absent',
    latestRaw.strongest_per_asset[1].picked_from_n == null
    && latestRaw.strongest_per_asset[1].number_of_pairs_searched === 17
    && state.perAsset[1].pick === 'Picked as the strongest of 17 links. The top of a long list looks strong partly by luck.');
  const both = buildCard(row({ picked_from_n: 3, number_of_pairs_searched: 17 }), 'asset');
  add('picked_from_n wins when both count fields are present',
    both.pick.startsWith('Picked as the strongest of 3 links.'));
  add('the top line uses the chance summary wording',
    state.summary === 'We tested 24 links. Luck alone would make about 1.2 look this strong; we saw 2.');
  add('the example notice shows for an example run',
    state.exampleNotice === COPY.exampleNotice && state.previewBanner === COPY.previewBanner);

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
    && missingCorrelation.lagTag === ''
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
    && few.lag === COPY.sameDayLine
    && few.lagTag === COPY.sameDayTag
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
  writeFileSync(path.join(runDir, 'runs', 'EXAMPLE.json'), readFileSync(path.join(siteRoot, 'data/correlations/runs/EXAMPLE.json')));
  const fromRun = loadCorrelations(runDir);
  add('a missing latest file can fall back to the run copy',
    fromRun.status === 'ok' && fromRun.source === 'runs' && fromRun.file.run_id === 'EXAMPLE');
  rmSync(runDir, { recursive: true, force: true });

  const chrome = readFileSync(path.join(siteRoot, 'app/components/Chrome.js'), 'utf8');
  const tabs = chrome.slice(chrome.indexOf('const TABS'), chrome.indexOf('];'));
  add('the page does not appear in the tab bar',
    !tabs.includes('strongest-links') && !tabs.includes('Strongest links'));

  const sameDay = buildCard(row({ lag: 'same_day' }), 'asset');
  add('same day shows the not-a-lead tag and the same-day line',
    sameDay.lagTag === 'Same day, not a lead'
    && sameDay.lag === 'These moved on the same day. This does not show which moved first.'
    && state.perAsset[0].lagTag === 'Same day, not a lead'
    && state.perAsset[0].lag === 'These moved on the same day. This does not show which moved first.');
  add('odds moved first, 1 day before the asset',
    buildCard(row({ lag: 'odds_lead_1d' }), 'asset').lag === 'Odds moved first, 1 day before the asset'
    && buildCard(row({ lag: 'odds_lead_1d' }), 'asset').lagTag === ''
    && state.perAsset[1].lag === 'Odds moved first, 1 day before the asset');
  add('odds moved first, 5 days before the asset',
    buildCard(row({ lag: 'odds_lead_5d' }), 'asset').lag === 'Odds moved first, 5 days before the asset'
    && state.perEvent[1].lag === 'Odds moved first, 5 days before the asset');
  add('asset moved first, 1 day before the odds',
    buildCard(row({ lag: 'asset_lead_1d' }), 'asset').lag === 'Asset moved first, 1 day before the odds'
    && buildCard(row({ lag: 'asset_lead_1d' }), 'asset').lagTag === '');
  add('asset moved first, 5 days before the odds',
    buildCard(row({ lag: 'asset_lead_5d' }), 'asset').lag === 'Asset moved first, 5 days before the odds'
    && state.perEvent[0].lag === 'Asset moved first, 5 days before the odds');
  const unknown = buildCard(row({ lag: null }), 'asset');
  const unrecognized = buildCard(row({ lag: 'later' }), 'asset');
  add('unknown lag says timing not available',
    unknown.lag === 'Timing not available'
    && unknown.lagTag === ''
    && unrecognized.lag === 'Timing not available'
    && unrecognized.lagTag === '');
}

export async function correlationPageChecks(add, page) {
  const loaded = loadCorrelations(path.join(siteRoot, 'data/correlations'));
  const state = buildPageState(loaded);
  const view = await page('/strongest-links');
  const html = view.html || '';
  const visible = textOf(html);
  const cards = [...state.perAsset, ...state.perEvent];
  const nav = (html.match(/<nav id="tabs">[\s\S]*?<\/nav>/) || [''])[0];
  const home = await page('/');
  const homeNav = ((home.html || '').match(/<nav id="tabs">[\s\S]*?<\/nav>/) || [''])[0];
  add('strongest links page renders the preview banner, example notice, and noindex',
    view.status === 200
    && html.includes(COPY.previewBanner)
    && html.includes(COPY.exampleNotice)
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
      && (!card.lagTag || html.includes(card.lagTag))
      && html.includes(card.manyTests))
    && (html.match(/class="corr-split"/g) || []).length === cards.length
    && html.includes('rank correlation')
    && !visible.includes('Example: a decoy link')
    && !visible.includes('0.91'));
  add('the rendered page shows nulls as not available',
    visible.includes('±not available')
    && visible.includes('not available of shuffles')
    && !visible.includes('±0 in')
    && !visible.includes('±0%')
    && !visible.includes('(0 trading days)'));
  add('the rendered page is not in the tab bar',
    !nav.includes('/strongest-links')
    && !nav.includes('Strongest links')
    && !homeNav.includes('/strongest-links')
    && !homeNav.includes('Strongest links')
    && existsSync(path.join(siteRoot, 'app/strongest-links/page.js')));
  add('the strongest links page has no advice wording', textProblem(visible) === '');
}
