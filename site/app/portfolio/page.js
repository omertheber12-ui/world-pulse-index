import { loadPulse } from '../../lib/pulse.js';
import { eventName, fig, forHolding, guessWords, holdName, usd, weightText } from '../../lib/copy.js';
import { Footer, FigureNote } from '../components/Footer.js';
import { Holdings } from '../components/Chrome.js';
import { PortfolioSkeleton } from '../components/Skeletons.js';

export const revalidate = 60;
export const metadata = { title: 'Portfolio · World Pulse Index' };

export default async function PortfolioPage({ searchParams }) {
  const sp = await searchParams;
  if (sp.state === 'loading') return <PortfolioSkeleton />;
  const pulse = await loadPulse(sp.state === 'error' ? 'error' : 'live');
  if (sp.state === 'empty' || !pulse.holdings.rows.length) {
    return (
      <>
        <main><p className="empty">No holdings to show yet.</p></main>
        <Footer pulse={pulse} />
      </>
    );
  }
  const rows = pulse.holdings.rows.slice().sort((a, b) => b.value - a.value).map((r) => ({
    ticker: r.ticker,
    name: holdName(r.ticker, r.name),
    valueText: usd(r.value),
    weightText: weightText(r.weight),
    bar: Math.max(0, Math.min(100, r.weight)).toFixed(2),
    events: forHolding(r.ticker, pulse.events).map((x) => ({
      id: x.s.ev.event_id,
      name: eventName(x.s.ev),
      fig: fig(x.s.lead && x.s.lead.pct),
      guess: guessWords(r.ticker, x.s.ev),
    })),
  }));
  const note = sp.state === 'error'
    ? <p className="note">Showing reported holdings from {pulse.holdings.time}.</p>
    : <FigureNote pulse={pulse} />;
  return (
    <>
      <main>
        {note}
        <h1 className="bignum">{usd(pulse.holdings.total)}</h1>
        <p className="cap">Sample portfolio, not your live account. Saved read at {pulse.holdings.time} Asia/Jerusalem.</p>
        <Holdings rows={rows} />
      </main>
      <Footer pulse={pulse} />
    </>
  );
}
