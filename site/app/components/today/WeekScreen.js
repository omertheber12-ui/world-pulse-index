import Link from 'next/link';
import { SAME_DAY_LESSON } from '../../../lib/screenCopy.js';
import { OddsChart } from './OddsChart.js';

export function WeekScreen({ model }) {
  return (
    <main data-week="1">
      <p className="today-jump"><Link className="today-back" href="/">Back to Today</Link></p>
      {model.range ? <p className="today-date">{model.range}</p> : null}
      <h1>{model.title}</h1>
      {model.saved ? <p className="today-follow">{model.saved}</p> : null}
      {model.cards.map((card) => (
        <section className="story today-card" key={card.kicker + (card.title || card.sentence)}>
          <p className="kicker">{card.kicker}</p>
          {card.title ? <h2>{card.title}</h2> : null}
          {card.sentence ? <p className="today-sentence">{card.sentence}</p> : null}
          {card.body ? <p className="today-follow">{card.body}</p> : null}
          {card.chart ? <OddsChart chart={card.chart} /> : null}
          {card.href ? <Link className="today-link" href={card.href}>{card.link || SAME_DAY_LESSON.link}</Link> : null}
        </section>
      ))}
    </main>
  );
}
