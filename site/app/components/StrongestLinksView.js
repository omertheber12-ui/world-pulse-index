import Link from 'next/link';
import { COPY } from '../../lib/correlations.js';

function Tag({ label, tier }) {
  return <span className={'tag yf-tag yf-' + tier}>{label}</span>;
}

function ChartSlot() {
  return (
    <div className="chart-slot">
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

function ChartCard({ card }) {
  return (
    <article className="chart-card" data-chart-card="1" data-section={card.section} data-group={card.timingGroup} data-tier={card.tier}>
      <div className="chart-top">
        <h2>{card.headline}</h2>
        <Tag label={card.tierLabel} tier={card.tier} />
        <p className="chart-strength num">{card.strength}</p>
      </div>
      <ChartSlot />
      <details className="chart-details">
        <summary>Details</summary>
        <p>{card.episodes}</p>
        <p>{card.chance}</p>
        <p>{card.pick}</p>
        {card.strictPick ? <p>{card.strictPick}</p> : null}
        {card.runner ? <p>{card.runner}</p> : null}
      </details>
    </article>
  );
}

function LinkRow({ row }) {
  return (
    <details className="yf-row" data-all-link="1" data-tier={row.tier} data-group={row.timingGroup}>
      <summary>
        <span className="yf-name">{row.headline}</span>
        <Tag label={row.tierLabel} tier={row.tier} />
        <span className="yf-num num">{row.strength}</span>
        <span className="yf-spark" aria-hidden="true" />
      </summary>
      <div className="yf-detail">
        <p>{row.episodes} separate episodes</p>
        <p>{row.lagLabel}. {row.direction}.</p>
      </div>
    </details>
  );
}

function AllGroup({ title, group, showWeaker }) {
  const shown = group && group.shown ? group.shown : [];
  const weaker = group && group.weaker ? group.weaker : [];
  if (!shown.length && !weaker.length) return null;
  return (
    <section className="yf-group">
      <h2>{title}</h2>
      <div className="yf-list">
        {shown.map((row, index) => <LinkRow key={row.timingGroup + '-s-' + index} row={row} />)}
      </div>
      {weaker.length ? (
        <details className="corr-weaker">
          <summary>{showWeaker}</summary>
          <div className="yf-list">
            {weaker.map((row, index) => <LinkRow key={row.timingGroup + '-w-' + index} row={row} />)}
          </div>
        </details>
      ) : null}
    </section>
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
      <p>Description only, not proven. The number on each card is a rank correlation.</p>
      <p>Extra check, not a verdict: other checks use the same measure and do not change the label.</p>
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
        <h1>{state.title}</h1>
        {state.exampleNotice ? <p className="example-notice" role="status">{state.exampleNotice}</p> : null}
        {state.researchNotice ? <p className="research-notice" role="status">{state.researchNotice}</p> : null}
        {state.mode === 'empty' ? <p className="empty">{state.empty}</p> : null}
        {state.mode === 'ready' ? (
          <>
            <HowToRead state={state} />
            <section className="chart-list">
              {(state.chartCards || []).map((card, index) => (
                <ChartCard key={card.section + '-' + index} card={card} />
              ))}
            </section>
            {links ? (
              <section data-all-links="1" className="all-links">
                <h2 className="all-title">{links.title}</h2>
                <AllGroup title={links.sameDayTitle} group={links.sameDay} showWeaker={links.showWeaker} />
                <AllGroup title={links.leadTitle} group={links.lead} showWeaker={links.showWeaker} />
              </section>
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
