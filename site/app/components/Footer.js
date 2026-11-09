import Link from 'next/link';
import { clock } from '../../lib/copy.js';

export function Footer({ pulse, extra = null }) {
  const t = pulse.liveOk && pulse.gammaAt ? clock(pulse.gammaAt) : clock(pulse.builtMs);
  return (
    <footer>
      Polymarket, public data · {t} Asia/Jerusalem · Insights only, not advice. · <Link href="/how">How it works</Link>
      {extra}
    </footer>
  );
}

export function FigureNote({ pulse }) {
  if (!pulse || pulse.liveOk) return null;
  return <p className="note">Showing figures from {clock(pulse.builtMs)}. Live read failed.</p>;
}

export function Guess() {
  return <span className="guess">Guess</span>;
}
