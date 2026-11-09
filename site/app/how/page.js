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
          <p id="figures">Figures are prices on Polymarket, read as chances, not proven forecasts. They are shown as displayed, so the options of one event can add to a bit more or less than 100%. <span className="tag fact">Fact</span> means a public figure with its time.</p>
          <p id="touch">The big percentage is the weight of related holdings, not expected loss. For each holding we add its share of the portfolio times a link strength: full is 1, some is 0.5, weak is 0.25. <span className="tag assumption">Assumption</span> means that strength number. Holdings are grouped as a direct holding, through a fund, or an estimated link.</p>
          <p id="formula">Today shows the top three events. This ranking is a guess to tune, not a finding. Score = 0.5 × Move + 0.35 × Exposure + 0.15 × Quality. Each part is scaled from 0 to 100. Move is the size of the 24-hour change in points, up or down, capped at 20 points, so 20 points or more scores 100. Exposure weights a direct holding by 1.0, a holding through a fund by 0.7, and an estimated link by 0.3, then is capped at 50% of the portfolio, so 50% scores 100. Quality is 100, or 50 when the market is thin or the update is older than 1 hour. An event is left out when its 24-hour volume is under $10,000, it has not been updated in over 6 hours, its resolution date has already passed, or the linked share is 0%. Tie-breakers, in order: bigger move, bigger direct share, higher volume, sooner resolution date. Thin market means 24-hour volume under $50,000 or liquidity under $10,000.</p>
          <p id="move">A move is counted from the public 24-hour change. Ten points or more fills the change factor. Smaller moves still count, on a smaller scale.</p>
          <p id="guess"><span className="tag guess">Guess</span> means our idea of how an event could reach a holding, and the words after it say exactly what is guessed. It is not proven. Insights only, not advice.</p>
        </div>
      </main>
      <Footer pulse={pulse} />
    </>
  );
}
