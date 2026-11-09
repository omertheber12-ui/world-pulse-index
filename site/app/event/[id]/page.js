import { loadPulse, loadHistory, chartPath } from '../../../lib/pulse.js';
import { eventName, fig, isClosed, mostly, optionLine } from '../../../lib/copy.js';
import { scoreEvent } from '../../../lib/score.js';
import { Footer, FigureNote, Guess } from '../../components/Footer.js';
import { Move } from '../../components/EventRow.js';
import { BackLink } from '../../components/Chrome.js';
import { EventSkeleton } from '../../components/Skeletons.js';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: 'Event ' + id + ' · World Pulse Index' };
}

export default async function EventPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  if (sp.state === 'loading') return <EventSkeleton />;
  const pulse = await loadPulse(sp.state === 'error' ? 'error' : 'live');
  const base = pulse.events.find((s) => s.ev.event_id === String(id));
  const raw = base ? base.ev : null;
  if (!raw) {
    return (
      <>
        <main>
          <BackLink />
          <p className="empty">We could not find this event.</p>
        </main>
        <Footer pulse={pulse} />
      </>
    );
  }
  const s = scoreEvent(raw, { holdings: pulse.holdings, rules: pulse.rules }, true);
  if (!s.lead) {
    return (
      <>
        <main>
          <BackLink />
          <h1>{eventName(raw)}</h1>
          <p className="empty">We could not find this event.</p>
        </main>
        <Footer pulse={pulse} />
      </>
    );
  }
  const lead = s.lead;
  const rest = s.opts.filter((_, i) => s.opts.length === 1 || i > 0);
  const parts = s.parts.filter((p) => p.strength > 0).sort((a, b) => b.contrib - a.contrib);
  const line = mostly(s.parts);
  const second = s.opts[1];
  const other = second ? optionLine(s.ev, second.label, pulse.rules, false) : 'The other result';
  const round = Math.round(s.touch);
  const bit = line ? ', ' + line.charAt(0).toLowerCase() + line.slice(1) : '';
  const hist = await loadHistory(lead.token);
  const d = hist ? chartPath(hist) : null;
  const holdNames = { INTC: 'Intel', BTC: 'Bitcoin', SPY: 'SPY', JPM: 'JPMorgan', BAC: 'Bank of America', ETH: 'Ethereum' };
  return (
    <>
      <main>
        <FigureNote pulse={pulse} />
        <BackLink />
        <h1>{eventName(s.ev)}</h1>
        {isClosed(s.ev) ? <p className="closed">Closed</p> : null}
        <p className="bignum">{fig(lead.pct)}%</p>
        <p className="subline">
          {optionLine(s.ev, lead.label, pulse.rules, false)}
          {lead.move == null ? null : <> · <Move move={s.move} meaningful={s.meaningful} today /></>}
        </p>
        {d ? (
          <div className="chart" role="img" aria-label="24 hour chart">
            <svg className="spark" viewBox="0 0 640 140" preserveAspectRatio="none">
              <path d={d} fill="none" stroke="#116C5B" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="chart-caps"><span>24 h ago</span><span>now</span></div>
          </div>
        ) : null}
        {rest.map((o) => {
          const v = Math.max(0, Math.min(100, o.pct || 0));
          return (
            <div className="optrow" key={o.market + o.label}>
              <div className="optop">
                <span className="oname">{optionLine(s.ev, o.label, pulse.rules, false)}</span>
                <span className="opct">{fig(o.pct)}%</span>
              </div>
              <div className={s.opts.length === 1 ? 'obar lead' : 'obar'}><i style={{ width: v.toFixed(1) + '%' }} /></div>
            </div>
          );
        })}
        <div className="linkrow touchblock">Could touch {round}% of your portfolio <Guess /></div>
        {line ? <p className="mostly">{line}</p> : null}
        <details className="hold">
          <summary>Show holdings ›</summary>
          <ul>
            {parts.map((p) => (
              <li key={p.ticker}><span>{holdNames[p.ticker] || p.name}</span><span className="contrib">{p.contrib.toFixed(1)}</span></li>
            ))}
          </ul>
        </details>
        <div className="linkrow lines">
          <Guess />
          <p>If it happens: could touch about {round}%{bit}.</p>
          <p>If not: {other} would be the surprise against {fig(lead.pct)}%.</p>
        </div>
      </main>
      <Footer
        pulse={pulse}
        extra={<> · <a href={s.ev.polymarket_url} target="_blank" rel="noopener">Open on Polymarket ›</a></>}
      />
    </>
  );
}
