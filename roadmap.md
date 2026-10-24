# FC135 recovery

## Extension Insights
- [ ] Implement read-only admin coverage map, place summary, source-labelled activity counts, filters and data quality.
- [ ] Verify authorization, data semantics, full tests, automatic build and signed-in desktop/mobile; do not publish.

## Home carousel automatic rotation
- [x] Added seven-second rotation, interaction/visibility/reduced-motion pauses, manual timer reset and quiet announcements. All 239 tests and automatic build passed; desktop (1280px) and phone (390px) rotation, focus pause, reduced motion, manual controls and uncropped artwork verified without overflow or page errors; nothing published.

## Updated About JESUP artwork (2026-10-24)
- [x] Replaced only the About slide asset; wagon and portrait remain uncropped above high-contrast HTML text. Desktop (1280px) and phone (390px) screenshots inspected; carousel navigation and About link passed with no page errors or overflow. All 229 tests passed and automatic build OK; nothing published.

## Eventbrite ticket-type mapping
- [x] Store ticket type on import; admin mapping to products; counts-only preview and idempotent admin issuance; Wallet/scanner show ticket type. Verified on a rolled-back private test event.

## Confirmed FC135 Eventbrite direction
- [x] Clarified Tuskegee Eventbrite proceeds and separate HNCH vendor payment in operations documentation and admin settings; FC135 seller tab no longer offers Square fee configuration. Import/claim and nine inactive products preserved.
- [x] Shared resolver gates public registration links on organizer-confirmed publication, authorization, matching Eventbrite URL/ID and enabled registration status. FC135 provider set to Eventbrite, draft URL cleared, draft/unauthorized status recorded; native registration and checkout remain disabled.
- [x] All 193 tests passed (including six new authorization/visibility checks); automatic build OK. Local desktop/mobile FC135 shows no purchase link or Tickets tab, no page errors or overflow. Database read-back confirms closed registration, nine inactive products and no seller connection. Organizer publication/payout verification and authenticated admin visual read-back were not attempted; no deployment or external payment changes.

## Guest gradient reference
- [x] Match gradu.png through shared diagonal CSS gradients for splash/entry and scrim-protected Home, banners and accent buttons; preserve neutral cards and selection-only school palettes. Removed maroon program overlays and gradient placeholders; repaired local gradient aliases and foreground pairing for selected-school dark controls.
- [x] Full suite: 40 files / 164 tests passed; automatic build OK. Desktop/mobile guest light/dark and selected Tuskegee across entry, Home, Programs, Partners, FC135 and TUAIC: 288 rendered contrast checks, minimum 5.04:1, no page errors or horizontal overflow. Splash/reference is a CSS approximation of supplied samples; no bitmap shipped.
- [ ] Authenticated admin visual check blocked: authorized session mint failed with gateway_error and no cached session exists; shared admin banner/button tokens inspected but signed-in rendering unverified. External preview still HTTP 401 Unauthorized; no publication/domain/data/auth/RLS changes.

## Selection-only themes and session entry
- [x] Replaced ownership-driven branding with profile/explicit guest school selection; all unselected pages inherit splash-palette gradient (lightened for readable text) and neutral controls. Header guest school picker switches/resets school for the session; featured content inherits it. Event metadata remains unchanged.
- [x] First anonymous session shows splash then existing /auth sign-in/create-account screen with Continue as guest; session choice preserves safe public path/query/hash. Signed-in users bypass; reduced motion shortens the splash without animation. Reset/invite/OAuth return parameters bypass entry; invite/recovery type keeps password setup open. Public loaders and permissions unchanged.
- [x] 40 files / 164 tests passed; automatic build OK; desktop/mobile fresh/repeat guest, public deep link, Tuskegee→Alcorn→network school switching, authenticated admin, reduced motion, reset form, invite-type and OAuth-error bypass verified with no page errors. Mobile light/dark choice/screens inspected; 148 sampled page contrast pairs passed, minimum 6.01:1. Real email/token redemption and provider roundtrips were not attempted; external preview remains 401 Unauthorized and externally unverified. No auth/RLS/data/live deployment changes.

## Institution-aware colors and contrast
- [x] Resolve explicit event branding, owner name or single institution ID before profile personalization; scoped layout tokens replace root mutations. FC135 preset and verified CISC-source program presentation use Tuskegee without login. Missing/multiple ownership stays network rather than inferred from location/name. Eight official programs lack normalized owner IDs; CISC provenance is presentation attribution only, not a data/filter change.
- [x] Fixed shared button/banner/filter/card/navigation foreground pairs, solid secondary hover backgrounds, visible focus, independent dark-mode banner pairs, network teal gradient and Tuskegee featured-entry scope. Home hero follows selected institution when present. Auth/admin/data/RLS unchanged.
- [x] Full suite 39 files / 154 tests passed; automatic build OK. Desktop/mobile light/dark checks for Home, Programs, Partners, FC135, TUAIC and authenticated Admin: 148 rendered foreground/background pairs, minimum 5.24:1; checked public button hover/focus, schedule tab and no public horizontal overflow/page errors. External home remains HTTP 401 Unauthorized, so hosted visuals unverified. No live deployment.

