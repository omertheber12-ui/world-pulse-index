import { RowLink } from './Chrome.js';
import { eventName, fig, optionLine } from '../../lib/copy.js';

export function Move({ move, meaningful, today = false }) {
  const tail = today ? ' today' : '';
  if (move == null) return <span className="mv">—</span>;
  const a = Math.abs(move);
  const cls = 'mv' + (meaningful ? (move > 0 ? ' up' : ' down') : '');
  if (a < 0.05) return <span className={cls}>→ 0.0{tail}</span>;
  return <span className={cls}>{(move > 0 ? '▲ ' : '▼ ') + a.toFixed(1) + tail}</span>;
}

export function EventRow({ s, rules, id = false, thin = false }) {
  const lead = s.lead;
  return (
    <RowLink className="row" href={'/event/' + s.ev.event_id} {...(id ? { 'data-id': s.ev.event_id } : {})}>
      <span className="rname">{eventName(s.ev)}</span>
      <span className="ropt">{lead ? optionLine(s.ev, lead.label, rules, true) : ''}</span>
      <span className="rfig">
        {fig(lead ? lead.pct : null)}%{thin && lead && lead.thin ? <span className="thin">thin</span> : null}
      </span>
      <span className="rchg"><Move move={s.move} meaningful={s.meaningful} /></span>
    </RowLink>
  );
}
