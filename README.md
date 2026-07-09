# UK Road Trip 2027

A dependency-free, offline-first Progressive Web App for planning and taking a 15-day UK self-drive holiday.

## Features

- Planning dashboard and focused Travel Mode Today view.
- Editable itinerary, activities, hotels, restaurants and attractions.
- Accommodation planning centre with stop cards, hotel images, hotel comparison tables, weighted scoring and booking tracker fields.
- Reusable travel-management modules for flights, car rental, documents, weather, emergency contacts and companions.
- Active Trip ID model (`UK-2027`) with a versioned registry ready for future trips.
- Offline driving guide and saved London Tube journeys.
- Shared budget engine for total budget, actual spend, forecast, remaining balance, per-person cost and currency conversion.
- Notification infrastructure for countdowns, reminders, alerts and future Firebase Cloud Messaging integration.
- Architecture-only adapter layer for future Google Places, Google Hotels, Booking.com, Expedia, Hotels.com, Airbnb, OpenWeather, Google Maps and Calendar integrations.
- Admin CMS draft/publish boundary and normalized price-history model for future provider imports.
- Expense tracking, packing, checklists and notes.
- Light, dark and System themes with responsive phone, tablet and desktop layouts.
- Validated JSON import/export, automatic backups and sequential schema migrations.
- Installable PWA behavior, complete offline reloads and print-ready travel views.

## Run locally

Serve the project root over HTTP. ES modules and service workers do not run reliably from a `file://` URL.

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173/src/`.

For production, deploy the project directory to any HTTPS static host and use `/src/` as the application URL. No build step or server-side rewrite is required because navigation uses URL hashes.

Run dependency-free production checks with:

```sh
node tests/validate-data.mjs
```

## Trip data

`data/versions.json` selects the active immutable snapshot under `data/versions/`. On first launch, the app validates and copies that snapshot to namespaced Local Storage. Later browser edits affect the working copy, so deploying a new snapshot does not silently overwrite a traveler's changes.

To refine the itinerary, copy the active snapshot to the next filename such as `trip-v0.3.json`, update its `dataRevision` and `lastUpdated`, then register it and set `activeVersion` in `data/versions.json`. Revert by selecting an earlier registered version; existing devices can then activate it with **Settings → Restore bundled data**. Existing version files must not be edited after commit.

The current bundled planning snapshot is `UK-2027` in `data/versions/trip-v0.7.json`; `activeVersion` remains pointed at the legacy-safe baseline for older cached app shells while current clients read `currentVersion`. Future trips should receive their own stable Trip ID and be added to the same schema rather than changing application code.

Use **Settings → Trip JSON** for direct edits, or import/export a complete JSON backup. Restoring bundled data creates a backup of the current working copy first.

## Repository boundaries

- `src/` contains application code and PWA runtime files; it changes infrequently.
- `data/` contains the version registry, immutable trip snapshots and schemas; it is the frequent-edit boundary.
- `assets/` contains images, icons and future offline maps.
- `docs/` contains architecture, data, accessibility, performance and review documentation.

## Offline behavior

The service worker precaches the complete app shell, every registered trip snapshot, icons and local hero image. External map and website links remain optional online actions; all core itinerary, place, budget and checklist information stays available offline.

If a browser ever shows an older interface after deployment, open `/src/recover.html` once to clear the old offline shell and reload the latest app.

Install from the browser’s application menu on desktop. On iPhone or iPad, open the site in Safari and use **Share → Add to Home Screen**.

## Printing

Use the print action on the itinerary, day, driving guide or budget. Application navigation and editing controls are automatically removed from paper and PDF output.

## Engineering documentation

- `docs/ARCHITECTURE.md` explains module boundaries and data flow.
- `docs/DATA.md` documents editing and schema migration conventions.
- `docs/INTEGRATIONS.md` documents the future provider adapter architecture.
- `docs/ADMIN_CMS.md` documents the draft/publish boundary for future CMS work.
- `docs/PERFORMANCE.md` defines the production performance budget.
- `docs/ACCESSIBILITY.md` records the WCAG-oriented review and verification checklist.
- `docs/REVIEW.md` records production code-review findings and residual boundaries.

See `CHANGELOG.md` for release history and `TODO.md` for explicitly deferred extensions.
