/**
 * Brand's 21 headlines, word for word, keyed by pick.
 * A pair that is both a holding pick and an event pick uses one headline.
 * The size pair on the 2-year yield drops the sentence Brand added about being the strongest link.
 */

const H1 = 'On the same day, bigger swings in Federal Reserve rate-decision odds often lined up with moves in the Bitcoin price.';
const H2 = 'A move in the main US oil price often lined up the next day with a move in other central-bank rate-decision odds.';
const H3 = 'A bigger swing in national-election odds often lined up with a move in gold over the next week.';
const H4 = 'On the same day, bigger swings in Federal Reserve rate-decision odds often lined up with moves in the S&P 500 index.';
const H5 = 'This is the strongest listed link for the Nasdaq 100 and Federal Reserve rate-decision odds over the next week, but it did not clear the chance line.';
const H6 = 'On the same day, bigger swings in Federal Reserve rate-decision odds often lined up with moves in the US 2-year government bond yield.';
const H7 = 'On the same day, bigger swings in Federal Reserve rate-decision odds often lined up with moves in the US 10-year government bond yield.';
const H8 = 'On the same day, a rise in the chance of a Federal Reserve rate cut often lined up with a fall in the US 3-month Treasury bill rate.';
const H9 = 'On the same day, a rise in the chance of a Federal Reserve rate cut often lined up with a fall in 5-year inflation expected, as priced in US government bonds.';
const H10 = 'A move in 10-year inflation expected, as priced in US government bonds, often lined up over the next week with a move in the same direction in the odds for the US monthly inflation report.';
const H11 = 'On the same day, a rise in the chance of a Federal Reserve rate cut often lined up with a fall in the US dollar against the Japanese yen.';
const H12 = 'On the same day, a rise in the chance of peace over war often lined up with a fall in the US dollar against the Israeli shekel.';
export const FEATURED_HEADLINE = 'On the same day, a rise in the chance of a Federal Reserve rate cut often lined up with a fall in the US 2-year government bond yield. This is one of two links that passed a stricter pick-from-many check.';
const H15 = 'A move in the US dollar against the Israeli shekel often lined up over the next week with a move in the same direction in the chance of a rate cut at other central banks.';
const H19 = 'A move in the Bitcoin price often lined up over the next week with a bigger swing in war and ceasefire odds.';
const H20 = 'A move in 5-year inflation expected, as priced in US government bonds, often lined up over the next week with a move in the same direction in the odds for the US monthly inflation report.';
const H21 = 'A bigger swing in US monthly inflation-report odds often lined up the next day with a move in gold.';

export const BRAND_HEADLINES = {
  'asset|F1_fed/size|bitcoin': H1,
  'asset|F2_other_cb/size|oil': H2,
  'asset|F3_elections/size|gold': H3,
  'asset|F1_fed/size|sp500': H4,
  'asset|F1_fed/size|nasdaq100': H5,
  'asset|F1_fed/size|us_2y_yield': H6,
  'asset|F1_fed/size|us_10y_yield': H7,
  'asset|F1_fed/direction|us_3m_bill': H8,
  'asset|F1_fed/direction|inflation_expectation_5y': H9,
  'asset|INF_us_cpi/direction|inflation_expectation_10y': H10,
  'asset|F1_fed/direction|usd_jpy': H11,
  'asset|F4_ceasefire_war/direction|usd_ils': H12,
  'event|F1_fed/direction|us_2y_yield': FEATURED_HEADLINE,
  'event|F1_fed/size|us_2y_yield': H6,
  'event|F2_other_cb/direction|usd_ils': H15,
  'event|F2_other_cb/size|oil': H2,
  'event|F3_elections/size|gold': H3,
  'event|F4_ceasefire_war/direction|usd_ils': H12,
  'event|F4_ceasefire_war/size|bitcoin': H19,
  'event|INF_us_cpi/direction|inflation_expectation_5y': H20,
  'event|INF_us_cpi/size|gold': H21,
};

export const STANDING_LINE = 'Past data. Description only, not proven. Not a forecast and not advice.';

export function brandHeadline(section, eventFamily, assetId) {
  return BRAND_HEADLINES[section + '|' + eventFamily + '|' + assetId] || '';
}