## One-time owner admin invitation
- [x] Auth accepted one invitation for info@accessfarmtotable.com at 2026-10-22 10:38:19 UTC, explicitly returning to the recovered project's allowed preview /auth?mode=reset. No password generated or stored; no invite link/token logged.
- [x] Verified exact invited auth ID bd648192-50a4-4280-967f-2f0aa94eafff and matching profile; idempotent admin insert and removal of only its automatic user role leaves [admin]. Two prior admins preserved. Email remains unconfirmed and password unset; no RLS/auth configuration/application-code changes or deployment.
- [ ] Recipient inbox delivery and password setup remain unverified: Auth accepted sending through default sender but no auth delivery log is available; preview landing responds 401 to sandbox. Recipient should open invitation while signed into this recovered Lovable project; if still blocked, platform must repair the existing preview binding before requesting a fresh password-reset email through /auth. No invitation retries sent.

## Active official program cleanup
- [x] Deleted only blank e59237f9-27f1-43aa-b771-f2334775cb0c and MeatMe cab68826-1a98-4e04-bac5-b79751f009e1; five gallery rows cascaded. All nine inquiries preserved, including MeatMe inquiry with its program link cleared. Value Addition record retained inactive/unfeatured; eight official programs ordered 1–8.
- [x] Removed program demo definitions and program writes from starter imports; Home reads active ordered records with no demo fallback. Seven concise descriptions and eight source links verified against CISC pages. Family INC remains name/source-only due to reported title mismatch; generated program covers/hero metadata, unsupported objectives/taglines/contact details removed. Uploaded storage objects retained, not purged; non-program demo/event content unchanged.
- [x] Full suite: 38 files / 147 tests passed; automatic build OK. Browser verified eight ordered results, all eight detail/source links, Home six-entry ordered preview, inactive/deleted detail rejection, desktop/mobile and no page errors. External /programs returns 401 Unauthorized: hosted appearance remains unverified behind existing preview access/binding blocker. No deployment, RLS, auth, FC135 or live-domain changes.

## Active provisional 134th-program adaptation
- [x] Seed 21 editable provisional FC135 sessions using only supplied reference times/topics, unassigned people and locations, with provenance notice; omit ambiguous gaps/Session III.
- [x] Expose reusable agenda status editing and event-timezone day/time display; preserve session IDs on edits and unrelated content/protections.
- [x] Full suite: 36 files / 143 tests passed; automatic build OK. Desktop/mobile schedule and signed-in admin settings/session save/read-back passed with no page errors. Hosted FC135 returns 401 Unauthorized, so external rendering remains unverified under the existing platform blocker below.

## Active recovered Home Hero Redesign
- [x] Restore image-free HomeHero with About Jesup first, manual labeled slideshow controls, existing Programs/Publications entries and a persistent FC135 link; preserve event-scoped branding.
- [x] Strengthen neutral network secondary/accent and use a home-only charcoal/gray-teal gradient; refine About historical wording and link existing directories without speculative feature claims. Home/About have distinct network metadata without placeholder social images.
- [x] Existing suite: 35 files / 138 tests passed; automatic build OK at 10:18:02 UTC. Browser Home/About/FC135 and preserved Programs/Publications/Markets return 200 locally; About/slideshow/mobile FC135 link passed, no page errors, no mobile horizontal overflow. Desktop/mobile screenshots inspected.
- [ ] External preview verification blocked: all three URLs redirect to Lovable's auth-bridge naming inaccessible old project lovp_0s4ebmzbx19hxvh5nf1270fx8t; bridge 200 is not application success. Platform must correct preview authentication/hosting binding to this editor project; latest external pages remain unverified.
- Shared planning URL yielded only a Chat history heading; implementation follows the user's explicitly confirmed requirements, not unavailable chat details. Data, RLS, auth/admin code, selected institution theme provider, and event theme configuration unchanged; no deployment.

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

## Presenter submissions increment (2026-10-23)
- [x] Retire Equipment from public/admin navigation, discovery, dashboards, and starter imports; preserve tables and history; public/admin routes show retired notices.
- [x] Add per-conference presenter submissions: staff-configured window (event timezone), allowed types, max size, enable/disable.
- [x] Staff-granted presenter access (student/faculty, optional session link); presenter portal with deadline, upload, replace-before-cutoff.
- [x] Private `presenter-files` bucket with server-minted signed upload/download URLs; staff dashboard with latest files, missing/late status, access logging, file removal.
- [x] Server-side authorization and deadline enforcement in database functions and RLS; FC135 left disabled (no settings row).
- [x] End-to-end verified as admin: configure, add presenter, upload, staff board, signed download, past-cutoff lockout; test data cleaned up.
- [x] Security lockdown (2026-10-23): direct submission inserts/updates and direct access-log inserts revoked; all writes via `submit_presenter_file` (verifies the storage object exists and matches size) and `log_presenter_file_access`; negative checks (forged path, direct insert/update, forged audit row, ghost object) verified blocked live.
- [ ] Remaining setup: admins must set FC135 presenter deadlines and add presenter accounts before the module opens; presenter invite-by-email (vs account ID) is a future nicety.

## Speaker experience increment (2026-10-23)
- [x] Optional keynote/featured designation per speaker, shown prominently only when set.
- [x] Admin-configured optional follow-up fields: website, platform-labelled social links, email, phone — validated/sanitized on save, only populated fields shown.
- [x] Full readable speaker bio/detail dialog with session names and times in the event timezone.
- [x] Event-scoped speaker ↔ session assignment (admin checkboxes in the event form).
- [x] Live next-session countdown: event timezone display, simultaneous session grouping, "happening now" and after-event states, hidden for provisional/draft agendas and when `countdown_enabled` is false.
- [x] Verified live on a temporary event (desktop + mobile + dialog); FC135 confirmed to show no countdown while its agenda is provisional; test data removed.
- [ ] Remaining setup: FC135 speakers and session assignments await organizer-provided data; none were invented.

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