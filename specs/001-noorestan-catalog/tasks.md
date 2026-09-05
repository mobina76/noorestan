# Tasks: Noorestan Product Catalog Website

**Input**: Design documents from `/specs/001-noorestan-catalog/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Automated tests are included because the constitution requires proportionate tests for
critical behavior, security, accessibility, reactive workflows, and regressions. Within each story,
write the listed tests first and confirm they fail before implementing the behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as
an independently useful increment.

**Status correction (2026-09-05)**: A read-only audit found this file's checkboxes did not reliably
reflect the actual codebase — some checked tasks had no corresponding code, and some unchecked tasks
were already substantially implemented. The checkboxes below were re-verified against the real
backend/frontend code and a running local stack (real Postgres, real seeded Mazinoor data, a live
Mazinoor import run) rather than assumed from prior state. Where a task is functionally complete but
via a simpler mechanism than originally planned (e.g. per-endpoint `If-Match` checks instead of a
dedicated concurrency middleware type), it is marked done with a note. Tasks left unchecked are real
gaps, not just unverified ones.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the pinned workspaces, deployment shape, quality commands, and contracts.

- [X] T001 Create the .NET 10 solution and API, import module, and test projects under `backend/Noorestan.slnx`, `backend/src/Noorestan.Api/`, `backend/src/Noorestan.MazinoorImport/`, and `backend/tests/`
- [X] T002 Create the Angular 22 SSR application with routing, strict TypeScript, and standalone APIs in `frontend/`
- [X] T003 [P] Configure Tailwind semantic tokens for near-black/dark-navy backgrounds, elevated surfaces, off-white/muted blue-gray text, cool borders, ice-blue primary/glow, accessible status colors, controlled radii/spacing/shadows/motion, Persian typography, logical-direction utilities, reduced-motion/forced-color fallbacks, and global RTL defaults in `frontend/src/styles.css`, `frontend/tailwind.config.ts`, and `frontend/src/index.html`
- [X] T004 [P] Configure frontend formatting, linting, strict build, unit test, SSR build, and browser test commands in `frontend/package.json`, `frontend/eslint.config.js`, and `frontend/playwright.config.ts`
- [X] T005 [P] Pin the .NET 10 SDK and configure nullable analysis, warnings, formatting, and central package versions in `global.json`, `backend/Directory.Build.props`, and `backend/Directory.Packages.props`
- [X] T006 [P] Configure backend unit and integration test projects in `backend/tests/Noorestan.Api.UnitTests/Noorestan.Api.UnitTests.csproj`, `backend/tests/Noorestan.Api.IntegrationTests/Noorestan.Api.IntegrationTests.csproj`, and `backend/tests/Noorestan.MazinoorImport.Tests/Noorestan.MazinoorImport.Tests.csproj`
- [X] T007 [P] Add local PostgreSQL and S3-compatible object-store services with health checks and persistent development volumes in `compose.yaml`
- [X] T008 [P] Add safe example configuration for database, cookies, official Mazinoor origins, retrieval limits, image limits, and object storage in `backend/src/Noorestan.Api/appsettings.Development.example.json` and `.env.example`
- [ ] T009 Configure OpenAPI validation and strongly typed frontend contract generation/checking from `specs/001-noorestan-catalog/contracts/openapi.yaml` in `frontend/package.json` and `backend/Noorestan.slnx`
- [X] T010 [P] Document exact restore, build, test, migration, owner-bootstrap, and local-run commands in `README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared persistence, security, HTTP, observability, and image foundations.

**Critical**: No user story implementation starts until this phase is complete.

