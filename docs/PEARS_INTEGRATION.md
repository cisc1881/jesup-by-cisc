# PEARS integration foundation

JESUP now has an admin preparation page at `/admin/reports/pears`. An administrator can save a sandbox PEARS organization ID for a JESUP institution, map programs and events to PEARS identifiers, view a program's aggregate metrics from linked events, and generate an event review package from JESUP's existing report calculations. The package is stored in `pears_export_jobs` and downloaded as JSON. It contains aggregate attendance, geographic reach, and evaluation metrics; no participant names, contact information, quotes, or individual demographic responses.

The JSON format (`jesup-pears-review-v1`) is an internal review format. It is **not** a PEARS import template or API payload. No data is sent to PEARS. Institution ownership of JESUP events is not yet modeled, so the administrator must verify the event belongs in the selected institution's PEARS organization before preparing a package.

## Before live transfer

Obtain the institution's PEARS Data Connect/API documentation and credentials through its authorized administrator. Confirm authentication, write endpoints, organization and activity identifiers, field definitions, reporting periods, required indicators, consent rules, idempotency behavior, rate limits, and sandbox access. Store credentials only in server secrets. Then add a server-side adapter that validates a reviewed package against the confirmed PEARS contract, submits it, records the remote response, and supports retry without duplicate activity records.

The PEARS Data Mart is described for analytics and should be evaluated separately from write access. Do not assume Data Connect or the Data Mart supports record creation.

On November 4, 2026, the Tuskegee sandbox's [API Keys settings](https://pears.io/organizations/settings/general/apikeys) displayed “Coming soon with the PEARS Data Mart add-on” and directed users to PEARS support for early access. No key creation control or write API contract was available in that account. The [PEARS organization settings documentation](https://support.pears.io/administration/administration/organization-settings) describes API keys generally, but it does not override the sandbox account's availability message.

## Deployment

Apply `supabase/migrations/20261104120000_pears_foundation.sql` before opening the admin page. Regenerate Supabase types from the deployed schema when the project's normal type generation workflow is available; the local types include the new tables for this branch.
