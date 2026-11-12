export function OddsChart({ chart }) {
  if (!chart) return null;
  const points = chart.points || [];
  const width = 640;
  const height = 168;
  const padX = 16;
  const padTop = 16;
  const padBottom = 28;
  const known = points.filter((point) => typeof point.odds === 'number');
  let d = '';
  if (known.length >= 2) {
    let min = Math.min(...known.map((point) => point.odds));
    let max = Math.max(...known.map((point) => point.odds));
    if (min === max) {
      min -= 0.01;
      max += 0.01;
    }
    const innerW = width - padX * 2;
    const innerH = height - padTop - padBottom;
    const step = points.length > 1 ? innerW / (points.length - 1) : 0;
    let drawing = false;
    points.forEach((point, index) => {
      if (typeof point.odds !== 'number') {
        drawing = false;
        return;
      }
      const x = padX + index * step;
      const y = padTop + (1 - (point.odds - min) / (max - min)) * innerH;
      d += (drawing ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      drawing = true;
    });
  }
  return (
    <figure className="today-chart">
      <svg viewBox={'0 0 ' + width + ' ' + height} role="img" aria-label={chart.caption}>
        <title>{chart.caption}</title>
        <line x1={padX} y1={height - 20} x2={width - padX} y2={height - 20} stroke="#CBD3D4" strokeWidth="1" />
        {d ? (
          <path d={d.trim()} fill="none" stroke="#116C5B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        ) : null}
      </svg>
      <div className="chart-caps">
        <span>{chart.startLabel}</span>
        <span data-axis="end">{chart.endLabel}</span>
      </div>
      <figcaption>{chart.caption}</figcaption>
      <table className="sr-only">
        <caption>{chart.caption}</caption>
        <thead>
          <tr><th>Day</th><th>Odds</th></tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <td>{point.dateLabel}</td>
              <td>{point.oddsLabel || 'No saved odds'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
