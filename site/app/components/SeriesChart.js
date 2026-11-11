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

function extent(points, pick) {
  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    const value = pick(point);
    if (typeof value !== 'number') continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min)) return [0, 1];
  if (min === max) return [min - 1, max + 1];
  return [min, max];
}

function mapY(value, min, max, top, bottom) {
  return bottom - ((value - min) / (max - min)) * (bottom - top);
}

function tick(value) {
  const abs = Math.abs(value);
  if (abs >= 100) return String(Math.round(value));
  if (abs >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

export function SeriesChart({ model, spark }) {
  if (!model || !model.points || !model.points.length) return null;
  const points = model.points;
  if (spark) {
    const [min, max] = extent(points, (point) => point.odds);
    const path = line(points, (i) => (i / Math.max(1, points.length - 1)) * 64, (value) => mapY(value, min, max, 2, 26), (point) => point.odds);
    return (
      <svg className="spark" viewBox="0 0 64 28" data-trend="1" aria-hidden="true">
        <path d={path} />
      </svg>
    );
  }
  const left = 8;
  const right = 632;
  const top = 16;
  const bottom = 214;
  const [oddsMin, oddsMax] = extent(points, (point) => point.odds);
  const oddsLow = Math.min(0, oddsMin);
  const oddsHigh = Math.max(0, oddsMax);
  const [assetMin, assetMax] = extent(points, (point) => point.asset);
  const xAt = (i) => left + (i / Math.max(1, points.length - 1)) * (right - left);
  const oddsPath = line(points, xAt, (value) => mapY(value, oddsLow, oddsHigh, top, bottom), (point) => point.odds);
  const assetPath = line(points, xAt, (value) => mapY(value, assetMin, assetMax, top, bottom), (point) => point.asset);
  return (
    <figure className="series-chart">
      <svg viewBox="0 0 640 250" role="img">
        <title>{model.oddsAxis}</title>
        <line className="axis" x1={left} y1={top} x2={left} y2={bottom} />
        <line className="axis" x1={left} y1={bottom} x2={right} y2={bottom} />
        <line className="axis" x1={right} y1={top} x2={right} y2={bottom} />
        <path className="odds-line" data-odds-line="1" d={oddsPath} />
        <path className="asset-line" data-asset-line="1" d={assetPath} />
        <text className="tick" x={left + 6} y={top + 12}>{tick(oddsHigh)}</text>
        <text className="tick" x={left + 6} y={bottom - 6}>{tick(oddsLow)}</text>
        <text className="tick right" x={right - 6} y={top + 12} textAnchor="end">{tick(assetMax)}</text>
        <text className="tick right" x={right - 6} y={bottom - 6} textAnchor="end">{tick(assetMin)}</text>
        <text className="tick" x={left} y={236}>{points[0].date}</text>
        <text className="tick right" x={right} y={236} textAnchor="end">{points[points.length - 1].date}</text>
      </svg>
      <figcaption>
        <span><i className="swatch odds" /> {model.oddsAxis}</span>
        <span><i className="swatch asset" /> {model.assetAxis}</span>
      </figcaption>
    </figure>
  );
}
