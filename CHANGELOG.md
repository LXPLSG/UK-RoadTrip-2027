# Changelog

All notable changes to UK Road Trip 2027 are documented here. The project follows Semantic Versioning and the Keep a Changelog format.

## [Unreleased]

## [1.4.2] - 2026-07-09

### Added

- Added official website quick-access buttons to accommodation hotel options.
- Added nearby-attraction distance rows with Google Maps directions links for accommodation options.
- Added `v0.9` trip snapshot with hotel coordinates, official URLs and attraction mappings.

## [1.4.1] - 2026-07-09

### Changed

- Made Accommodation stop cards open a focused detail view for the selected stop.
- Added three-option accommodation shortlists for every stop in `v0.8`.
- Moved option cards, scoring bars, comparison table and booking tracker fields into the stop detail level.

## [1.4.0] - 2026-07-09

### Added

- Added the top-level Accommodation menu and accommodation planning centre.
- Added `v0.7` trip snapshot with accommodation stops for Bristol, Cotswolds, Windermere, Edinburgh, York and London.
- Added stop cards with images, date ranges, nights, recommendation score, current booking status, booking action and notes.
- Added per-destination hotel comparison tables, ten-part recommendation score bars and booking tracker fields.

## [1.3.0] - 2026-07-09

### Added

- Added schema v9 hotel-selection data with per-location accommodation options, weighted scores, pros, cons and comparison fields.
- Added the Hotels page selection workspace so each stay location shows shortlist options, best-current-fit scoring and a comparison table before the linked overnight placeholders.
- Added `v0.6` trip snapshot with 24 provisional hotel options across the UK route.

## [1.2.4] - 2026-07-09

### Fixed

- Added a browser recovery page for clearing stale service-worker caches when an old app shell hides newer Dashboard features.
- Changed JavaScript and CSS runtime requests to network-first caching so future UI releases appear without manual browser-cache clearing.

## [1.2.3] - 2026-07-09

### Changed

- Made Phase 4 dashboard information explicit with data-driven trip essentials, route, Trip ID, revision and planning-status sections.
- Added `v0.5` trip snapshot with the fixed route stored in JSON for dashboard display.

## [1.2.2] - 2026-07-09

### Fixed

- Added a `v0.3` compatibility bridge for older cached app shells that had already cached a registry pointing to `trip-v0.3.json`.
- Moved the current schema-8 Phase 6 snapshot to `v0.4` so current clients keep the integration architecture while stale clients can recover and update.

## [1.2.1] - 2026-07-09

### Fixed

- Prevented stale cached app shells from failing when the public trip registry advances to a newer schema by splitting the legacy `activeVersion` pointer from the current app `currentVersion` pointer.
- Migrated bundled snapshots before validation so future schema transitions are safer.

## [1.2.0] - 2026-07-09

### Added

- Phase 6 architecture-only provider adapter layer for Google Places, Google Hotels, Booking.com, Expedia, Hotels.com, Airbnb, OpenWeather, Google Maps and Calendar.
- Provider registry and capability contracts so future integrations can be swapped without UI component changes.
- Schema v8 with disabled-by-default integration provider preferences and normalized price-history storage.
- `v0.3` immutable trip snapshot preserving previous `v0.1` and `v0.2` history.
- Accommodation-domain selectors for hotel comparison and booking tracking.
- Price-history utilities for future provider snapshots and trend calculation.
- Admin CMS draft/publish boundary for future authenticated content management.
- Future integration and Admin CMS documentation.

## [1.1.0] - 2026-07-09

### Added

- Phase 5 travel platform model with active Trip ID `UK-2027`, trip summaries and reusable JSON-defined module registry.
- Versioned `v0.2` bundled trip snapshot while preserving `v0.1` as immutable history.
- Generic travel-management module pages for flights, car rental, travel documents, weather, emergency contacts and travel companions.
- Shared budget engine for total budget, actual spend, forecast, remaining balance, per-person estimates, category rollups and static currency conversion.
- Notification infrastructure for price drops, booking windows, cancellation deadlines, countdowns, weather alerts, road closures and reservation reminders, with a future Firebase Cloud Messaging adapter boundary.
- Reusable UI components for comparison tables, budget cards, status chips, timelines, price cards, booking cards, recommendation badges and rating bars.

### Changed

- Separated application code under `src/` from frequently edited trip content, assets and documentation.
- Replaced the mutable bundled trip file with an immutable `v0.1` snapshot and a validated registry for future revisions and rollbacks.
- Budget and dashboard views now consume shared services instead of duplicating forecast calculations.

## [1.0.0] - 2026-07-06

### Added

- Initial offline-first project structure.
- Versioned trip data schema and representative 15-day sample dataset.
- Progressive Web App shell, local assets and installation metadata.
- Light, dark and operating-system theme resolution with persisted preferences.
- Responsive desktop and mobile navigation with route matching and connectivity status.
- Data-derived planning dashboard with trip metrics, readiness and upcoming-day summaries.
- Focused Today view with travel-phase context, schedule, overnight details and emergency contacts.
- Country-filtered full itinerary with route metrics and adjacent-day navigation.
- Dedicated hotel management with overnight linkage, references, parking and booking status.
- Restaurant shortlist and reservation workspace with cuisine, date, time and city filters.
- Attraction and ticket workspace with itinerary linkage, booking requirements and search.
- Offline driving guide with route legs, vehicle details, emergency information and versioned UK road guidance.
- Offline London Tube journey planner with editable routes, accessibility notes and TfL handoff.
- JSON-defined budget categories, editable expenses and linked-place de-duplication.
- Dedicated packing workspace backed by typed JSON checklist groups.
- Searchable, categorized and pinnable trip notes with optional day links.
- Complete settings centre with structured trip editing, System theme, trip modes, migrations and mobile tool access.
- Print-optimized itinerary, day, driving-guide and budget views with paper-safe page breaks.
- Preloaded dimensioned hero media, bounded navigation fallback and fresh-first bundled data caching.
- Keyboard-safe dialogs, valid checklist labeling, assistive segmented controls and forced-color support.
- Hardened semantic validation, legacy country migration, deployment-relative manifest identity and presentation-data separation.
- Scroll-safe desktop navigation for short laptop viewports.

## [0.1.0] - 2026-07-06

### Added

- First production development baseline.
