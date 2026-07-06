# Production Code Review

## Scope

The review covers data integrity, migration safety, offline behavior, security boundaries, responsive rendering and maintainability.

## Resolved Findings

- Legacy schema version 1 documents now recover missing country fields before current validation.
- Runtime validation checks dates, amounts, IDs, references, configured categories and safe external URL protocols.
- Itinerary length is derived from JSON rather than embedded in presentation code.
- Manifest identity is deployment-relative for root and subdirectory hosting.
- Bundled JSON uses network-first service-worker handling to prevent stale release data.
- Dialog listeners are cleaned up and focus is returned to the triggering control.
- Linked place costs are not counted twice when a ledger expense references the same place.

## Residual Boundaries

- Local Storage is intentionally device-local and does not provide cross-device synchronization.
- External map, TfL and official-guidance links require connectivity; the saved travel plan remains offline.
- Full offline map tiles and live transport disruption data are outside the current storage and API scope.
