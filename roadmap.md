# FC135 recovery

## Active second increment
- [x] Inspect dormant schema and existing import, auth, meal, QR and badge systems.
- [x] Harden claiming, issuance, staff operations and audit/replay safeguards.
- [x] Add admin catalog, entitlement issuance, staff settings and disabled seller configuration.
- [x] Add gated Wallet/claim UI and event-scoped staff scanner/badge tools.
- [x] Run focused tests and verify authenticated flows, public shell and current build.

- [x] Inspect recovered event data, schema, auth, and reusable conference infrastructure.
- [x] Publish FC135 and move other public events to draft, preserving records.
- [x] Add branded conference shell with admin-controlled sections and homepage entry.
- [x] Narrow delivery to visibility and shell; defer ticket/payment/staff features and remove new scanner surface.
- [x] Verify tests, preview, and current build signals; document exact remaining work.

## Verification
- Second increment: authenticated database checks passed for unpriced approval, capacity, issue retries, redemption retries/replay rejection, repeat admission, duplicate badge prevention, incorrect claim rejection, verified-email/barcode claim and duplicate claim prevention.
- Browser read-back confirmed admission QR in Wallet, invalid scanner credential rejection, admin catalog/staff/seller screens, Home-only public FC135, and no page errors. Verification records are non-public and retained inactive for audit; FC135 test registration was removed and section settings restored.
- Physical camera/printer hardware, live Eventbrite provider import, and a separate non-admin staff account are not end-to-end verified.
- Four focused test files passed: 18 tests in the second increment (15 in the first).
- Latest automatic build reports build OK.
- Browser checks passed for public FC135, mobile layout, calendar download, signed-in event view, and admin settings save/read-back; no page errors or failed data requests on the final run.
- Events list contains only FC135; six earlier event records remain draft/inactive with prior publication settings preserved.
- Programs, Publications, and Markets pages still open.
- Project changes are saved by managed version history; no manual Git commit or deployment was performed.

## Subsequent passes (outside this increment)
- Checkout, seller OAuth/onboarding implementation and payment processing remain deferred.
- Confirm schedule, speakers, registration details, sponsors, maps, and resources before enabling their sections.
- Publication and domain changes remain prohibited for this recovery pass.