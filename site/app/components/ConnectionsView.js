import Link from 'next/link';
import { COPY } from '../../lib/connections.js';

function Filters({ state }) {
  return (
    <div className="chiprow">
      <div className="chips" role="navigation" aria-label="Asset">
        {state.filters.map((item) => (
          <Link key={item.id} className={item.on ? 'on' : ''} href={item.href} aria-current={item.on ? 'page' : undefined}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Insights({ footer }) {
  return (
    <footer>
      {footer ? <p>{footer}</p> : null}
      <p>{COPY.insights} · <Link href="/how">How it works</Link></p>
    </footer>
  );
}

function Tags({ tags }) {
  if (!tags || !tags.length) return null;
  return (
    <p className="conn-tags">
      {tags.map((tag) => (
        <span className={'tag conn-' + tag.kind} key={tag.kind}>{tag.text}</span>
      ))}
    </p>
  );
}

function CardBody({ card }) {
  return (
    <>
      <Tags tags={card.tags} />
      <h2 className="conn-event">{card.eventName}</h2>
      <p className="conn-asset">{card.assetLabel}</p>
      {card.oddsPattern ? <p className="conn-odds">{card.oddsPattern}</p> : null}
      {card.stats && card.stats.length ? (
        <div className="conn-stats">
          {card.stats.map((stat) => (
            <p className="conn-stat" key={stat.label}>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </p>
          ))}
        </div>
      ) : null}
      {card.bar ? (
        <div className="obar conn-obar" aria-hidden="true"><i style={{ width: card.bar.pct + '%' }} /></div>
      ) : null}
      {card.companion ? <p className="conn-sentence">{card.companion}</p> : null}
      {card.sentence ? <p className="conn-sentence">{card.sentence}</p> : null}
      {card.oilNote ? <p className="conn-oil">{card.oilNote}</p> : null}
      {card.howSure ? <p className="conn-how">{card.howSure}</p> : null}
    </>
  );
}

function readableDate(text) {
  return String(text || '').replace(/(\d{4})-(\d{2})-(\d{2})/g, (_, year, month, day) => {
    const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return Number(day) + ' ' + names[Number(month) - 1] + ' ' + year;
  });
}

function ConnectionsBody({ state, embedded }) {
  return (
    <>
      {embedded ? <h3 className="cx-older">Older tests</h3> : <h1>{state.title}</h1>}
      <Filters state={state} />
      {state.mode === 'loading' ? <p className="checking">{state.loading}</p> : null}
      {state.mode === 'unread' ? (
        <>
          <h2>{state.unread.headline}</h2>
          <p>{state.unread.body}</p>
        </>
      ) : null}
      {state.mode === 'empty' ? (
        <>
          <h2>{state.empty.headline}</h2>
          <p>{state.empty.body}</p>
          <p className="note">{state.empty.context}</p>
        </>
      ) : null}
      {state.mode === 'list' ? (
        <>
          {state.banners.map((banner) => (
            <aside className={'conn-banner ' + banner.tone} key={banner.tone}>
              <p>{banner.text}</p>
              {banner.helper ? <p className="conn-helper">{banner.helper}</p> : null}
            </aside>
          ))}
          {state.cards.map((card) => (
            <Link className="conn-card" key={card.id} href={card.href} data-history={card.historyStatus}>
              <CardBody card={card} />
              <p className="conn-meta">{readableDate(card.lastChecked)}</p>
              <p className="morelink">{COPY.details}</p>
            </Link>
          ))}
          {state.quiet.map((line) => (
            <p className="conn-quiet" key={line}>{line}</p>
          ))}
        </>
      ) : null}
    </>
  );
}

export function EarlierChecks({ state }) {
  return (
    <details className="earlier-checks">
      <summary className="cx-grow">
        <span className="cx-ltext">
          <span className="cx-gtitle">Earlier checks</span>
          <span className="cx-lmeta">Older tests from earlier runs, kept for the record.</span>
        </span>
        <span className="cx-chev" aria-hidden="true">›</span>
      </summary>
      <div className="earlier-body">
        <ConnectionsBody state={state} embedded />
        {state.footer ? <p className="conn-meta">{readableDate(state.footer)}</p> : null}
      </div>
    </details>
  );
}

export function ConnectionsScreen({ state }) {
  return (
    <>
      <main data-page="connections" data-mode={state.mode}>
        <ConnectionsBody state={state} />
      </main>
      <Insights footer={state.footer} />
    </>
  );
}

export function ConnectionDetail({ state }) {
  const card = state.card;
  return (
    <>
      <main data-page="connection" data-mode={state.mode}>
        <p className="back"><Link href={state.backHref}>‹ Connections</Link></p>
        {state.mode === 'unread' ? (
          <>
            <h1>{state.unread.headline}</h1>
            <p>{state.unread.body}</p>
          </>
        ) : null}
        {state.mode === 'missing' ? <h1>{state.message}</h1> : null}
        {state.mode === 'detail' && card ? (
          <>
            <Tags tags={card.tags} />
            <h1 className="conn-event">{card.eventName}</h1>
            <p className="conn-asset">{card.assetLabel}</p>
            {card.oddsPattern ? <p className="conn-odds">{card.oddsPattern}</p> : null}
            {card.stats && card.stats.length ? (
              <div className="conn-stats">
                {card.stats.map((stat) => (
                  <p className="conn-stat" key={stat.label}>
                    <b>{stat.value}</b>
                    <span>{stat.label}</span>
                  </p>
                ))}
              </div>
            ) : null}
            {card.bar ? (
              <div className="obar conn-obar" aria-hidden="true"><i style={{ width: card.bar.pct + '%' }} /></div>
            ) : null}
            {card.companion ? <p className="conn-sentence">{card.companion}</p> : null}
            {card.sentence ? <p className="conn-sentence">{card.sentence}</p> : null}
            {card.oilNote ? <p className="conn-oil">{card.oilNote}</p> : null}
            {card.howSure ? <p className="conn-how">{card.howSure}</p> : null}
            {card.rows && card.rows.length ? (
              <dl className="conn-rows">
                {card.rows.map((row, index) => (
                  <div key={(row.label || 'row') + index}>
                    {row.label ? <dt>{row.label}</dt> : null}
                    <dd>{row.text}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {card.sources && card.sources.length ? (
              <div className="conn-sources">
                <h2>Sources</h2>
                {card.sources.map((source) => (
                  <p key={source.href}><a href={source.href}>{source.label}</a></p>
                ))}
              </div>
            ) : null}
            <p className="note">{card.howWeCheck}</p>
            <p className="conn-meta">{card.lastChecked}</p>
          </>
        ) : null}
      </main>
      <Insights footer={state.footer} />
    </>
  );
}