- [X] T011 Define shared persistence conventions, entity base fields, concurrency tokens, and UTC handling in `backend/src/Noorestan.Api/Infrastructure/Persistence/AppDbContext.cs` and `backend/src/Noorestan.Api/Infrastructure/Persistence/EntityBase.cs`
- [X] T012 Define AdministratorAccount and AuditEvent entities plus database mappings and owner uniqueness constraints in `backend/src/Noorestan.Api/Infrastructure/Identity/AdministratorAccount.cs`, `backend/src/Noorestan.Api/Infrastructure/Auditing/AuditEvent.cs`, and `backend/src/Noorestan.Api/Infrastructure/Persistence/AppDbContext.cs`
- [X] T013 Define Category, SpecificationDefinition, SpecificationChoice, Product, ProductFeature, ProductSpecificationValue, ProductImage, ImageVariant, BusinessProfile, ManagedContent, ImportRun, and ImportItem entities and mappings in `backend/src/Noorestan.Api/Features/` and `backend/src/Noorestan.Api/Infrastructure/Persistence/AppDbContext.cs`
- [X] T014 Create the initial PostgreSQL migration with foreign keys, check constraints, filtered uniqueness, lifecycle indexes, search indexes, and bounded relationship rules in `backend/src/Noorestan.Api/Infrastructure/Persistence/Migrations/` — verified by applying it to a real local PostgreSQL instance
- [X] T015 [P] Implement ASP.NET Core Identity, secure cookie settings, CSRF validation, Admin/Owner policies, login throttling, and session revocation wiring — implemented directly in `backend/src/Noorestan.Api/Program.cs` rather than a separate `IdentityConfiguration.cs`; CSRF is now actually enforced via a request-pipeline check (previously only wired for logout), verified end-to-end over HTTPS
- [X] T016 [P] Implement the one-use first-owner bootstrap command with secret invalidation and refusal when an owner exists in `backend/src/Noorestan.Api/Infrastructure/Identity/OwnerBootstrap.cs` — verified by running it
- [X] T017 [P] Implement Problem Details and validation/authorization/concurrency error responses — done via `AddProblemDetails`, `Results.ValidationProblem`, and per-endpoint `If-Match`/version conflict checks rather than the originally planned separate middleware types; behavior verified (400/401/403/409 responses)
- [ ] T018 [P] Implement structured logging, correlation IDs, redaction, health/readiness checks, and request metrics in `backend/src/Noorestan.Api/Infrastructure/Observability/ObservabilityConfiguration.cs` — health checks exist; the rest is not implemented
- [X] T019 [P] Implement audit event recording for authentication and content mutations without sensitive values in `backend/src/Noorestan.Api/Infrastructure/Auditing/AuditWriter.cs` — wired for image uploads; not yet called from every admin mutation (real gap, see final report)
- [ ] T020 [P] Implement the S3-compatible object-store abstraction, official/public delivery URL mapping, durable cleanup records, and test fake — still the local-disk `DevelopmentObjectStorage`; MinIO is provisioned in `compose.yaml` but unused by the app (real gap)
- [X] T021 [P] Implement signature-based image validation and bounded JPEG variant generation using SkiaSharp (MIT-licensed; AVIF/WebP re-encode was descoped for time) in `backend/src/Noorestan.Api/Infrastructure/Images/ImageProcessor.cs` — verified with real uploaded and imported photos
- [X] T022 Configure versioned `/api/v1` endpoints, JSON conventions (including string enum serialization), cookie credentials, antiforgery header propagation, and typed frontend API models (hand-written in `frontend/src/app/core/api/contracts.ts` rather than OpenAPI-generated) in `backend/src/Noorestan.Api/Program.cs`, `frontend/src/app/core/http/`, and `frontend/src/app/core/api/`
- [X] T023 [P] Implement the premium dark Angular shell, skip link, responsive RTL navigation, semantic token-based surfaces, reduced-motion behavior, lazy route boundaries, and route titles in `frontend/src/app/app.ts`, `frontend/src/app/app.html`, `frontend/src/app/app.routes.ts` — now data-driven from the real business profile instead of static/invented copy
- [X] T024 [P] Implement Signals-based session state, RxJS session loading, functional authentication guard, and CSRF interceptor in `frontend/src/app/core/auth/` and `frontend/src/app/core/http/` — a shared `readApiError` helper maps Problem Details per call site rather than a single global interceptor
- [ ] T025 Create shared PostgreSQL/object-storage integration fixtures and authenticated client helpers in `backend/tests/Noorestan.Api.IntegrationTests/Infrastructure/ApiFactory.cs` — not implemented; the integration test project still has no real API/DB test coverage
- [ ] T026 Create shared Persian RTL mobile/tablet/desktop fixtures, keyboard helpers, semantic contrast/focus assertions, reduced-motion and forced-color modes, and accessibility assertions in `frontend/tests/e2e/fixtures/` — e2e specs check RTL/mobile/reduced-motion ad hoc per test rather than through shared fixtures

