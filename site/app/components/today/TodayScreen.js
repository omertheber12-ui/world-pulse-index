import Link from 'next/link';
import { FirstHint } from './FirstHint.js';
import { OddsChart } from './OddsChart.js';

export function TodayScreen({ model }) {
  const state = model.mode === 'no update' ? 'no-update' : model.mode === 'no baseline' ? 'no-baseline' : model.mode;
  return (
    <main data-today="1" data-today-mode={state}>
      {model.hint ? <FirstHint /> : null}
      <p className="today-date">
        {model.dateLabel}
        {model.updatedLabel ? ' · Updated ' + model.updatedLabel + ' Israel time' : ''}
      </p>
      {model.note ? <p className="today-follow">{model.note}</p> : null}
      <h1>{model.title}</h1>
      {model.pick ? (
        <section className="story today-card">
          <p className="kicker">The one change worth knowing</p>
          <p className="today-sentence">{model.pick.sentence}</p>
          <OddsChart chart={model.pick.chart} />
          {model.pick.href ? (
            <Link className="today-link" href={model.pick.href}>See the link behind it</Link>
          ) : null}
        </section>
      ) : null}
      {model.mode === 'quiet' ? (
        <section className="story today-card">
          <p className="today-sentence">{model.message}</p>
        </section>
      ) : null}
      {model.mode === 'no update' || model.mode === 'no baseline' ? (
        <section className="story today-card">
          {model.message ? <p className="today-sentence">{model.message}</p> : null}
          {model.lastGoodLabel ? <p className="today-follow">Last good day: {model.lastGoodLabel}.</p> : <p className="today-follow">No earlier saved day is on file.</p>}
        </section>
      ) : null}
      {model.smaller ? (
        <details className="smaller">
          <summary>
            <span className="smaller-label">{model.smaller.label}</span>
            <svg className="smaller-chev" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <ul>
            {model.smaller.moves.map((move) => <li key={move}>{move}</li>)}
          </ul>
        </details>
      ) : null}
      <p className="today-jump"><Link className="today-link" href={model.weekHref}>This week in one minute</Link></p>
      {model.caughtUp ? (
        <section className="story today-card caught">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 12.5 10.5 15 16 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <h2>You're caught up.</h2>
            <p>{model.caughtUp}</p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
