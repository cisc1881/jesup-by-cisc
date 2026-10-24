# JESUP hosting migration: Lovable to Cloudflare Pages

## Verified state (October 24, 2026)

- `https://jesup.cisc1881.org` responds from the existing Lovable deployment behind Cloudflare. The public page uses Lovable asset paths and includes a Lovable badge.
- The live page advertises Supabase project `trffktqewlrzziowmspd`. Older production notes name `annwryirualnxsrnupjm`, so those notes must not be used to switch the backend during the hosting cutover.
- Authoritative DNS for `cisc1881.org` is at Wix (`ns14.wixdns.net`, `ns15.wixdns.net`). The current `jesup` A record resolves to `185.158.133.1`. Bluehost is not the verified JESUP application host or DNS provider.
- This repository builds a Cloudflare Pages Functions output with `npm run build:pages`. Nitro emits `_worker.js` as a module directory; `npm run prepare:pages-upload` creates a root `_worker.js` file for Cloudflare's dashboard Direct Upload in `dist-pages-upload/`.
- A direct-upload Pages project now exists at `https://jesup-staging.pages.dev`. Home, `/auth`, `/admin`, `/events`, `/programs`, `/publications`, `/markets`, and the locally hosted JESUP hero and logo images returned HTTP 200 on October 24. These are response checks, not full browser, authentication, or admin authorization tests.
- `jesup-staging.cisc1881.org` is now attached to the Pages project through a Wix CNAME to `jesup-staging.pages.dev`. On October 24, HTTPS returned 200 and browser checks confirmed the home page, sign-in screen, guest entry, FC135, Programs, Publications, and Markets. The signed-out `/admin` route redirected to sign-in; an administrator then signed in and opened the Command Center and Events listing, which loaded FC135 and the existing event records. Registration/payment flows remain unverified.
- Google and Apple buttons still call the Lovable cloud auth integration (`src/integrations/lovable/index.ts`). Verify both providers and Supabase redirect allow-list entries for the staging and eventual live hostname before cutover.
- The three Lovable asset-store images referenced in repository metadata were copied into `public/images/jesup/` and the metadata now points to those self-hosted paths. The first Pages upload returned 404 because `_worker.js` was a directory. The bundled replacement fixed it.
- Staging serves data from the same Supabase project advertised by the live site. Avoid test writes until a separate staging backend or safe test plan is in place. Cloudflare's dashboard returned an unknown error when applying `nodejs_compat`; the Pages worker nevertheless served the checked routes. Runtime settings and server functions still need verification.
- The live `jesup.cisc1881.org` A record and deployment have not been changed.

## Migration sequence

1. **Secure access.** Sign in to the Cloudflare account that will own JESUP Pages and the Wix account managing `cisc1881.org`. Use account invitations rather than sharing passwords or API keys in chat. Confirm who can change the JESUP DNS record.
2. **Preserve the live backend for the hosting move.** Read the live Lovable/Supabase settings and configure the Pages preview with the same Supabase URL and publishable key. Put server-only values in Pages secrets. Do not deploy with an inferred project ref or a service-role key in browser variables. Record Auth redirect URLs, Edge Function origins, email links, OAuth callbacks, CORS and Storage URLs that mention the old host.
3. **Build staging.** Run `npm ci`, `npm run build:pages`, and `npm run prepare:pages-upload`. Zip the *contents* of `dist-pages-upload/` and upload the zip to the existing `jesup-staging` Pages project. The root of the zip must contain `_worker.js`, not an `_worker.js/` directory. Do not attach `jesup.cisc1881.org` yet. Restrict staging access if it connects to live data; avoid creating test registrations on the live backend.
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
npm run prepare:pages-upload
```

Cloudflare Pages supports custom subdomains by CNAME while the parent domain remains with another DNS provider. A Pages project must be created and the custom domain added in Cloudflare before changing Wix DNS. See [Cloudflare Pages custom-domain documentation](https://developers.cloudflare.com/pages/configuration/custom-domains/) and [Nitro's Cloudflare deployment documentation](https://nitro.build/deploy/providers/cloudflare).
