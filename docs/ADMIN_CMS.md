# Admin CMS Architecture

The Admin CMS is an architecture boundary for future authenticated editing. Phase 6 does not add a separate admin screen or server. It adds `src/js/admin-cms.js`, a draft/publish service that works against the same validated JSON document used by the app.

## Goals

- Keep trip content editable without changing application code.
- Validate every draft before publishing.
- Support future authentication, role controls and cloud storage without changing view components.
- Preserve the existing versioned JSON workflow for rollback.

## Draft Flow

1. Load the active working trip document.
2. Create an `AdminCmsDraft`.
3. Edit named collections such as `places`, `flights`, `carRentals`, `travelDocuments`, `expenses`, `weather`, `travelCompanions` or `notes`.
4. Validate with `validateTripData`.
5. Publish a complete replacement JSON document.

## Future Extension Points

- Authenticated cloud CMS backed by the same schema.
- Draft review and approval status.
- Attachment storage through IndexedDB or cloud object storage.
- Provider import review queues for hotels, weather, maps and calendar events.
- Version creation workflow that writes a new immutable `data/versions/trip-v0.x.json` snapshot.

## Non-Goals For Phase 6

- No live admin login.
- No remote writes.
- No provider API calls.
- No change to existing user-facing editing behavior.
