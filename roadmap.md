# FC135 recovery

## Active recovered Home Hero Redesign
- [ ] Restore image-free HomeHero with About Jesup and a prominent FC135 entry; preserve event-scoped branding.
- [ ] Refine network secondary/accent and About wording without adding unverified features or facts.
- [ ] Run existing tests, check automatic build, and verify Home, About, FC135 and mobile; report external access blockers.

## Active reusable Event Experience pass
- [x] Audit existing builder, attendee sections, credentials and integration preparation.
- [x] Complete date-only editing, event organizer/resource links, product descriptions/order, seller configuration editing and active-product section gating; no factual FC135 content added.
- [x] Full test suite: 35 files / 138 tests passed. Automatic build OK; signed-in settings save and private product save/read-back passed and original test product restored.
- [x] External editor-preview home, /events and /events/fc135 return 200 with correct titles/headings. Distinct hosted lovable.app preview remains unverified: direct requests return 401, its viewer times out, and cross-origin browser fetch fails. Hosted status still identifies prior cb4a7475, not this pass.
- [x] Document exact remaining content and integration requirements in docs/FC135_OPERATIONS.md.

## Active external preview repair
- [x] Confirm hosted FC135 HTTP 500 in preview logs; identify browser-configured SSR reads as a deployment-specific failure path (exact underlying provider error not present in logs).
- [x] Move public event reads behind request-scoped anonymous server functions without changing event data or permissions.
- [x] Reproduce hosted 500 in a Worker runtime: occurs exactly when the hosted runtime lacks backend connection settings (inherited project binding). Add publishable fallback to the recovered project.
- [x] Hosted preview build 70c60c19: home, /events and /events/fc135 return 200 in hosted logs, no errors (visual check of the open tab not possible).
- [ ] Platform: re-bind hosted preview/deployment identity (badge points to lost project lovp_0s4ebmzbx19hxvh5nf1270fx8t) and inject this project's server settings — requires Lovable support.

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