**Checkpoint**: Persistence, contracts, authorization, HTTP behavior, object storage, and test harnesses
are ready; user-story phases may begin.

---

## Phase 3: User Story 1 - Discover Suitable Products (Priority: P1) — MVP

**Goal**: Visitors browse published products by category and find relevant products through Persian
search and category-specific filters.

**Independent Test**: Seed multiple lifecycle states and category attributes, then browse, search with
Persian variants, combine/clear filters, paginate, and reach a relevant published product anonymously.

### Tests for User Story 1

- [ ] T027 [P] [US1] Add public category, catalog pagination, lifecycle visibility, search normalization, filter, and empty-state API integration tests in `backend/tests/Noorestan.Api.IntegrationTests/PublicCatalog/PublicCatalogTests.cs` — not written; the integration test project still has no real API/DB coverage (real gap)
- [X] T028 [P] [US1] Add unit tests for Persian/Arabic letter, digit, whitespace, and partial-term normalization in `backend/tests/Noorestan.Api.UnitTests/Catalog/PersianSearchNormalizerTests.cs`
- [X] T029 [P] [US1] Add browser tests for anonymous browse/search/filter/recovery in `frontend/tests/e2e/public-catalog.spec.ts` — rewritten against the real seeded catalog and passing; query-URL restoration and full keyboard-operation coverage are not asserted (partial)

### Implementation for User Story 1

- [X] T030 [P] [US1] Implement Persian normalization and normalized searchable field maintenance in `backend/src/Noorestan.Api/Features/Catalog/Search/PersianSearchNormalizer.cs`
- [X] T031 [P] [US1] Implement published-category list and applicable filter-definition queries — done as `GetCategories`/`GetFilters` handlers inside `backend/src/Noorestan.Api/Features/PublicCatalog/PublicCatalogEndpoints.cs` rather than separate files
- [X] T032 [US1] Implement bounded published-product search, category filtering, stable sorting, and pagination in `PublicCatalogEndpoints.ListProducts` — typed per-specification filter query params are not implemented (search covers name/category/features/spec text only); real gap
- [X] T033 [US1] Public categories, filters, and products endpoints are implemented and mapped in `backend/src/Noorestan.Api/Features/PublicCatalog/PublicCatalogEndpoints.cs` (no OpenAPI contract-generation step; see T009/T094)
- [X] T034 [P] [US1] Implement typed catalog query calls and search/filter loading — done via `frontend/src/app/core/api/public-api.service.ts` and `CatalogComponent`'s own Signals-based query state rather than a separate data-access/store folder
- [X] T035 [P] [US1] Implement image-first product cards using real product photography (`frontend/src/app/shared/product-card.component.ts`) with pagination and a recovery empty state in `catalog.component.ts`
- [X] T036 [US1] Implement the catalog page with Signals-derived state and URL-synced search/filter/page params in `frontend/src/app/features/catalog/catalog.component.ts`
- [ ] T037 [US1] SSR now renders the catalog page per request (see `app.routes.server.ts`), but there is no dedicated `seo.service.ts` for canonical/meta tags — real gap

**Checkpoint**: US1 independently delivers the searchable, filterable published catalog MVP.

---

## Phase 4: User Story 2 - Evaluate and Inquire About a Product (Priority: P1)

**Goal**: Visitors understand a product through structured details and copied responsive images, then
contact Noorestan directly with product context and no stored inquiry.

