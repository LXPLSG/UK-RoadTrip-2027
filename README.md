# UK Road Trip 2027

A dependency-free, offline-first Progressive Web App for planning and taking a 15-day UK self-drive holiday.

## Run locally

Serve the project root over HTTP. ES modules and service workers do not run reliably from a `file://` URL.

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Trip data

`data/trip.json` is the bundled canonical dataset. On first launch, the app copies it to namespaced Local Storage. Later edits are saved to that working copy so updating deployed files does not overwrite a traveler's changes.

Use **Settings → Trip JSON** for direct edits, or import/export a complete JSON backup. Restoring bundled data creates a backup of the current working copy first.

## Offline behavior

The service worker precaches the complete app shell, trip JSON, icons and local hero image. External map and website links remain optional online actions; all core itinerary, place, budget and checklist information stays available offline.

## Printing

Use the print action on the itinerary, day, driving guide or budget. Application navigation and editing controls are automatically removed from paper and PDF output.

## Engineering documentation

- `docs/ARCHITECTURE.md` explains module boundaries and data flow.
- `docs/DATA.md` documents editing and schema migration conventions.
- `docs/PERFORMANCE.md` defines the production performance budget.
