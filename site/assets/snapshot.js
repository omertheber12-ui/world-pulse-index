// Built by build_site.py. Public Polymarket figures + read-only holdings snapshot. No keys.
window.WPI_SNAPSHOT = {
 "built_at": "9 November 2026, 18:16:33 Asia/Jerusalem",
 "built_iso": "2026-11-09T18:16:33.958741+02:00",
 "built_ms": 1794240993958,
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
    "note": "US elections (only US races found in Product search)"
   },
   "wars": {
    "group": "wars",
    "chips": 0.5,
    "crypto": 0.25,
    "broad_us_stocks": 0.5,
    "banks": 0.25,
    "product_touch_ref": 38.0,
    "note": "Wars"
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
   "Only United States election races found; most look nearly settled.",
   "Strength numbers are untested starting Assumptions.",
   "Attention formula is a first Guess from Product."
  ]
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
     "outcomePrices": "[\"0.0045\", \"0.9955\"]",
     "clobTokenIds": "[\"17640596861394454242836532536014033416733783473450136742726948856144855149507\", \"104236736263775307891497202874191911203963566711959725788584750440530976742193\"]",
     "oneDayPriceChange": -0.001,
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
   "event_id": "1262243",
   "group": "worldwide_elections",
   "strength_key": "worldwide_elections",
   "title": "Which Senate Swing States will Republicans win? (Build Your Map)",
   "slug": "which-tossup-senate-states-will-republicans-win-ak-ia-ks-me-mi-oh-tx",
   "polymarket_url": "https://polymarket.com/event/which-tossup-senate-states-will-republicans-win-ak-ia-ks-me-mi-oh-tx",
   "source_url": "https://gamma-api.polymarket.com/events/1262243",
   "market_ids": [
    "6274257"
   ],
   "volume": 78729544.01457301,
   "markets": [
    {
     "id": "6274257",
     "question": "Will Republicans lose the Alaska, Iowa, Kansas, Maine, Michigan, Ohio, and Texas Senate seats?",
     "groupItemTitle": "None",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.981\", \"0.019\"]",
     "clobTokenIds": "[\"13535941900723044344907002451427688051727855016747811259193368015899108383450\", \"80727480162707694817992062873857913056698208056368499870278974630056151503113\"]",
     "oneDayPriceChange": -0.0035,
     "volumeNum": 10638907.821615001,
     "closed": false,
     "slug": "2026-senate-map-r-none"
    }
   ]
  },
  {
   "event_id": "1304411",
   "group": "worldwide_elections",
   "strength_key": "worldwide_elections",
   "title": "Senate Combo: Louisiana, Mississippi, Florida",
   "slug": "senate-combo-louisiana-mississippi-florida",
   "polymarket_url": "https://polymarket.com/event/senate-combo-louisiana-mississippi-florida",
   "source_url": "https://gamma-api.polymarket.com/events/1304411",
   "market_ids": [
    "6612550"
   ],
   "volume": 3002.4979829999997,
   "markets": [
    {
     "id": "6612550",
     "question": "Will Republicans win the Louisiana, Mississippi, and Florida Senate seats?",
     "groupItemTitle": "Reps sweep",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.3245\", \"0.6755\"]",
     "clobTokenIds": "[\"43940531322901107468025282861695842774781409824444430254983886576593249911353\", \"75147850967389311097723504135931248592782759879610657370689972984494233270383\"]",
     "oneDayPriceChange": 0.3125,
     "volumeNum": 766.5568549999999,
     "closed": false,
     "slug": "will-republicans-win-the-louisiana-mississippi-and-florida-senate-seats"
    }
   ]
  },
  {
   "event_id": "1224132",
   "group": "worldwide_elections",
   "strength_key": "worldwide_elections",
   "title": "Senate Combo: Mississippi, South Carolina, Montana",
   "slug": "senate-three-way-combo-mississippi-south-carolina-montana",
   "polymarket_url": "https://polymarket.com/event/senate-three-way-combo-mississippi-south-carolina-montana",
   "source_url": "https://gamma-api.polymarket.com/events/1224132",
   "market_ids": [
    "5971438"
   ],
   "volume": 15721.4879,
   "markets": [
    {
     "id": "5971438",
     "question": "Will Republicans win the Mississippi and Montana Senate seats, and Democrats win South Carolina?",
     "groupItemTitle": "Reps MS & MT, Dems SC",
     "outcomes": "[\"Yes\", \"No\"]",
     "outcomePrices": "[\"0.137\", \"0.863\"]",
     "clobTokenIds": "[\"9167006927021919176346100216115255120760758621254693980968420456591891174956\", \"92339640466783597011203690800664032768718976926565675276142200328553224556132\"]",
     "oneDayPriceChange": 0.1255,
     "volumeNum": 2448.050112,
     "closed": false,
     "slug": "will-republicans-win-the-mississippi-and-montana-senate-seats-and-democrats-win-south-carolina"
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
