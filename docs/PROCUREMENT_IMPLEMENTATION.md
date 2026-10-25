# JESUP institutional procurement

## Architecture decision

The current paid FC135 path is Eventbrite. JESUP's native Square checkout is disabled. Procurement must therefore be an independently enabled event option, with a configured seller and priced `event_products`; no quote or invoice may infer a price from `ticket_price_label`. A quote never creates a paid credential. Eventbrite purchases remain in Eventbrite and are reconciled through the existing import path.

The existing `events`, `event_products`, `event_registrations`, `event_entitlements`, `institutions`, `event_staff_assignments`, and email queue are reused. The new procurement order owns its line-item price snapshots and buyer/registrant list. It may link to registration IDs once an authorized organizer confirms them. A PO is not treated as payment.

## Delivery order

1. Add private procurement records, institution profiles, event settings, immutable line snapshots, documents, activity log, and payment ledger with strict RLS. Add server-side quote, PO, approval, invoice, and payment transitions.
2. Add event opt-in and priced catalog configuration, buyer quote/PO forms, buyer purchase center, and admin finance review. Keep FC135 off until its seller/payee, price catalog, and organizer approval are recorded.
3. Generate numbered quote and invoice PDFs from server-validated snapshots; use private storage and signed downloads. Add private PO uploads and tokenized buyer links with expiry and revocation.
4. Add idempotent email queue events, due reminders, CSV and aging reports, and integration tests against a disposable Supabase database. Only then enable per-event procurement.

## Release gates

- FC135 JESUP purchase-order sales use HNCH LLC as seller/payee, per the owner's October 25 decision. Eventbrite sales remain with Tuskegee. Remit-to details and pricing still need configuration before enabling PO requests.
- Apply migration only after backup and verify RLS with owner, organizer, institution admin, and unrelated user accounts.
- Test capacity and credential issuance separately from quote/PO approval. Paid or confirmed registration must never be inferred from a quote alone.
- Verify email sender, PDF rendering, storage access, and registration reconciliation before enabling the event option.
- Cloudflare staging currently shares the live Lovable-managed database. Do not create test orders there.

## Current branch status

This branch contains the opt-in schema/RLS, quote and PO transitions, private PO uploads, numbered quote/invoice PDFs, buyer purchase pages, administrator review and event settings, a manual payment ledger, and CSV export. TypeScript, production build, and the existing Vitest suite pass. The migrations have **not** been applied to the shared database, so no public buyer can use this yet.

Before release, complete and test the remaining requirements: institution profile management and dynamic required fields, secure unauthenticated buyer links, vendor document uploads, email notifications and reminders, registration issuance/confirmation after the configured threshold, Square invoice payment links, receipt generation, and full finance/aging filters. The current event registration trigger automatically marks ordinary JESUP registrations as registered, so procurement must not insert attendee registrations until that trigger and the credential rules are updated together. The buyer's requested attendees remain linked to the procurement order meanwhile.

The server document functions require the existing server-side `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL`; neither is placed in client code. Do not enable procurement until those functions have been tested against a disposable database and the deployment's server environment.
