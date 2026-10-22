<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Extend the shared event ledger for conferences; products represent tickets, self/guest add-ons, parking and company/sponsor packages, with entitlements tied to existing registrations to avoid duplicate attendee systems.
- Conference presentation uses event metadata and event-scoped semantic theme tokens; section visibility requires explicit enablement plus content so unpublished details never appear as placeholder features.
- Conference catalog visibility uses active products read through a request-scoped public server function; organizer labels and validated resource links remain event metadata to reuse the shell without duplicating content systems.
- Conference-only settings saves merge an explicit field allowlist against fresh metadata and use an optimistic equality guard to avoid overwriting unrelated or concurrently changed event settings.
- Convert admin local event/session inputs using the event timezone; date-only conferences use exclusive midnight boundaries and all-day calendar exports so unknown service times are not presented as appointments.
- Staff authorization and redemption/check-in/claim operations are event-scoped database functions with explicit execution grants and locking; UI gates never substitute for authorization.
- Square seller configuration is admin-only and database-enforced non-live; payment processing, secrets and OAuth are outside the foundation.
- Public connection configuration prefers managed environment settings but falls back to the recovered project's publishable values when settings are missing or point at the lost project, because inherited hosted builds may not receive this project's settings.
- Public event loaders call server functions using a request-scoped publishable client; browser clients stay out of SSR queries to avoid viewer-proxy dependencies while preserving anonymous RLS.
- Conference operations use authenticated server functions and event-scoped RPCs; checkout stays disabled, issuance is explicitly admin-only, and imported identity claims require verified email plus an original one-time barcode.
- Staff operation retries use request IDs and database locks; badge issuance records a print request, not confirmation that a physical printer succeeded.
- The role policy helper is callable for public policies but returns false for anonymous callers and only checks the caller's own identity, preserving public reads without role enumeration.
- Home always renders the network HomeHero; featured conferences use a separate event link rather than replacing it, keeping About discoverable and event themes scoped to their event pages.
- Provisional agendas reuse event_sessions and event metadata agenda_status/agenda_notice/agenda_provenance; render proposed times in the event timezone and never create products or entitlements from planning blocks.
- Public program catalogs and Home program entries read active database records in sort_order; starter imports never create or overwrite programs, so approved content and deletions survive refreshes.
- Theme selection uses only the signed-in profile school or session-scoped explicit guest school, never event/program ownership or metadata; paired layout-scoped tokens keep unselected content neutral and prevent guest branding leaks.
- Session entry is a presentation gate after hydration and session resolution, not a public data/auth guard; auth callbacks bypass it, while guest continuation retains only safe public destinations and lasts in sessionStorage.
