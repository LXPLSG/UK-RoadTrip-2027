# Architecture

UK Road Trip 2027 is a dependency-free, offline-first Progressive Web App. It uses ES modules, a single validated JSON document, Local Storage for the working copy and Cache Storage for application assets.

## Boundaries

- `data/` contains the bundled canonical sample and its schema.
- `js/repository.js` is the only module that reads or writes persisted trip data.
- `js/store.js` owns in-memory state and publishes state changes.
- `js/router.js` maps hash routes to views without server rewrites.
- `js/views.js` renders domain views and dispatches user intent through the store.
- `js/components.js` contains reusable, domain-neutral UI building blocks.
- `service-worker.js` owns application asset caching and offline navigation.

Views do not access Local Storage directly. Trip-specific content is never embedded in HTML; generic interface labels remain part of the presentation layer.

## Data Flow

1. The repository fetches and validates `data/trip.json`.
2. A valid Local Storage working copy takes precedence over bundled data.
3. The store clones candidate updates before persistence.
4. Successful writes publish a `change` event and trigger the active view to render.
5. Failed writes leave the previous in-memory and persisted state intact.

## Extension Strategy

The repository boundary can later be implemented with IndexedDB or a remote API. Stable entity IDs and schema migrations preserve compatibility. Views consume selectors and store methods rather than persistence details.
