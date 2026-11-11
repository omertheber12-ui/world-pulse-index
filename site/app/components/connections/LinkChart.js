'use client';

import { useState } from 'react';

const RANGES = [
  ['1m', '1M', 31],
  ['6m', '6M', 182],
  ['1y', '1Y', 365],
  ['all', 'All', 0],
];

function cutoff(lastDate, days) {
  if (!lastDate || !days) return '';
  const date = new Date(lastDate + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function windowOf(points, range) {
  if (!points.length || range === 'all') return points;
  const spec = RANGES.find((item) => item[0] === range);
  const from = cutoff(points[points.length - 1].date, spec ? spec[2] : 0);
  const kept = points.filter((point) => point.date >= from);
  return kept.length ? kept : points;
}

function extent(points, pick) {
  let min = Infinity;
  let max = -Infinity;
  points.forEach((point) => {
    const value = pick(point);
    if (typeof value !== 'number') return;
    if (value < min) min = value;
    if (value > max) max = value;
  });
  if (!Number.isFinite(min)) return [0, 1];
  if (min === max) return [min - 1, max + 1];
  return [min, max];
}

function pathOf(points, xAt, yAt, pick) {
  let d = '';
  let drawing = false;
  points.forEach((point, index) => {
    const value = pick(point);
    if (typeof value !== 'number') { drawing = false; return; }
    d += (drawing ? 'L' : 'M') + xAt(index).toFixed(1) + ' ' + yAt(value).toFixed(1) + ' ';
    drawing = true;
  });
  return d.trim();
}

function monthLabel(iso) {
  if (!iso) return '';
  const [year, month] = iso.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[month - 1] + ' ' + year;
}

function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

export function LinkChart({ chart, variant }) {
  const [range, setRange] = useState('all');
  const [hover, setHover] = useState(null);
  if (!chart || !chart.points || !chart.points.length) return null;
  const points = windowOf(chart.points, range);
  return (
    <figure className="cx-chart" data-range={range}>
      <div className="cx-cardtop">
        <span />
        {variant === 'detail' ? chips(range, setRange, setHover) : (
          <details className="cx-range">
            <summary className="cx-pill">Range ⌄</summary>
            {chips(range, setRange, setHover)}
          </details>
        )}
      </div>
      <div className="cx-chart-desk"><ChartSvg chart={chart} points={points} phone={false} hover={hover} setHover={setHover} /></div>
      <div className="cx-chart-phone"><ChartSvg chart={chart} points={points} phone={true} hover={hover} setHover={setHover} /></div>
      <p className="cx-readout" data-readout="1" aria-live="polite">{labelFor(chart, points, hover)}</p>
    </figure>
  );
}

function chips(range, setRange, setHover) {
  return (
    <div className="cx-chips" role="group" aria-label="Time range">
      {RANGES.map(([id, name]) => (
        <button key={id} type="button" className={range === id ? 'on' : ''} aria-pressed={range === id} onClick={() => { setRange(id); setHover(null); }}>{name}</button>
      ))}
    </div>
  );
}

function labelFor(chart, points, hover) {
  if (hover == null || !points[hover] || typeof points[hover].asset !== 'number') return '';
  const value = chart.assetUnit === 'percent' && chart.measure !== 'size'
    ? points[hover].asset.toFixed(2) + '%'
    : String(Math.round(points[hover].asset * 100) / 100);
  return longDate(points[hover].date) + ' · ' + chart.assetName + ' ' + value;
}

function ChartSvg({ chart, points, phone, hover, setHover }) {
  const plotW = phone ? 214 : 864;
  const plotH = phone ? 190 : 340;
  const labelW = phone ? 96 : 192;
  const width = plotW + labelW;
  const height = plotH + 48;
  const [oddsMin, oddsMax] = extent(points, (point) => point.odds);
  const [assetMin, assetMax] = extent(points, (point) => point.asset);
  const xAt = (index) => (points.length > 1 ? (index / (points.length - 1)) * plotW : 0);
  const yAt = (value, min, max) => plotH - ((value - min) / (max - min)) * plotH;
  const oddsPath = pathOf(points, xAt, (value) => yAt(value, oddsMin, oddsMax), (point) => point.odds);
  const assetPath = pathOf(points, xAt, (value) => yAt(value, assetMin, assetMax), (point) => point.asset);
  const lastOdds = [...points].reverse().find((point) => typeof point.odds === 'number');
  const lastAsset = [...points].reverse().find((point) => typeof point.asset === 'number');
  const oddsY = lastOdds ? yAt(lastOdds.odds, oddsMin, oddsMax) : plotH;
  const assetY = lastAsset ? yAt(lastAsset.asset, assetMin, assetMax) : 0;
  let nameOddsY = oddsY;
  let nameAssetY = assetY;
  if (Math.abs(nameOddsY - nameAssetY) < 40) {
    if (nameOddsY > nameAssetY) nameOddsY = nameAssetY + 40;
    else nameAssetY = nameOddsY + 40;
  }
  const oddsTitle = phone && chart.measure !== 'size' ? 'Odds change' : chart.oddsName;

  function readAt(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < points.length; i++) {
      const gap = Math.abs(xAt(i) - x);
      if (gap < best) { best = gap; nearest = i; }
    }
    setHover(nearest);
  }

  const aria = 'Line chart, ' + chart.windowStart + ' to ' + chart.windowEnd + '. ' + oddsTitle + ' ends at ' + chart.oddsEnd + '. ' + chart.assetName + ' ends at ' + chart.assetEnd + '.';

  return (
      <svg className="cx-mainchart" viewBox={'0 -8 ' + width + ' ' + (height + 8)} role="img" aria-label={aria} onPointerMove={readAt} onPointerDown={readAt} onPointerLeave={() => setHover(null)}>
        <text className="cx-axisdate" x="0" y={plotH + 22}>{monthLabel(points[0] && points[0].date)}</text>
        <text className="cx-axisdate" x={plotW} y={plotH + 22} textAnchor="end">{monthLabel(points[points.length - 1] && points[points.length - 1].date)}</text>
        <line className="cx-base" x1="0" y1={plotH} x2={plotW} y2={plotH} />
        <path className="cx-asset" data-asset-line="1" d={assetPath} />
        <path className="cx-odds" data-odds-line="1" d={oddsPath} />
        {lastAsset ? <circle className="cx-end asset" cx={xAt(points.indexOf(lastAsset))} cy={assetY} r="4" /> : null}
        {lastOdds ? <circle className="cx-end odds" cx={xAt(points.indexOf(lastOdds))} cy={oddsY} r="4" /> : null}
        <text className="cx-name" x={plotW + 12} y={nameAssetY}>{chart.assetName}</text>
        <text className="cx-value" x={plotW + 12} y={nameAssetY + 18}>{chart.assetEnd}</text>
        <text className="cx-name" x={plotW + 12} y={nameOddsY}>{oddsTitle}</text>
        <text className="cx-value odds" x={plotW + 12} y={nameOddsY + 18}>{chart.oddsEnd}</text>
        {hover != null && points[hover] ? (
          <g>
            <line className="cx-hoverline" x1={xAt(hover)} y1="0" x2={xAt(hover)} y2={plotH} />
            {typeof points[hover].asset === 'number' ? <circle className="cx-hollow asset" cx={xAt(hover)} cy={yAt(points[hover].asset, assetMin, assetMax)} r="5" /> : null}
            {typeof points[hover].odds === 'number' ? <circle className="cx-hollow odds" cx={xAt(hover)} cy={yAt(points[hover].odds, oddsMin, oddsMax)} r="5" /> : null}
          </g>
        ) : null}
      </svg>
  );
}
