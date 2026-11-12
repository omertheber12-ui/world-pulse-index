import Link from 'next/link';
import { learnCardSet } from '../../../lib/screenCopy.js';
import { LearnOneThing } from './LearnOneThing.js';
import { LinkChart } from './LinkChart.js';
import { ConnFooter } from './TopBar.js';

export function LinkDetailView({ state }) {
  if (!state || state.mode === 'empty') {
    return (
      <>
        <main className="cx-wrap" data-page="connections" data-mode="empty">
          <h1>Connections</h1>
          <p className="cx-stand">{state && state.standing}</p>
          <p className="cx-empty">{state && state.empty}</p>
        </main>
        <ConnFooter />
      </>
    );
  }
  if (state.mode !== 'ready' || !state.row) {
    return (
      <>
        <main className="cx-wrap" data-page="connections" data-mode="missing">
          <Link className="cx-back" href="/connections">‹ Connections</Link>
          <h1>{state.message}</h1>
          <p className="cx-stand">{state.standing}</p>
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
      <main className="cx-wrap" data-page="connections" data-mode="detail" data-link-detail="1">
        <Link className="cx-back" href="/connections">‹ Connections</Link>
        <div className="cx-tags">
          <span className={'cx-tag t-' + tag}>{row.tierLabel}</span>
          <span className="cx-tag t-plain">{row.timingLabel}</span>
        </div>
        <h1>{detail.pageHeadline}</h1>
        <p className="cx-meta">{detail.meta}</p>
        <section className="cx-card cx-chartcard" data-main-chart="1">
          <LinkChart chart={chart} variant="detail" />
          <p className="cx-note">{detail.note}</p>
        </section>
        <LearnOneThing cards={learnCardSet({
          scoreText: detail.strength.valueText,
          bandText: detail.strength.bandText,
          episodes: detail.facts[0] && detail.facts[0].value,
          tradingDays: detail.facts[1] && detail.facts[1].value,
          outside: detail.strength.outside,
        })} />
        <section className="cx-sec">
          <h2>How strong is this?</h2>
          <div className="cx-card cx-pad">
            <StrengthScale strength={detail.strength} />
            <p className="cx-plain">{detail.strength.band}</p>
            {detail.strength.way ? <p className="cx-sub2">{detail.strength.way}</p> : null}
          </div>
          <div className="cx-facts">
            {detail.facts.map((fact) => (
              <div className="cx-fact" key={fact.label}>
                <div className="cx-fig">{fact.value}</div>
                <div className="cx-fl">{fact.label}</div>
              </div>
            ))}
          </div>
          <div className="cx-card cx-pad cx-checks">
            {detail.checks.map((line) => <p key={line}>{line}</p>)}
          </div>
          <details className="cx-card cx-list">
            <summary className="cx-grow">
              <span className="cx-ltext">
                <span className="cx-gtitle">How to read this</span>
                <span className="cx-lmeta">What the lines, the band and the checks mean.</span>
              </span>
              <span className="cx-chev" aria-hidden="true">›</span>
            </summary>
            <div className="cx-read">
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
          <p className="cx-fn">{detail.sources}</p>
          <p className="cx-fn">{state.standing}</p>
        </section>
      </main>
      <ConnFooter />
    </>
  );
}

function StrengthScale({ strength }) {
  const value = Number(strength.raw);
  const band = Number(strength.bandAbs);
  const place = (number) => ((Math.max(-1, Math.min(1, number)) + 1) / 2) * 100;
  const dot = Number.isFinite(value) ? place(value) : 50;
  const left = Number.isFinite(band) ? place(-Math.abs(band)) : 40;
  const right = Number.isFinite(band) ? place(Math.abs(band)) : 60;
  const ends = strength.size
    ? ['−1 bigger with smaller', 'bigger with bigger +1']
    : ['−1 opposite ways', 'same way +1'];
  return (
    <div className="cx-scale" role="img" aria-label={'Strength scale from minus 1 to plus 1. This link ' + strength.valueText + '. Chance alone plus or minus ' + strength.bandText + '.'}>
      <div className="cx-scale-labels">
        <span className="cx-scale-link" style={{ left: dot + '%' }}>{'This link ' + strength.valueText}</span>
        <span className="cx-scale-chance" style={{ left: ((left + right) / 2) + '%' }}>{'Chance alone ±' + strength.bandText}</span>
      </div>
      <div className="cx-scale-track">
        <div className="cx-scale-line" />
        <div className="cx-scale-band" style={{ left: left + '%', width: Math.max(right - left, 0) + '%' }} />
        <div className="cx-scale-dot" style={{ left: dot + '%' }} />
      </div>
      <div className="cx-scale-ends">
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
      </div>
    </div>
  );
}