**Independent Test**: Open a published multi-image product, inspect its structured data and gallery,
use each direct contact route, and confirm hidden/archived/nonexistent products return no public data.

### Tests for User Story 2

- [ ] T038 [P] [US2] Add product-detail visibility, specification ordering, image variant, and contextual contact API tests in `backend/tests/Noorestan.Api.IntegrationTests/PublicCatalog/ProductDetailTests.cs` — not written (real gap; covered indirectly by e2e)
- [X] T039 [P] [US2] Add product-detail browser tests (gallery, code, specs table, no-commerce, unpublished/unknown-not-found) in `frontend/tests/e2e/product-detail.spec.ts` — rewritten against real seeded data and passing; full reduced-motion/keyboard-per-control coverage not asserted (partial)

### Implementation for User Story 2

- [X] T040 [US2] Implement the published product-detail query with ordered features/specifications/images and contact-link context — done as `PublicCatalogEndpoints.GetProduct`
- [X] T041 [US2] Product-detail routing returns the same not-found response for unpublished, hidden, archived, and missing products in `PublicCatalogEndpoints.cs` — verified with a real unknown-slug request
- [X] T042 [P] [US2] Implement a responsive image gallery with explicit dimensions and reduced decoration, using real product photo variants, in `frontend/src/app/features/catalog/product-detail.component.ts` — keyboard/touch gallery controls are basic (thumbnail buttons only, no swipe/arrow-key navigation); partial
- [X] T043 [P] [US2] Implement the structured technical specification table directly in `product-detail.component.ts` (not split into a separate `product-specifications/` folder)
- [X] T044 [P] [US2] Implement phone/WhatsApp/email contact actions with an encoded product reference — done via `core/site/site.store.ts` (`whatsAppLink`/`telLink`/`mailLink`) and used directly in `product-detail.component.ts` rather than a separate component; each channel is hidden when the administrator has not configured it, and none submit to any API
- [X] T045 [US2] Implement the SSR product-detail composition (gallery, title/code/category, description, related products, loading/not-found state, direct contact) in `frontend/src/app/features/catalog/product-detail.component.ts` — no explicit canonical-URL metadata (see T037)
- [ ] T046 [US2] Add automated assertions that the API exposes no inquiry/cart/checkout/payment/order/inventory mutation — verified manually (the API genuinely has no such endpoints) but no dedicated regression test exists (real gap)

**Checkpoint**: US2 independently supports product evaluation and qualified direct contact.

---

## Phase 5: User Story 4 - Manage the Product Catalog (Priority: P1)

**Goal**: Authenticated administrators safely manage accounts, categories, flexible specifications,
products, lifecycle, images, and the authorized initial Mazinoor import without developer assistance.

**Independent Test**: Authenticate as admin/owner, exercise authorization boundaries, create and
publish a complete product, manage images/specifications, hide/archive/restore/delete it, enforce
category integrity, resolve a concurrency conflict, and dry-run/commit/repeat an official-site import.

### Tests for User Story 4

- [ ] T047 [P] [US4] Add authentication, CSRF, throttling, account deactivation, owner transfer, and backend policy integration tests in `backend/tests/Noorestan.Api.IntegrationTests/Identity/IdentityTests.cs` — not written; behavior verified manually against a real running instance instead (real gap)
- [ ] T048 [P] [US4] Add category/specification type, incompatible change, category deletion, and concurrency integration tests — not written (real gap)
- [ ] T049 [P] [US4] Add product validation, publish/hide/archive/restore/permanent-delete, category-change, and stale-update integration tests — not written (real gap)
- [ ] T050 [P] [US4] Add image signature/limit/variant/primary/order/failure/cleanup integration tests — not written; verified manually via real uploads (real gap)
- [X] T051 [P] [US4] Add official Mazinoor extraction fixture, malformed-input, and missing-name/spec/image tests in `backend/tests/Noorestan.MazinoorImport.Tests/MazinoorExtractorTests.cs` — origin-restriction/timeout/retry are covered by the pre-existing `MazinoorHttpSourceTests.cs`; bounded-concurrency and full JSON-schema contract validation are not tested (partial)
- [ ] T052 [P] [US4] Add dry-run, owner authorization, idempotent code/URL matching, local-edit preservation, image copying, and runtime-isolation import integration tests — not written; this behavior was instead verified by hand against the real mazinoor.com site (dry-run, commit, and idempotent re-run all confirmed working) — automated coverage remains a real gap
- [X] T053 [P] [US4] Add an admin browser test (login, unauthenticated redirect, product list with real data) in `frontend/tests/e2e/admin-catalog.spec.ts` — narrower than originally scoped (no dedicated conflict/upload-failure/account-policy/import-status browser tests yet); partial

