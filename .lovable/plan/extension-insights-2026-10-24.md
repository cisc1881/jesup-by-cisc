# Extension Insights

## Focused dashboard
- Add an administrator-only **Extension Insights** page to Command Center’s Analytics navigation.
- Show published, active events and active markets on a free OpenStreetMap map, with a matching accessible place summary. Only valid venue coordinates appear; no individual addresses or attendee identities are returned to this page.
- Provide event date-range and event/market filters. Institution filtering uses only explicit event institution associations; markets without an institution association cannot be attributed to a school.
- Show source-labelled activity metrics: selected event/market records, mapped places, registration records, cancelled registration records and registration records with a recorded check-in. These are not unique people, complete attendance or measured impact.
- Include a data-quality tab for missing/invalid coordinates and missing place/county information, with links to existing event/market administration and clear empty states.

## Data limitations
- Existing event/market models have no dedicated county field. County coverage will be labelled **not recorded**, never derived from venue coordinates or participant records. No county boundaries, geocoding, participant home geography or impact estimates are introduced.
- Date filtering uses event dates (overlap with the selected UTC calendar range); markets remain current active listings, not dated market activity.
- Existing records are reused read-only; no schema changes, payment changes or publication.

## Technical implementation
- Use the inherited admin route gate plus a separately administrator-validated authenticated server function; ordinary reads remain under existing row-level permissions.
- Return narrow venue DTOs and aggregate-only counts, using exact count queries rather than attendee rows. Keep filters in route search parameters and prime TanStack Query from the loader.
- Dynamically load Leaflet behind a browser-only boundary, preserving OpenStreetMap attribution and providing a text equivalent to the map.
- Test eligibility, coordinate validation, date overlap, explicit institution attribution, summary/count semantics and server authorization. Run the full test suite, inspect automatic build results and verify signed-in desktop/phone and unauthorized access.