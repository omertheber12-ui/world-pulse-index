import {
  clock, holdName, moneyCompact, shortDate, splitText, storyOf, thinMarketNote, weightText, whyMatters,
} from '../../lib/copy.js';

const KIND = { direct: 'Direct', fund: 'Through a fund', estimated: 'Estimated link' };

function Chart({ path }) {
  if (!path) return null;
  return (
    <div className="chart mini" role="img" aria-label="7 day chance chart">
      <svg viewBox="0 0 640 80" preserveAspectRatio="none">
        <path d={path.d} fill="none" stroke="#116C5B" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="chart-caps"><span>{path.start}</span><span>{path.end}</span></div>
    </div>
  );
}

function Table({ s }) {
  const rows = (s.exposure && s.exposure.rows) || [];
  return (
    <table className="break">
      <tr><th>Asset</th><th>Weight</th><th>Link type</th><th>Why it links</th></tr>
      {rows.map((r) => (
        <tr key={r.kind + r.ticker}>
          <td>{holdName(r.ticker, r.name)}</td>
          <td className="num">{weightText(r.weight)}%{r.kind === 'fund' ? ' (' + weightText(r.fundWeight) + '% of portfolio × ' + Math.round(r.inner * 100) + '% in the fund)' : ''}</td>
          <td>{KIND[r.kind]}</td>
          <td>{r.reason}{r.kind === 'estimated' ? '' : ''}</td>
        </tr>
      ))}
      <tr>
        <td>Total</td>
        <td className="num">{Math.round(s.exposure.total * 10) / 10}%</td>
        <td colSpan="2">{splitText(s.exposure)}. Share of your portfolio linked to this event. This is not an expected loss.</td>
      </tr>
    </table>
  );
}

export function StoryCard({ s, pulse, chart, heading = 'h2', open = false, meta = false }) {
  const story = storyOf(s);
  const Heading = heading;
  const when = pulse.liveOk && pulse.gammaAt ? clock(pulse.gammaAt) : clock(pulse.builtMs);
  const vol = s.lead && s.lead.volume24hr;
  const liq = (s.lead && s.lead.liquidity != null) ? s.lead.liquidity : s.ev.liquidity;
  const thinNote = thinMarketNote(vol, liq);
  const updated = Date.parse((s.lead && s.lead.updatedAt) || s.ev.updatedAt || '');
  const stale = !Number.isNaN(updated) && (Date.now() - updated) > 60 * 60 * 1000;
  const pct = Math.round(s.exposure.total * 10) / 10;
  return (
    <article className="story" data-id={s.ev.event_id}>
      <a className="storyhit" href={'/event/' + s.ev.event_id}>
        <Heading>{story.headline}</Heading>
        <p className="change">{story.line}</p>
      </a>
      {meta ? (
        <p className="headmeta">
          <a href={s.ev.polymarket_url} target="_blank" rel="noopener">Polymarket</a>
          {' · updated '}{when}
          {thinNote ? ' · ' + thinNote : ''}
        </p>
      ) : null}
      <details className="exposure" open={open || undefined}>
        <summary>
          <span className="expo">Your exposure: {pct}% of portfolio</span>
          <span className="split">{splitText(s.exposure)}</span>
          <span className="explabel">Share of your portfolio linked to this event. This is not an expected loss.</span>
          <span className="sr-only">Show holdings</span>
        </summary>
        <Table s={s} />
      </details>
      <p className="whyline">Why this matters to you: {whyMatters(s.exposure)}</p>
      <Chart path={chart} />
      <p className="source">
        <a href={s.ev.polymarket_url} target="_blank" rel="noopener">Polymarket</a>
        {' · updated '}{when}
        {story.endText ? ' · resolves ' + shortDate(s.lead.endDate || s.ev.endDate) : ' · resolution date not listed'}
        {vol != null ? ' · volume ' + moneyCompact(vol) : ''}
        {liq != null ? ' · liquidity ' + moneyCompact(liq) : ''}
      </p>
      {thinNote && !meta ? <p className="thinflag">{thinNote}</p> : null}
      {stale ? <p className="thinflag">Not updated recently</p> : null}
    </article>
  );
}