### Implementation for User Story 4

- [X] T054 [P] [US4] Implement login, logout, session, and antiforgery issuance endpoints — done inline in `backend/src/Noorestan.Api/Program.cs` rather than a separate `AuthEndpoints.cs`; CSRF validation is now actually enforced on every admin/owner mutation (previously only wired for logout)
- [X] T055 [P] [US4] Implement owner-only account create/deactivate and atomic ownership-transfer endpoints in `backend/src/Noorestan.Api/Features/Identity/OwnerAccountEndpoints.cs`
- [X] T056 [US4] Implement category CRUD/ordering and specification definitions/choices with a non-archived-product deletion guard — done in `AdminCatalogEndpoints.cs` and the new `Features/AdminCatalog/SpecificationEndpoints.cs` (not a single `CategoryEndpoints.cs` file); choice type-change validation checks existing product values before allowing a type change
- [X] T057 [US4] Implement product CRUD and specification-value validation with category-change clearing semantics in `AdminCatalogEndpoints.cs` — added the previously-missing `PUT /products/{id}/specifications` endpoint this session (product specification values had no write path at all before)
- [X] T058 [US4] Implement publish prerequisites (primary ready image + required specs) and draft/published/hidden/archived/restore transitions in `AdminCatalogEndpoints.ChangeStatus`
- [X] T059 [US4] Implement confirmed archived-only permanent deletion in `AdminCatalogEndpoints.DeleteProduct`, including deleting the product's image/variant object-storage files after the database transaction commits
- [X] T060 [US4] Implement product image upload (signature validation, real resized variants), ordering, primary selection, alt-text update, and removal in the new `backend/src/Noorestan.Api/Features/AdminCatalog/ProductImageEndpoints.cs` — this endpoint did not exist before this session; "replace" is done via remove+re-upload and there is no separate retry flow, since upload is synchronous rather than a background processing state
- [X] T061 [P] [US4] Implement normalized Mazinoor extraction records in `backend/src/Noorestan.MazinoorImport/Contracts/ExtractionModels.cs` — validated against the schema's shape by construction; no automated JSON-schema validation step
- [X] T062 [P] [US4] Implement allowlisted HTTPS retrieval (HTML and, new this session, binary image retrieval) with timeout, size limits, and retry/backoff in `MazinoorHttpSource.cs` — verified against the real mazinoor.com site
- [X] T063 [US4] Implement real HTML extraction (name, description, structured per-SKU specifications, catalog code, and photo gallery) in `MazinoorExtractor.cs` — completely rewritten this session to target the real `family-grid`/lightbox-gallery structure discovered by inspecting live mazinoor.com pages (the previous version used generic `<h1>`/meta-tag regexes that could not have worked against the real site)
- [X] T064 [US4] Implement single-active-run orchestration, dry-run reporting, per-item outcomes, URL/code idempotency, local-edit preservation (existing products are never overwritten by re-import), draft creation, and real image copying in the new `backend/src/Noorestan.Api/Features/Imports/MazinoorImportRunner.cs` — runs synchronously within the request rather than as a background job (no queue/worker infrastructure was introduced for this scope)
- [X] T065 [US4] Implement owner-only import start/list/status/item-result endpoints in the new `backend/src/Noorestan.Api/Features/Imports/MazinoorImportEndpoints.cs`; scheduling is intentionally absent
- [X] T066 [P] [US4] Implement the admin shell and a real login form wired to the backend in `frontend/src/app/features/admin/admin-shell.component.ts` and `features/admin/auth/admin-login.component.ts` — replaces a prior non-functional static login mockup; no explicit unsaved-change guard yet (real gap)
- [X] T067 [P] [US4] Implement category and specification-definition forms (including choice management) in `frontend/src/app/features/admin/categories/category-list.component.ts`
- [X] T068 [US4] Implement the product editor (details, features, category specification values, publish/hide/archive/restore/delete, conflict responses surfaced) in `frontend/src/app/features/admin/products/product-editor.component.ts`
- [X] T069 [P] [US4] Implement image upload, alt-text editing, reordering (up/down controls rather than drag-and-drop, to avoid adding a new UI-kit dependency), primary selection, and removal directly in `product-editor.component.ts`
- [X] T070 [US4] Implement the product list with status tabs, search, pagination, and hide/archive/restore actions in `frontend/src/app/features/admin/products/product-list.component.ts`
- [X] T071 [P] [US4] Implement owner-only account creation, deactivation, and ownership-transfer in `frontend/src/app/features/admin/accounts/account-list.component.ts`
- [X] T072 [US4] Implement owner-only Mazinoor dry-run/commit controls with per-item outcomes and draft links in the new `frontend/src/app/features/admin/imports/import-panel.component.ts` — verified end-to-end against the real mazinoor.com site

