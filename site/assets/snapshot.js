// Built by build_site.py. Public Polymarket figures + read-only holdings snapshot. No keys.
window.WPI_SNAPSHOT = {
 "built_at": "9 November 2026, 18:23:14 Asia/Jerusalem",
 "built_iso": "2026-11-09T18:23:14.236873+02:00",
 "built_ms": 1794241394236,
 "group_order": [
  "central_bank_rates",
  "big_company_events",
  "worldwide_elections",
  "wars"
 ],
 "group_short": {
  "central_bank_rates": "Central banks",
  "big_company_events": "Big company",
  "worldwide_elections": "Elections",
  "wars": "Wars"
 },
 "holdings": {
  "fetched_at": "9 November 2026, 16:44:57 Asia/Jerusalem",
  "time": "16:44",
  "source": "eToro connector, read-only portfolio summary",
  "total": 4202.18,
  "cash": 2.02,
  "cash_weight": 0.048070287327054054,
  "rows": [
   {
    "name": "Intel",
    "ticker": "INTC",
    "units": 23.184235,
    "value": 1325.91,
    "weight": 31.55290825238329
   },
   {
    "name": "Bitcoin",
    "ticker": "BTC",
    "units": 0.013694,
    "value": 1017.32,
    "weight": 24.209338962157737
   },
   {
    "name": "State Street SPDR S&P 500 ETF",
    "ticker": "SPY",
    "units": 1.179758,
    "value": 880.96,
    "weight": 20.964356595862146
   },
   {
    "name": "JPMorgan Chase & Co",
    "ticker": "JPM",
    "units": 1.549533,
    "value": 522.82,
    "weight": 12.441637435807129
   },
   {
    "name": "Bank of America Corp",
    "ticker": "BAC",
    "units": 9.011622,
    "value": 452.3,
    "weight": 10.763460870310173
   },
   {
    "name": "Ethereum",
    "ticker": "ETH",
    "units": 0.0004,
    "value": 0.85,
    "weight": 0.02022759615247324
   }
  ]
 },
 "rules": {
  "source": {
   "label": "Fact",
   "product_task": "Product task 10",
   "doc_id": "1XptYmlRKxo2JEUm15rodf9RoM8UeWegkX521kMa9Z30",
   "doc_url": "https://docs.google.com/document/d/1XptYmlRKxo2JEUm15rodf9RoM8UeWegkX521kMa9Z30/edit",
   "doc_title": "Product Rules \u00b7 TP-010 Portfolio Touch Score",
   "delivered_at": "9 November 2026, 17:55 Asia/Jerusalem",
   "note": "Default scoring rules. Swap this file only to change strengths or formula."
  },
  "holdings_sectors": {
   "INTC": {
    "sector": "chips",
    "label": "Guess",
    "sector_words": "Chips, technology"
   },
   "BTC": {
    "sector": "crypto",
    "label": "Guess",
    "sector_words": "Crypto"
   },
   "ETH": {
    "sector": "crypto",
    "label": "Guess",
    "sector_words": "Crypto"
   },
   "SPY": {
    "sector": "broad_us_stocks",
    "label": "Guess",
    "sector_words": "Broad US stocks, heavy in big technology"
   },
   "JPM": {
    "sector": "banks",
    "label": "Guess",
    "sector_words": "Banks"
   },
   "BAC": {
    "sector": "banks",
    "label": "Guess",
    "sector_words": "Banks"
   },
   "CASH": {
    "sector": "none",
    "label": "Fact",
    "sector_words": "No link"
   }
  },
  "strength_levels": {
   "strong": 1.0,
   "some": 0.5,
   "weak": 0.25,
   "none": 0,
   "label": "Assumption"
  },
  "group_strengths": {
   "central_bank_rates_fed": {
    "group": "central_bank_rates",
    "subgroup": "fed",
    "chips": 0.5,
    "crypto": 0.5,
    "broad_us_stocks": 1.0,
    "banks": 1.0,
    "product_touch_ref": 71.9,
    "note": "Federal Reserve rates"
   },
   "central_bank_rates_ecb": {
    "group": "central_bank_rates",
    "subgroup": "ecb",
    "chips": 0.25,
    "crypto": 0.25,
    "broad_us_stocks": 0.25,
    "banks": 0.25,
    "product_touch_ref": 25.0,
    "note": "European Central Bank rates"
   },
   "central_bank_rates_china": {
    "group": "central_bank_rates",
    "subgroup": "china",
    "chips": 0.5,
    "crypto": 0.25,
    "broad_us_stocks": 0.25,
    "banks": 0.25,
    "product_touch_ref": 32.8,
    "note": "China's central bank rates"
   },
   "big_company_events": {
    "group": "big_company_events",
    "chips": 1.0,
    "crypto": 0,
    "broad_us_stocks": 0.5,
    "banks": 0,
    "product_touch_ref": 41.8,
    "note": "Nvidia and big technology"
   },
   "worldwide_elections": {
    "group": "worldwide_elections",
    "chips": 0.25,
    "crypto": 0.25,
    "broad_us_stocks": 0.5,
    "banks": 0.5,
    "product_touch_ref": 36.0,
    "note": "US elections (2028 presidential winner); Product task 10 strengths"
   },
   "wars": {
    "group": "wars",
    "chips": 0.5,
    "crypto": 0.25,
    "broad_us_stocks": 0.5,
    "banks": 0.25,
    "product_touch_ref": 38.0,
    "note": "Wars"
   },
   "election_france": {
    "group": "worldwide_elections",
    "subgroup": "france",
    "chips": 0.25,
    "crypto": 0.25,
    "broad_us_stocks": 0.25,
    "banks": 0.25,
    "label": "Guess, Assumption",
    "author": "Development's own guess, pending Product",
    "note": "French election: European risk, weak links to SPY, banks, Bitcoin and Intel"
   },
   "election_israel": {
    "group": "worldwide_elections",
    "subgroup": "israel",
    "chips": 0.5,
    "crypto": 0.25,
    "broad_us_stocks": 0.25,
    "banks": 0.25,
    "label": "Guess, Assumption",
    "author": "Development's own guess, pending Product",
    "note": "Israel prime minister: some link to Intel (large Israel operations), weak to others"
   }
  },
  "scoring": {
   "touch": "sum over holdings of (holding_weight_percent \u00d7 link_strength). Holding weight = holding dollar value / portfolio total \u00d7 100. Link strength from group_strengths by the holding's sector. Cash strength is always 0.",
   "uncertainty": "4 \u00d7 p \u00d7 (1 \u2212 p), where p is the leading option figure as a fraction 0\u20131. Equals 1.0 at 50% and near 0 when one option is near 100%.",
   "attention": "touch \u00d7 uncertainty, plus touch \u00d7 0.5 when a meaningful move is present under Product task 7 (5 points or more versus about 24 hours earlier, lasting at least one hour). Cap at touch.",
   "high_effect_threshold": 30,
   "update_rule": "Scores update only when Polymarket percentages move. Not from news. Whether or not the event happens, the score follows the figure.",
   "one_event_rule": "Related options in one event count as one event, not several.",
   "every_link_label": "Guess",
   "strength_label": "Assumption",
   "insight_lines": {
    "if_happens": "If it happens (Guess): This could touch about {touch_rounded}% of your portfolio, mostly {top_holdings}; {extra}.",
    "if_not": "If it does not happen (Guess): The other result would be the surprise against today's leading figure, and could touch the same {touch_rounded}%."
   }
  },
  "group_display": {
   "central_bank_rates": "Central bank rate decisions",
   "big_company_events": "Big company events",
   "worldwide_elections": "Worldwide elections",
   "wars": "Wars"
  },
  "gaps": [
   "No live earnings markets found for Apple, Microsoft, Alphabet, Amazon, Meta, Tesla or Intel at Product search time.",
   "Strength numbers are untested starting Assumptions.",
   "Attention formula is a first Guess from Product.",
   "Election strengths for France and Israel are Development's own Guess, pending Product."
  ],
  "rate_wording": {
   "No change": "{bank} holds rates {when}",
   "25 bps increase": "{bank} raises 0.25 points {when}",
   "50+ bps increase": "{bank} raises 0.5+ points {when}",
   "25 bps decrease": "{bank} cuts 0.25 points {when}",
   "50+ bps decrease": "{bank} cuts 0.5+ points {when}"
  }
 },
 "links": {
  "architecture": "https://docs.google.com/document/d/1LXe3vWDLnm02pKvsWNFDbCpzQO7ObTqLVF9YM4VKEzA/edit",
  "product_rules": "https://docs.google.com/document/d/1XptYmlRKxo2JEUm15rodf9RoM8UeWegkX521kMa9Z30/edit"
 },
 "events": [
  {
   "event_id": "770450",
   "group": "central_bank_rates",
   "strength_key": "central_bank_rates_fed",
   "title": "Fed Decision in December?",
   "slug": "fed-decision-in-december-20260729232808632",
   "polymarket_url": "https://polymarket.com/event/fed-decision-in-december-20260729232808632",
   "source_url": "https://gamma-api.polymarket.com/events/770450",
   "market_ids": [
    "3215008",
    "3215007",
    "3215009",
    "3215006",
    "3215005"
   ],
   "plain": "Fed rate decision in December",
   "rate": {
    "bank": "Fed",
    "when": "in December"
   },
   "outcomes_plain": {},
   "outcome_template": null,
   "volume": 17387051.012682,
   "markets": [
    {
     "id": "3215008",
     "question": "Will the Fed increase interest rates by 25 bps after the December 2026 meeting?",
     "groupItemTitle": "25 bps increase",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.805\", \"0.195\"]",
     "clobTokenIds": "[\"111662129652828266889360374468657435151479595863413519836161861837506140152890\", \"94483965432909797688470702512207472940215538148754820061518518664128018848687\"]",
     "oneDayPriceChange": 0.04,
     "volumeNum": 5111256.082467999,
     "closed": false,
     "slug": "will-the-fed-increase-interest-rates-by-25-bps-after-the-december-2026-meeting-20260729232808636"
    },
    {
     "id": "3215007",
     "question": "Will there be no change in Fed interest rates after the December 2026 meeting?",
     "groupItemTitle": "No change",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.195\", \"0.805\"]",
     "clobTokenIds": "[\"42865728742506860386768556888821101266630139112044622335353850919229585308601\", \"8077351031134730167836761678618167504307708651130165095377248922919635337796\"]",
     "oneDayPriceChange": -0.02,
     "volumeNum": 4047040.113297,
     "closed": false,
     "slug": "will-there-be-no-change-in-fed-interest-rates-after-the-december-2026-meeting-20260729232808635"
    },
    {
     "id": "3215009",
     "question": "Will the Fed increase interest rates by 50+ bps after the December 2026 meeting?",
     "groupItemTitle": "50+ bps increase",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0055\", \"0.9945\"]",
     "clobTokenIds": "[\"35090254409399344650860070211816464534198960801264823587796928404808383727584\", \"17037715451587457598270390992151934195448806241696976473961259598235638233970\"]",
     "oneDayPriceChange": null,
     "volumeNum": 2111980.518305,
     "closed": false,
     "slug": "will-the-fed-increase-interest-rates-by-50-bps-after-the-december-2026-meeting-20260729232808637"
    },
    {
     "id": "3215006",
     "question": "Will the Fed decrease interest rates by 25 bps after the December 2026 meeting?",
     "groupItemTitle": "25 bps decrease",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0065\", \"0.9935\"]",
     "clobTokenIds": "[\"77367448845023382525249480243608609306658725883285195065573683809293972009019\", \"23677896678650147625251750117853328843601853501710889530409633595389256242910\"]",
     "oneDayPriceChange": null,
     "volumeNum": 3024978.545245,
     "closed": false,
     "slug": "will-the-fed-decrease-interest-rates-by-25-bps-after-the-december-2026-meeting-20260729232808634"
    },
    {
     "id": "3215005",
     "question": "Will the Fed decrease interest rates by 50+ bps after the December 2026 meeting?",
     "groupItemTitle": "50+ bps decrease",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.006\", \"0.994\"]",
     "clobTokenIds": "[\"17640596861394454242836532536014033416733783473450136742726948856144855149507\", \"104236736263775307891497202874191911203963566711959725788584750440530976742193\"]",
     "oneDayPriceChange": 0.0005,
     "volumeNum": 3091795.753367,
     "closed": false,
     "slug": "will-the-fed-decrease-interest-rates-by-50-bps-after-the-december-2026-meeting-20260729232808633"
    }
   ]
  },
  {
   "event_id": "770451",
   "group": "central_bank_rates",
   "strength_key": "central_bank_rates_fed",
   "title": "Fed Decision in January?",
   "slug": "fed-decision-in-january-20260729233815502",
   "polymarket_url": "https://polymarket.com/event/fed-decision-in-january-20260729233815502",
   "source_url": "https://gamma-api.polymarket.com/events/770451",
   "market_ids": [],
   "plain": "Fed rate decision in January",
   "rate": {
    "bank": "Fed",
    "when": "in January"
   },
   "outcomes_plain": {},
   "outcome_template": null,
   "volume": 1311450.4495239998,
   "markets": [
    {
     "id": "3215010",
     "question": "Will the Fed decrease interest rates by 50+ bps after the January 2027 meeting?",
     "groupItemTitle": "50+ bps decrease",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0085\", \"0.9915\"]",
     "clobTokenIds": "[\"45053521911672808043600263178798111402897730682087979734684574823004307023433\", \"54892629532396715672060844552184409083592827625930470370999146720346626910259\"]",
     "oneDayPriceChange": null,
     "volumeNum": 207442.88863699997,
     "closed": false,
     "slug": "will-the-fed-decrease-interest-rates-by-50-bps-after-the-january-2027-meeting-20260729233815503"
    },
    {
     "id": "3215011",
     "question": "Will the Fed decrease interest rates by 25 bps after the January 2027 meeting?",
     "groupItemTitle": "25 bps decrease",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.034\", \"0.966\"]",
     "clobTokenIds": "[\"55531205670373260499988385930313327116586167390725681551489621136380793885916\", \"109592678904810057002493483716660995296395997473352977641574408716547799045975\"]",
     "oneDayPriceChange": -0.0025,
     "volumeNum": 190279.99350599997,
     "closed": false,
     "slug": "will-the-fed-decrease-interest-rates-by-25-bps-after-the-january-2027-meeting-20260729233815504"
    },
    {
     "id": "3215012",
     "question": "Will there be no change in Fed interest rates after the January 2027 meeting?",
     "groupItemTitle": "No change",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.775\", \"0.225\"]",
     "clobTokenIds": "[\"63563009510989471204377539732457086916124654411092982704760023438039220215330\", \"36342864926284644003283595741257595655709757799681943153551982143131732331338\"]",
     "oneDayPriceChange": null,
     "volumeNum": 355626.307374,
     "closed": false,
     "slug": "will-there-be-no-change-in-fed-interest-rates-after-the-january-2027-meeting-20260729233815505"
    },
    {
     "id": "3215013",
     "question": "Will the Fed increase interest rates by 25 bps after the January 2027 meeting?",
     "groupItemTitle": "25 bps increase",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.185\", \"0.815\"]",
     "clobTokenIds": "[\"58421987972100586826330616250690474504359298033602990223828098109695719571344\", \"63396423986062034636625373404202970920080078602349826866595954726582462497358\"]",
     "oneDayPriceChange": null,
     "volumeNum": 427988.61530099995,
     "closed": false,
     "slug": "will-the-fed-increase-interest-rates-by-25-bps-after-the-january-2027-meeting-20260729233815506"
    },
    {
     "id": "3215014",
     "question": "Will the Fed increase interest rates by 50+ bps after the January 2027 meeting?",
     "groupItemTitle": "50+ bps increase",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0075\", \"0.9925\"]",
     "clobTokenIds": "[\"42452047366442275682382090045397807109079755041679563479952649068752467853296\", \"98510419442387454895805766707264980500719881328500989992133076060209252362108\"]",
     "oneDayPriceChange": 0.001,
     "volumeNum": 130112.64470600002,
     "closed": false,
     "slug": "will-the-fed-increase-interest-rates-by-50-bps-after-the-january-2027-meeting-20260729233815507"
    }
   ]
  },
  {
   "event_id": "1025305",
   "group": "central_bank_rates",
   "strength_key": "central_bank_rates_ecb",
   "title": "ECB Interest Rates: December 2026",
   "slug": "ecb-interest-rates-december-2026",
   "polymarket_url": "https://polymarket.com/event/ecb-interest-rates-december-2026",
   "source_url": "https://gamma-api.polymarket.com/events/1025305",
   "market_ids": [
    "4570943"
   ],
   "plain": "ECB rate decision in December",
   "rate": {
    "bank": "ECB",
    "when": "in December"
   },
   "outcomes_plain": {},
   "outcome_template": null,
   "volume": 65187.529856,
   "markets": [
    {
     "id": "4570943",
     "question": "Will the ECB announce a 50+ bps decrease at the December 2026 meeting?",
     "groupItemTitle": "50+ bps decrease",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0025\", \"0.9975\"]",
     "clobTokenIds": "[\"52440441184411582649360692926952533217058683048104189135288649923889579160011\", \"90125527067668279619131650087807057831782717691641752501181466242134384963092\"]",
     "oneDayPriceChange": null,
     "volumeNum": 5443.280698999999,
     "closed": false,
     "slug": "will-the-ecb-announce-a-50-bps-decrease-at-the-december-2026-meeting"
    }
   ]
  },
  {
   "event_id": "1280521",
   "group": "central_bank_rates",
   "strength_key": "central_bank_rates_ecb",
   "title": "ECB Interest Rates: February 2027",
   "slug": "ecb-interest-rates-february-2027",
   "polymarket_url": "https://polymarket.com/event/ecb-interest-rates-february-2027",
   "source_url": "https://gamma-api.polymarket.com/events/1280521",
   "market_ids": [
    "6404226"
   ],
   "plain": "ECB rate decision in February",
   "rate": {
    "bank": "ECB",
    "when": "in February"
   },
   "outcomes_plain": {},
   "outcome_template": null,
   "volume": 14004.826258,
   "markets": [
    {
     "id": "6404226",
     "question": "Will the ECB decrease the deposit facility rate by 50+ bps at the February meeting?",
     "groupItemTitle": "50+ bps decrease",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0135\", \"0.9865\"]",
     "clobTokenIds": "[\"47729335837260894555857342426493062947123429108786003219890616472642736070690\", \"77180322010419069505506022259531084130575776193598003852134459012475806487646\"]",
     "oneDayPriceChange": -0.0225,
     "volumeNum": 2382.446766,
     "closed": false,
     "slug": "will-the-ecb-decrease-the-deposit-facility-rate-by-50-bps-at-the-february-2027-meeting"
    }
   ]
  },
  {
   "event_id": "1123963",
   "group": "central_bank_rates",
   "strength_key": "central_bank_rates_china",
   "title": "People's Bank of China rate change by December 31?",
   "slug": "peoples-bank-of-china-rate-change-by-december-31",
   "polymarket_url": "https://polymarket.com/event/peoples-bank-of-china-rate-change-by-december-31",
   "source_url": "https://gamma-api.polymarket.com/events/1123963",
   "market_ids": [
    "5230123"
   ],
   "plain": "China central bank rate change by 31 December",
   "rate": null,
   "outcomes_plain": {
    "No Change": "China holds rates through December",
    "Yes": "China changes rates by 31 December"
   },
   "outcome_template": null,
   "volume": 19012.311774,
   "markets": [
    {
     "id": "5230123",
     "question": "Will the People\u2019s Bank of China not change rates by December 31?",
     "groupItemTitle": "No Change",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.9\", \"0.1\"]",
     "clobTokenIds": "[\"72508137872945643796815081900363361565570754660360557133294357942107098746316\", \"12290475821459530102114962465464727132252537955390306741619256988402794595640\"]",
     "oneDayPriceChange": -0.02,
     "volumeNum": 9761.897815,
     "closed": false,
     "slug": "will-the-peoples-bank-of-china-not-change-rates-by-december-31"
    }
   ]
  },
  {
   "event_id": "1194143",
   "group": "big_company_events",
   "strength_key": "big_company_events",
   "title": "Will NVIDIA (NVDA) Q3 Data Center Revenue be above __?",
   "slug": "will-nvidia-nvda-q3-data-center-revenue-be-above-20261008120135000",
   "polymarket_url": "https://polymarket.com/event/will-nvidia-nvda-q3-data-center-revenue-be-above-20261008120135000",
   "source_url": "https://gamma-api.polymarket.com/events/1194143",
   "market_ids": [
    "5730325"
   ],
   "plain": "Nvidia data center revenue this quarter",
   "rate": null,
   "outcomes_plain": {
    "$100B": "Nvidia data center sales top $100B"
   },
   "outcome_template": null,
   "volume": 2179.820335,
   "markets": [
    {
     "id": "5730325",
     "question": "Will NVIDIA (NVDA) Q3 Data Center revenue be above $100B?",
     "groupItemTitle": "$100B",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.975\", \"0.025\"]",
     "clobTokenIds": "[\"63173682896024371821969300433849199302022010142516011383337930374434659807252\", \"32781327044453127187684041249429081969173019873817364967908010370511243705911\"]",
     "oneDayPriceChange": 0.13,
     "volumeNum": 453.990954,
     "closed": false,
     "slug": "will-nvidia-nvda-q3-data-center-revenue-be-above-20261008120135000-100b"
    }
   ]
  },
  {
   "event_id": "1194144",
   "group": "big_company_events",
   "strength_key": "big_company_events",
   "title": "NVIDIA (NVDA) Q3 adjusted gross margin (non-GAAP)?",
   "slug": "nvidia-nvda-q3-adjusted-gross-margin-non-gaap-20261008120136000",
   "polymarket_url": "https://polymarket.com/event/nvidia-nvda-q3-adjusted-gross-margin-non-gaap-20261008120136000",
   "source_url": "https://gamma-api.polymarket.com/events/1194144",
   "market_ids": [
    "5730329"
   ],
   "plain": "Nvidia gross margin this quarter",
   "rate": null,
   "outcomes_plain": {
    "<71%": "Nvidia gross margin under 71%"
   },
   "outcome_template": null,
   "volume": 7404.988247000001,
   "markets": [
    {
     "id": "5730329",
     "question": "NVIDIA (NVDA) Q3 adjusted gross margin <71%?",
     "groupItemTitle": "<71%",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0285\", \"0.9715\"]",
     "clobTokenIds": "[\"63752781868424102384492401978216600032322688971706824046658879805832674590222\", \"14313137827136881755848648464718437523794085386778494019567947934277996341978\"]",
     "oneDayPriceChange": null,
     "volumeNum": 662.6629440000002,
     "closed": false,
     "slug": "nvidia-nvda-q3-adjusted-gross-margin-non-gaap-20261008120136000-less-than-71"
    }
   ]
  },
  {
   "event_id": "800884",
   "group": "big_company_events",
   "strength_key": "big_company_events",
   "title": "Nvidia\u2019s Market Cap end of 2026?",
   "slug": "nvidias-market-cap-end-of-2026",
   "polymarket_url": "https://polymarket.com/event/nvidias-market-cap-end-of-2026",
   "source_url": "https://gamma-api.polymarket.com/events/800884",
   "market_ids": [
    "3358974"
   ],
   "plain": "Nvidia market value at end of 2026",
   "rate": null,
   "outcomes_plain": {
    "<$4.00T": "Nvidia ends 2026 under $4 trillion"
   },
   "outcome_template": null,
   "volume": 68316.444538,
   "markets": [
    {
     "id": "3358974",
     "question": "Will Nvidia\u2019s market capitalization be less than $4.00T at the end of 2026?",
     "groupItemTitle": "<$4.00T",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.2645\", \"0.7355\"]",
     "clobTokenIds": "[\"75184185460235875385343932552601861806273235321353622101075745551195596449064\", \"34018603004196992445593398920516394351314045267655138524671675534959894093072\"]",
     "oneDayPriceChange": 0.125,
     "volumeNum": 8924.707029999998,
     "closed": false,
     "slug": "will-nvidias-market-capitalization-be-less-than-3pt50t-at-the-end-of-2026-1785882876109"
    }
   ]
  },
  {
   "event_id": "79987",
   "group": "worldwide_elections",
   "strength_key": "election_france",
   "title": "Next French Presidential Election",
   "slug": "next-french-presidential-election",
   "polymarket_url": "https://polymarket.com/event/next-french-presidential-election",
   "source_url": "https://gamma-api.polymarket.com/events/79987",
   "market_ids": [
    "679018",
    "679064",
    "679030",
    "679022",
    "679021",
    "679060",
    "679029",
    "679034"
   ],
   "plain": "French presidential election 2027",
   "rate": null,
   "outcomes_plain": {},
   "outcome_template": "{label} wins",
   "volume": 169364301.062319,
   "markets": [
    {
     "id": "679018",
     "question": "Will Marine Le Pen win the 2027 French presidential election?",
     "groupItemTitle": "Marine Le Pen",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.4505\", \"0.5495\"]",
     "clobTokenIds": "[\"55764212211467781322980371912612507865974994976253196346176314491480419639168\", \"5649717099758674861276159343380402289083378331461490840325685141994171250523\"]",
     "oneDayPriceChange": null,
     "volumeNum": 5264282.706934,
     "closed": false,
     "slug": "will-marine-le-pen-win-the-2027-french-presidential-election"
    },
    {
     "id": "679064",
     "question": "Will Teddy Riner win the 2027 French presidential election?",
     "groupItemTitle": "Teddy Riner",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.1845\", \"0.8155\"]",
     "clobTokenIds": "[\"5484359180643998833429212063323989217966527556579338887565291075146224382196\", \"38487328584338975336631272662082357710888040951341541748452771296940469992311\"]",
     "oneDayPriceChange": null,
     "volumeNum": 49756.993751,
     "closed": false,
     "slug": "will-teddy-riner-win-the-2027-french-presidential-election"
    },
    {
     "id": "679030",
     "question": "Will Jean-Luc M\u00e9lenchon win the 2027 French presidential election?",
     "groupItemTitle": "Jean-Luc M\u00e9lenchon",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.135\", \"0.865\"]",
     "clobTokenIds": "[\"88550326946437280548248031502775629664259630024343210447063397951616199975032\", \"78935030613038194779147226463048913187247425461933527083007539809178403199936\"]",
     "oneDayPriceChange": null,
     "volumeNum": 3567885.7974659996,
     "closed": false,
     "slug": "will-jean-luc-mlenchon-win-the-2027-french-presidential-election"
    },
    {
     "id": "679022",
     "question": "Will David Lisnard win the 2027 French presidential election?",
     "groupItemTitle": "David Lisnard",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.1295\", \"0.8705\"]",
     "clobTokenIds": "[\"55404192439775628931124671719520886657525387168536821457706619003199189099864\", \"79358475953126059185096320578578995575874288599466094920037110232928386404141\"]",
     "oneDayPriceChange": -0.019,
     "volumeNum": 6925218.9355770005,
     "closed": false,
     "slug": "will-david-lisnard-win-the-2027-french-presidential-election"
    },
    {
     "id": "679021",
     "question": "Will \u00c9douard Philippe win the 2027 French presidential election?",
     "groupItemTitle": "\u00c9douard Philippe",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.075\", \"0.925\"]",
     "clobTokenIds": "[\"84846382165343032223975853870946110241285484772019446686866815597350660955868\", \"80456575204440643570499123641511043765364487572502085512858581574010154701650\"]",
     "oneDayPriceChange": -0.02,
     "volumeNum": 3156941.879523,
     "closed": false,
     "slug": "will-douard-philippe-win-the-2027-french-presidential-election"
    },
    {
     "id": "679060",
     "question": "Will Christine Lagarde win the 2027 French presidential election?",
     "groupItemTitle": "Christine Lagarde",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0575\", \"0.9425\"]",
     "clobTokenIds": "[\"99240068351455574729467629800805892674088563638353047506523604209057843144195\", \"58754901030958194596958074489255728955620849812430285036092529343781637878128\"]",
     "oneDayPriceChange": -0.009,
     "volumeNum": 2856194.836313,
     "closed": false,
     "slug": "will-christine-lagarde-win-the-2027-french-presidential-election"
    },
    {
     "id": "679029",
     "question": "Will Rapha\u00ebl Glucksmann win the 2027 French presidential election?",
     "groupItemTitle": "Rapha\u00ebl Glucksmann",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0225\", \"0.9775\"]",
     "clobTokenIds": "[\"97531408855841405410232789703119036119573635076996943730887685044477538494161\", \"91614037901759358822201019738747890245698909012092657780820261729371244775376\"]",
     "oneDayPriceChange": -0.005,
     "volumeNum": 3572384.5832,
     "closed": false,
     "slug": "will-raphal-glucksmann-win-the-2027-french-presidential-election"
    },
    {
     "id": "679034",
     "question": "Will Dominique de Villepin win the 2027 French presidential election?",
     "groupItemTitle": "Dominique de Villepin",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0185\", \"0.9815\"]",
     "clobTokenIds": "[\"94391324985187701312427605791553049327097814064787849723991205429060004737042\", \"26890459666562518130876295284144647143504759262811197504274347102239033858901\"]",
     "oneDayPriceChange": -0.001,
     "volumeNum": 3579668.1527790003,
     "closed": false,
     "slug": "will-dominique-de-villepin-win-the-2027-french-presidential-election"
    }
   ]
  },
  {
   "event_id": "81557",
   "group": "worldwide_elections",
   "strength_key": "election_israel",
   "title": "Prime Minister of Israel after the next election?",
   "slug": "who-will-be-the-next-prime-minister-of-israel-after-the-next-election",
   "polymarket_url": "https://polymarket.com/event/who-will-be-the-next-prime-minister-of-israel-after-the-next-election",
   "source_url": "https://gamma-api.polymarket.com/events/81557",
   "market_ids": [
    "682708",
    "682705",
    "682710",
    "682706",
    "682711",
    "682712",
    "682714",
    "682719"
   ],
   "plain": "Israel next prime minister",
   "rate": null,
   "outcomes_plain": {},
   "outcome_template": "{label} becomes prime minister",
   "volume": 90634924.085552,
   "markets": [
    {
     "id": "682708",
     "question": "Will Gadi Eizenkot be the next Prime Minister of Israel?",
     "groupItemTitle": "Gadi Eizenkot",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.608\", \"0.392\"]",
     "clobTokenIds": "[\"52487256270918227930942830546248720603566203568229607048093730748840489555808\", \"1507744758511144558263623459899956467548763419522526462308518027912401299177\"]",
     "oneDayPriceChange": -0.0645,
     "volumeNum": 9834171.917501,
     "closed": false,
     "slug": "will-gadi-eizenkot-be-the-next-prime-minister-of-israel"
    },
    {
     "id": "682705",
     "question": "Will Benjamin Netanyahu be the next Prime Minister of Israel?",
     "groupItemTitle": "Benjamin Netanyahu",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.264\", \"0.736\"]",
     "clobTokenIds": "[\"20006732765674855733524007935991362439352594042415161039767275461950712817548\", \"54533569528927082430133047556849600511985191158927477533124630301934489498530\"]",
     "oneDayPriceChange": 0.077,
     "volumeNum": 34743120.484285004,
     "closed": false,
     "slug": "will-benjamin-netanyahu-be-the-next-prime-minister-of-israel"
    },
    {
     "id": "682710",
     "question": "Will Avigdor Lieberman be the next Prime Minister of Israel?",
     "groupItemTitle": "Avigdor Lieberman",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0675\", \"0.9325\"]",
     "clobTokenIds": "[\"105057524965982907913786325697426001538810836564004836999292309706852745390829\", \"13887896800265966487014179943559375403384011039339488276489274832989862323735\"]",
     "oneDayPriceChange": -0.002,
     "volumeNum": 5426683.198829999,
     "closed": false,
     "slug": "will-avigdor-lieberman-be-the-next-prime-minister-of-israel"
    },
    {
     "id": "682706",
     "question": "Will Naftali Bennett be the next Prime Minister of Israel?",
     "groupItemTitle": "Naftali Bennett",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.034\", \"0.966\"]",
     "clobTokenIds": "[\"58945936829392654397399777214757608864525173988558750256164021442231118224154\", \"39409206330527880169507414405291721950884951005340760541937649898052386499519\"]",
     "oneDayPriceChange": 0.0075,
     "volumeNum": 5854080.501469001,
     "closed": false,
     "slug": "will-naftali-bennett-be-the-next-prime-minister-of-israel"
    },
    {
     "id": "682711",
     "question": "Will Yossi Cohen be the next Prime Minister of Israel?",
     "groupItemTitle": "Yossi Cohen",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0015\", \"0.9985\"]",
     "clobTokenIds": "[\"80908635602471552886049573110321791161186841957249509900771759394573505359926\", \"279135026232966548267372221910300904521833390614952028405533756942338898146\"]",
     "oneDayPriceChange": null,
     "volumeNum": 4624725.50969,
     "closed": false,
     "slug": "will-yossi-cohen-be-the-next-prime-minister-of-israel"
    },
    {
     "id": "682712",
     "question": "Will Yair Golan be the next Prime Minister of Israel?",
     "groupItemTitle": "Yair Golan",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0015\", \"0.9985\"]",
     "clobTokenIds": "[\"38003127295883228185689665963602138176190384641897237734105806870773590495970\", \"43581484654171741412819396053420951222941194520459214805405618926172095980803\"]",
     "oneDayPriceChange": 0.0005,
     "volumeNum": 3008197.3360289996,
     "closed": false,
     "slug": "will-yair-golan-be-the-next-prime-minister-of-israel"
    },
    {
     "id": "682714",
     "question": "Will Gideon Sa\u2019ar be the next Prime Minister of Israel?",
     "groupItemTitle": "Gideon Sa\u2019ar",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0015\", \"0.9985\"]",
     "clobTokenIds": "[\"113523109301381527088718768250912137532200947193534063249121987336101159734964\", \"81875811432969830460135158317591338081684626327054488810775527982906009292091\"]",
     "oneDayPriceChange": null,
     "volumeNum": 2598873.263076999,
     "closed": false,
     "slug": "will-gideon-saar-be-the-next-prime-minister-of-israel"
    },
    {
     "id": "682719",
     "question": "Will Israel Katz be the next Prime Minister of Israel?",
     "groupItemTitle": "Israel Katz",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0015\", \"0.9985\"]",
     "clobTokenIds": "[\"49071939739791449726827416712265617396930502300780957239086018273026268436098\", \"19043464432761022117798242943058502377099044437371801839246425042395638016765\"]",
     "oneDayPriceChange": null,
     "volumeNum": 1679285.049765,
     "closed": false,
     "slug": "will-israel-katz-be-the-next-prime-minister-of-israel"
    }
   ]
  },
  {
   "event_id": "31552",
   "group": "worldwide_elections",
   "strength_key": "worldwide_elections",
   "title": "Presidential Election Winner 2028",
   "slug": "presidential-election-winner-2028",
   "polymarket_url": "https://polymarket.com/event/presidential-election-winner-2028",
   "source_url": "https://gamma-api.polymarket.com/events/31552",
   "market_ids": [
    "561261",
    "561229",
    "561231",
    "561234",
    "561230",
    "561246",
    "561239",
    "561232"
   ],
   "plain": "US presidential election 2028",
   "rate": null,
   "outcomes_plain": {},
   "outcome_template": "{label} wins",
   "volume": 736903451.792976,
   "markets": [
    {
     "id": "561261",
     "question": "Will Jon Ossoff win the 2028 US Presidential Election?",
     "groupItemTitle": "Jon Ossoff",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.1885\", \"0.8115\"]",
     "clobTokenIds": "[\"110102705199530588976777616718115948005824665233400132417374621750887344831757\", \"98394838816403247684221016468696784125095120854407803889228262583112436699261\"]",
     "oneDayPriceChange": 0.015,
     "volumeNum": 6985244.528896,
     "closed": false,
     "slug": "will-jon-ossoff-win-the-2028-us-presidential-election"
    },
    {
     "id": "561229",
     "question": "Will JD Vance win the 2028 US Presidential Election?",
     "groupItemTitle": "JD Vance",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.1755\", \"0.8245\"]",
     "clobTokenIds": "[\"16040015440196279900485035793550429453516625694844857319147506590755961451627\", \"94476829201604408463453426454480212459887267917122244941405244686637914508323\"]",
     "oneDayPriceChange": -0.002,
     "volumeNum": 18854450.434423998,
     "closed": false,
     "slug": "will-jd-vance-win-the-2028-us-presidential-election"
    },
    {
     "id": "561231",
     "question": "Will Alexandria Ocasio-Cortez win the 2028 US Presidential Election?",
     "groupItemTitle": "Alexandria Ocasio-Cortez",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.1185\", \"0.8815\"]",
     "clobTokenIds": "[\"8113830512143065501177519557124858581375945005490796772950589720955457782465\", \"11493926619286817179231142642565394485790380952577225820901334479399429951651\"]",
     "oneDayPriceChange": -0.002,
     "volumeNum": 14411469.661399001,
     "closed": false,
     "slug": "will-alexandria-ocasio-cortez-win-the-2028-us-presidential-election"
    },
    {
     "id": "561234",
     "question": "Will Marco Rubio win the 2028 US Presidential Election?",
     "groupItemTitle": "Marco Rubio",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0955\", \"0.9045\"]",
     "clobTokenIds": "[\"11171618905857319805355893398009978356002287408842633593535559412449299952250\", \"65892530750232246342273648992064742042382898919201083513241874070914353628268\"]",
     "oneDayPriceChange": null,
     "volumeNum": 13481446.805038001,
     "closed": false,
     "slug": "will-marco-rubio-win-the-2028-us-presidential-election"
    },
    {
     "id": "561230",
     "question": "Will Gavin Newsom win the 2028 US Presidential Election?",
     "groupItemTitle": "Gavin Newsom",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0765\", \"0.9235\"]",
     "clobTokenIds": "[\"98250445447699368679516529207365255018790721464590833209064266254238063117329\", \"18823838997443878656879952590502524526556504037944392973476854588563571859850\"]",
     "oneDayPriceChange": 0.006,
     "volumeNum": 19130626.334713005,
     "closed": false,
     "slug": "will-gavin-newsom-win-the-2028-us-presidential-election"
    },
    {
     "id": "561246",
     "question": "Will Ron DeSantis win the 2028 US Presidential Election?",
     "groupItemTitle": "Ron DeSantis",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0555\", \"0.9445\"]",
     "clobTokenIds": "[\"104480514270625615787868282411330496385404675495672110015326625654626015018993\", \"65724430065358897810064400118831287249960059855415477063660293398018349529272\"]",
     "oneDayPriceChange": -0.001,
     "volumeNum": 12988292.146252997,
     "closed": false,
     "slug": "will-ron-desantis-win-the-2028-us-presidential-election"
    },
    {
     "id": "561239",
     "question": "Will Kamala Harris win the 2028 US Presidential Election?",
     "groupItemTitle": "Kamala Harris",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0325\", \"0.9675\"]",
     "clobTokenIds": "[\"70663352401606372246362604193214664065595751757222752105245221905399175050480\", \"4988819538339626436114997160558538168652916536529198363646261454228218983102\"]",
     "oneDayPriceChange": -0.003,
     "volumeNum": 9756414.300219996,
     "closed": false,
     "slug": "will-kamala-harris-win-the-2028-us-presidential-election"
    },
    {
     "id": "561232",
     "question": "Will Pete Buttigieg win the 2028 US Presidential Election?",
     "groupItemTitle": "Pete Buttigieg",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0265\", \"0.9735\"]",
     "clobTokenIds": "[\"35629456194498013232473191985311930903993567273832459837879398120893197410860\", \"26087406687932108531005204502244492184534000122992461059156880611150953145122\"]",
     "oneDayPriceChange": 0.002,
     "volumeNum": 8727790.428483997,
     "closed": false,
     "slug": "will-pete-buttigieg-win-the-2028-us-presidential-election"
    }
   ]
  },
  {
   "event_id": "711714",
   "group": "wars",
   "strength_key": "wars",
   "title": "Israel x Iran ceasefire continues through...?",
   "slug": "israel-x-iran-ceasefire-continues-throughptptpt-20260716224448963",
   "polymarket_url": "https://polymarket.com/event/israel-x-iran-ceasefire-continues-throughptptpt-20260716224448963",
   "source_url": "https://gamma-api.polymarket.com/events/711714",
   "market_ids": [
    "3399468"
   ],
   "plain": "Israel-Iran ceasefire holds",
   "rate": null,
   "outcomes_plain": {
    "December 31": "Israel-Iran ceasefire holds through 31 December"
   },
   "outcome_template": null,
   "volume": 50332537.870677,
   "markets": [
    {
     "id": "3399468",
     "question": "Israel x Iran ceasefire continues through December 31?",
     "groupItemTitle": "December 31",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.61\", \"0.39\"]",
     "clobTokenIds": "[\"34732988886981510167874389845708832808627284379840131351229635795767825787404\", \"63915287271940688064870172991436489775587541335457370355314489349033951709373\"]",
     "oneDayPriceChange": 0.03,
     "volumeNum": 2221855.2074370002,
     "closed": false,
     "slug": "israel-x-iran-ceasefire-continues-through-december-31-415"
    }
   ]
  },
  {
   "event_id": "478472",
   "group": "wars",
   "strength_key": "wars",
   "title": "Russia x Ukraine ceasefire agreement by...?",
   "slug": "russia-x-ukraine-ceasefire-agreement-by",
   "polymarket_url": "https://polymarket.com/event/russia-x-ukraine-ceasefire-agreement-by",
   "source_url": "https://gamma-api.polymarket.com/events/478472",
   "market_ids": [
    "2243897"
   ],
   "plain": "Russia-Ukraine ceasefire deal",
   "rate": null,
   "outcomes_plain": {
    "December 31": "Russia-Ukraine ceasefire deal by 31 December"
   },
   "outcome_template": null,
   "volume": 10635545.837024001,
   "markets": [
    {
     "id": "2243897",
     "question": "Russia x Ukraine ceasefire agreement by December 31, 2026?",
     "groupItemTitle": "December 31",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.145\", \"0.855\"]",
     "clobTokenIds": "[\"99878393523957043401217108863095556720659532630565063651671026144852955005052\", \"69565284411089708271128692790745152090129066525382935764397092493923596997488\"]",
     "oneDayPriceChange": -0.01,
     "volumeNum": 3308089.343211,
     "closed": false,
     "slug": "russia-x-ukraine-ceasefire-agreement-by-december-31-2026"
    }
   ]
  },
  {
   "event_id": "160366",
   "group": "wars",
   "strength_key": "wars",
   "title": "Will the US officially declare war on Iran by...?",
   "slug": "will-the-us-officially-declare-war-on-iran-by",
   "polymarket_url": "https://polymarket.com/event/will-the-us-officially-declare-war-on-iran-by",
   "source_url": "https://gamma-api.polymarket.com/events/160366",
   "market_ids": [
    "1170144"
   ],
   "plain": "US declares war on Iran",
   "rate": null,
   "outcomes_plain": {
    "December 31": "US declares war on Iran by 31 December"
   },
   "outcome_template": null,
   "volume": 7873698.511402987,
   "markets": [
    {
     "id": "1170144",
     "question": "Will the US officially declare war on Iran by December 31, 2026?",
     "groupItemTitle": "December 31",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0195\", \"0.9805\"]",
     "clobTokenIds": "[\"7557290671053949208699445220310834898387867585937374554219472108856099537227\", \"83652999054281077992136893356670906681712967148078791434355880630259935043726\"]",
     "oneDayPriceChange": -0.0005,
     "volumeNum": 901064.273507,
     "closed": false,
     "slug": "will-the-us-officially-declare-war-on-iran-by-december-31-2026-746"
    }
   ]
  },
  {
   "event_id": "34044",
   "group": "wars",
   "strength_key": "wars",
   "title": "Will China invade Taiwan by end of 2026?",
   "slug": "will-china-invade-taiwan-before-2027",
   "polymarket_url": "https://polymarket.com/event/will-china-invade-taiwan-before-2027",
   "source_url": "https://gamma-api.polymarket.com/events/34044",
   "market_ids": [
    "567621"
   ],
   "plain": "China invades Taiwan in 2026",
   "rate": null,
   "outcomes_plain": {
    "Will China invade Taiwan by end of 2026?": "China invades Taiwan by end of 2026"
   },
   "outcome_template": null,
   "volume": 46019902.515467,
   "markets": [
    {
     "id": "567621",
     "question": "Will China invade Taiwan by end of 2026?",
     "groupItemTitle": "",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.0175\", \"0.9825\"]",
     "clobTokenIds": "[\"94559586571241563470235664821564670251180951772614764383113614156422396181162\", \"90772332434487149264114862115632028379978765245278600275169585501290867536237\"]",
     "oneDayPriceChange": 0.001,
     "volumeNum": 46019902.515467,
     "closed": false,
     "slug": "will-china-invade-taiwan-before-2027"
    }
   ]
  },
  {
   "event_id": "1337182",
   "group": "wars",
   "strength_key": "wars",
   "title": "US x Iran Effective Ceasefire begins by...? (2 week pause)",
   "slug": "us-x-iran-effective-ceasefire-begins-by-2-week-pause-20261108",
   "polymarket_url": "https://polymarket.com/event/us-x-iran-effective-ceasefire-begins-by-2-week-pause-20261108",
   "source_url": "https://gamma-api.polymarket.com/events/1337182",
   "market_ids": [
    "6831494"
   ],
   "plain": "US-Iran ceasefire starts",
   "rate": null,
   "outcomes_plain": {
    "November 15": "US-Iran ceasefire starts by 15 November"
   },
   "outcome_template": null,
   "volume": 441164.813465,
   "markets": [
    {
     "id": "6831494",
     "question": "US x Iran Effective Ceasefire by November 15?",
     "groupItemTitle": "November 15",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.45\", \"0.55\"]",
     "clobTokenIds": "[\"6097871914367610284582440381544005482777665716584926016321254901654860681152\", \"48094359207016110356802741009227133669406414283907907434349128209323981054413\"]",
     "oneDayPriceChange": 0.09,
     "volumeNum": 93176.195015,
     "closed": false,
     "slug": "us-x-iran-effective-ceasefire-by-november-15-20261108"
    }
   ]
  }
 ]
};
