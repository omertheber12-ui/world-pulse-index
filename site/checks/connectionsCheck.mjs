/** Fixture checks for Connections. Fixtures stay here and are never written to data/connections/latest.json. */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  COPY, VISIBLE_HISTORY, buildCard, buildDetail, buildDetailState, buildListState,
  loadConnections, loadingState, selectVisiblePairs, validateFile, visibleText,
} from '../lib/connections.js';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TODAY = '2026-11-10';
const FINGERPRINT = '149a7c2b6e2d4e812c8612281a478272c69a0d03a3dc9ae960446f1802d4b953';

function base(pairs, extra = {}) {
  return {
    schema_version: 'connections-1',
    method_id: 'TR-007',
    method_fingerprint: FINGERPRINT,
    date_last_checked: TODAY,
    run_id: 'TR-007-2026-11-10',
    search_size: 40,
    assets_checked: ['oil', 'bitcoin'],
    set_aside: [],
    pairs,
    ...extra,
  };
}

function described(over = {}) {
  return {
    event_name: 'Fed rate decision in December',
    event_id: '770450',
    market_id: '3215008',
    asset: 'bitcoin',
    verdict: 'no',
    history_status: 'described',
    insight_kind: 'next_session',
    stronger_connection: false,
    lead_window: 'week_before',
    locked_direction: 'up',
    extra_average_percentage_points: 0.05,
    predicted_big_move_count: 1,
    predicted_big_move_rate_percent: 25,
    confirmation_firing_count: 4,
    odds_pattern: 'the chance rose at least 4 points, which was more than on ordinary days',
    insight_sentence: 'Fed odds and Bitcoin moved an extra 0.05% up on the days the pattern appeared.',
    readable_fact: 'A different fact sentence that must not replace the insight.',
    how_sure: null,
    date_last_checked: TODAY,
    method_id: 'TR-007',
    ...over,
  };
}

function yesPair(over = {}) {
  return described({
    event_name: 'ECB rate decision in December',
    event_id: '1025305',
    market_id: '4570943',
    asset: 'oil',
    verdict: 'yes_first_look',
    stronger_connection: true,
    extra_average_percentage_points: 0.35,
    predicted_big_move_count: 6,
    confirmation_firing_count: 11,
    predicted_big_move_rate_percent: (100 * 6) / 11,
    placebo_share_beaten_percent: 96.2,
    reverse_check_passed: true,
    asset_first_stronger: false,
    conflict_share_percent: 10,
    many_pair_correction_pass: false,
    how_sure: 'First look, not independently verified. This pair passed the main test but not the extra check for looking at many pairs.',
    insight_sentence: 'ECB odds and the main US oil price moved an extra 0.35% up on the days the pattern appeared.',
    readable_fact: null,
    oil_publish_lag_note: 'This is a statistical link with a delayed official price print, not proof someone could have acted on that official number the same day.',
    prediction_time: '00:00 New York time on the asset day. The pattern uses only trades at or before this time.',
    observation_time: 'The official daily oil spot price for that trading day. This is the market date, not the later publication time.',
    ...over,
  });
}

function hidden(over = {}) {
  return {
    event_name: 'Fed rate decision in January',
    event_id: '770451',
    market_id: '3215010',
    asset: 'bitcoin',
    verdict: 'not_enough_history',
    history_status: 'not_enough_history',
    insight_kind: 'not_enough_history',
    stronger_connection: false,
    lead_window: null,
    locked_direction: null,
    extra_average_percentage_points: null,
    predicted_big_move_count: null,
    predicted_big_move_rate_percent: null,
    confirmation_firing_count: null,
    how_sure: null,
    date_last_checked: TODAY,
    ...over,
  };
}

function noPattern(over = {}) {
  return {
    event_name: 'Nvidia data center revenue this quarter',
    event_id: '1194143',
    market_id: '5730325',
    asset: 'oil',
    verdict: 'no',
    history_status: 'checked_no_pattern',
    insight_kind: 'checked_no_pattern',
    stronger_connection: false,
    lead_window: null,
    locked_direction: null,
    extra_average_percentage_points: null,
    predicted_big_move_count: null,
    confirmation_firing_count: null,
    placebo_share_beaten_percent: null,
    how_sure: null,
    odds_pattern: null,
    readable_fact: 'No next-day pattern was locked for Nvidia revenue and oil.',
    insight_sentence: 'A second sentence that must stay off this card.',
    date_last_checked: TODAY,
    ...over,
  };
}

