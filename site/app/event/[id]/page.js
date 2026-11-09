import { loadPulse, loadHistory, chartPath } from '../../../lib/pulse.js';
import { fig, isClosed, optionLine } from '../../../lib/copy.js';
import { scoreEvent } from '../../../lib/score.js';
import { Footer, FigureNote } from '../../components/Footer.js';
import { BackLink } from '../../components/Chrome.js';
import { StoryCard } from '../../components/StoryCard.js';
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
  const raw = (pulse.raw || []).find((e) => e.event_id === String(id));
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
          <p className="empty">We could not find this event.</p>
        </main>
        <Footer pulse={pulse} />
      </>
    );
  }
  const hist = await loadHistory(s.lead.token, 7);
  const chart = hist ? chartPath(hist, 7) : null;
  const monthHist = await loadHistory(s.lead.token, 30);
  const month = monthHist ? chartPath(monthHist, 30) : null;
  const rest = s.opts.filter((_, i) => s.opts.length === 1 || i > 0);
  return (
    <>
      <main>
        <FigureNote pulse={pulse} />
        <BackLink />
        {isClosed(s.ev) ? <p className="closed">Closed</p> : null}
        <StoryCard s={s} pulse={pulse} chart={chart} heading="h1" open meta />
        {month ? <div className="chart" role="img" aria-label="30 day chance chart"><svg viewBox="0 0 640 80" preserveAspectRatio="none"><path d={month.d} fill="none" stroke="#116C5B" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg><div className="chart-caps"><span>{month.start}</span><span>{month.end}</span></div></div> : null}
        {s.lead.question ? <p className="cap">Contract rules, in the market's own words: {s.lead.question}</p> : null}
        <p className="cap"><a href="/how#formula">How the ranking works</a></p>
        <h2>Other chances</h2>
        {rest.map((o) => {
          const v = Math.max(0, Math.min(100, o.pct || 0));
          return (
            <div className="optrow" key={String(o.market) + o.label}>
              <div className="optop">
                <span className="oname">{optionLine(s.ev, o.label, pulse.rules, false)}</span>
                <span className="opct">{fig(o.pct)}%</span>
              </div>
              <div className={s.opts.length === 1 ? 'obar lead' : 'obar'}><i style={{ width: v.toFixed(1) + '%' }} /></div>
            </div>
          );
        })}
      </main>
      <Footer pulse={pulse} />
    </>
  );
}
