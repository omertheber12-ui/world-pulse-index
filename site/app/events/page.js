import Link from 'next/link';
import { loadPulse } from '../../lib/pulse.js';
import { CHIPS, chipLabel } from '../../lib/copy.js';
import { Footer, FigureNote } from '../components/Footer.js';
import { EventRow } from '../components/EventRow.js';
import { EventsSkeleton } from '../components/Skeletons.js';

export const revalidate = 60;
export const metadata = { title: 'Events · World Pulse Index' };

export default async function EventsPage({ searchParams }) {
  const sp = await searchParams;
  if (sp.state === 'loading') return <EventsSkeleton />;
  const g = CHIPS.some((c) => c[0] === sp.g) ? sp.g : 'all';
  const pulse = await loadPulse(sp.state === 'error' ? 'error' : 'live');
  const rows = sp.state === 'empty' ? [] : pulse.events.filter((s) => g === 'all' || s.ev.group === g);
  const label = chipLabel(g);
  return (
    <>
      <main>
        {sp.state === 'empty' ? null : <FigureNote pulse={pulse} />}
        <h1>Events</h1>
        <div className="chiprow">
          <div className="chips">
            {CHIPS.map(([key, name]) => (
              <Link key={key} className={key === g ? 'on' : ''} href={key === 'all' ? '/events' : '/events?g=' + key}>{name}</Link>
            ))}
          </div>
        </div>
        {rows.length ? (
          <div className="list">
            {rows.map((s) => <EventRow key={s.ev.event_id} s={s} rules={pulse.rules} thin />)}
          </div>
        ) : (
          <p className="empty">{g === 'all' ? 'No events to show right now.' : 'No open events in ' + label + ' right now.'}</p>
        )}
      </main>
      <Footer pulse={pulse} />
    </>
  );
}