function sameDay(over = {}) {
  return described({
    event_name: 'Russia-Ukraine ceasefire deal',
    event_id: '478472',
    market_id: '2243897',
    asset: 'bitcoin',
    verdict: 'no',
    insight_kind: 'moved_together',
    stronger_connection: false,
    lead_window: null,
    locked_direction: null,
    extra_average_percentage_points: null,
    predicted_big_move_count: null,
    predicted_big_move_rate_percent: null,
    confirmation_firing_count: null,
    odds_pattern: null,
    insight_sentence: 'On those days, Bitcoin made a large move while the chance of a ceasefire changed by a median of 3 points that same day, compared with a median of 1 point on ordinary days (from 12 large-move days in the earlier sample). This describes them moving together that day. It is not a next-day pattern.',
    readable_fact: null,
    ...over,
  });
}

function checked(pairs, extra) {
  return validateFile(base(pairs, extra), { root: siteRoot, today: TODAY });
}

function shown(pairs, filter = 'all') {
  const result = checked(pairs);
  return { result, state: buildListState({ status: 'ok', file: result.file, events: result.file ? undefined : [] }, filter) };
}

function ready(pairs, filter = 'all') {
  const result = checked(pairs);
  const events = JSON.parse(readFileSync(path.join(siteRoot, 'data/fallback.json'), 'utf8')).events;
  const state = buildListState({ status: 'ok', file: result.file, events }, filter);
  return { result, state, text: visibleText(state) };
}

