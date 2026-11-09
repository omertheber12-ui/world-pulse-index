import { loadPulse } from '../lib/pulse.js';
import { headline } from '../lib/copy.js';
import { Footer, FigureNote, Guess } from './components/Footer.js';
import { EventRow } from './components/EventRow.js';
import { TodaySkeleton } from './components/Skeletons.js';
import Link from 'next/link';

export const revalidate = 60;
export const metadata = { title: 'Today · World Pulse Index' };

export default async function TodayPage({ searchParams }) {
  const sp = await searchParams;
  if (sp.state === 'loading') return <TodaySkeleton />;
  if (sp.state === 'empty') {
    return (
      <>
        <main><p className="empty">No events to show right now.</p></main>
        <Footer pulse={{ liveOk: true, gammaAt: Date.now(), builtMs: Date.now() }} />
      </>
    );
  }
  const pulse = await loadPulse(sp.state === 'error' ? 'error' : 'live');
  const ranked = pulse.events;
  if (!ranked.length) {
    return (
      <>
        <main>
          <FigureNote pulse={pulse} />
          <p className="empty">No events to show right now.</p>
        </main>
        <Footer pulse={pulse} />
      </>
    );
  }
  const h = headline(ranked, pulse.rules);
  const t = h.top;
  const line = t.ev.group === 'central_bank_rates'
    ? 'of your portfolio could be touched by this decision'
    : 'of your portfolio could be touched by this event';
  const ranking = ranked.map((s) => s.ev.event_id + ':' + s.attention.toFixed(4)).join(',');
  return (
    <>
      <main>
        <FigureNote pulse={pulse} />
        <h1>{h.text}</h1>
        <p className="bignum">{Math.round(t.touch)}%</p>
        <p className="touchline">{line} <Guess /></p>
        <p className="insight">{h.insight}</p>
        <h2>Top events</h2>
        <div className="list" id="top5" data-ranking={ranking}>
          {ranked.slice(0, 5).map((s) => <EventRow key={s.ev.event_id} s={s} rules={pulse.rules} id />)}
        </div>
        <p className="more"><Link href="/events">All events ›</Link></p>
      </main>
      <Footer pulse={pulse} />
    </>
  );
}
