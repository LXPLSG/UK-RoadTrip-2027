# Future API Integrations

Phase 6 prepares provider interfaces only. The application still runs entirely from local JSON and does not call external APIs, store API keys or require network access for core functionality.

## Adapter Pattern

Provider-specific code lives behind `src/js/integrations/`.

- `contracts.js` defines capability names, result envelopes and integration errors.
- `adapters.js` declares architecture-only adapters for Google Places, Google Hotels, Booking.com, Expedia, Hotels.com, Airbnb, OpenWeather, Google Maps and Calendar.
- `registry.js` selects providers by capability rather than by UI component.
- `index.js` builds the default registry.

UI components should depend on capabilities such as `hotels.compare`, `weather.forecast` or `calendar.event`. They should not import a concrete provider such as `BookingComAdapter`.

## Prepared Providers

| Provider | Prepared Capabilities | Notes |
| --- | --- | --- |
| Google Places | Place search | Future attraction, restaurant and place-detail enrichment. |
| Google Hotels | Hotel search, hotel comparison, price history | Future accommodation discovery and comparison. |
| Booking.com | Hotel search, hotel comparison, booking tracking, price history | Future accommodation and booking-state provider. |
| Expedia | Hotel search, hotel comparison, booking tracking, price history | Future package and accommodation provider. |
| Hotels.com | Hotel search, hotel comparison, booking tracking, price history | Future hotel and rewards-oriented provider. |
| Airbnb | Stay search, comparison, price history | Future alternative accommodation provider. |
| OpenWeather | Forecasts and weather alerts | Future daily weather and alert provider. |
| Google Maps | Routes, distance, traffic | Future mapping and drive-time provider. |
| Calendar | Event creation/export | Future local or cloud calendar export. |

## Data Contracts

Schema v8 adds:

- `integrations.enabled`: feature flag for live provider use.
- `integrations.defaultProviders`: capability-to-provider preferences.
- `priceHistory`: normalized price snapshots from any provider.

The active bundled snapshot is `data/versions/trip-v0.3.json`. Existing `v0.1` and `v0.2` snapshots remain immutable history and migrate forward during validation.

## Implementation Rules

- Keep provider credentials outside versioned JSON and source code.
- Add live adapters as new classes that implement the existing method names.
- Normalize provider responses before they reach views or reusable components.
- Cache only normalized trip-safe data, not raw provider payloads.
- Treat provider terms, rate limits, consent and attribution as release blockers before enabling live calls.
- Use `integrations.enabled` as the guardrail for production API behavior.

## UI Independence

The Accommodation module, Hotel Comparison, Booking Tracker, Budget Dashboard and Price History should consume shared services and normalized data. Provider swaps should not require changes to cards, tables, route views or print styles.
