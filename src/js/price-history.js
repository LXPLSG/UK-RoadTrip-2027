/** Price-history utilities for future provider snapshots and local comparisons. */
export function priceHistoryFor(data, itemId) {
  return (data.priceHistory || [])
    .filter(point => point.itemId === itemId)
    .sort((a, b) => `${a.capturedAt}`.localeCompare(`${b.capturedAt}`));
}

export function latestPrice(data, itemId) {
  return priceHistoryFor(data, itemId).at(-1) || null;
}

export function priceTrend(data, itemId) {
  const points = priceHistoryFor(data, itemId);
  if (points.length < 2) return { direction: 'flat', delta: 0, points };
  const first = Number(points[0].amount || 0);
  const latest = Number(points.at(-1).amount || 0);
  const delta = latest - first;
  return {
    direction: delta < 0 ? 'down' : delta > 0 ? 'up' : 'flat',
    delta,
    points
  };
}

export function appendPricePoint(data, { itemId, providerId, amount, currency, capturedAt = new Date().toISOString(), url = '' }) {
  const next = structuredClone(data);
  next.priceHistory = Array.isArray(next.priceHistory) ? next.priceHistory : [];
  next.priceHistory.push({ id: `price-${Date.now().toString(36)}`, itemId, providerId, amount: Number(amount || 0), currency, capturedAt, url });
  return next;
}
