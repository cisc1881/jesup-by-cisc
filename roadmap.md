# FC135 first shippable increment

- [x] Inspect recovered event data, schema, auth, and reusable conference infrastructure.
- [x] Publish FC135 and move other public events to draft, preserving records.
- [x] Add branded conference shell with admin-controlled sections and homepage entry.
- [x] Narrow delivery to visibility and shell; defer ticket/payment/staff features and remove new scanner surface.
- [x] Verify tests, preview, and current build signals; document exact remaining work.

## Verification
- Four focused test files passed: 15 tests.
- Latest automatic build reports build OK.
- Browser checks passed for public FC135, mobile layout, calendar download, signed-in event view, and admin settings save/read-back; no page errors or failed data requests on the final run.
- Events list contains only FC135; six earlier event records remain draft/inactive with prior publication settings preserved.
- Programs, Publications, and Markets pages still open.
- Project changes are saved by managed version history; no manual Git commit or deployment was performed.

## Subsequent passes (outside this increment)
- Ticket/add-on/payment/staff workflows remain deferred; previously applied foundation schema is dormant, not a delivered workflow.
- Confirm schedule, speakers, registration details, sponsors, maps, and resources before enabling their sections.
- Publication and domain changes remain prohibited for this recovery pass.