'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LinkChart } from './LinkChart.js';
import { ConnFooter } from './TopBar.js';

const FILTERS = [
  ['all', 'All', 'all'],
  ['same_day', 'Same day', 'sameDay'],
  ['lead', 'One moved first', 'lead'],
];

function visibleRows(rows, filter) {
  if (filter === 'same_day') return rows.filter((row) => row.timing === 'same_day');
  if (filter === 'lead') return rows.filter((row) => row.timing !== 'same_day');
  return rows;
}

function tally(rows) {
  return {
    strong: rows.filter((row) => row.tier === 'strict').length,
    medium: rows.filter((row) => row.tier === 'stronger').length,
    weak: rows.filter((row) => row.tier === 'weaker').length,
  };
}

function Spark({ row }) {
  return (
    <svg className="cx-spark" viewBox="0 0 88 32" aria-hidden="true">
      <path className="asset" d={row.sparkAsset} />
      <path className="odds" d={row.sparkOdds} />
    </svg>
  );
}

function RowLink({ row }) {
  return (
    <Link className="cx-lrow" href={row.href} data-link-row="1" data-tier={row.tier} data-timing={row.timing}>
      <Spark row={row} />
      <span className="cx-ltext">
        <span className="cx-lhead">{row.headline}</span>
        <span className="cx-lmeta">{row.timingLabel} · {row.episodes} separate episodes</span>
      </span>
      <span className={'cx-tag t-' + (row.tier === 'strict' ? 'strong' : row.tier === 'stronger' ? 'medium' : 'weak')}>{row.tierLabel}</span>
      <span className="cx-chev" aria-hidden="true">›</span>
    </Link>
  );
}

function Group({ title, note, rows, empty, preview }) {
  const [more, setMore] = useState(false);
  const shown = more ? rows : rows.slice(0, preview);
  const rest = rows.length - preview;
  return (
    <details className="cx-group">
      <summary className="cx-grow">
        <span className="cx-ltext">
          <span className="cx-gtitle">{title}</span>
          <span className="cx-lmeta">{note}</span>
        </span>
        <span className="cx-chev" aria-hidden="true">›</span>
      </summary>
      {rows.length === 0 ? <p className="cx-empty-row">{empty}</p> : shown.map((row) => <RowLink key={row.id} row={row} />)}
      {rest > 0 && !more ? (
        <button type="button" className="cx-more" onClick={() => setMore(true)}>Show {rest} more {title.replace(/^\d+\s/, '')} ›</button>
      ) : null}
    </details>
  );
}

export function ConnectionsHome({ state, earlier }) {
  const [filter, setFilter] = useState('all');
  if (state.mode !== 'ready' || !state.featured) {
    return (
      <>
        <main className="cx-wrap" data-page="connections" data-mode="empty">
          <p className="cx-banner">{state.banner}</p>
          <h1>Connections</h1>
          <p className="cx-stand">{state.standing}</p>
          <p className="cx-empty">{state.empty}</p>
        </main>
        <ConnFooter />
      </>
    );
  }
  const rows = visibleRows(state.rows, filter);
  const tiers = tally(rows);
  const strong = rows.filter((row) => row.tier === 'strict');
  const medium = rows.filter((row) => row.tier === 'stronger');
  const weak = rows.filter((row) => row.tier === 'weaker');
  const featured = state.featured;
  return (
    <>
      <main className="cx-wrap" data-page="connections" data-mode="ready" data-filter={filter}>
        <p className="cx-banner">{state.banner}</p>
        <p className="cx-stand">{state.standing}</p>
        <div className="cx-tags">
          <span className="cx-tag t-strong">{featured.tierLabel}</span>
          <span className="cx-tag t-plain">{featured.timingLabel}</span>
        </div>
        <h1>{featured.detail.pageHeadline}</h1>
        <p className="cx-meta">{featured.detail.meta}</p>
        <section className="cx-card cx-chartcard" data-main-chart="1">
          <LinkChart chart={featured.chart} variant="overview" />
        </section>
        <Link className="cx-quiet" href={featured.href}>See how strong this is ›</Link>
        <section className="cx-sec">
          <h2>{'All ' + state.shown + ' links we can show'}</h2>
          <p className="cx-sub">Each link pairs one kind of event odds with one asset, on the same day or with one moving first.</p>
          <div className="cx-tbar" role="img" aria-label={tiers.strong + ' strong, ' + tiers.medium + ' medium, ' + tiers.weak + ' weak'}>
            <span className="seg strong" style={{ flex: Math.max(tiers.strong, tiers.strong ? 1 : 0) + ' 0 0', minWidth: tiers.strong ? 8 : 0 }} />
            <span className="seg medium" style={{ flex: tiers.medium + ' 0 0' }} />
            <span className="seg weak" style={{ flex: tiers.weak + ' 0 0' }} />
          </div>
          <div className="cx-legend">
            <div className="cx-leg"><span className="sw strong" /><div><div className="cx-legn">{tiers.strong + ' Strong'}</div><div className="cx-legs">Passed the strict check</div></div></div>
            <div className="cx-leg"><span className="sw medium" /><div><div className="cx-legn">{tiers.medium + ' Medium'}</div><div className="cx-legs">Above the chance line</div></div></div>
            <div className="cx-leg"><span className="sw weak" /><div><div className="cx-legn">{tiers.weak + ' Weak'}</div><div className="cx-legs">Below the chance line</div></div></div>
          </div>
          <div className="cx-segw">
            <div className="cx-segc" role="group" aria-label="Timing">
              {FILTERS.map(([id, label, key]) => (
                <button key={id} type="button" aria-pressed={filter === id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>
                  {label} <span>{state.counts[key]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="cx-card cx-list">
            <div className="cx-ghead">Strong links <span>· passed the strict check</span></div>
            {strong.length === 0 ? <p className="cx-empty-row">{filter === 'lead' ? 'No strong links with one moving first' : 'No strong links in this timing'}</p> : strong.map((row) => <RowLink key={row.id} row={row} />)}
            <Group title={medium.length + ' medium links'} note="Above the chance line. Any single one may be luck." rows={medium} empty="No medium links in this timing" preview={4} />
            <Group title={weak.length + ' weaker links'} note="Below the chance line. May well be luck, kept to watch." rows={weak} empty="No weaker links in this timing" preview={4} />
          </div>
          <div className="cx-card cx-list cx-earlier">{earlier}</div>
          <p className="cx-fn">{state.hidden + ' more tested links are not shown because they had fewer than 10 separate episodes. ' + state.tested + ' links were tested in all.'}</p>
        </section>
      </main>
      <ConnFooter />
    </>
  );
}
