# FC135 catalog and credential increment

## Implemented
- Event-scoped admin product catalog: ticket, meal, activity, parking, sponsor and company packages; self, guest and company beneficiaries; nullable cents price, capacity and active state.
- Explicit administrator-only issuance/revocation. Unpriced issuance requires an explicit approval flag; no automatic entitlements from imports or registration. Product capacity is serialized under a database lock.
- Owner-only Wallet lists issued credentials and redemption counts. Guest/company credentials remain attached to the purchasing attendee's existing registration.
- Eventbrite claim requires signed-in database-confirmed email and exact original Eventbrite barcode, with a row lock, per-account lock, consumed claim fields and the existing unique event/user constraint. Email-only claim is deprecated and execution revoked. Import updates no longer overwrite an account claimed during sync.
- Event staff assignment roles: checkin, redemption, badge and manager. Explicit event operations enablement plus database authorization applies to every staff RPC.
- Admission check-in is idempotent; entitlement/legacy meal consumption is quantity-limited and locked. Staff requests have idempotency keys with an audit ledger. Badge issuance allows one current badge per registration through the locked operation path; printing records an issuance request, not physical printer success.
- Existing admin attendance/meal infrastructure is preserved. Event-scoped scanner supports admission, entitlement, configured legacy meal redemption and badge print.

## Configuration
Admin event editor → Conference operations manages products, credentials, assignments and non-secret seller identifiers/fees. Conference shell toggles separately enable catalog, claiming, Wallet and staff operations; section toggles are still required for public navigation. FC135 remains Home-only by default.

## Square remains non-live
Seller records retain merchant, location, application and application-fee fields only. The database forbids live payments. No checkout, secrets, OAuth tokens, payment requests or fund movement exist in this increment.
Required before a future payment pass:
1. Confirm the legal seller, Square account and eligible locations/currency.
2. Obtain seller consent through a reviewed per-seller OAuth onboarding flow, with secure token storage and revocation/refresh handling.
3. Confirm Square application approval/eligibility for application fees, fee recipient and contractual consent; choose percentage/fixed rules and refund treatment.
4. Implement server-validated priced orders, inventory reservation, payment idempotency, signed webhooks, reconciliation and refunds; test sandbox before any separate live approval.

## Deferred
Checkout/payment processing; seller OAuth and live onboarding; automatic Eventbrite product mapping/entitlement issuance; guest account transfer; badge printer integration/reprint UI; offline scanning and bulk issuance; confirmed FC135 product names/prices and service windows. No unconfirmed products are seeded into FC135.
