# JESUP hosting migration: Lovable to Cloudflare Pages

## Verified state (October 24, 2026)

- `https://jesup.cisc1881.org` responds from the existing Lovable deployment behind Cloudflare. The public page uses Lovable asset paths and includes a Lovable badge.
- The live page advertises Supabase project `trffktqewlrzziowmspd`. Older production notes name `annwryirualnxsrnupjm`, so those notes must not be used to switch the backend during the hosting cutover.
- Authoritative DNS for `cisc1881.org` is at Wix (`ns14.wixdns.net`, `ns15.wixdns.net`). The current `jesup` A record resolves to `185.158.133.1`. Bluehost is not the verified JESUP application host or DNS provider.
- This repository builds a Cloudflare Pages Functions output with `npm run build:pages` (`dist/` with `_worker.js`). Local type check, tests, standard build, and Pages build succeeded. Wrangler's local Pages runtime returned HTTP 200 for Home without configured Supabase values. That does not prove that authentication, server functions, Supabase, email, or storage work on a deployed Pages site.
- No Cloudflare account session or deployment credential is available in the current environment. No DNS or live deployment has been changed.

## Migration sequence

1. **Secure access.** Sign in to the Cloudflare account that will own JESUP Pages and the Wix account managing `cisc1881.org`. Use account invitations rather than sharing passwords or API keys in chat. Confirm who can change the JESUP DNS record.
2. **Preserve the live backend for the hosting move.** Read the live Lovable/Supabase settings and configure the Pages preview with the same Supabase URL and publishable key. Put server-only values in Pages secrets. Do not deploy with an inferred project ref or a service-role key in browser variables. Record Auth redirect URLs, Edge Function origins, email links, OAuth callbacks, CORS and Storage URLs that mention the old host.
3. **Build staging.** Create a new Cloudflare Pages project from the Git repository or direct upload, using `npm ci` and `npm run build:pages`, output directory `dist`. Do not attach `jesup.cisc1881.org` yet. Use the assigned `*.pages.dev` URL for testing. Restrict staging access if it connects to live data; avoid creating test registrations on the live backend.
4. **Validate staging.** Check Home, Programs, Publications, Markets, FC135, sign-in/guest flow, admin authorization, images, server functions, wallet/scanner routes, and error logs on desktop and phone. Verify signed-out and non-admin access. Confirm the Pages runtime limits and required plan with real traffic measurements.
   Review the dependency audit before production. A direct override pins the patched `proxy-addr` release; other audit findings still need impact assessment and fixes where applicable.
5. **Prepare rollback.** Record current Wix `jesup` record, Lovable custom-domain state, and the last known-good code/deployment. Confirm database backup coverage; Supabase database backups do not include stored file objects. Schedule a short cutover window.
6. **Cut over only after staging passes.** Add `jesup.cisc1881.org` in Cloudflare Pages first and complete its validation. Replace only the `jesup` DNS record at Wix with the CNAME target provided by Pages; leave the parent domain and other records alone. Verify TLS, canonical URLs, sign-in callbacks, public and admin routes, and live Supabase connectivity from multiple networks. Keep Lovable deployment available for rollback until the new host is stable.
7. **Separate the database later.** The live project ref is currently the one described as development in old notes. Any move to `annwryirualnxsrnupjm` needs its own inventory, backup/export of database and Storage, migration parity check, data reconciliation, Auth/OAuth review, and staged cutover. Do not combine that with the hosting switch.

## Local verification

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run build:pages
```

Cloudflare Pages supports custom subdomains by CNAME while the parent domain remains with another DNS provider. A Pages project must be created and the custom domain added in Cloudflare before changing Wix DNS. See [Cloudflare Pages custom-domain documentation](https://developers.cloudflare.com/pages/configuration/custom-domains/) and [Nitro's Cloudflare deployment documentation](https://nitro.build/deploy/providers/cloudflare).
