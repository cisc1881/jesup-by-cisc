# Next increment: Eventbrite ticket-type mapping with admin-reviewed credential issuance

## Why this one
Import, verified-email claim, Wallet, staff scanner and badge print foundations already exist. The gap that blocks real FC135 use: imported Eventbrite attendees carry a `Ticket Type` (read but discarded), so a paid Eventbrite attendee who claims their ticket gets admission only — no meal/activity/parking/guest credentials. Staff then have nothing to redeem. This increment connects paid Eventbrite registrations to Wallet entitlements without any JESUP payment.

Out of scope: native checkout, Square/seller settings, fees, publishing the Eventbrite draft, offline scanning, guest transfers, physical printer confirmation.

## What gets built
1. **Retain ticket type on import** (CSV and API sync, same RPC): store the Eventbrite ticket class name/ID per registration. Not shown publicly.
2. **Admin mapping table** (Event Builder > Operations > "Eventbrite ticket mapping"): each distinct imported ticket type can be mapped to zero or more existing event products with a per-attendee quantity (e.g. "Self meal x2"). Guest products keep their beneficiary rule; the mapping never sets prices or activates inactive products.
3. **Dry-run then explicit issue**: admin previews "N registrations would receive X credentials" (counts only, no names), then confirms. Issuance reuses `issue_event_entitlement` semantics: request ID replay, per-event lock, skip already-issued (idempotent by registration+product+mapping), skip cancelled registrations, never revoke on re-run.
4. **Wallet**: claimed attendees see their ticket type label and mapped credentials (existing QR display); guest-beneficiary credentials show "Guest" label until a name is entered by staff/admin.
5. **Scanner result**: check-in response shows ticket type so staff can confirm admission category.

## Safeguards
- All writes through one admin-only SECURITY DEFINER function with explicit grants; UI gating is not authorization.
- Inactive or unpriced products can only be issued via mapping when the admin ticks the existing "allow unpriced" acknowledgement; no product is activated by this flow.
- No attendee names/emails/barcodes in previews, audit payloads or logs; audit records counts, mapping ID, request ID.
- Cancellation import does not delete issued credentials; it flags them for admin review (existing revoke action).
- FC135 registration stays closed, nine products stay inactive; no FC135 data is imported or issued.

## Technical details
- Migration: add `eventbrite_ticket_class` (text, nullable) to `event_registrations`; new `event_ticket_mappings (event_id, ticket_class, product_id, quantity)` with RLS admin-only + staff read; RPC `issue_mapped_entitlements(p_event_id, p_request_id, p_dry_run, p_allow_unpriced)`; extend `import_eventbrite_registrations` to accept optional `ticket_class` without changing existing matching/protection rules.
- Files: `src/lib/eventbrite-import.ts`, `src/lib/eventbrite-api-sync.ts` (pass ticket class), `src/lib/eventbrite-import.functions.ts`, new `src/lib/ticket-mapping.functions.ts`, `src/components/admin/conference-operations-panel.tsx` (new tab), `src/components/events/conference-wallet.tsx`, `src/lib/conference-operations.functions.ts` (wallet select), `src/routes/_authenticated/events.$id.scan.tsx` (ticket type in result), `docs/FC135_OPERATIONS.md`, `roadmap.md`, `AGENTS.md` rule.
- Tests (vitest, next to existing): ticket class carried by CSV and API normalizers; mapping quantity validation; dry-run returns counts only; re-run issues nothing new; cancelled registrations skipped; inactive product refused without acknowledgement; non-admin rejected. Plus DB verification on a private test event (deleted afterward), full suite and build.
