# Performance Budget

The application is designed for a trip-sized local dataset and immediate cached startup on contemporary mobile devices.

## Budgets

- Initial HTML, CSS and JavaScript source: below 250 KB uncompressed.
- Bundled trip JSON: below 100 KB.
- Largest visual asset: below 750 KB.
- No third-party runtime requests, fonts or scripts.
- No horizontal layout shift from fixed-format images or controls.
- Cached core-view startup target: under two seconds on mid-range mobile hardware.

## Strategy

The hero image is dimensioned, preloaded and decoded asynchronously. ES modules allow browser-level dependency scheduling. Static assets use cache-first delivery; bundled trip JSON uses network-first delivery so app releases cannot be trapped behind an older asset cache. Navigation falls back to cached HTML after a short network timeout.

Performance is reviewed using real desktop and mobile browser rendering, offline reloads and source-size checks. The dataset is intentionally small enough for validated full-document Local Storage writes; IndexedDB becomes appropriate when attachments or multiple trips are introduced.
