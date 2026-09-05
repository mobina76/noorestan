# Quickstart and Validation Guide

This guide describes the intended local validation workflow after implementation. It does not create
the application or replace `tasks.md`.

## Prerequisites

- Pinned .NET LTS SDK and Node/toolchain versions declared by the implemented repository
- PostgreSQL instance and an S3-compatible development object store
- Environment-specific secrets supplied outside source control
- Authorized access to representative official Mazinoor catalog pages and captured rights-cleared
  HTML/image fixtures for deterministic importer validation

## Local setup

1. Copy the checked-in example settings to local, ignored settings and provide database, cookie,
   object-storage, and public contact configuration.
2. Start PostgreSQL and the development object store.
3. Restore backend and frontend dependencies with their lockfiles enforced.
4. Apply EF Core migrations through the documented deployment command.
5. Run the one-use owner bootstrap command, then invalidate its bootstrap secret.
6. Start the API, Angular SSR development server, and background image-processing execution mode if
   implementation separates processing from the request.
7. Confirm readiness reports database and object storage available without exposing secrets.

Exact commands must be added when workspace manifests and SDK pinning exist; this plan intentionally
does not scaffold them.

## Automated quality gates

Run, in order:

1. Frontend format check, lint, strict TypeScript build, unit/component tests, and production SSR build.
2. Backend format check, compile with warnings treated according to repository policy, unit tests, and
   API integration tests against disposable PostgreSQL/object storage.
3. OpenAPI validation and frontend contract compatibility check.
4. Browser journey tests at representative mobile, tablet, and desktop sizes in Persian RTL.
5. Automated accessibility scan plus keyboard-only assertions for critical journeys.
6. Importer unit/integration tests using dry-run and idempotent repeat fixtures.
7. Visual regression and reduced-motion checks for the design-system reference pages.

All gates must pass before merge as required by the constitution.

## End-to-end acceptance scenarios

### Public catalog and contact

1. Seed published, hidden, draft, and archived products across categories with distinct specifications.
2. Verify public lists, direct URLs, search, filters, and metadata expose published records only.
3. Search using Persian/Arabic letter and digit variants and partial terms; confirm equivalent relevant
   results and a recovery-oriented empty state.
4. Open a multi-image product and verify responsive sources, meaningful alt text, ordered technical
   data, and keyboard-operable gallery behavior.
5. Activate phone, WhatsApp, and email actions. Confirm WhatsApp/email include product context, phone
   has adjacent product context, and no inquiry is posted to or retained by the API.
6. Confirm no cart, checkout, payment, online order, customer account, or price/stock claim exists.

### Visual direction and responsive RTL

1. Inspect the homepage at mobile, tablet, and desktop widths in native RTL. Confirm the architectural
   image-led hero, large Persian typography, restrained blue ambient glow, catalog/contact CTAs, and
   category, featured-product, why Noorestan, company, and final contact sections form a coherent flow.
2. Inspect catalog cards with and without product codes and images. Confirm photography dominates,
   borders and hover states are subtle, text remains readable, and no styling resembles purchase UI.
3. Inspect product detail with one and many images, long technical values, missing optional content,
   related and unrelated products, and persistent contact actions. Confirm gallery/specification order,
   layout stability, and absence of purchase controls.
4. Inspect admin forms, tables/cards, image controls, dialogs, errors, and destructive states at all
   breakpoints. Confirm the shared identity remains visible without glow or motion obscuring tasks.
5. Verify all component colors derive from semantic tokens; contrast passes in default, hover, focus,
   disabled, muted, success, and error states and information is never color-only.
6. Enable reduced motion and confirm reveal/movement effects disappear while state feedback remains.
   Enable forced colors where supported and confirm focus, controls, and content remain understandable.
7. Throttle a representative mobile device/network and confirm bounded glow/blur, below-fold lazy
   images, explicit dimensions, and transitions do not compromise responsiveness or layout stability.

### Administration and authorization

1. Verify anonymous users receive unauthorized responses for every protected API operation even if
   frontend guards are bypassed.
2. Sign in as a normal administrator; complete product/category/content workflows but confirm account
   lifecycle and ownership endpoints are forbidden.
3. Sign in as owner; create and deactivate another account, verify session revocation, and transfer
   ownership. Confirm the active owner cannot be deactivated before transfer.
4. Submit missing/invalid antiforgery proof and confirm state-changing requests fail safely.
5. Cause two administrators to edit the same record; confirm stale submission returns a conflict and
   never silently overwrites the newer version.

### Catalog integrity and lifecycle

1. Define text, number, boolean, and choice specifications; verify typed validation and applicable
   filter behavior.
2. Attempt an incompatible definition-type or product-category change; verify explicit migration or
   clearing is required.
3. Attempt to remove a category containing non-archived products; verify removal is blocked until all
   products are reassigned or archived.
4. Publish, hide, republish, archive, and restore a product; verify each public visibility transition.
5. Confirm restore retains content. Confirm permanent deletion is only possible from archive, requires
   separate confirmation/concurrency proof, and schedules/removes associated objects safely.

### Images and failure recovery

1. Upload valid source images and verify object keys/metadata only are stored in PostgreSQL and bounded
   responsive variants are generated.
2. Reject spoofed, unsafe, oversized, or unsupported files without losing other form content.
3. Simulate interrupted upload/processing and object-storage outage; verify failed state, retry/cleanup,
   understandable admin feedback, and continued delivery of existing ready images.
4. Verify changing the primary image is atomic and public URLs use stable delivery paths.

### Authorized Mazinoor import

1. As a normal administrator, attempt to start an import and confirm the API denies it. As owner,
   start a dry-run against the configured official Mazinoor origin and confirm the run is explicit,
   never scheduled, limited to one active run, and reports progress and per-item outcomes.
2. Review extraction of product names, Mazinoor codes, categories, descriptions, specifications,
   canonical source URLs, and available image references. Confirm malformed required fields fail only
   affected items, optional omissions warn, and no catalog mutation occurs in dry-run.
3. Start a commit run and confirm imported records are ordinary drafts, source codes/URLs remain for
   traceability, all catalog fields are editable, images are copied to Noorestan object storage, and
   no product/image response hotlinks the Mazinoor origin.
4. Repeat the import and confirm product code, or canonical source URL fallback, prevents duplicates.
   Confirm unchanged content is skipped and locally edited fields are not silently overwritten.
5. Change captured source markup and exercise timeout, invalid HTML, oversized response, missing image,
   unsupported media, partial network failure, and rate limiting; confirm bounded retries, clear
   item/run outcomes, and no corrupt or accidentally published product.
6. Disable Mazinoor/network access and confirm all public and normal administration journeys, imported
   catalog data, and copied images remain fully operational. Only a newly requested import may fail.

### Operations and recovery

1. Verify structured logs correlate requests and audit mutations without secrets or sensitive cookie
   content.
2. Exercise liveness/readiness and simulated dependency failure behavior.
3. Restore a database backup and corresponding object-store version/backup in a non-production
   environment; reconcile missing/orphan object metadata and record recovery time.
4. Measure representative catalog/search/filter journeys against SC-004 and the plan's scale baseline.

## Contract and model references

- HTTP surface: [contracts/openapi.yaml](contracts/openapi.yaml)
- Normalized official-site extraction contract: [contracts/mazinoor-extraction.schema.json](contracts/mazinoor-extraction.schema.json)
- Persistence and lifecycle rules: [data-model.md](data-model.md)
- Product and business acceptance criteria: [spec.md](spec.md)
