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
      var spread = m.spread != null ? Number(m.spread) : (m.bestBid != null && m.bestAsk != null ? Number(m.bestAsk) - Number(m.bestBid) : null);
      var thin = (m.volume24hr != null && Number(m.volume24hr) < 10000) || (spread != null && spread > 0.03);
      if (oc.length === 2 && String(oc[0]).toLowerCase() === 'yes') {
        out.push({ label: m.groupItemTitle || m.question || 'Yes', pct: pr[0] * 100, move: odc, token: tk[0], market: m.id, volume: Number(m.volumeNum || 0), thin: thin });
      } else {
        oc.forEach(function (o, i) {
          out.push({ label: (m.groupItemTitle ? m.groupItemTitle + ': ' : '') + o, pct: pr[i] * 100, move: odc == null ? null : (i === 0 ? odc : -odc), token: tk[i], market: m.id, volume: Number(m.volumeNum || 0), thin: thin });
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
  var ICON = {
    today: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
    events: '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h9"/></svg>',
    portfolio: '<svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 0 8 8h-8z"/><path d="M14 2.5A8 8 0 0 1 21.5 10H14z"/></svg>'
  };
  W.shell = function (active) {
    var tabs = [['today', 'today.html', 'Today'], ['events', 'events.html', 'Events'], ['portfolio', 'portfolio.html', 'My portfolio']];
    document.getElementById('top').innerHTML = '<a class="brand" href="today.html">World Pulse Index</a><nav id="tabs">' + tabs.map(function (t) {
      return '<a class="tab' + (t[0] === active ? ' on' : '') + '" href="' + t[1] + '">' + ICON[t[0]] + '<span>' + t[2] + '</span></a>';
    }).join('') + '</nav>';
    document.getElementById('footer').innerHTML = '<a href="how.html">How it works</a> · Insights only, not advice. · Polymarket, public data. Holdings: reported eToro read, ' + esc(S.holdings.time) + ' Asia/Jerusalem. Every event-to-holding link is a Guess.';
    W.timeline();
  };
  W.figTime = function () { return W.live.gammaOk ? W.time(W.live.midAt && W.live.midAt > W.live.gammaAt ? W.live.midAt : W.live.gammaAt, true) : W.time(new Date(S.built_ms), false); };
  W.timeline = function () {
    var el = document.getElementById('timeline'); if (!el) return;
    el.className = 'timeline';
    var f = W.live.gammaOk ? 'Figures at ' + W.figTime() + ' Asia/Jerusalem · refreshes every minute'
      : (W.live.error ? '<span class="warn"></span>Figures at ' + W.figTime() + ' (built-in figures from ' + W.figTime() + ' · live read failed)' : 'Figures at ' + W.figTime() + ' (built-in) · reading live figures…');
    el.innerHTML = f + ' · Holdings at ' + esc(S.holdings.time) + ' · Insights only, not advice · <a href="how.html">How it works</a>';
  };
  W.src = function (ev) {
    return '<div class="caption src"><a href="' + esc(ev.polymarket_url) + '" target="_blank" rel="noopener">Polymarket</a>, public data · ' + (W.live.gammaOk ? 'as of ' + W.figTime() : 'built-in figures from ' + W.figTime()) + '</div>';
  };
  /* Live reads: Gamma every 60 s, order book midpoint every 20 s. Failures keep the built-in snapshot. */
  var render = function () {};
  function remember() { W.all().forEach(function (s) { if (s.lead) W.prevLead[s.ev.event_id] = s.lead.label; }); }
  function readGamma() {
    return Promise.all(S.events.map(function (ev) {
      var ac = window.AbortController ? new AbortController() : null; if (ac) setTimeout(function () { ac.abort(); }, 8000);
      return fetch('https://gamma-api.polymarket.com/events/' + ev.event_id, ac ? { signal: ac.signal } : {}).then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(function (j) {
        var ms = j.markets || [];
        if (ev.market_ids && ev.market_ids.length) {
          var keep = ev.markets.map(function (old) { return ms.filter(function (m) { return String(m.id) === String(old.id); })[0] || old; });
          ms = keep;
        }
        ev.markets = ms.map(function (m) { return { id: m.id, question: m.question, groupItemTitle: m.groupItemTitle, outcomes: m.outcomes, outcomePrices: m.outcomePrices, clobTokenIds: m.clobTokenIds, oneDayPriceChange: m.oneDayPriceChange, volumeNum: m.volumeNum, volume24hr: m.volume24hr, bestBid: m.bestBid, bestAsk: m.bestAsk, spread: m.spread, closed: m.closed }; });
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
  W.state = function () { return W.param('state'); };   // preview: loading | error | empty
  W.start = function (active, fn, opts) {
    opts = opts || {};
    render = function () { try { fn(); } catch (e) { console.error(e); } };
    remember();
    W.shell(active);
    var st = W.state();
    if (st === 'empty') S.events = [];
    if (st === 'error') { W.live.error = true; render(); W.timeline(); return; }
    if (st === 'loading') { W.loading = true; render(); return; }
    if (opts.waitLive) { W.loading = true; render(); W.loading = false; } else render();
    readGamma().then(function () { if (!W.live.gammaOk) { W.live.error = true; render(); W.timeline(); } });
    setInterval(readGamma, 60000);
    setInterval(readMids, 20000);
  };
  W.retry = function () { W.live.error = false; W.timeline(); readGamma().then(function () { if (!W.live.gammaOk) { W.live.error = true; render(); W.timeline(); } }); return false; };
  W.rerender = function () { render(); };
  W.param = function (k) { return new URLSearchParams(location.search).get(k); };
  W.moveText = function (m) {
    if (m == null) return '<div class="move">no 24 h change data</div>';
    var a = Math.abs(m), big = a >= 5;
    if (a < 0.05) return '<div class="move">→ flat in 24 h · no meaningful move</div>';
    var up = m > 0;
    return '<div class="move' + (big ? (up ? ' up' : ' down') : '') + '">' + (up ? '▲ up ' : '▼ down ') + a.toFixed(1) + ' pts in 24 h · ' + (big ? 'meaningful move' : 'no meaningful move') + '</div>';
  };
  /* one bar per option; tick at the figure about 24 h earlier; striped when trading is thin */
  W.bar = function (o, isLead, sm, caption) {
    if (o == null || typeof o !== 'object') o = { pct: o };
    var v = o.pct == null || isNaN(o.pct) ? 0 : Math.max(0, Math.min(100, o.pct));
    var prev = o.move != null ? Math.max(0, Math.min(100, o.pct - o.move)) : null;
    return '<div class="barwrap"><span class="bar' + (sm ? ' sm' : '') + (isLead ? ' lead' : '') + (o.thin ? ' thin' : '') + '" role="img" aria-label="' + W.pct1(o.pct) + '%"><i style="width:' + v.toFixed(1) + '%"></i>' + (prev != null ? '<b style="left:' + prev.toFixed(1) + '%" title="24 h ago ' + W.pct1(prev) + '%"></b>' : '') + '</span>' + (sm ? '' : '<span class="bar-val">' + W.pct1(o.pct) + '%</span>') + '</div>' +
      (caption && prev != null ? '<div class="tick-cap">24 h ago ' + W.pct1(prev) + '%</div>' : '') +
      (caption && o.thin ? '<div class="thin-cap">Thin trading, read as rough</div>' : '');
  };
  W.card = function (s) {
    var l = s.lead;
    return '<div class="card link" data-id="' + s.ev.event_id + '" tabindex="0" role="link" onclick="if(!event.target.closest(\'a\'))location.href=\'event.html?id=' + s.ev.event_id + '\'" onkeydown="if(event.key===\'Enter\')location.href=\'event.html?id=' + s.ev.event_id + '\'">' +
      '<div class="labels"><span class="chip">' + esc(S.group_short[s.ev.group]) + '</span>' + (s.high ? '<span class="flag">High</span>' : '') + (s.meaningful ? '<span class="chip moved">Moved</span>' : '') + '</div>' +
      '<div class="ctitle"><a class="plainlink" href="event.html?id=' + s.ev.event_id + '">' + esc(W.name(s.ev)) + '</a></div>' +
      '<div class="opt">' + esc(l ? W.plainOutcome(s.ev, l.label) : '') + '</div>' +
      '<div class="big">' + W.pct(l ? l.pct : null) + '%</div>' + W.bar(l, true, false, true) + W.moveText(s.move) +
      '<div class="divider"></div><div class="pair"><div><div class="caption">Touch <span class="guess">Guess</span></div><div class="nm">' + Math.round(s.touch) + '%</div></div>' +
      '<div><div class="caption">Attention <span class="guess">Guess</span></div><div class="nm">' + Math.round(s.attention) + '%</div></div></div>' +
      '<div class="caption" style="margin-top:8px">Why on Today: ' + esc(s.why) + '</div>' + W.src(s.ev) + '</div>';
  };
  W.skeletonCard = function () { return '<div class="card"><div class="sk" style="width:60%;height:18px"></div><div class="sk" style="width:96px;height:40px"></div><div class="sk" style="width:100%;height:8px"></div></div>'; };
  W.emptyState = function () { return '<div class="card state"><div class="icon"></div><div class="ctitle" style="-webkit-line-clamp:unset">No events to show right now</div><p class="sub">We could not find open events in these groups. Figures come back when Polymarket lists them.</p><a class="btn secondary" href="how.html">How it works</a></div>'; };
  W.errorCard = function () { return '<div class="error" role="alert"><div class="t">We could not read live figures</div><div class="b">Showing built-in figures from ' + W.time(new Date(S.built_ms), false) + ' Asia/Jerusalem.</div><a href="#" onclick="return WPI.retry()">Try again</a></div>'; };
})();
