# Product TODO

This file tracks deliberate follow-up work, not defects required for the current release.

## Next Release

- Add full multi-trip switching UI on top of the schema v7 Trip ID registry.
- Add an IndexedDB repository adapter for large attachments, documents and offline map regions.
- Add encrypted cloud synchronization after an account model is defined.
- Add calendar export for confirmed activities and bookings.
- Implement live provider adapters behind the Phase 6 registry for weather, maps, hotels, bookings, flight status and exchange rates.
- Add Firebase Cloud Messaging delivery after notification permissions and account strategy are defined.
- Build the authenticated Admin CMS UI on top of the Phase 6 draft/publish service.

## Product Decisions Needed

- Confirm the final traveler names, dates and route.
- Confirm whether expense entry should support multiple source currencies beyond the current planning converter.
- Select preferred map and live transit providers for optional online integrations.
- Confirm API access approach, provider terms, attribution requirements and rate-limit budgets before enabling live integrations.
