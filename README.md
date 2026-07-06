# UK Road Trip 2027

A dependency-free, offline-first Progressive Web App for planning and taking a 15-day UK self-drive holiday.

## Features

- Planning dashboard and focused Travel Mode Today view.
- Editable itinerary, activities, hotels, restaurants and attractions.
- Offline driving guide and saved London Tube journeys.
- Budget planning, expense tracking, packing, checklists and notes.
- Light, dark and System themes with responsive phone, tablet and desktop layouts.
- Validated JSON import/export, automatic backups and sequential schema migrations.
- Installable PWA behavior, complete offline reloads and print-ready travel views.

## Run locally

Serve the project root over HTTP. ES modules and service workers do not run reliably from a `file://` URL.

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

For production, deploy the project directory to any HTTPS static host. No build step or server-side rewrite is required because navigation uses URL hashes.

Run dependency-free production checks with:

```sh
node tests/validate-data.mjs
```

## Trip data

`data/trip.json` is the bundled canonical dataset. On first launch, the app copies it to namespaced Local Storage. Later edits are saved to that working copy so updating deployed files does not overwrite a traveler's changes.

Use **Settings → Trip JSON** for direct edits, or import/export a complete JSON backup. Restoring bundled data creates a backup of the current working copy first.

## Offline behavior

The service worker precaches the complete app shell, trip JSON, icons and local hero image. External map and website links remain optional online actions; all core itinerary, place, budget and checklist information stays available offline.

Install from the browser’s application menu on desktop. On iPhone or iPad, open the site in Safari and use **Share → Add to Home Screen**.

## Printing

Use the print action on the itinerary, day, driving guide or budget. Application navigation and editing controls are automatically removed from paper and PDF output.

## Engineering documentation

- `docs/ARCHITECTURE.md` explains module boundaries and data flow.
- `docs/DATA.md` documents editing and schema migration conventions.
- `docs/PERFORMANCE.md` defines the production performance budget.
- `docs/ACCESSIBILITY.md` records the WCAG-oriented review and verification checklist.
- `docs/REVIEW.md` records production code-review findings and residual boundaries.

See `CHANGELOG.md` for release history and `TODO.md` for explicitly deferred extensions.
