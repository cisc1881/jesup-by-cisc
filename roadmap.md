# FC135 recovery

## Active second increment
- [ ] Inspect dormant schema and existing import, auth, meal, QR and badge systems.
- [ ] Harden claiming, issuance, staff operations and audit/replay safeguards.
- [ ] Add admin catalog, entitlement issuance, staff settings and disabled seller configuration.
- [ ] Add gated Wallet/claim UI and event-scoped staff scanner/badge tools.
- [ ] Run focused tests and verify authenticated flows, public shell and current build.

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
- Checkout, seller OAuth/onboarding implementation and payment processing remain deferred.
- Confirm schedule, speakers, registration details, sponsors, maps, and resources before enabling their sections.
- Publication and domain changes remain prohibited for this recovery pass.