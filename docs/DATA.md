# Trip Data Guide

`data/trip.json` is the editable bundled dataset and initial source of truth. The application copies it to Local Storage on first use. Later browser edits affect the working copy, not the bundled file.

## Editing

Edit common records through the application. Use the raw JSON editor or import/export tools for bulk changes. Every replacement is validated before activation and the previous working copy is retained as a backup.

## Conventions

- Dates use `YYYY-MM-DD`; timestamps use ISO 8601.
- Every entity has a stable, unique ID.
- Relationships use IDs rather than array indexes.
- Monetary values are numeric and use `trip.homeCurrency` unless otherwise stated.
- Optional external URLs must use `https` where available.
- Unknown or undecided values use empty strings, `null`, `TBC` or a planning status instead of invented confirmation details.

## Schema Evolution

`schemaVersion` changes only when document structure changes. `dataRevision` changes when bundled content changes. Future migrations must be sequential, deterministic and backed up before execution.

Schema version 2 adds `drivingGuide`; schema version 3 adds `tubePlan`. Older working copies are migrated sequentially using reviewed defaults bundled with the application.
