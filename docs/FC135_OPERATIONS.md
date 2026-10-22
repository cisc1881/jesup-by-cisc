# FC135 catalog and credential increment

## Implemented
- Event-scoped admin product catalog: ticket, meal, activity, parking, sponsor and company packages; self, guest and company beneficiaries; nullable cents price, capacity and active state.
- Explicit administrator-only issuance/revocation. Unpriced issuance requires an explicit approval flag; no automatic entitlements from imports or registration. Product capacity is serialized under a database lock.
- Owner-only Wallet lists the linked admission QR, issued credentials and redemption counts. Guest/company credentials remain attached to the attendee's existing registration; no purchase flow is enabled.
- Eventbrite claim requires signed-in database-confirmed email and exact original Eventbrite barcode, with a row lock, per-account lock, consumed claim fields and the existing unique event/user constraint. Email-only claim is deprecated and execution revoked. Import updates no longer overwrite an account claimed during sync.
- Event staff assignment roles: checkin, redemption, badge and manager. Explicit event operations enablement plus database authorization applies to every staff RPC.
- Admission check-in is idempotent; entitlement/legacy meal consumption is quantity-limited and locked. Staff requests have idempotency keys with an audit ledger. Badge issuance allows one current badge per registration through the locked operation path; printing records an issuance request, not physical printer success.
- Existing admin attendance/meal infrastructure is preserved. Event-scoped scanner supports admission, entitlement, configured legacy meal redemption and badge print.

## Configuration
Admin event editor → Conference operations manages products, credentials, assignments and non-secret seller identifiers/fees. Conference shell toggles separately enable catalog, claiming, Wallet and staff operations; section toggles are still required for public navigation. FC135 remains Home-only by default.

## Reusable Event Experience configuration
- Basics supports a date-only mode with inclusive first/last dates. Saving converts these into event-timezone midnight boundaries, with the end exclusive; timed events and sessions retain timezone-aware conversion.
- Conference shell supports an event-specific organizer label, existing theme presets, map/parking links, and named HTTPS resource links. No FC135 links or organizer content are seeded by this pass.
- Catalog products support descriptions and display order as well as category, self/guest/company beneficiary, price, capacity and active state. Editing preserves descriptions rather than erasing them. Tickets remain hidden for an empty enabled catalog unless registration or confirmed Eventbrite settings provide content.
- Public catalog reads use the same request-scoped anonymous connection pattern as event reads. Resource links require a nonempty label, HTTPS URL, and explicit section enablement. Settings-only saves preserve unrelated current metadata and reject concurrent changes.
- Existing disabled Square configuration can be loaded into the editor before changing merchant, location, application and fee identifiers. This is not seller onboarding or payment authorization.

## Still required from organizers / integrations
- Confirmed session titles, dates/times, locations and speakers; speaker bios/photos only if supplied.
- Ticket/add-on names, prices or approved free issuance, beneficiary rules, quantities/capacities, meal/activity service windows, parking policy, sponsor/company package contents and confirmed sponsors/exhibitors.
- Approved event artwork, registration provider/URL/Eventbrite ID, campus/parking links, resource links, and explicit decisions to enable community, My Event, Wallet, catalog, claiming and staff operations.
- Eventbrite provider credentials and live import verification, product mapping and automatic entitlement issuance are not supplied in this pass.
- Square legal seller/account/location/currency consent, reviewed OAuth/token handling, application-fee eligibility and consent, priced orders/reservations/webhooks/refunds/reconciliation and sandbox testing remain future work. No payment credentials are requested or stored here.
- Physical badge printing, reprint workflow, camera hardware verification, offline scanning, bulk issuance and guest-account transfers remain deferred.

## Square remains non-live
Seller records retain merchant, location, application and application-fee fields only. The database forbids live payments. No checkout, secrets, OAuth tokens, payment requests or fund movement exist in this increment.
Required before a future payment pass:
1. Confirm the legal seller, Square account and eligible locations/currency.
2. Obtain seller consent through a reviewed per-seller OAuth onboarding flow, with secure token storage and revocation/refresh handling.
3. Confirm Square application approval/eligibility for application fees, fee recipient and contractual consent; choose percentage/fixed rules and refund treatment.
4. Implement server-validated priced orders, inventory reservation, payment idempotency, signed webhooks, reconciliation and refunds; test sandbox before any separate live approval.

## Deferred
Checkout/payment processing; seller OAuth and live onboarding; automatic Eventbrite product mapping/entitlement issuance; guest account transfer; badge printer integration/reprint UI; offline scanning and bulk issuance; confirmed FC135 product names/prices and service windows. No unconfirmed products are seeded into FC135.

## Verification boundaries
Reusable configuration pass: the full existing suite passed (35 files, 138 tests). Administrator browser checks saved the existing FC135 shell settings unchanged, confirmed its February 18–19 date-only inputs, saved/read back description and order on an existing private verification product, then restored the original product. Public FC135 remained Home-only; Programs, Publications and Markets loaded without page errors. Automatic preview build reported build OK. External editor-preview requests on the project’s lovableproject.com origin returned 200 for Home, Events and FC135, with correct titles/headings. The separate hosted lovable.app preview returned 401 to direct requests; its viewer did not respond, cross-origin browser fetching failed, and hosted build status still named the prior cb4a7475 version. This pass is not verified on that distinct hosted deployment. No publication/domain change, new factual FC135 content, or RLS/schema change was made.

Authenticated administrator verification exercised actual database issuance, unpriced approval/capacity rejection, request retries, redemption replay rejection, repeat check-in, badge duplicate rejection, and verified-email/barcode claiming. Browser verification read the claimed admission QR through Wallet and checked the scanner error path and admin controls. FC135 settings were restored and test registrations removed; isolated verification events remain draft/inactive with audit records. Camera/printer hardware, live Eventbrite API imports, a separate non-admin staff session, and legacy meal redemption with configured meal data remain unverified.
