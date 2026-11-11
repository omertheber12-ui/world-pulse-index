import Link from 'next/link';
import { COPY } from '../../lib/correlations.js';
import { chartModel } from '../../lib/chartSeries.js';
import { SeriesChart } from './SeriesChart.js';

function Tag({ label, tier }) {
  return <span className={'tag yf-tag yf-' + tier}>{label}</span>;
}

function ChartSlot({ large }) {
  return (
    <div className={large ? 'chart-slot chart-slot-large' : 'chart-slot'}>
      <svg viewBox="0 0 640 220" role="img" aria-label="Chart coming">
        <title>Chart coming</title>
        <line className="axis" x1="36" y1="16" x2="36" y2="184" />
        <line className="axis" x1="36" y1="184" x2="604" y2="184" />
        <line className="axis" x1="604" y1="16" x2="604" y2="184" />
        <text x="320" y="108" textAnchor="middle">Chart coming</text>
      </svg>
    </div>
  );
}

function LinkRow({ row }) {
  return (
    <details className="yf-row" data-all-link="1" data-tier={row.tier} data-group={row.timingGroup}>
      <summary>
        <span className="yf-name">{row.headline}</span>
        <Tag label={row.tierLabel} tier={row.tier} />
        <span className="yf-spark" aria-hidden="true" />
      </summary>
      <div className="yf-detail">
        <p className="num">{row.strength}</p>
        <p>{row.episodes} separate episodes</p>
        <p>{row.lagLabel}. {row.direction}.</p>
      </div>
    </details>
  );
}

function AllGroup({ title, group }) {
  const rows = group && group.rows ? group.rows : [];
  if (!rows.length) return null;
  return (
    <section className="yf-group">
      <h2>{title}</h2>
      <div className="yf-list">
        {rows.map((row, index) => <LinkRow key={row.timingGroup + '-' + index} row={row} />)}
      </div>
    </section>
  );
}

function PickLine({ card }) {
  return (
    <details className="pick-line" data-pick-line="1">
      <summary>
        <span className="pick-name">{card.headline}</span>
        <SeriesChart model={chartModel(card)} spark />
        <Tag label={card.tierLabel} tier={card.tier} />
      </summary>
      <SeriesChart model={chartModel(card)} />
      <div className="yf-detail">
        <p className="num">{card.strength}</p>
        <p>{card.episodes}</p>
        <p>{card.chance}</p>
        <p>{card.pick}</p>
        {card.strictPick ? <p>{card.strictPick}</p> : null}
        {card.runner ? <p>{card.runner}</p> : null}
      </div>
    </details>
  );
}

function HowToRead({ state }) {
  const links = state.allLinks;
  if (!links) return null;
  return (
    <details className="how-read">
      <summary>How to read this</summary>
      <p>{state.summary}</p>
      <p>{links.note}</p>
      <ul className="corr-legend">
        {(links.legend || []).map((line) => <li key={line}>{line}</li>)}
      </ul>
      <p>{links.strictNote}</p>
      {state.researchNotice ? <p>{state.researchNotice}</p> : null}
      <p>Description only, not proven. The number on each card is a rank correlation.</p>
      <p>Extra check, not a verdict: other checks use the same measure and do not change the label.</p>
      <p>Prices come from Yahoo Finance, FRED and the Bank of Israel. Odds come from Polymarket public trades, with trades before 12 Nov 2023 from the Envio export (CC BY 4.0).</p>
      {state.footer ? <p>{state.footer}</p> : null}
    </details>
  );
}

export function StrongestLinksScreen({ state }) {
  const links = state.allLinks;
  return (
    <>
      <main data-page="strongest-links" data-mode={state.mode}>
        <aside className="preview-banner" role="note">{state.previewBanner}</aside>
        <p className="quiet-note">Internal, not proven.</p>
        {state.exampleNotice ? <p className="example-notice" role="status">{state.exampleNotice}</p> : null}
        {state.mode === 'empty' ? <h1>{state.title}</h1> : null}
        {state.mode === 'empty' ? <p className="empty">{state.empty}</p> : null}
        {state.mode === 'ready' && state.mainChart ? (
          <>
            <header className="hero">
              <h1>{state.mainChart.headline}</h1>
              <Tag label={state.mainChart.tierLabel} tier={state.mainChart.tier} />
            </header>
            <div className="hero-chart" data-main-chart="1">
              <SeriesChart model={chartModel(state.mainChart)} />
            </div>
            <details className="chart-details">
              <summary>Details</summary>
              <p className="num">{state.mainChart.strength}</p>
              <p>{state.mainChart.episodes}</p>
              <p>{state.mainChart.chance}</p>
              <p>{state.mainChart.pick}</p>
              {state.mainChart.strictPick ? <p>{state.mainChart.strictPick}</p> : null}
              {state.mainChart.runner ? <p>{state.mainChart.runner}</p> : null}
            </details>
            <section className="pick-list">
              {(state.otherPicks || []).map((card, index) => (
                <PickLine key={card.section + '-' + index} card={card} />
              ))}
            </section>
            <HowToRead state={state} />
            {links ? (
              <details className="see-every">
                <summary>{COPY.seeEvery}</summary>
                <section data-all-links="1" className="all-links">
                  <h2 className="all-title">{links.title}</h2>
                  <AllGroup title={links.sameDayTitle} group={links.sameDay} />
                  <AllGroup title={links.leadTitle} group={links.lead} />
                </section>
              </details>
            ) : null}
          </>
        ) : null}
      </main>
      <footer>
        <p>{COPY.insights} · <Link href="/how">How it works</Link></p>
      </footer>
    </>
  );
}
