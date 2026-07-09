# Changelog

All notable changes to UK Road Trip 2027 are documented here. The project follows Semantic Versioning and the Keep a Changelog format.

## [Unreleased]

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
