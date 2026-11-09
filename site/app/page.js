import { loadPulse, loadHistory, chartPath } from '../lib/pulse.js';
import { homeEligible } from '../lib/score.js';
import { Footer, FigureNote } from './components/Footer.js';
import { StoryCard } from './components/StoryCard.js';
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
  const home = ranked.filter((s) => homeEligible(s));
  const top = home.slice(0, 3);
  if (!top.length) {
    return (
      <>
        <main>
          <FigureNote pulse={pulse} />
          <h1>Today's top 3 changes for your portfolio</h1>
          <p className="empty">No events pass the ranking cutoff right now.</p>
        </main>
        <Footer pulse={pulse} />
      </>
    );
  }
  const charts = await Promise.all(top.map(async (s) => chartPath(await loadHistory(s.lead && s.lead.token, 7), 7)));
  const ranking = home.map((s) => s.ev.event_id + ':' + s.score.toFixed(4)).join(',');
  const today = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  return (
    <>
      <main>
        <FigureNote pulse={pulse} />
        <p className="pagetitle">Today's top 3 changes for your portfolio</p>
        <p className="cap">{today} · Sample portfolio. Not your live account. <span className="tag guess">Guess</span> ranking weights are a starting point to tune.</p>
        <div className="list" id="top3" data-ranking={ranking}>
          {top.map((s, i) => (
            <StoryCard key={s.ev.event_id} s={s} pulse={pulse} chart={charts[i]} heading={i === 0 ? 'h1' : 'h2'} />
          ))}
        </div>
        <p className="more"><Link href="/events">All events ›</Link></p>
      </main>
      <Footer pulse={pulse} />
    </>
  );
}
