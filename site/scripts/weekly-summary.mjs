/**
 * Write one weekly file per ISO week from the saved day files.
 * The text describes the saved days only.
 */
import { SITE, loadRule } from '../lib/dailyOdds.js';
import { readDayFiles, writeWeeks } from '../lib/dailyStore.js';

const days = readDayFiles(SITE);
const weeks = writeWeeks(SITE, days, loadRule(SITE));
for (const week of weeks) console.log(week.week, week.status, week.days_covered.join(','));
if (!weeks.length) {
  console.error('no saved days');
  process.exit(1);
}
