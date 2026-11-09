/* World Pulse Index shared code: data, live reads, scoring, layout. No keys. Insights only. */
(function () {
  var S = window.WPI_SNAPSHOT;
  var W = { S: S, mids: {}, live: { gammaAt: null, gammaOk: false, midAt: null }, prevLead: {} };
  window.WPI = W;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  W.esc = esc;
  function parse(x) { if (Array.isArray(x)) return x; try { return JSON.parse(x || '[]'); } catch (e) { return []; } }
  W.time = function (d, secs) {
    return d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jerusalem', hour12: false, hour: '2-digit', minute: '2-digit', second: secs ? '2-digit' : undefined });
  };
  W.pct = function (v) { if (v == null) return '—'; return (v >= 10 || v === 0 ? v.toFixed(0) : v.toFixed(1)); };
  W.pct1 = function (v) { return v == null ? '—' : v.toFixed(1); };
  W.money = function (v) { if (!v) return '—'; if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'; return '$' + v.toFixed(0); };
  W.usd = function (v) { return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

  /* Options of one event, biggest first. Binary Yes/No markets show the Yes side (Product convention). */
  W.options = function (ev) {
    var out = [];
    ev.markets.forEach(function (m) {
      if (m.closed || !m.outcomePrices) return;
      var oc = parse(m.outcomes), pr = parse(m.outcomePrices).map(Number), tk = parse(m.clobTokenIds);
      var odc = m.oneDayPriceChange == null ? null : Number(m.oneDayPriceChange) * 100;
      if (oc.length === 2 && String(oc[0]).toLowerCase() === 'yes') {
        out.push({ label: m.groupItemTitle || m.question || 'Yes', pct: pr[0] * 100, move: odc, token: tk[0], market: m.id, volume: Number(m.volumeNum || 0) });
      } else {
        oc.forEach(function (o, i) {
          out.push({ label: (m.groupItemTitle ? m.groupItemTitle + ': ' : '') + o, pct: pr[i] * 100, move: odc == null ? null : (i === 0 ? odc : -odc), token: tk[i], market: m.id, volume: Number(m.volumeNum || 0) });
        });
      }
    });
    out.forEach(function (o) { var mid = W.mids[o.token]; if (mid != null) { o.pct = mid * 100; o.fromMid = true; } });
    out.sort(function (a, b) { return b.pct - a.pct; });
    return out;
  };

  /* Plain wording for an option (rules.json plain names); falls back to plain name + option */
  W.plainOutcome = function (ev, label) {
    if (ev.rate && S.rules.rate_wording && S.rules.rate_wording[label]) return S.rules.rate_wording[label].replace('{bank}', ev.rate.bank).replace('{when}', ev.rate.when);
    if (ev.outcomes_plain && ev.outcomes_plain[label]) return ev.outcomes_plain[label];
    if (ev.outcome_template) return ev.outcome_template.replace('{label}', label);
    return (ev.plain || ev.title) + ': ' + label;
  };
  W.name = function (ev) { return ev.plain || ev.title; };
  W.sector = function (t) { var h = S.rules.holdings_sectors[t]; return h ? h.sector : 'none'; };
  W.sectorWords = function (t) { var h = S.rules.holdings_sectors[t]; return h ? h.sector_words : 'No link'; };
  W.strengthWord = function (v) { return v >= 1 ? 'strong' : v >= 0.5 ? 'some' : v > 0 ? 'weak' : 'none'; };

  /* Product task 10 scoring */
  W.score = function (ev) {
    var opts = W.options(ev), lead = opts[0] || null;
    var st = S.rules.group_strengths[ev.strength_key];
    var parts = S.holdings.rows.map(function (r) {
      var s = Number(st[W.sector(r.ticker)] || 0);
      return { ticker: r.ticker, name: r.name, weight: r.weight, strength: s, contrib: r.weight * s };
    });
    var touch = parts.reduce(function (a, p) { return a + p.contrib; }, 0);
    var p = lead ? lead.pct / 100 : null;
    var unc = p == null ? 0 : 4 * p * (1 - p);
    var move = lead ? lead.move : null;
    var meaningful = move != null && Math.abs(move) >= 5;
    var att = Math.min(touch * unc + (meaningful ? touch * 0.5 : 0), touch);
    var top = parts.filter(function (x) { return x.contrib > 0.05; }).sort(function (a, b) { return b.contrib - a.contrib; });
    var topWords = top.slice(0, 2).map(function (x) { return x.name; }).join(' and ') || 'no linked holdings';
    var leaderChanged = lead && W.prevLead[ev.event_id] && W.prevLead[ev.event_id] !== lead.label;
    var why;
    if (meaningful) why = 'moved ' + Math.abs(move).toFixed(0) + ' points since yesterday';
    else if (p != null && p >= 0.4 && p <= 0.6) why = 'close to 50/50 (' + W.pct(lead.pct) + '%)';
    else if (leaderChanged) why = 'leader changed since you opened the page';
    else why = 'highest attention today';
    var tr = Math.round(touch);
    return {
      ev: ev, opts: opts, lead: lead, parts: parts, touch: touch, high: touch > S.rules.scoring.high_effect_threshold,
      unc: unc, move: move, meaningful: meaningful, attention: att, why: why, topWords: topWords,
      ifHappens: 'If it happens (Guess): this could touch about ' + tr + '% of your reported portfolio, mostly ' + topWords + '.',
      ifNot: 'If it does not happen (Guess): the other result would be the surprise against ' + (lead ? W.pct(lead.pct) + '%' : 'the figure') + ' and could touch the same ' + tr + '%.'
    };
  };
  W.all = function () { return S.events.map(W.score); };
  W.ranked = function () { return W.all().sort(function (a, b) { return b.attention - a.attention || b.touch - a.touch; }); };
  W.byId = function (id) { var e = S.events.filter(function (x) { return x.event_id === String(id); })[0]; return e ? W.score(e) : null; };

  /* Product task 7 headline: 12 words or fewer */
  function words(s, n) { var w = String(s).replace(/[?]/g, '').split(/\s+/); return w.length > n ? w.slice(0, n).join(' ') + '…' : w.join(' '); }
  W.headline = function () {
    var r = W.ranked(), mv = r.filter(function (x) { return x.meaningful; });
    if (mv.length) {
      var t = mv[0], o = W.plainOutcome(t.ev, t.lead.label).split(/\s+/).slice(0, 6).join(' ');
      return { top: t, text: 'Odds ' + o + ' ' + (t.move > 0 ? 'rose ' : 'fell ') + Math.abs(t.move).toFixed(0) + ' points to ' + W.pct(t.lead.pct) + '%' };
    }
    var t0 = r[0];
    return { top: t0, text: 'No big moves today', line: 'Top event: ' + W.plainOutcome(t0.ev, t0.lead.label) + ' at ' + W.pct(t0.lead.pct) + '%, could touch ' + Math.round(t0.touch) + '% of your portfolio (Guess).' };
  };
  /* Shared layout */
  W.shell = function (active) {
    var tabs = [['today', 'today.html', 'Today'], ['events', 'events.html', 'Events'], ['portfolio', 'portfolio.html', 'My portfolio']];
    var nav = '<a class="brand" href="today.html">World Pulse Index</a><nav id="tabs">' + tabs.map(function (t) {
      return '<a class="tab' + (t[0] === active ? ' on' : '') + '" href="' + t[1] + '">' + t[2] + '</a>';
    }).join('') + '</nav>';
    document.getElementById('top').innerHTML = nav;
    document.getElementById('footer').innerHTML = 'Insights only, not advice. Figures: Polymarket public data (no key). Holdings: read-only eToro read, ' + esc(S.holdings.fetched_at) + '. Every event-to-holding link is a Guess. · <a href="how.html">How it works</a>';
    W.timeline();
  };
  W.timeline = function () {
    var el = document.getElementById('timeline'); if (!el) return;
    var f = W.live.gammaOk ? 'Figures at ' + W.time(W.live.midAt && W.live.midAt > W.live.gammaAt ? W.live.midAt : W.live.gammaAt, true) + ' (live)'
      : 'Figures at ' + W.time(new Date(S.built_ms), true) + ' · built-in figures at ' + W.time(new Date(S.built_ms), false);
    el.className = 'timeline';
    el.innerHTML = esc(f) + ' · Holdings at ' + esc(S.holdings.time) + ' · Insights only, not advice · <a href="how.html">How it works</a>';
  };

  /* Live reads: Gamma every 60 s, order book midpoint every 20 s. Failures keep the built-in snapshot. */
  var render = function () {};
  function remember() { W.all().forEach(function (s) { if (s.lead) W.prevLead[s.ev.event_id] = s.lead.label; }); }
  function readGamma() {
    return Promise.all(S.events.map(function (ev) {
      return fetch('https://gamma-api.polymarket.com/events/' + ev.event_id).then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(function (j) {
        var ms = j.markets || [];
        if (ev.market_ids && ev.market_ids.length) {
          var keep = ev.markets.map(function (old) { return ms.filter(function (m) { return String(m.id) === String(old.id); })[0] || old; });
          ms = keep;
        }
        ev.markets = ms.map(function (m) { return { id: m.id, question: m.question, groupItemTitle: m.groupItemTitle, outcomes: m.outcomes, outcomePrices: m.outcomePrices, clobTokenIds: m.clobTokenIds, oneDayPriceChange: m.oneDayPriceChange, volumeNum: m.volumeNum, closed: m.closed }; });
        if (j.volume) ev.volume = Number(j.volume);
        return true;
      }).catch(function () { return false; });
    })).then(function (res) {
      var ok = res.filter(Boolean).length;
      if (ok) { W.live.gammaOk = true; W.live.gammaAt = new Date(); W.mids = {}; }
      W.live.gammaCount = ok;
      render(); W.timeline();
    });
  }
  function readMids() {
    if (!W.live.gammaOk) return Promise.resolve();
    var leads = W.all().map(function (s) { return s.lead; }).filter(function (l) { return l && l.token; });
    return Promise.all(leads.map(function (l) {
      return fetch('https://clob.polymarket.com/midpoint?token_id=' + encodeURIComponent(l.token)).then(function (r) { if (!r.ok) throw r.status; return r.json(); })
        .then(function (j) { var v = parseFloat(j.mid); if (!isNaN(v)) { W.mids[l.token] = v; return true; } return false; })
        .catch(function () { return false; });
    })).then(function (res) {
      if (res.filter(Boolean).length) { W.live.midAt = new Date(); render(); W.timeline(); }
    }).catch(function () {});
  }
  W.start = function (active, fn) {
    render = function () { try { fn(); } catch (e) { console.error(e); } };
    remember();
    W.shell(active);
    render();
    readGamma();
    setInterval(readGamma, 60000);
    setInterval(readMids, 20000);
  };
  W.rerender = function () { render(); };
  W.param = function (k) { return new URLSearchParams(location.search).get(k); };
  W.bar = function (v) { var w = v == null || isNaN(v) ? 0 : Math.max(0, Math.min(100, v)); return '<span class="bar" aria-hidden="true"><i style="width:' + w.toFixed(1) + '%"></i></span>'; };
  W.card = function (s) {
    return '<a class="card" href="event.html?id=' + s.ev.event_id + '">' +
      '<div class="ctitle">' + esc(W.name(s.ev)) + '</div>' +
      '<div class="big">' + W.pct(s.lead ? s.lead.pct : null) + '%</div>' + W.bar(s.lead ? s.lead.pct : null) +
      '<div class="opt">Odds: ' + esc(s.lead ? W.plainOutcome(s.ev, s.lead.label) : '') + ' · Polymarket</div>' +
      '<div class="touch">Could touch ' + Math.round(s.touch) + '% of your portfolio' + (s.high ? ' <span class="flag">High effect</span>' : '') + ' <span class="guess">Guess</span></div>' +
      '<div class="why">Why: ' + esc(s.why) + '</div></a>';
  };
})();
