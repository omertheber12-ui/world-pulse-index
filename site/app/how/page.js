import { loadPulse } from '../../lib/pulse.js';
import { Footer } from '../components/Footer.js';
import { HowSkeleton } from '../components/Skeletons.js';

export const metadata = { title: 'How it works · World Pulse Index' };

export default async function HowPage({ searchParams }) {
  const sp = await searchParams;
  const pulse = await loadPulse('live');
  if (sp.state === 'loading') return <HowSkeleton />;
  if (sp.state === 'empty') {
    return (
      <>
        <main><p className="empty">Nothing to show yet.</p></main>
        <Footer pulse={pulse} />
      </>
    );
  }
  if (sp.state === 'error') {
    return (
      <>
        <main><p className="note">This page could not be loaded.</p></main>
        <Footer pulse={pulse} />
      </>
    );
  }
  return (
    <>
      <main>
        <h1>How it works</h1>
        <div className="how">
          <p id="figures">Figures are prices on Polymarket, read as chances, not proven forecasts. They are shown as displayed, so the options of one event can add to a bit more or less than 100%.</p>
          <p id="touch">Touch adds, for each holding, its share of the portfolio times a link strength: strong 1, some 0.5, weak 0.25. The big percentage is that total.</p>
          <p id="attention">Lists are sorted by attention, which mixes touch with how uncertain the figure is, plus extra when a move is meaningful. That score is only used to sort and is not shown.</p>
          <p id="move">A move is meaningful when the figure changes by 5 points or more versus about 24 hours earlier, and the change lasts an hour. Smaller moves stay grey.</p>
          <p id="guess">Guess is our idea of how an event could reach a holding. It is not proven. Insights only, not advice.</p>
        </div>
      </main>
      <Footer pulse={pulse} />
    </>
  );
}
