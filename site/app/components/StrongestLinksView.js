import Link from 'next/link';
import { COPY } from '../../lib/correlations.js';

function Card({ card, index }) {
  return (
    <article className="conn-card corr-card" data-section={card.section} data-group={card.timingGroup} data-order={index}>
      <p className="corr-label"><span className="tag fact">{card.label}</span></p>
      <h3 className="conn-event">{card.subject}</h3>
      <p className="conn-asset">{card.other}</p>
      <div className="corr-split">
        <p className="corr-num">
          <b>{card.correlation}</b>
          {card.rankCaption ? <small>{card.rankCaption}</small> : null}
        </p>
        <p className="corr-chance">{card.chance}</p>
      </div>
      <p className="corr-line">{card.sample}</p>
      <p className="corr-line">{card.pick}</p>
      {card.strictPick ? <p className="corr-line">{card.strictPick}</p> : null}
      {(card.extraChecks || []).map((line) => (
        <p className="corr-extra" key={line}>{line}</p>
      ))}
      <p className="corr-line">{card.manyTests}</p>
      <p className="corr-line">{card.lag}</p>
    </article>
  );
}

function LinkTable({ rows }) {
  if (!rows || !rows.length) return null;
  return (
    <div className="corr-table-wrap">
      <table className="corr-links">
        <thead>
          <tr>
            <th>Event</th>
            <th>Asset</th>
            <th>Timing</th>
            <th>Strength <span>rank correlation</span></th>
            <th>Separate episodes</th>
            <th>Tier</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.timingGroup + '-' + row.tier + '-' + index} data-all-link="1" data-tier={row.tier} data-group={row.timingGroup}>
              <td>{row.eventLabel}</td>
              <td>{row.assetLabel}</td>
              <td>{row.lagLabel}</td>
              <td><b className="num">{row.strength}</b> {row.direction}</td>
              <td className="num">{row.episodes}</td>
              <td>{row.tierLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllGroup({ title, group, showWeaker }) {
  const shown = group && group.shown ? group.shown : [];
  const weaker = group && group.weaker ? group.weaker : [];
  if (!shown.length && !weaker.length) return null;
  return (
    <section>
      <h3>{title}</h3>
      <LinkTable rows={shown} />
      {weaker.length ? (
        <details className="corr-weaker">
          <summary>{showWeaker}</summary>
          <LinkTable rows={weaker} />
        </details>
      ) : null}
    </section>
  );
}

function AllLinks({ links }) {
  if (!links) return null;
  return (
    <section data-all-links="1">
      <h2>{links.title}</h2>
      <p className="corr-luck">{links.note}</p>
      <ul className="corr-legend">
        {(links.legend || []).map((line) => <li key={line}>{line}</li>)}
      </ul>
      <p className="corr-strict-note">{links.strictNote}</p>
      <AllGroup title={links.sameDayTitle} group={links.sameDay} showWeaker={links.showWeaker} />
      <AllGroup title={links.leadTitle} group={links.lead} showWeaker={links.showWeaker} />
    </section>
  );
}

function Group({ title, cards }) {
  if (!cards || !cards.length) return null;
  return (
    <>
      <h2>{title}</h2>
      {cards.map((card, index) => (
        <Card key={card.section + '-' + index} card={card} index={index} />
      ))}
    </>
  );
}

export function StrongestLinksScreen({ state }) {
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
            <p className="corr-summary">{state.summary}</p>
            <Group title={state.sameDayTitle} cards={state.sameDay} />
            <Group title={state.leadTitle} cards={state.lead} />
            <AllLinks links={state.allLinks} />
          </>
        ) : null}
      </main>
      <footer>
        {state.footer ? <p>{state.footer}</p> : null}
        <p>{COPY.insights} · <Link href="/how">How it works</Link></p>
      </footer>
    </>
  );
}
