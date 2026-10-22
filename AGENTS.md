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
- Convert admin local event/session inputs using the event timezone; date-only conferences use exclusive midnight boundaries and all-day calendar exports so unknown service times are not presented as appointments.
- Staff authorization and redemption/check-in/claim operations are event-scoped database functions with explicit execution grants and locking; UI gates never substitute for authorization.
- Square seller configuration is admin-only and database-enforced non-live; payment processing, secrets and OAuth are outside the foundation.