export function runConnectionChecks(add) {
  add('visible cards are chosen in one helper', VISIBLE_HISTORY.join() === 'described,checked_no_pattern');

  const kept = checked([described(), hidden(), noPattern(), sameDay()]);
  add('loader keeps pairs that are not yes_first_look',
    kept.ok && kept.file.pairs.length === 4,
    kept.errors.join('; '));
  add('not_enough_history stays off the cards',
    selectVisiblePairs(kept.file.pairs).length === 3
    && selectVisiblePairs(kept.file.pairs).every((pair) => pair.history_status !== 'not_enough_history'));

  const missingDir = mkdtempSync(path.join(tmpdir(), 'wpi-missing-'));
  const missing = loadConnections(missingDir, { root: siteRoot, today: TODAY });
  const missingState = buildListState(missing, 'all');
  add('no results file shows the empty state',
    missing.status === 'missing'
    && missingState.mode === 'empty'
    && missingState.footer === COPY.notChecked
    && missingState.empty.headline === COPY.emptyHeadline
    && !visibleText(missingState).includes(COPY.otherEvents)
    && missingState.cards.length === 0);
  rmSync(missingDir, { recursive: true, force: true });

  const badDir = mkdtempSync(path.join(tmpdir(), 'wpi-bad-'));
  writeFileSync(path.join(badDir, 'latest.json'), '{');
  const bad = loadConnections(badDir, { root: siteRoot, today: TODAY });
  const badState = buildListState(bad, 'all');
  add('unreadable file uses the could-not-read copy',
    bad.status === 'invalid'
    && badState.unread.headline === COPY.unreadHeadline
    && badState.unread.body === COPY.unreadBody
    && badState.footer === COPY.unreadableFooter
    && badState.footer !== COPY.notChecked
    && badState.cards.length === 0);
  rmSync(badDir, { recursive: true, force: true });

  const prevDir = mkdtempSync(path.join(tmpdir(), 'wpi-prev-'));
  mkdirSync(path.join(prevDir, 'runs'));
  writeFileSync(path.join(prevDir, 'latest.json'), '{');
  const previousRaw = base([described()], { date_last_checked: '2026-11-09', run_id: 'TR-007-2026-11-09' });
  writeFileSync(path.join(prevDir, 'runs', 'TR-007-2026-11-09.json'), JSON.stringify(previousRaw));
  const prev = loadConnections(prevDir, { root: siteRoot, today: TODAY });
  const prevState = buildListState(prev, 'all');
  add('a previous readable file stays on screen',
    prev.status === 'ok' && prev.source === 'previous' && prevState.footer === 'Last checked: 2026-11-09' && prevState.cards.length === 1);
  rmSync(prevDir, { recursive: true, force: true });

  const none = ready([hidden(), hidden({
    event_name: 'China central bank rate change by 31 December',
    event_id: '1123963',
    market_id: '5230123',
    asset: 'oil',
  })]);
  add('zero visible pairs use the empty page and the check date',
    none.result.ok && none.state.mode === 'empty'
    && none.text.includes(COPY.emptyHeadline)
    && none.text.includes('Last checked: ' + TODAY)
    && !none.text.includes('nothing passed')
    && !none.text.includes(COPY.otherEvents)
    && none.state.cards.length === 0,
    none.result.errors.join('; '));

  const zeros = checked([hidden({ extra_average_percentage_points: 0 })]);
  add('a zero is not accepted where a score was not measured', !zeros.ok);

  const nulls = checked([hidden()]);
  add('null scores on not_enough_history are allowed', nulls.ok, nulls.errors.join('; '));

  const weak = ready([described()]);
  const weakCard = weak.state.cards[0];
  add('a described pair with stronger_connection false is still a card',
    weak.result.ok && weak.state.cards.length === 1
    && !weakCard.tags.some((tag) => tag.text === 'Stronger connection')
    && weakCard.tags.some((tag) => tag.text === 'First look')
    && weakCard.stats.some((stat) => stat.value === '4')
    && weak.text.includes('1 of 4')
    && !weak.text.includes('Thin history'),
    weak.result.errors.join('; '));

  const mismatched = checked([described({ predicted_big_move_rate_percent: 90 })]);
  add('hit rate must equal 100 × n / m', !mismatched.ok);

  const forced = buildCard(described({ predicted_big_move_rate_percent: 99, predicted_big_move_count: 1, confirmation_firing_count: 4 }), {
    date: TODAY, firstWave: true, searchSize: 40, events: [],
  });
  add('the hit line uses the counts, not a rounded percent', forced.companion === 'The price moved at least 1 percent this way in 1 of 4 of those later days.');

  const strongFail = checked([yesPair({ stronger_connection: true, verdict: 'no', how_sure: null, extra_average_percentage_points: 0.05, confirmation_firing_count: 4, predicted_big_move_count: 1, predicted_big_move_rate_percent: 25 })]);
  add('stronger_connection true is only accepted with yes_first_look', !strongFail.ok);

  const lowBar = checked([yesPair({ extra_average_percentage_points: 0.05 })]);
  add('a yes_first_look pair that misses the locked bar fails the file check', !lowBar.ok);

  const many = ready([yesPair()]);
  add('many-pair false still validates and shows the card',
    many.result.ok
    && many.state.cards[0].tags.some((tag) => tag.text === 'Stronger connection')
    && many.state.cards[0].howSure.startsWith(COPY.firstLookSentence)
    && many.text.includes('extra check for looking at many pairs')
    && many.text.includes('0.35% up')
    && many.text.includes(many.state.cards[0].oilNote)
    && !many.text.includes('962 of 1,000'),
    many.result.errors.join('; '));
  const manyDetail = buildDetail(yesPair(), { date: TODAY, searchSize: 40, events: [], firstWave: true });
  add('detail shows the luck percent, the real firing count, and the oil note',
    manyDetail.rows.some((row) => row.text === 'This extra average ranked above 96.2% of 1,000 luck checks.')
    && manyDetail.rows.some((row) => row.label === 'Confirmed signals' && row.text === '11')
    && manyDetail.rows.some((row) => row.text.startsWith('How many pairs were tested: 40'))
    && manyDetail.oilNote.startsWith('This is a statistical link')
    && manyDetail.rows.some((row) => row.text.startsWith('00:00 New York time')));

  const plainOil = ready([yesPair({ oil_publish_lag_note: null })]);
  add('oil with numbers uses the delayed-print sentence when the note is empty',
    plainOil.state.cards[0].oilNote === COPY.oilNoteFallback);
  const bitcoin = ready([described({ oil_publish_lag_note: 'This is a statistical link with a delayed official price print.' })]);
  add('the oil note is not shown on Bitcoin', !bitcoin.text.includes('delayed official'));

  const unclear = ready([described({
    event_name: 'Nvidia market value at end of 2026',
    event_id: '800884',
    market_id: '3358974',
    verdict: 'unclear',
    insight_sentence: 'The extra move was small.',
    extra_average_percentage_points: 0.12,
    predicted_big_move_count: 2,
    confirmation_firing_count: 6,
    predicted_big_move_rate_percent: (100 * 2) / 6,
  })]);
  const unclearCount = unclear.text.split('This reading is unclear').length - 1;
  add('an unclear card says this reading is unclear once',
    unclear.result.ok && unclearCount === 1 && !unclear.state.cards[0].tags.some((tag) => tag.text === 'Stronger connection'),
    unclear.result.errors.join('; '));

  const day = ready([sameDay()]);
  add('a same-day card shows with an empty extra average',
    day.result.ok && day.state.cards.length === 1
    && day.state.cards[0].tags.some((tag) => tag.text === 'Moved together')
    && day.state.cards[0].tags.some((tag) => tag.text === 'First look')
    && !day.state.cards[0].tags.some((tag) => tag.text === 'Stronger connection')
    && day.state.cards[0].stats.length === 0
    && day.text.includes('moving together that day'));
  const bareDay = ready([sameDay({ insight_sentence: null, readable_fact: null })]);
  add('a same-day card without sentences does not invent one',
    bareDay.state.cards.length === 1
    && bareDay.state.cards[0].sentence === ''
    && !bareDay.text.includes('often moved'));

  const preferred = ready([described({ insight_sentence: 'Insight sentence for the card.', readable_fact: 'Fact sentence for the card.' })]);
  add('a described card prefers the insight sentence and does not stack another',
    preferred.state.cards[0].sentence === 'Insight sentence for the card.'
    && !preferred.text.includes('Fact sentence for the card.')
    && !preferred.text.includes('On days when the chance rose'));

  const fallback = ready([described({ insight_sentence: null, readable_fact: null })]);
  add('a next-session card falls back to the measured-pattern sentence',
    fallback.state.cards[0].sentence.startsWith('On days when the chance rose')
    && fallback.state.cards[0].sentence.includes('0.05% up')
    && fallback.state.cards[0].sentence.includes('does not mean one caused the other'));

  const quiet = ready([described(), noPattern(), hidden()]);
  add('the grouped quiet line is for missing history only, and only beside a card',
    quiet.state.cards.length === 2
    && quiet.text.includes(COPY.otherEvents)
    && quiet.state.cards.some((card) => card.historyStatus === 'checked_no_pattern')
    && quiet.state.cards.filter((card) => card.historyStatus === 'checked_no_pattern').length === 1);

  const pattern = ready([noPattern()]);
  const patternCard = pattern.state.cards[0];
  const patternDetail = buildDetail(noPattern(), { date: TODAY, searchSize: 40, events: [], firstWave: true });
  const patternDetailText = visibleText({ card: patternDetail });
  add('checked_no_pattern is a card without strength tags, numbers, or the oil note',
    pattern.result.ok
    && pattern.state.mode === 'list'
    && patternCard.tags.length === 0
    && patternCard.sentence === 'No next-day pattern was locked for Nvidia revenue and oil.'
    && !pattern.text.includes('A second sentence')
    && patternCard.stats.length === 0
    && patternCard.howSure === ''
    && patternCard.oilNote === ''
    && !pattern.text.includes(COPY.firstLookBanner)
    && pattern.text.includes(COPY.sparseBanner)
    && !patternDetailText.includes('luck checks')
    && !patternDetailText.includes(COPY.oilNoteFallback)
    && !patternDetailText.includes('First look, not independently verified'),
    pattern.result.errors.join('; '));

  const factMissing = ready([noPattern({ readable_fact: null })]);
  add('checked_no_pattern uses the insight sentence when the fact is missing',
    factMissing.state.cards[0].sentence === 'A second sentence that must stay off this card.');
  const bothMissing = ready([noPattern({ readable_fact: null, insight_sentence: null })]);
  add('checked_no_pattern still shows a card when both sentences are missing',
    bothMissing.state.cards.length === 1 && bothMissing.state.cards[0].sentence === '');

  const numberedNo = ready([noPattern({
    extra_average_percentage_points: 0.44,
    odds_pattern: 'the chance rose at least 4 points',
    how_sure: 'First look, not independently verified.',
    placebo_share_beaten_percent: 97,
  })]);
  add('verdict no with checked_no_pattern does not show a numeric fact',
    numberedNo.result.ok
    && numberedNo.state.cards[0].stats.length === 0
    && numberedNo.state.cards[0].howSure === ''
    && !numberedNo.text.includes('0.44%'),
    numberedNo.result.errors.join('; '));

  const one = ready([noPattern()]);
  const two = ready([noPattern(), described()]);
  const three = ready([noPattern(), described(), sameDay()]);
  const four = ready([
    noPattern(),
    described(),
    sameDay(),
    described({
      event_name: 'US declares war on Iran',
      event_id: '160366',
      market_id: '1170144',
      asset: 'oil',
      insight_sentence: 'A fourth described card.',
    }),
  ]);
  add('the sparse banner shows for 1, 2, or 3 visible cards and hides at 4',
    one.text.includes(COPY.sparseBanner)
    && two.text.includes(COPY.sparseBanner)
    && three.text.includes(COPY.sparseBanner)
    && !four.text.includes(COPY.sparseBanner)
    && three.text.includes(COPY.sparseHelper)
    && three.text.includes(COPY.firstLookBanner));

  const assetQuiet = ready([described(), hidden({ asset: 'oil', event_id: '711714', market_id: '3399468', event_name: 'Israel-Iran ceasefire holds' })], 'all');
  add('the all filter names the asset with no card',
    assetQuiet.text.includes(COPY.oilQuiet) && assetQuiet.text.includes(COPY.otherEvents) && assetQuiet.state.cards.length === 1);
  const onlyLine = ready([described()], 'oil');
  add('a single-asset filter with no cards shows that quiet line and not the empty page',
    onlyLine.state.mode === 'list'
    && onlyLine.state.cards.length === 0
    && onlyLine.text.includes(COPY.oilQuiet)
    && !onlyLine.text.includes(COPY.emptyHeadline)
    && !onlyLine.text.includes(COPY.otherEvents));
  const both = ready([described(), yesPair()]);
  add('both assets with cards do not get an asset quiet line',
    !both.text.includes(COPY.oilQuiet) && !both.text.includes(COPY.bitcoinQuiet));

  const loading = loadingState('all');
  add('loading keeps the title and does not use the empty headline',
    loading.mode === 'loading'
    && loading.loading === COPY.loading
    && loading.filters.length === 3
    && !visibleText(loading).includes(COPY.emptyHeadline));

  const dup = checked([described(), described()]);
  add('duplicate pairs fail the file check', !dup.ok);
  const unknownEvent = checked([described({ event_id: '999999' })]);
  add('events must come from the frozen app list', !unknownEvent.ok);
  const badPrint = checked([described()], { method_fingerprint: '0'.repeat(64) });
  add('the method fingerprint must match the lock', !badPrint.ok);
  const wallet = checked([described({ proxy_wallet: '0x' + 'ab'.repeat(20) })]);
  add('wallet fields fail the file check', !wallet.ok);
  const emptyMap = checked({});
  add('an empty pair map is allowed', emptyMap.ok && emptyMap.file.pairs.length === 0, emptyMap.errors.join('; '));

  const absent = buildListState({ status: 'missing' }, 'all');
  const detailMissing = buildDetailState({ status: 'missing' }, 'oil-770450-3215008');
  add('a detail link does not invent a result when nothing has been checked',
    detailMissing.mode === 'missing' && detailMissing.message === COPY.notInCheck && !visibleText(detailMissing).includes('0.35'));
  add('the shipped empty copy does not say nothing passed',
    absent.empty.headline === 'Nothing has enough history to describe yet.'
    && !absent.empty.body.toLowerCase().includes('nothing passed'));

  const bannedHits = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === '.next' || name === 'checks') continue;
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(js|mjs|css)$/.test(name)) {
        const text = readFileSync(full, 'utf8');
        for (const needle of ['Thin history', 'Example layout', 'random dates', 'often moved in the same period', '962 of 1,000', 'Netanyahu']) {
          if (text.includes(needle)) bannedHits.push(path.relative(siteRoot, full) + ' ' + needle);
        }
      }
    }
  }
  walk(path.join(siteRoot, 'app'));
  walk(path.join(siteRoot, 'lib'));
  add('live source has no example layout, thin-history tag, or old same-day sentence', bannedHits.length === 0, bannedHits.join('; '));
}

