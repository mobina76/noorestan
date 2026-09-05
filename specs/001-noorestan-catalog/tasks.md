# Tasks: Noorestan Product Catalog Website

**Input**: Design documents from `/specs/001-noorestan-catalog/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Automated tests are included because the constitution requires proportionate tests for
critical behavior, security, accessibility, reactive workflows, and regressions. Within each story,
write the listed tests first and confirm they fail before implementing the behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as
an independently useful increment.

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

- [ ] T011 Define shared persistence conventions, entity base fields, concurrency tokens, and UTC handling in `backend/src/Noorestan.Api/Infrastructure/Persistence/AppDbContext.cs` and `backend/src/Noorestan.Api/Infrastructure/Persistence/EntityBase.cs`
- [ ] T012 Define AdministratorAccount and AuditEvent entities plus database mappings and owner uniqueness constraints in `backend/src/Noorestan.Api/Infrastructure/Identity/AdministratorAccount.cs`, `backend/src/Noorestan.Api/Infrastructure/Auditing/AuditEvent.cs`, and `backend/src/Noorestan.Api/Infrastructure/Persistence/AppDbContext.cs`
- [ ] T013 Define Category, SpecificationDefinition, SpecificationChoice, Product, ProductFeature, ProductSpecificationValue, ProductImage, ImageVariant, BusinessProfile, ManagedContent, ImportRun, and ImportItem entities and mappings in `backend/src/Noorestan.Api/Features/` and `backend/src/Noorestan.Api/Infrastructure/Persistence/AppDbContext.cs`
- [ ] T014 Create the initial PostgreSQL migration with foreign keys, check constraints, filtered uniqueness, lifecycle indexes, search indexes, and bounded relationship rules in `backend/src/Noorestan.Api/Infrastructure/Persistence/Migrations/`
- [ ] T015 [P] Implement ASP.NET Core Identity, secure cookie settings, CSRF validation, Admin/Owner policies, login throttling, and session revocation wiring in `backend/src/Noorestan.Api/Infrastructure/Identity/IdentityConfiguration.cs`
- [ ] T016 [P] Implement the one-use first-owner bootstrap command with secret invalidation and refusal when an owner exists in `backend/src/Noorestan.Api/Infrastructure/Identity/OwnerBootstrap.cs`
- [ ] T017 [P] Implement Problem Details, validation-error, authorization-error, and optimistic-concurrency middleware in `backend/src/Noorestan.Api/Infrastructure/Http/ApiProblemDetails.cs` and `backend/src/Noorestan.Api/Infrastructure/Http/ConcurrencyMiddleware.cs`
- [ ] T018 [P] Implement structured logging, correlation IDs, redaction, health/readiness checks, and request metrics in `backend/src/Noorestan.Api/Infrastructure/Observability/ObservabilityConfiguration.cs`
- [ ] T019 [P] Implement audit event recording for authentication and content mutations without sensitive values in `backend/src/Noorestan.Api/Infrastructure/Auditing/AuditWriter.cs`
- [ ] T020 [P] Implement the S3-compatible object-store abstraction, official/public delivery URL mapping, durable cleanup records, and test fake in `backend/src/Noorestan.Api/Infrastructure/Images/ObjectStorage.cs` and `backend/tests/Noorestan.Api.IntegrationTests/Fakes/FakeObjectStorage.cs`
- [ ] T021 [P] Implement signature-based image validation and bounded AVIF/WebP/compatibility variant generation in `backend/src/Noorestan.Api/Infrastructure/Images/ImageProcessor.cs`
- [ ] T022 Configure versioned `/api/v1` endpoints, JSON conventions, cookie credentials, antiforgery header propagation, and generated typed API models in `backend/src/Noorestan.Api/Program.cs`, `frontend/src/app/core/http/`, and `frontend/src/app/core/api/`
- [ ] T023 [P] Implement the premium dark Angular shell, skip link, responsive RTL navigation, semantic token-based surfaces, restrained CSS navigation feedback, reduced-motion behavior, lazy route boundaries, loading/error surface, and route titles in `frontend/src/app/app.component.ts`, `frontend/src/app/app.routes.ts`, and `frontend/src/app/core/layout/`
- [ ] T024 [P] Implement Signals-based session state, RxJS session loading, functional authentication guard, CSRF interceptor, and global Problem Details mapping in `frontend/src/app/core/auth/` and `frontend/src/app/core/http/`
- [ ] T025 Create shared PostgreSQL/object-storage integration fixtures and authenticated client helpers in `backend/tests/Noorestan.Api.IntegrationTests/Infrastructure/ApiFactory.cs`
- [ ] T026 Create shared Persian RTL mobile/tablet/desktop fixtures, keyboard helpers, semantic contrast/focus assertions, reduced-motion and forced-color modes, and accessibility assertions in `frontend/tests/e2e/fixtures/rtl.fixture.ts` and `frontend/tests/e2e/fixtures/accessibility.ts`

**Checkpoint**: Persistence, contracts, authorization, HTTP behavior, object storage, and test harnesses
are ready; user-story phases may begin.

---

## Phase 3: User Story 1 - Discover Suitable Products (Priority: P1) — MVP

**Goal**: Visitors browse published products by category and find relevant products through Persian
search and category-specific filters.

**Independent Test**: Seed multiple lifecycle states and category attributes, then browse, search with
Persian variants, combine/clear filters, paginate, and reach a relevant published product anonymously.

### Tests for User Story 1

- [ ] T027 [P] [US1] Add public category, catalog pagination, lifecycle visibility, search normalization, filter, and empty-state API integration tests in `backend/tests/Noorestan.Api.IntegrationTests/PublicCatalog/PublicCatalogTests.cs`
- [ ] T028 [P] [US1] Add unit tests for Persian/Arabic letter, digit, whitespace, and partial-term normalization in `backend/tests/Noorestan.Api.UnitTests/Catalog/PersianSearchNormalizerTests.cs`
- [ ] T029 [P] [US1] Add browser tests for anonymous browse/search/filter/query-URL restoration, keyboard operation, image-first card hierarchy, product code variants, restrained hover/focus behavior, and mobile/tablet/desktop RTL composition in `frontend/tests/e2e/public-catalog.spec.ts`

### Implementation for User Story 1

- [ ] T030 [P] [US1] Implement Persian normalization and normalized searchable field maintenance in `backend/src/Noorestan.Api/Features/Catalog/Search/PersianSearchNormalizer.cs`
- [ ] T031 [P] [US1] Implement published-category list and applicable filter-definition queries in `backend/src/Noorestan.Api/Features/PublicCatalog/GetCategories.cs` and `backend/src/Noorestan.Api/Features/PublicCatalog/GetCategoryFilters.cs`
- [ ] T032 [US1] Implement bounded published-product search, category filtering, typed specification filters, stable sorting, and pagination in `backend/src/Noorestan.Api/Features/PublicCatalog/ListProducts.cs`
- [ ] T033 [US1] Map and register the public categories, filters, and products endpoints to the OpenAPI contract in `backend/src/Noorestan.Api/Features/PublicCatalog/PublicCatalogEndpoints.cs`
- [ ] T034 [P] [US1] Implement typed catalog query parsing/serialization and RxJS-cancelled search/filter loading in `frontend/src/app/features/catalog/data-access/catalog-api.ts` and `frontend/src/app/features/catalog/data-access/catalog-query.store.ts`
- [ ] T035 [P] [US1] Implement premium minimal image-first product cards with semantic dark surfaces, subtle cool borders/glow, restrained hover/image transitions, product name/category/optional code, plus accessible result summary, pagination, and recovery empty state in `frontend/src/app/features/catalog/ui/`
- [ ] T036 [US1] Implement lazy catalog and category pages with Signals-derived state and URL-backed search/filter controls in `frontend/src/app/features/catalog/pages/catalog-page.component.ts` and `frontend/src/app/features/catalog/catalog.routes.ts`
- [ ] T037 [US1] Add public catalog SSR metadata, canonical query behavior, and error/not-found handling in `frontend/src/app/features/catalog/catalog.routes.ts` and `frontend/src/app/core/seo/seo.service.ts`

**Checkpoint**: US1 independently delivers the searchable, filterable published catalog MVP.

---

## Phase 4: User Story 2 - Evaluate and Inquire About a Product (Priority: P1)

**Goal**: Visitors understand a product through structured details and copied responsive images, then
contact Noorestan directly with product context and no stored inquiry.

**Independent Test**: Open a published multi-image product, inspect its structured data and gallery,
use each direct contact route, and confirm hidden/archived/nonexistent products return no public data.

### Tests for User Story 2

- [ ] T038 [P] [US2] Add product-detail visibility, specification ordering, image variant, and contextual contact API tests in `backend/tests/Noorestan.Api.IntegrationTests/PublicCatalog/ProductDetailTests.cs`
- [ ] T039 [P] [US2] Add mobile/tablet/desktop RTL tests for dominant responsive gallery, image transitions, title/code/category hierarchy, long specifications, related-product conditions, visible direct contact, keyboard/alt text, reduced motion, no inquiry request, and unpublished-not-found behavior in `frontend/tests/e2e/product-detail.spec.ts`

### Implementation for User Story 2

- [ ] T040 [US2] Implement the published product-detail query with ordered features/specifications/images and contact-link context in `backend/src/Noorestan.Api/Features/PublicCatalog/GetProduct.cs`
- [ ] T041 [US2] Register product-detail routing and ensure unpublished, hidden, archived, and missing products share the safe public not-found response in `backend/src/Noorestan.Api/Features/PublicCatalog/PublicCatalogEndpoints.cs`
- [ ] T042 [P] [US2] Implement the dominant accessible responsive picture/gallery with explicit dimensions, bounded cool framing glow, keyboard/touch controls, restrained image transitions, below-fold lazy loading, and reduced-motion fallback in `frontend/src/app/features/catalog/ui/product-gallery/`
- [ ] T043 [P] [US2] Implement structured high-contrast technical features/specification presentation with semantic surfaces, locale-appropriate values, natural RTL reading order, and responsive handling for long values in `frontend/src/app/features/catalog/ui/product-specifications/`
- [ ] T044 [P] [US2] Implement phone, WhatsApp, and email actions with encoded product reference and no API submission in `frontend/src/app/features/contact/product-contact-actions.component.ts`
- [ ] T045 [US2] Implement the premium SSR product-detail composition with photography-first gallery, title/code/category hierarchy, description, related products when meaningful, metadata, canonical URL, loading/error state, and highly visible non-obstructive direct-contact placement in `frontend/src/app/features/catalog/pages/product-detail-page.component.ts`
- [ ] T046 [US2] Add assertions that the API and generated frontend contract expose no inquiry, cart, checkout, payment, order, or inventory mutation in `backend/tests/Noorestan.Api.IntegrationTests/Contracts/NonCommerceBoundaryTests.cs`

**Checkpoint**: US2 independently supports product evaluation and qualified direct contact.

---

## Phase 5: User Story 4 - Manage the Product Catalog (Priority: P1)

**Goal**: Authenticated administrators safely manage accounts, categories, flexible specifications,
products, lifecycle, images, and the authorized initial Mazinoor import without developer assistance.

**Independent Test**: Authenticate as admin/owner, exercise authorization boundaries, create and
publish a complete product, manage images/specifications, hide/archive/restore/delete it, enforce
category integrity, resolve a concurrency conflict, and dry-run/commit/repeat an official-site import.

### Tests for User Story 4

- [ ] T047 [P] [US4] Add authentication, CSRF, throttling, account deactivation, owner transfer, and backend policy integration tests in `backend/tests/Noorestan.Api.IntegrationTests/Identity/IdentityTests.cs`
- [ ] T048 [P] [US4] Add category/specification type, incompatible change, category deletion, and concurrency integration tests in `backend/tests/Noorestan.Api.IntegrationTests/AdminCatalog/CategoryTests.cs`
- [ ] T049 [P] [US4] Add product validation, publish/hide/archive/restore/permanent-delete, category-change, and stale-update integration tests in `backend/tests/Noorestan.Api.IntegrationTests/AdminCatalog/ProductTests.cs`
- [ ] T050 [P] [US4] Add image signature/limit/variant/primary/order/failure/cleanup integration tests in `backend/tests/Noorestan.Api.IntegrationTests/AdminCatalog/ProductImageTests.cs`
- [ ] T051 [P] [US4] Add official Mazinoor extraction fixture, malformed source, origin restriction, timeout, bounded retry/concurrency, and schema contract tests in `backend/tests/Noorestan.MazinoorImport.Tests/MazinoorExtractorTests.cs`
- [ ] T052 [P] [US4] Add dry-run, owner authorization, idempotent code/URL matching, local-edit preservation, image copying, and runtime-isolation import integration tests in `backend/tests/Noorestan.Api.IntegrationTests/Imports/MazinoorImportTests.cs`
- [ ] T053 [P] [US4] Add Persian typed-form, keyboard, responsive table/card, contrast/focus, reduced-motion, destructive confirmation, conflict, upload failure, account policy, and import-status browser tests proving visual effects never obscure admin work in `frontend/tests/e2e/admin-catalog.spec.ts`

### Implementation for User Story 4

- [ ] T054 [P] [US4] Implement login, logout, session, antiforgery issuance, and deactivated-session rejection endpoints in `backend/src/Noorestan.Api/Features/Identity/AuthEndpoints.cs`
- [ ] T055 [P] [US4] Implement owner-only account create/deactivate and atomic ownership-transfer endpoints in `backend/src/Noorestan.Api/Features/Identity/OwnerAccountEndpoints.cs`
- [ ] T056 [US4] Implement category CRUD, ordering, specification definitions/choices, incompatible-change validation, and non-archived-product deletion guard in `backend/src/Noorestan.Api/Features/AdminCatalog/CategoryEndpoints.cs`
- [ ] T057 [US4] Implement product CRUD and typed specification validation with category-change mapping/clearing semantics in `backend/src/Noorestan.Api/Features/AdminCatalog/ProductEndpoints.cs`
- [ ] T058 [US4] Implement publish prerequisites and atomic draft/published/hidden/archived/restore transitions in `backend/src/Noorestan.Api/Features/AdminCatalog/ProductLifecycle.cs`
- [ ] T059 [US4] Implement confirmed archived-only permanent deletion with transactional metadata removal and durable object cleanup in `backend/src/Noorestan.Api/Features/AdminCatalog/PermanentDeleteProduct.cs`
- [ ] T060 [US4] Implement product image upload, validation, processing status, variants, order, primary selection, replacement, removal, retry, and cleanup in `backend/src/Noorestan.Api/Features/AdminCatalog/ProductImageEndpoints.cs`
- [ ] T061 [P] [US4] Implement normalized Mazinoor extraction records and validate them against `specs/001-noorestan-catalog/contracts/mazinoor-extraction.schema.json` in `backend/src/Noorestan.MazinoorImport/Contracts/`
- [ ] T062 [P] [US4] Implement allowlisted HTTPS retrieval with timeout, response/media limits, bounded concurrency, retry/backoff, and canonical URL handling in `backend/src/Noorestan.MazinoorImport/Retrieval/MazinoorHttpSource.cs`
- [ ] T063 [US4] Implement deterministic category/product traversal and HTML extraction of codes, descriptions, specifications, source URLs, and image references in `backend/src/Noorestan.MazinoorImport/Extraction/MazinoorExtractor.cs`
- [ ] T064 [US4] Implement durable single-active-run orchestration, dry-run reporting, per-item transactions, code/URL idempotency, hashes, local-edit preservation, draft creation, and image copying in `backend/src/Noorestan.Api/Features/Imports/MazinoorImportRunner.cs`
- [ ] T065 [US4] Implement owner-only import start/status/item-result endpoints and explicitly omit scheduling in `backend/src/Noorestan.Api/Features/Imports/MazinoorImportEndpoints.cs`
- [ ] T066 [P] [US4] Implement the lazy Persian admin shell and login using the shared dark token system with quieter surfaces/minimal glow, responsive RTL navigation/data layouts, owner awareness, clear focus/errors, and unsaved-change protection in `frontend/src/app/features/auth/` and `frontend/src/app/features/admin/admin.routes.ts`
- [ ] T067 [P] [US4] Implement strongly typed category/specification forms with Signals-derived validity, semantic token-based fields, persistent labels/errors, natural RTL spacing/icons, and mobile-safe table/card adaptation in `frontend/src/app/features/admin/categories/`
- [ ] T068 [US4] Implement the strongly typed responsive RTL product editor for details, features, category specifications, prominent photography management entry, publication validation, and conflict resolution using restrained admin surfaces in `frontend/src/app/features/admin/products/product-editor/`
- [ ] T069 [P] [US4] Implement RxJS upload/progress/cancellation and accessible responsive RTL image ordering/primary/removal controls with photography-led previews, clear focus, and motion-safe feedback in `frontend/src/app/features/admin/products/product-images/`
- [ ] T070 [US4] Implement the responsive RTL product list using readable table-to-card adaptation, semantic status styling, and explicit hide/archive/restore/permanent-delete workflows with confirmation and current-version handling in `frontend/src/app/features/admin/products/product-list/`
- [ ] T071 [P] [US4] Implement owner-only account creation, deactivation, and ownership-transfer screens in `frontend/src/app/features/admin/accounts/`
- [ ] T072 [US4] Implement owner-only Mazinoor dry-run/commit controls, active-run progress, per-item outcomes, warnings, errors, and draft links in `frontend/src/app/features/admin/imports/`

**Checkpoint**: US4 independently enables secure, non-technical catalog ownership and isolated initial import.

---

## Phase 6: User Story 3 - Understand and Trust the Representative (Priority: P2)

**Goal**: Visitors understand Noorestan's approved relationship to Mazinoor, see credible business
information, reach the catalog, and recognize the direct-contact sales model.

**Independent Test**: Navigate homepage, company, and contact routes without catalog search; verify
approved identity/contact content, responsive RTL accessibility, catalog entry points, and no commerce UI.

### Tests for User Story 3

- [ ] T073 [P] [US3] Add public business-profile/visible-content API tests and unsafe-content validation tests in `backend/tests/Noorestan.Api.IntegrationTests/PublicSite/PublicSiteTests.cs`
- [ ] T074 [P] [US3] Add homepage/company/contact tests for premium dark visual hierarchy, architectural hero imagery, restrained glow, required homepage sections/CTAs, responsive RTL, keyboard/focus, reduced motion, metadata, and non-commerce presentation in `frontend/tests/e2e/public-site.spec.ts`

### Implementation for User Story 3

- [ ] T075 [US3] Implement the public business profile and visible bounded-content endpoint in `backend/src/Noorestan.Api/Features/PublicSite/GetPublicSite.cs`
- [ ] T076 [P] [US3] Implement reusable semantic-token business identity and prominent direct-contact components with ice-blue primary treatment, restrained glow, accessible contrast/focus, and RTL-safe icons in `frontend/src/app/features/contact/` and `frontend/src/app/shared/business-identity/`
- [ ] T077 [P] [US3] Implement the premium SSR homepage with an architectural-lighting image hero, large Persian typography, bounded ambient blue glow, primary catalog and secondary contact CTAs, then polished category, featured-product, why Noorestan, company-introduction, and final contact sections in `frontend/src/app/features/home/`
- [ ] T078 [P] [US3] Implement premium minimal SSR company/contact pages with image-led dark composition, semantic Persian content, current details, restrained interactions, and responsive RTL behavior in `frontend/src/app/features/company/` and `frontend/src/app/features/contact/contact-page.component.ts`
- [ ] T079 [US3] Add canonical metadata, organization/product-representative structured data using approved content only, and share previews in `frontend/src/app/core/seo/seo.service.ts`

**Checkpoint**: US3 independently establishes representative trust and direct-contact expectations.

---

## Phase 7: User Story 5 - Manage Business Content (Priority: P2)

**Goal**: Administrators update the authoritative business profile and bounded homepage/company/contact
content safely, preview it, and publish without developer assistance.

**Independent Test**: Authenticate, edit each supported field/slot, preview and save valid changes,
exercise validation and concurrency failures, then verify consistent public rendering.

### Tests for User Story 5

- [ ] T080 [P] [US5] Add business profile, bounded slot, link/markup validation, authorization, audit, and concurrency integration tests in `backend/tests/Noorestan.Api.IntegrationTests/AdminContent/AdminSiteTests.cs`
- [ ] T081 [P] [US5] Add typed Persian form, token-consistent preview, responsive RTL, contrast/focus, reduced-motion, error preservation, keyboard, and public visual/content consistency browser tests in `frontend/tests/e2e/admin-content.spec.ts`

### Implementation for User Story 5

- [ ] T082 [US5] Implement business profile and bounded managed-content read/update endpoints with allowlisted slots, safe link targets, validation, concurrency, and audit in `backend/src/Noorestan.Api/Features/AdminContent/AdminSiteEndpoints.cs`
- [ ] T083 [P] [US5] Implement the strongly typed Persian business-profile form with quiet semantic dark surfaces, responsive RTL grouping, persistent labels, phone/WhatsApp/email/address/hours fields, and accessible validation in `frontend/src/app/features/admin/content/business-profile-form.component.ts`
- [ ] T084 [P] [US5] Implement bounded homepage/company/contact slot editors with plain structured content and safe call-to-action targets in `frontend/src/app/features/admin/content/content-slot-editor.component.ts`
- [ ] T085 [US5] Implement Signals-based preview, dirty state, RxJS save workflow, validation mapping, and optimistic-conflict resolution in `frontend/src/app/features/admin/content/content-editor-page.component.ts`
- [ ] T086 [US5] Refresh/invalidate SSR public content consistently after an administrative update in `frontend/src/app/features/admin/content/content-api.ts` and `backend/src/Noorestan.Api/Features/AdminContent/AdminSiteEndpoints.cs`

**Checkpoint**: US5 independently enables safe routine business-content ownership.

---

## Phase 8: Polish and Cross-Cutting Concerns

**Purpose**: Validate the assembled product against constitutional, security, performance, recovery,
accessibility, and operational requirements.

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
