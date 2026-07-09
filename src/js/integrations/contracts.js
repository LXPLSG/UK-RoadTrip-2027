/** Provider-neutral contracts for future online travel integrations. */
export const CAPABILITIES = Object.freeze({
  places: 'places.search',
  hotels: 'hotels.search',
  hotelComparison: 'hotels.compare',
  bookingTracker: 'bookings.track',
  weather: 'weather.forecast',
  maps: 'maps.route',
  calendar: 'calendar.event',
  priceHistory: 'prices.history'
});

export class IntegrationError extends Error {
  constructor(providerId, capability, message = 'Provider capability is not configured.') {
    super(message);
    this.name = 'IntegrationError';
    this.providerId = providerId;
    this.capability = capability;
  }
}

export function emptyResult(providerId, capability, reason = 'Provider adapter is architecture-only.') {
  return Object.freeze({
    ok: false,
    providerId,
    capability,
    reason,
    items: [],
    fetchedAt: null
  });
}

export function successResult(providerId, capability, items = [], meta = {}) {
  return Object.freeze({
    ok: true,
    providerId,
    capability,
    items,
    fetchedAt: new Date().toISOString(),
    meta
  });
}

export function assertAdapter(adapter) {
  if (!adapter?.id || !adapter?.name || !Array.isArray(adapter.capabilities)) {
    throw new TypeError('Integration adapters require id, name and capabilities.');
  }
  return adapter;
}