export async function connectionPageChecks(add, page) {
  const list = await page('/connections');
  const html = list.html || '';
  add('Connections page is served with the tab and the insights line',
    list.status === 200 && html.includes('Connections') && html.includes('Insights only, not advice') && html.includes('/how') && html.includes('href="/connections"'));
  const latest = existsSync(path.join(siteRoot, 'data/connections/latest.json'));
  let runJson = false;
  const runsDir = path.join(siteRoot, 'data/connections/runs');
  if (existsSync(runsDir)) runJson = readdirSync(runsDir).some((name) => name.endsWith('.json'));
  if (!latest && !runJson) {
    add('live Connections page is the honest empty state',
      html.includes(COPY.emptyHeadline)
      && html.includes(COPY.notChecked)
      && html.includes(COPY.emptyBody)
      && !html.includes('Example layout')
      && !html.includes('Thin history')
      && !html.includes('random dates')
      && !html.includes('0.35%')
      && !html.includes('Netanyahu'));
    const detail = await page('/connections/oil-770450-3215008');
    add('live detail page does not invent a card',
      detail.status === 200 && detail.html.includes(COPY.notInCheck) && !detail.html.includes('0.35%'));
  }
  if (latest) {
    const loaded = loadConnections(path.join(siteRoot, 'data/connections'), { root: siteRoot, today: TODAY });
    const state = buildListState(loaded, 'all');
    const rendered = visibleText(state);
    add('live Connections page shows the results file',
      loaded.status === 'ok'
      && list.status === 200
      && html.includes(state.footer)
      && state.mode !== 'empty'
      && !html.includes(COPY.emptyHeadline)
      && state.cards.length > 0
      && state.cards.every((card) => card.sentence && html.includes(card.sentence))
      && state.quiet.every((line) => html.includes(line))
      && state.banners.every((banner) => html.includes(banner.text))
      && (html.match(/data-history="/g) || []).length === state.cards.length,
      'cards ' + state.cards.length + ' mode ' + state.mode);
    const earlierHtml = (html.split('<details class="earlier-checks">')[1] || '').split('</details>')[0];
    add('live page does not add strength tags the file did not earn',
      state.cards.every((card) => card.tags.length === 0)
        ? !earlierHtml.includes('Stronger connection') && !earlierHtml.includes('First look') && !earlierHtml.includes('Moved together')
        : true);
    add('oil delay note is absent when no oil card has numbers',
      state.cards.every((card) => !card.oilNote) ? !html.includes('official oil print') && !rendered.includes('official oil print') : true);
    for (const card of state.cards) {
      const detail = await page(card.href);
      add('detail ' + card.id + ' shows the file sentence only',
        detail.status === 200
        && detail.html.includes(card.sentence)
        && !detail.html.includes('luck checks')
        && !detail.html.includes('First look, not independently verified.')
        && (card.oilNote || !detail.html.includes('official oil print')));
    }
    const oil = await page('/connections?asset=oil');
    const bitcoin = await page('/connections?asset=bitcoin');
    const oilState = buildListState(loaded, 'oil');
    const bitcoinState = buildListState(loaded, 'bitcoin');
    add('asset filters follow the same results file',
      oil.status === 200 && bitcoin.status === 200
      && oilState.cards.every((card) => oil.html.includes(card.sentence))
      && bitcoinState.cards.every((card) => bitcoin.html.includes(card.sentence))
      && (oil.html.match(/data-history="/g) || []).length === oilState.cards.length
      && (bitcoin.html.match(/data-history="/g) || []).length === bitcoinState.cards.length);
  }
  const loading = await page('/connections?state=loading');
  add('Connections loading does not flash the empty headline',
    loading.status === 200
    && loading.html.includes(COPY.loading)
    && loading.html.includes('Connections')
    && !loading.html.includes(COPY.emptyHeadline));
}