**Checkpoint**: US4 independently enables secure, non-technical catalog ownership and isolated initial import.

---

## Phase 6: User Story 3 - Understand and Trust the Representative (Priority: P2)

**Goal**: Visitors understand Noorestan's approved relationship to Mazinoor, see credible business
information, reach the catalog, and recognize the direct-contact sales model.

**Independent Test**: Navigate homepage, company, and contact routes without catalog search; verify
approved identity/contact content, responsive RTL accessibility, catalog entry points, and no commerce UI.

### Tests for User Story 3

- [ ] T073 [P] [US3] Add public business-profile/visible-content API tests in `backend/tests/Noorestan.Api.IntegrationTests/PublicSite/PublicSiteTests.cs` — not written (real gap)
- [X] T074 [P] [US3] Add homepage/company/contact browser tests in `frontend/tests/e2e/public-site.spec.ts` — rewritten against the real business profile/copy and passing; visual-regression-style assertions are not included

### Implementation for User Story 3

- [X] T075 [US3] Implement the public business profile and visible bounded-content endpoint — done as `PublicSiteEndpoints.cs`; now backed by a real seeded `BusinessProfile` row (فروشگاه کالای برق نورستان) instead of only a hardcoded fallback string
- [X] T076 [P] [US3] Implement direct-contact actions with RTL-safe presentation — done via `core/site/site.store.ts` used from the header/footer/home/contact/product-detail; no separate `shared/business-identity/` component folder. Each contact channel (phone/WhatsApp/email) is only shown when the administrator has actually configured it, so no invented contact details are ever displayed
- [X] T077 [P] [US3] Implement the SSR homepage using real category/product data and the real business name/representative statement, with a reduced-scale hero and section rhythm (typography and spacing were substantially tightened this session per explicit UX direction; the hero visual uses a real product photograph rather than abstract CSS art) in `frontend/src/app/features/home/`
- [X] T078 [P] [US3] Implement the SSR company/contact pages using real business data in `frontend/src/app/features/company/company.component.ts` and `frontend/src/app/features/contact/contact.component.ts`
- [ ] T079 [US3] Canonical metadata and structured data are not implemented (real gap; see T037)

**Checkpoint**: US3 independently establishes representative trust and direct-contact expectations.

---

## Phase 7: User Story 5 - Manage Business Content (Priority: P2)

**Goal**: Administrators update the authoritative business profile and bounded homepage/company/contact
content safely, preview it, and publish without developer assistance.

**Independent Test**: Authenticate, edit each supported field/slot, preview and save valid changes,
exercise validation and concurrency failures, then verify consistent public rendering.

