# JESUP development without Lovable AI credits

JESUP is a TanStack Start application with Supabase for data and authentication. The current live domain is served through Lovable's hosting path behind Cloudflare. Bluehost is not part of the verified application deployment path. Keep the current live hosting in place while production access and data configuration are audited.

## Code source and local work

- The Lovable-connected Git repository is `cisc1881/tuskegee-connect-hub` (`lovable/main` in the local checkout). Changes pushed to that branch sync into Lovable's editor without using its AI builder.
- The earlier `cisc1881/jesup-by-cisc` repository is also present locally as `origin`. Its history and any uncommitted files must be preserved; do not reset or overwrite that checkout to change branches.
- Develop in a separate branch/worktree based on the current `lovable/main`. Keep commits small and buildable. Never force-push or rewrite commits already pushed to the connected branch.
- Lovable AI chat is optional. Do not use it for routine implementation while credits are constrained.

## Repeatable verification

The committed `package-lock.json` supports a clean npm install:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

For local preview, copy `.env.example` to an ignored `.env` and fill in **development** Supabase values from the authorized project settings. Run `npm run dev`. Do not put secrets in Git or connect local development to production data by assumption.

## Sync and release boundaries

1. Review the diff and all checks in the isolated branch.
2. Fast-forward the Lovable-connected `main` branch with the verified commits. Confirm the editor receives the code. A Git push is a **code sync**, not proof that the live domain was published or that database migrations ran.
3. For schema changes, review and apply migrations to the correct environment with a backup and rollback plan. Verify Supabase policies and authentication separately.
4. Publish to the live domain only after checking the actual hosting target, production Supabase project, environment variables, and a staging smoke test. Record the deployed commit and verify the public and admin routes.

The existing [deployment guide](./DEPLOYMENT_GUIDE.md) describes a possible standalone Cloudflare Workers deployment. It is an alternative to the current Lovable hosting path, not a completed migration. Do not change DNS or deploy it until production infrastructure is verified.
