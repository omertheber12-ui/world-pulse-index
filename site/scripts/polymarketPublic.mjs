/** Public Polymarket reads. No key and no sign-in. */
const UA = { accept: 'application/json', 'user-agent': 'WorldPulseIndex/1.0' };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getJson(url) {
  let last = new Error('read failed');
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(40000) });
      if (res.status === 429 || res.status >= 500) {
        last = new Error('HTTP ' + res.status);
        await sleep(400 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      last = err;
      if (attempt === 4) break;
      await sleep(300 * (attempt + 1));
    }
  }
  throw last;
}

function asList(value) {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || '[]'); } catch { return []; }
}

export function yesOdds(market) {
  const prices = asList(market.outcomePrices).map(Number);
  if (!prices.length || !Number.isFinite(prices[0])) return null;
  return prices[0];
}

export function yesToken(market) {
  const ids = asList(market.clobTokenIds).map(String);
  return ids[0] || '';
}

export async function fetchGammaMarkets(ids) {
  const map = new Map();
  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);
    const url = 'https://gamma-api.polymarket.com/markets?' + chunk.map((id) => 'id=' + encodeURIComponent(id)).join('&');
    const data = await getJson(url);
    for (const market of Array.isArray(data) ? data : []) map.set(String(market.id), market);
  }
  return map;
}

export async function fetchPriceHistory(token) {
  const month = 'https://clob.polymarket.com/prices-history?market=' + encodeURIComponent(token) + '&interval=1m&fidelity=60';
  const longer = 'https://clob.polymarket.com/prices-history?market=' + encodeURIComponent(token) + '&interval=max&fidelity=1440';
  let monthPoints = [];
  let longerPoints = [];
  let monthError = null;
  try {
    monthPoints = cleanPoints(await getJson(month)).map((point) => ({ ...point, url: month }));
  } catch (err) {
    monthError = err;
  }
  try {
    longerPoints = cleanPoints(await getJson(longer)).map((point) => ({ ...point, url: longer }));
  } catch (err) {
    if (!monthPoints.length) throw monthError || err;
  }
  const byTime = new Map();
  for (const point of longerPoints) byTime.set(Number(point.t), point);
  for (const point of monthPoints) byTime.set(Number(point.t), point);
  return { url: monthPoints.length ? month : longer, points: [...byTime.values()] };
}

function cleanPoints(data) {
  const rows = (data && data.history) || [];
  return rows.filter((point) => point && Number.isFinite(Number(point.t)) && Number.isFinite(Number(point.p)));
}

export function oddsByDate(points) {
  const map = new Map();
  const sorted = points.slice().sort((a, b) => Number(a.t) - Number(b.t));
  for (const point of sorted) {
    const odds = Number(point.p);
    if (!(odds >= 0 && odds <= 1)) continue;
    const date = new Date(Number(point.t) * 1000).toISOString().slice(0, 10);
    map.set(date, {
      odds,
      observed_at: new Date(Number(point.t) * 1000).toISOString(),
      source_url: point.url || '',
    });
  }
  return map;
}

/**
 * Sum of public trade size (shares) by UTC date.
 * Gamma's current volume24hr matches this share sum, not size times price.
 * A partial page run is complete:false so the caller does not keep a short total.
 */
export async function volumeByDate(conditionId, startSec, endSec) {
  const source = 'https://data-api.polymarket.com/v2/trades?condition=' + encodeURIComponent(conditionId) + '&limit=1000';
  const buckets = new Map();
  let cursor = null;
  let pages = 0;
  while (pages < 400) {
    const url = cursor ? source + '&cursor=' + encodeURIComponent(cursor) : source;
    const data = await getJson(url);
    const rows = (data && data.data) || [];
    pages += 1;
    if (!rows.length) return { buckets, source, complete: true, pages };
    let older = false;
    for (const row of rows) {
      const ts = Number(row.timestamp);
      const size = Number(row.size);
      if (!Number.isFinite(ts) || !Number.isFinite(size) || size < 0) continue;
      if (ts < startSec) {
        older = true;
        continue;
      }
      if (ts >= endSec) continue;
      const date = new Date(ts * 1000).toISOString().slice(0, 10);
      buckets.set(date, (buckets.get(date) || 0) + size);
    }
    const page = data.pagination || {};
    cursor = page.next_cursor || null;
    if (older || !page.has_more || !cursor) return { buckets, source, complete: true, pages };
    if (pages % 25 === 0) console.error('  volume pages', pages, conditionId.slice(0, 10));
    await sleep(60);
  }
  return { buckets, source, complete: false, pages };
}