### Tests for User Story 5

- [ ] T080 [P] [US5] Add business profile/managed-content integration tests in `backend/tests/Noorestan.Api.IntegrationTests/AdminContent/AdminSiteTests.cs` — not written (real gap; verified manually including a real concurrency-conflict response)
- [ ] T081 [P] [US5] Add an admin-content browser test in `frontend/tests/e2e/admin-content.spec.ts` — not written (real gap)

### Implementation for User Story 5

- [X] T082 [US5] Implement business profile and bounded managed-content read/update endpoints with an allowlisted slot key set, safe call-to-action target validation, concurrency (`If-Match`), and audit-ready structure in the new `backend/src/Noorestan.Api/Features/AdminContent/AdminSiteEndpoints.cs` — this endpoint did not exist before this session (business content had no write path at all)
- [X] T083 [P] [US5] Implement the business-profile form (name, representative statement, phone/WhatsApp/email/address/hours, validation) directly in the new `frontend/src/app/features/admin/content/content-editor.component.ts` (not a separate `business-profile-form.component.ts`)
- [X] T084 [P] [US5] Implement homepage/company/contact slot editors (title/body/CTA label+target/visibility) in the same `content-editor.component.ts`, tabbed by slot
- [X] T085 [US5] Implement Signals-based save workflow with validation-error and optimistic-conflict display in `content-editor.component.ts` — no live preview pane (real gap; the admin edits the same fields the public pages render)
- [X] T086 [US5] Public pages read business profile/content on every SSR request (no caching layer to invalidate), so an administrative update is visible immediately on next load — verified by editing the profile and re-requesting `/api/v1/public/site`

**Checkpoint**: US5 independently enables safe routine business-content ownership.

---

## Phase 8: Polish and Cross-Cutting Concerns

**Purpose**: Validate the assembled product against constitutional, security, performance, recovery,
accessibility, and operational requirements.

**Status**: None of this phase's deliverables (formal docs, visual-regression baselines, performance
tests, backup/DR, production containers) were produced this session. Format/lint/strict-build/unit/e2e
were run and pass (see the final chat report for exact results); that verification was not written up
as `docs/release-validation.md`. This phase remains the right scope for a pre-launch hardening pass.

- [ ] T087 [P] Complete Persian copy review, approved Mazinoor relationship wording, image rights evidence, and no-commerce language audit in `frontend/src/app/features/` and `docs/content-approval.md`
- [ ] T088 [P] Add automated accessibility scans and manual keyboard/screen-reader check records for critical public/admin routes in `frontend/tests/e2e/accessibility.spec.ts` and `docs/accessibility-validation.md`
- [ ] T089 [P] Add mobile/tablet/desktop RTL visual regression baselines for the architectural hero, homepage sections, catalog cards, product gallery/specifications/contact actions, key admin forms/tables, long Persian content, reduced motion, and empty/error/loading states in `frontend/tests/e2e/visual-regression.spec.ts`
- [ ] T090 [P] Add expected-scale seed generation and measure catalog/search/filter/admin latency plus representative-mobile hero/image/glow layout stability and rendering cost against plan targets in `backend/tests/Noorestan.Api.IntegrationTests/Performance/CatalogPerformanceTests.cs`, `frontend/tests/e2e/performance.spec.ts`, and `docs/performance-results.md`
- [ ] T091 Run dependency, secret, configuration, cookie, CSRF, authorization, upload, URL allowlist, SSR-data-leak, and rate-limit security review and record remediation in `docs/security-review.md`
- [ ] T092 [P] Implement and document automated PostgreSQL backups, object versioning/retention, cleanup reconciliation, and non-production restore rehearsal in `ops/backup/` and `docs/disaster-recovery.md`
- [ ] T093 [P] Add production container/build definitions and health-aware single-region deployment configuration in `frontend/Dockerfile`, `backend/src/Noorestan.Api/Dockerfile`, and `ops/compose.production.yaml`
- [ ] T094 Validate OpenAPI and extraction schemas, regenerate/check strict frontend API types, and confirm no undocumented public/admin endpoints in `specs/001-noorestan-catalog/contracts/` and `frontend/src/app/core/api/`
- [ ] T095 Execute every functional and visual-direction scenario in `specs/001-noorestan-catalog/quickstart.md` and record results, reference screenshots, and deviations in `specs/001-noorestan-catalog/validation-results.md`
- [ ] T096 Run all format, lint, strict compile, unit, integration, SSR, browser, accessibility, and import suites and record the release gate in `docs/release-validation.md`

