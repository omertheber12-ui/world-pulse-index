'use client';

import { useState } from 'react';

const RANGES = [
  ['full', 'Full'],
  ['1y', '1 year'],
  ['6m', '6 months'],
  ['3m', '3 months'],
];

function line(points, xAt, yAt, pick) {
  let path = '';
  let drawing = false;
  for (let i = 0; i < points.length; i++) {
    const value = pick(points[i]);
    if (typeof value !== 'number') {
      drawing = false;
      continue;
    }
    path += (drawing ? 'L' : 'M') + xAt(i).toFixed(1) + ' ' + yAt(value).toFixed(1) + ' ';
    drawing = true;
  }
  return path.trim();
}

function extent(points, pick, includeZero) {
  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    const value = pick(point);
    if (typeof value !== 'number') continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min)) return [0, 1];
  if (includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (min === max) return [min - 1, max + 1];
  return [min, max];
}

function mapY(value, min, max, top, bottom) {
  return bottom - ((value - min) / (max - min)) * (bottom - top);
}

function tick(value) {
  const abs = Math.abs(value);
  const text = abs >= 100 ? String(Math.round(abs)) : abs >= 10 ? abs.toFixed(1) : abs.toFixed(2);
  if (value < 0) return '-' + text;
  return text;
}

function figureText(value, measure) {
  if (typeof value !== 'number') return '';
  const text = tick(value);
  if (measure === 'direction' && value > 0) return '+' + text;
  return text;
}

function cutoff(lastDate, range) {
  if (!lastDate || range === 'full') return '';
  const days = range === '1y' ? 365 : range === '6m' ? 182 : 91;
  const date = new Date(lastDate + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function windowOf(points, range) {
  if (!points.length || range === 'full') return points;
  const from = cutoff(points[points.length - 1].date, range);
  const kept = points.filter((point) => point.date >= from);
  return kept.length ? kept : points;
}

export function SeriesChart({ model, spark }) {
  const [range, setRange] = useState('full');
  const [hover, setHover] = useState(null);
  if (!model || !model.points || !model.points.length) return null;
  const points = spark ? model.points : windowOf(model.points, range);
  if (spark) {
    const [min, max] = extent(points, (point) => point.odds, false);
    const path = line(
      points,
      (i) => (i / Math.max(1, points.length - 1)) * 64,
      (value) => mapY(value, min, max, 2, 26),
      (point) => point.odds,
    );
    return (
      <svg className="trend" viewBox="0 0 64 28" data-trend="1" aria-hidden="true">
        <path d={path} />
      </svg>
    );
  }
  const left = 52;
  const right = 588;
  const top = 36;
  const bottom = 214;
  const [oddsMin, oddsMax] = extent(points, (point) => point.odds, model.measure !== 'size');
  const [assetMin, assetMax] = extent(points, (point) => point.asset, false);
  const xAt = (i) => left + (i / Math.max(1, points.length - 1)) * (right - left);
  const oddsY = (value) => mapY(value, oddsMin, oddsMax, top, bottom);
  const assetY = (value) => mapY(value, assetMin, assetMax, top, bottom);
  const oddsPath = line(points, xAt, oddsY, (point) => point.odds);
  const assetPath = line(points, xAt, assetY, (point) => point.asset);
  function readAt(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 640;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < points.length; i++) {
      const gap = Math.abs(xAt(i) - x);
      if (gap < best) {
        best = gap;
        nearest = i;
      }
    }
    setHover(nearest);
  }

  const hovered = hover != null ? points[hover] : null;
  const readout = hovered && typeof hovered.odds === 'number'
    ? hovered.date + ' ' + figureText(hovered.odds, model.measure)
    : '';

  return (
    <figure className="series-chart" data-range={range} data-measure={model.measure || 'direction'}>
      <svg
        viewBox="0 0 640 250"
        role="img"
        onPointerMove={readAt}
        onPointerDown={readAt}
        onPointerLeave={() => setHover(null)}
      >
        <title>{model.oddsAxis}</title>
        <text className="end-label" x={left} y={16}>{model.oddsAxis}</text>
        <text className="end-label" x={right} y={16} textAnchor="end">{model.assetAxis}</text>
        <line className="axis" x1={left} y1={top} x2={left} y2={bottom} />
        <line className="axis" x1={right} y1={top} x2={right} y2={bottom} />
        <path className="odds-line" data-odds-line="1" d={oddsPath} />
        <path className="asset-line" data-asset-line="1" d={assetPath} />
        <text className="tick" x={4} y={top + 14}>{tick(oddsMax)}</text>
        <text className="tick" x={4} y={bottom - 4}>{tick(oddsMin)}</text>
        <text className="tick" x={636} y={top + 14} textAnchor="end">{tick(assetMax)}</text>
        <text className="tick" x={636} y={bottom - 4} textAnchor="end">{tick(assetMin)}</text>
        <text className="tick" x={left} y={236}>{points[0].date}</text>
        <text className="tick" x={right} y={236} textAnchor="end">{points[points.length - 1].date}</text>
      </svg>
      <p className="readout" data-readout="1">{readout}</p>
      <details className="time-range">
        <summary>Time range</summary>
        <div>
          {RANGES.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={range === id} onClick={() => { setRange(id); setHover(null); }}>
              {label}
            </button>
          ))}
        </div>
      </details>
    </figure>
  );
}
