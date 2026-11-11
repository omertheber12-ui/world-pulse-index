import Link from 'next/link';
import { COPY } from '../../lib/correlations.js';

function Card({ card, index }) {
  return (
    <article className="conn-card corr-card" data-section={card.section} data-order={index}>
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
      <p className="corr-line">{card.manyTests}</p>
      <p className="corr-line">{card.lag}</p>
    </article>
  );
}

export function StrongestLinksScreen({ state }) {
  return (
    <>
      <main data-page="strongest-links" data-mode={state.mode}>
        <aside className="preview-banner" role="note">{state.previewBanner}</aside>
        <h1>{state.title}</h1>
        {state.exampleNotice ? <p className="example-notice" role="status">{state.exampleNotice}</p> : null}
        {state.mode === 'empty' ? <p className="empty">{state.empty}</p> : null}
        {state.mode === 'ready' ? (
          <>
            <p className="corr-summary">{state.summary}</p>
            <h2>{state.perAssetTitle}</h2>
            {state.perAsset.map((card, index) => (
              <Card key={'asset-' + index} card={card} index={index} />
            ))}
            <h2>{state.perEventTitle}</h2>
            {state.perEvent.map((card, index) => (
              <Card key={'event-' + index} card={card} index={index} />
            ))}
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
