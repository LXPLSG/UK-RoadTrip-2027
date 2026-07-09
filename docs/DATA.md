# Trip Data Guide

`data/versions.json` is the bundled version registry. Its `activeVersion` points to an immutable trip snapshot in `data/versions/`, which the application copies to Local Storage on first use. Later browser edits affect the working copy, not the bundled snapshot.

## Editing

Edit common records through the application. Use the raw JSON editor or import/export tools for bulk changes. Every replacement is validated before activation and the previous working copy is retained as a backup.

## Creating a Version

1. Copy the active snapshot to the next sequential name, for example `data/versions/trip-v0.3.json`.
2. Make itinerary changes only in the new file.
3. Increment `dataRevision` and update `lastUpdated` in the snapshot.
4. Add a matching registry entry with a concise change summary.
5. Set `activeVersion` to the new version and run `node tests/validate-data.mjs`.

Committed snapshots are immutable history. To revert the bundled itinerary, change only `activeVersion` to an earlier registered entry. On an existing device, use **Settings → Restore bundled data** to replace its retained working copy after deployment; the current copy is backed up first. Schema changes are independent: they require a schema version increment and application migration, while ordinary itinerary refinements do not.

## Conventions

- Dates use `YYYY-MM-DD`; timestamps use ISO 8601.
- Every entity has a stable, unique ID.
- Relationships use IDs rather than array indexes.
- Monetary values are numeric and use `trip.homeCurrency` unless otherwise stated.
- Optional external URLs must use `https` where available.
- Unknown or undecided values use empty strings, `null`, `TBC` or a planning status instead of invented confirmation details.

The active Phase 5 baseline is `data/versions/trip-v0.2.json`; the next itinerary refinement should normally be `trip-v0.3.json`.

## Platform Fields

- `activeTripId` identifies the currently loaded trip. The UK trip is `UK-2027`.
- `trips` stores trip summaries for reusable multi-trip support.
- `travelModules` defines generic module pages such as flights, car rental, documents, weather, emergency contacts and companions.
- `flights`, `carRentals`, `travelDocuments`, `weather`, `travelCompanions` and `notifications` are reusable collections that can be populated over time.
- `currencyRates` supports the shared budget converter. Bundled rates are static planning values, not live financial data.

## Schema Evolution

`schemaVersion` changes only when document structure changes. `dataRevision` increments for each bundled content snapshot. The human-readable `v0.x` identifier records itinerary history and is managed by the registry. Future schema migrations must be sequential, deterministic and backed up before execution.

Schema version 2 adds `drivingGuide`; version 3 adds `tubePlan`; version 4 adds budget categories; version 5 types checklist groups; version 6 adds categorized notes; version 7 adds the travel platform model, Trip ID registry, reusable modules, shared budget categories, currency rates and notification infrastructure. Older working copies are migrated sequentially using reviewed defaults bundled with the application.
