import Link from 'next/link';
import { LinkChart } from './LinkChart.js';
import { ConnFooter } from './TopBar.js';

export function LinkDetailView({ state }) {
  if (!state || state.mode === 'empty') {
    return (
      <>
        <main className="conn-wrap" data-page="connections" data-mode="empty">
          <p className="conn-banner">{state && state.banner}</p>
          <h1>Connections</h1>
          <p className="conn-stand">{state && state.standing}</p>
          <p className="conn-empty">{state && state.empty}</p>
        </main>
        <ConnFooter />
      </>
    );
  }
  if (state.mode !== 'ready' || !state.row) {
    return (
      <>
        <main className="conn-wrap" data-page="connections" data-mode="missing">
          <p className="conn-banner">{state.banner}</p>
          <Link className="conn-back" href="/connections">‹ Connections</Link>
          <h1>{state.message}</h1>
          <p className="conn-stand">{state.standing}</p>
        </main>
        <ConnFooter />
      </>
    );
  }
  const row = state.row;
  const detail = row.detail;
  const chart = row.chart;
  const tag = row.tier === 'strict' ? 'strong' : row.tier === 'stronger' ? 'medium' : 'weak';
  return (
    <>
      <main className="conn-wrap" data-page="connections" data-mode="detail" data-link-detail="1">
        <p className="conn-banner">{state.banner}</p>
        <Link className="conn-back" href="/connections">‹ Connections</Link>
        <div className="conn-tags">
          <span className={'conn-tag t-' + tag}>{row.tierLabel}</span>
          <span className="conn-tag t-plain">{row.timingLabel}</span>
        </div>
        <h1>{detail.pageHeadline}</h1>
        <p className="conn-meta">{detail.meta}</p>
        <section className="conn-card conn-chartcard" data-main-chart="1">
          <LinkChart chart={chart} variant="detail" />
          <p className="conn-note">{detail.note}</p>
        </section>
        <section className="conn-sec">
          <h2>How strong is this?</h2>
          <div className="conn-card conn-pad">
            <StrengthScale strength={detail.strength} />
            <p className="conn-plain">{detail.strength.band}</p>
            {detail.strength.way ? <p className="conn-sub2">{detail.strength.way}</p> : null}
          </div>
          <div className="conn-facts">
            {detail.facts.map((fact) => (
              <div className="conn-fact" key={fact.label}>
                <div className="conn-fig">{fact.value}</div>
                <div className="conn-fl">{fact.label}</div>
              </div>
            ))}
          </div>
          <div className="conn-card conn-pad conn-checks">
            {detail.checks.map((line) => <p key={line}>{line}</p>)}
          </div>
          <details className="conn-card conn-list">
            <summary className="conn-grow">
              <span className="conn-ltext">
                <span className="conn-gtitle">How to read this</span>
                <span className="conn-lmeta">What the lines, the band and the checks mean.</span>
              </span>
              <span className="conn-chev">›</span>
            </summary>
            <div className="conn-read">
              <p>{detail.note}</p>
              <table>
                <caption>Chart values</caption>
                <tbody>
                  <tr><th>Window start</th><td>{chart && chart.windowStart}</td></tr>
                  <tr><th>Window end</th><td>{chart && chart.windowEnd}</td></tr>
                  <tr><th>{chart && chart.oddsName}</th><td>{chart && chart.oddsEnd}</td></tr>
                  <tr><th>{chart && chart.assetName}</th><td>{chart && chart.assetEnd}</td></tr>
                </tbody>
              </table>
            </div>
          </details>
          <p className="conn-fn">{detail.sources}</p>
          <p className="conn-fn">{state.standing}</p>
        </section>
      </main>
      <ConnFooter />
    </>
  );
}

function StrengthScale({ strength }) {
  const value = Number(strength.value);
  const band = Number(strength.bandAbs);
  const x = (number) => ((number + 1) / 2) * 100;
  const left = Number.isFinite(band) ? x(-band) : 50;
  const width = Number.isFinite(band) ? x(band) - x(-band) : 0;
  const dot = Number.isFinite(value) ? x(Math.max(-1, Math.min(1, value))) : 50;
  return (
    <svg className="conn-scale" viewBox="0 0 100 24" role="img" aria-label={'Strength scale from minus 1 to plus 1. Chance alone reaches about plus or minus ' + strength.bandAbs + '. This link is ' + strength.value + '.'}>
      <line x1="0" y1="14" x2="100" y2="14" />
      <rect x={left} y="8" width={Math.max(width, 0)} height="12" rx="1" />
      <circle cx={dot} cy="14" r="1.6" />
      <text x="0" y="6">−1 opposite ways</text>
      <text x="50" y="6" textAnchor="middle">0</text>
      <text x="100" y="6" textAnchor="end">same way +1</text>
    </svg>
  );
}