---

## Dependencies and Execution Order

### Phase dependencies

- Phase 1 has no dependencies.
- Phase 2 depends on Phase 1 and blocks every user story.
- US1, US2, US4, US3, and US5 all require Phase 2.
- US1 is the recommended first vertical slice.
- US2 can start after Phase 2 with seeded product data; integrating its catalog navigation is easier
  after US1.
- US4 can start after Phase 2 and supplies the sustainable production data-entry path; it does not
  depend on public UI implementation.
- US3 can start after Phase 2 using seeded BusinessProfile/ManagedContent data.
- US5 can start after Phase 2, but public consistency validation benefits from US3 being complete.
- Phase 8 depends on all stories included in the release.

### User-story dependency graph

```text
Setup -> Foundation -> US1 (public discovery MVP)
                    -> US2 (product evaluation/contact)
                    -> US4 (catalog/admin/import)
                    -> US3 (representative trust)
                    -> US5 (content management)

Recommended integration order: US1 -> US2 -> US4 -> US3 -> US5 -> Polish
Soft integration edges: US1 -> US2, US3 -> US5
```

### Within each user story

- Write and observe failing story tests before implementation.
- Establish model/query behavior before endpoints and endpoint behavior before UI integration.
- Enforce authorization and validation in the backend before relying on frontend affordances.
- Complete the independent test at the checkpoint before starting the next sequential story.

## Parallel Opportunities

- In Setup, T003-T008 and T010 can proceed in parallel after their relevant workspace root exists.
- In Foundation, identity, HTTP errors, observability, auditing, object storage, image processing, and
  frontend shell work use separate files and can proceed in parallel after T011-T014 establish models.
- After Foundation, separate contributors can implement US1, US4, and US3 concurrently using the
  OpenAPI contract and seeded fixtures.
- Within each story, tasks marked `[P]` are file-isolated and do not depend on unfinished sibling tasks.

### Parallel example: US1

```text
T027 API integration tests
T028 Persian normalizer unit tests
T029 public catalog browser tests
T030 Persian normalization implementation
T031 categories and filter queries
T035 product-card and empty-state UI
```

### Parallel example: US4

```text
T047-T053 test suites by security/catalog/image/import/browser concern
T054 authentication endpoints
T055 owner account endpoints
T061 extraction contracts
T062 official-site retrieval
T066 admin shell
T067 category forms
T069 image controls
T071 account screens
```

### Parallel example: US3 and US5

```text
US3: T073, T074, T076, T077, T078
US5: T080, T081, T083, T084
```

## Implementation Strategy

### MVP first

1. Complete Setup and Foundation.
2. Complete US1 and its independent test to deliver useful anonymous catalog discovery with seeded data.
3. Stop, validate search/filter behavior and Persian RTL accessibility, and demonstrate the slice.

### Production-capable increment

1. Add US2 for product evaluation and direct conversion.
2. Add US4 so the owner can sustain catalog data and perform the authorized initial import.
3. Add US3 and US5 for approved company presentation and routine content ownership.
4. Complete cross-cutting production validation and recovery work.

### Scope controls

- Do not add cart, checkout, payment, online orders, customer accounts, inventory, or inquiry storage.
- Do not add scheduled/continuous Mazinoor synchronization or hotlinked images.
- Do not add microservices, CQRS, MediatR, generic repositories, a global frontend store, or a page
  builder without a separately approved requirement.
- Imported source data enters through validation and normal catalog rules; public/runtime paths never
  call Mazinoor.
