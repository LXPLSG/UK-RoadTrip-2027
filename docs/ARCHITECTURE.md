# Architecture

UK Road Trip 2027 is a dependency-free, offline-first Progressive Web App. It uses ES modules, a single validated JSON document, Local Storage for the working copy and Cache Storage for application assets.

## Boundaries

- `data/versions.json` is the registry and rollback pointer for immutable snapshots under `data/versions/`.
- `data/*.schema.json` defines the registry and trip document contracts.
- `src/js/repository.js` is the only module that reads or writes persisted trip data.
- `src/js/store.js` owns in-memory state and publishes state changes.
- `src/js/router.js` maps hash routes to views without server rewrites.
- `src/js/navigation.js` defines the shared desktop and mobile navigation registry.
- `src/js/theme.js` and `src/js/mode.js` independently resolve appearance and Planning/Travel behavior.
- `src/js/migrations.js` upgrades older working documents before validation and activation.
- `src/js/budget.js` is the shared budget engine for forecasts, actual spend, remaining balance, per-person cost and currency conversion.
- `src/js/notifications.js` owns notification rule generation and provides the future Firebase Cloud Messaging adapter boundary.
- `src/js/views.js` renders domain views and dispatches user intent through the store.
- `src/js/components.js` contains reusable, domain-neutral UI building blocks.
- `src/service-worker.js` owns application asset caching and offline navigation.

Views do not access Local Storage directly. Trip-specific content is never embedded in HTML; generic interface labels remain part of the presentation layer.

## Travel Platform Model

Schema v7 introduces `activeTripId`, `trips`, `travelModules`, reusable travel collections and shared engines. `UK-2027` is the current active Trip ID. Module pages are configured by JSON records and rendered through shared card, table, status and price components, so a future trip can add or remove travel-management areas without introducing itinerary content into `src/`.

The current app keeps one active working trip in Local Storage while preserving a multi-trip registry in the document. A later repository adapter can promote this to full multi-trip switching or IndexedDB storage without changing the view/component contracts.

## Data Flow

1. The repository validates `data/versions.json` and resolves its `activeVersion` entry.
2. The selected immutable snapshot is fetched and validated against application invariants.
3. A valid Local Storage working copy takes precedence over bundled data.
4. The store clones candidate updates before persistence.
5. Successful writes publish a `change` event and trigger the active view to render.
6. Failed writes leave the previous in-memory and persisted state intact.

## Extension Strategy

The repository boundary can later be implemented with IndexedDB or a remote API. Stable entity IDs and schema migrations preserve compatibility. Views consume selectors and store methods rather than persistence details.
