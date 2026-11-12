/**
 * Plain sentences for the Today, week, and learn screens.
 * Describes saved readings. Does not tell anyone what to do next.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function displayName(name) {
  const raw = String(name || '').trim();
  const parts = raw.split(' — ');
  const event = (parts[0] || raw).trim();
  const outcome = parts.slice(1).join(' — ').trim();
  const rate = /^([A-Za-z]+) rate decision in ([A-Za-z]+)$/.exec(event);
  const eventLabel = rate ? rate[1] + ' ' + rate[2] + ' decision' : event;
  if (!outcome) return eventLabel;
  return eventLabel + ': ' + outcome;
}

export function moveSentence(name, direction, pointsText, when) {
  const tail = when ? ' ' + when : '';
  if (direction === 'held') return name + ' odds held' + tail + '.';
  const unit = pointsText === '1' ? 'point' : 'points';
  return name + ' odds ' + direction + ' ' + pointsText + ' ' + unit + tail + '.';
}

export function directionOf(points) {
  const n = Number(points);
  if (!Number.isFinite(n) || n === 0) return 'held';
  return n > 0 ? 'rose' : 'fell';
}

export function shortDay(iso) {
  if (!iso) return '';
  const parts = String(iso).split('-').map(Number);
  const month = MONTHS[(parts[1] || 1) - 1] || '';
  return (parts[2] || '') + ' ' + month;
}

export function formatOddsPercent(odds) {
  if (typeof odds !== 'number' || !Number.isFinite(odds)) return '';
  const text = (Math.round(odds * 10000) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return text + '%';
}

export function chartCaption(points) {
  const known = (points || []).filter((point) => typeof point.odds === 'number');
  if (known.length < 2) return 'Not enough saved odds to draw a line.';
  const start = formatOddsPercent(known[0].odds);
  const end = formatOddsPercent(known[known.length - 1].odds);
  const verb = known[known.length - 1].odds > known[0].odds
    ? 'rose'
    : known[known.length - 1].odds < known[0].odds
      ? 'fell'
      : 'held';
  const gaps = (points || []).some((point) => typeof point.odds !== 'number');
  const gap = gaps ? ' Days with no saved odds are left out of the line.' : '';
  return 'Saved odds ' + verb + ' from ' + start + ' to ' + end + ' over these days.' + gap;
}

export function smallerLabel(count) {
  if (count === 1) return '1 smaller change';
  return count + ' smaller changes';
}

export function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

const LINES_BODY = 'The chart has two lines. Labels at the ends name the odds line and the asset line. This is a picture of the past, from the first saved day in the window to the last. It shows what already happened on those days. It is not a forecast.';

export const LEARN_SOURCE = 'Figures on these cards are the accepted TR-016 numbers for this link.';

export const LEARN_ENTRY = {
  title: 'Learn one thing',
  body: 'What the lines show, what the score means, and what the chance band means. Three short cards.',
  start: 'Start',
};

export const SAME_DAY_LESSON = {
  kicker: 'One thing to learn',
  title: 'What a same-day link means.',
  body: 'Same day means the odds and the asset both moved on the same trading day. It does not mean one caused the other. Other links on the site had one side move first.',
  link: 'Learn more about this',
  href: '/connections',
};

function blank(value) {
  return value == null || String(value).trim() === '';
}

export function learnCardSet({ scoreText, bandText, episodes, tradingDays, outside }) {
  const score = blank(scoreText) ? 'not available' : String(scoreText);
  const band = blank(bandText) ? '' : String(bandText);
  const episodesText = blank(episodes) ? 'the saved' : String(episodes);
  const daysText = blank(tradingDays) ? 'the saved' : String(tradingDays);
  const known = score !== 'not available' && !blank(episodes) && !blank(tradingDays);
  const lined = outside
    ? 'the moves often lined up'
    : 'the moves did not line up more than chance alone';
  const scoreBody = known
    ? 'The score on this link is ' + score + '. Across ' + episodesText + ' separate episodes and ' + daysText + ' trading days, ' + lined + '. That score only ranks how the moves lined up in this recorded window. It does not prove one side caused the other, and it is not a forecast.'
    : 'The score on this link is ' + score + '. The saved figures do not give a full episode count for this window. A score only ranks how moves lined up in the recorded window. It does not prove one side caused the other, and it is not a forecast.';
  let bandBody;
  if (!band) {
    bandBody = 'The chance band is not available for this link. A chance band shows how large a score chance alone tends to make. The saved figures do not say whether this score sits outside that band. That is still not proof, and it is not a forecast.';
  } else if (score === 'not available') {
    bandBody = 'The chance band is ±' + band + '. It shows how large a score chance alone tends to make on a link like this. The saved figures do not say whether this score sits outside that band. That is still not proof, and it is not a forecast.';
  } else if (outside) {
    bandBody = 'The chance band is ±' + band + '. It shows how large a score chance alone tends to make on a link like this. This score sits outside that band. Sitting outside the band still does not prove that one side caused the other. It is not a forecast.';
  } else {
    bandBody = 'The chance band is ±' + band + '. It shows how large a score chance alone tends to make on a link like this. This score sits inside that band. Sitting inside the band means chance alone could explain the score. It is not a forecast.';
  }
  return [
    { topic: 'What the lines show', body: LINES_BODY },
    { topic: 'What ' + score + ' means', body: scoreBody },
    { topic: band ? 'What the chance band ±' + band + ' means' : 'What the chance band means', body: bandBody },
  ];
}
