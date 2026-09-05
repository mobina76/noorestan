# Phase 0 Research: Noorestan Product Catalog Website

## Application topology

**Decision**: Use a modular monolith: one Angular frontend, one ASP.NET Core API, one PostgreSQL
database, and object storage.

**Rationale**: Catalog and administration share one modest domain. A monolith minimizes deployment,
transactions, and operations while feature folders keep boundaries understandable.

**Alternatives considered**: Microservices, CQRS, MediatR, and repository/unit-of-work wrappers add
cost without a demonstrated problem; EF Core already provides the persistence abstraction.

## Runtime version policy

**Decision**: Use ASP.NET Core 10 LTS and pin the .NET 10 SDK feature band in the repository.

**Rationale**: .NET 10 is the current LTS line for this plan's date. Pinning its SDK makes local,
continuous-integration, and production builds reproducible while retaining long-term servicing.

**Alternatives considered**: A short-term-support release favors novelty over this project's need for
stable, low-maintenance operation.

## Relational database

**Decision**: Use PostgreSQL through EF Core and Npgsql.

**Rationale**: PostgreSQL is production-proven, inexpensive as a managed service, supports concurrent
public reads and admin writes, strong constraints, transactions, useful indexing, and routine
backup/restore. It avoids an expected migration if the catalog grows while remaining one conventional
dependency.

**Alternatives considered**: SQLite has less setup but ties production to a single persistent
filesystem and is weaker operationally for concurrent writes. SQL Server usually costs more without
a project-specific benefit. Document storage weakens relational integrity and filtering.

## Flexible specifications and Persian search

**Decision**: Model category-owned specification definitions and typed product values relationally.
Support text, number, boolean, and choice values with optional unit and filter metadata. Normalize
Arabic/Persian letter variants, whitespace, and digits at write and query boundaries. Add specialized
PostgreSQL search indexes only after measurement.

**Rationale**: This preserves validation and filter semantics without hard-coded product columns or
unstructured blobs. Direct relational queries are adequate for the stated scale.

**Alternatives considered**: JSON-only values weaken constraints and filtering. A separate search
service is excessive; PostgreSQL full-text/trigram indexing remains a measured upgrade path.

## Image storage and delivery

**Decision**: Store originals and generated responsive variants in private S3-compatible object
storage. Keep keys, dimensions, media type, size, checksum, order, primary flag, and alt text in
PostgreSQL. Deliver public variants through a stable CDN/object gateway URL.

**Rationale**: Object storage is durable, low-cost, and keeps binaries out of database backups.
Pre-generated AVIF/WebP plus a compatibility format at bounded widths provides predictable responsive
delivery without runtime transformations.

**Alternatives considered**: Database blobs violate the explicit constraint. Local files complicate
multi-instance operation and recovery. A digital-asset-management platform is unnecessary.

## Authentication and authorization

**Decision**: Use ASP.NET Core Identity with individual local accounts and an owner designation.
Use Secure, HttpOnly, SameSite cookies for the same-origin browser application and CSRF protection on
state changes. Enforce `Admin` and `Owner` policies in the API; Angular guards only aid navigation.
Bootstrap the first owner through a deployment-time one-use procedure.

**Rationale**: Framework identity avoids custom credential handling. Cookies keep credentials out of
browser script storage. Policies directly express the approved account model.

**Alternatives considered**: Browser-stored bearer tokens add exposure without a cross-domain need.
External identity is disproportionate for a few trusted operators. Shared credentials violate the
approved accountability rule.

## Angular rendering and state

**Decision**: Use standalone APIs and lazy feature routes. Server-render public home, company,
catalog, category, and product routes; keep admin routes client-rendered. Use Signals for synchronous
and derived view state and RxJS for HttpClient, debouncing, cancellation, uploads, and concurrency.

**Rationale**: Public routes benefit from crawlable metadata and strong first loads. This follows the
constitution's reactive boundaries without adding a global store.

**Alternatives considered**: Client-only public rendering weakens discovery and link previews. Full
prerendering cannot cover changing product routes without rebuilds. A global store is unjustified.

## Visual system and interaction language

**Decision**: Implement one semantic Tailwind/CSS-token system for a near-black/dark-navy foundation,
off-white and muted blue-gray type, ice-blue actions, cool subtle borders, and tightly bounded blue
glow. Use image-led compositions, Persian-first typography, CSS-first micro-interactions, explicit
responsive states, and reduced-motion fallbacks. Public layouts use more atmosphere and whitespace;
administration uses the same identity with quieter effects and denser task-focused surfaces.

**Rationale**: Semantic tokens preserve the premium architectural-lighting identity across features
without scattering colors or coupling templates to raw values. The public/admin modulation keeps the
brand coherent while protecting catalog-management usability. Image-first composition matches the
product's value, while bounded glow, responsive variants, and CSS-only motion control performance.

**Alternatives considered**: A generic store theme would incorrectly imply online commerce. Pure black
with strong neon effects undermines trust and readability. Separate public/admin design systems would
duplicate tokens and drift. A third-party animation system adds weight and motion complexity without a
need; restrained CSS transitions and optional intersection-based reveals are sufficient.

**Validation**: Test semantic contrast in every component state, keyboard/focus visibility, reduced
motion, forced colors where applicable, mobile/tablet/desktop RTL composition, long Persian content,
image loading/layout stability, and representative-device rendering cost. Visual regression baselines
cover the hero, catalog, product detail, contact actions, and key admin forms/tables.

## API and concurrency

**Decision**: Expose versioned JSON under `/api/v1` with OpenAPI DTO contracts, bounded pagination,
Problem Details errors, optimistic concurrency tokens, and atomic lifecycle/integrity transactions.

**Rationale**: This keeps strict frontend types aligned and prevents silent concurrent overwrites.

**Alternatives considered**: GraphQL and multiple backend-for-frontend services add complexity.
Last-write-wins risks administrator data loss.

## Mazinoor initial import

**Decision**: Treat the official Mazinoor website as the authorized initial source. An owner explicitly
starts a dry-run or commit run from administration. A separate Mazinoor adapter retrieves allowed
catalog/category/product pages, parses product names, codes, categories, descriptions, specifications,
source URLs, and image URLs, then emits a versioned normalized extraction contract. The import
orchestrator validates that contract, downloads authorized images with bounded requests, stores copies
in Noorestan object storage, and creates or updates normal draft products through catalog use cases.
No scheduled or continuous synchronization exists.

**Rationale**: Durable `ImportRun`/`ImportItem` records make a long operation observable and retryable
without holding an HTTP request. Idempotency uses the stable Mazinoor product code when available,
falling back to a canonical source URL; a source-content hash identifies unchanged items. Source code,
URL, and last-import evidence remain for traceability, but imported fields become Noorestan-owned and
editable. All images and catalog data are copied locally, so Mazinoor downtime or markup changes can
only fail a requested import and cannot affect normal public/admin operation.

**Alternatives considered**: A supplied manifest no longer satisfies the approved source requirement.
Hotlinking violates availability and storage requirements. A scheduled crawler or continuous sync adds
unrequested overwrite/conflict semantics. Direct database loading bypasses validation and audit rules.
Browser automation is a fallback only if authorized pages require rendering and direct HTTP retrieval
cannot obtain the data; prefer deterministic HTTP/HTML parsing first.

## Import safety and change containment

**Decision**: Allow only configured official Mazinoor origins, enforce HTTPS, timeouts, response-size
and content-type limits, bounded concurrency, retry with backoff for transient failures, and one active
run at a time. Respect the authorized access method and rate limits. Parse into an intermediate snapshot
before catalog writes. Missing required identity/category data fails that item; missing optional fields
produces warnings; malformed pages never publish partial products. Commit each valid product atomically,
and never overwrite later Noorestan edits during reruns unless an owner explicitly approves a reviewed
field-level update policy.

**Rationale**: The official site's structure is an external failure boundary. Validation, fixtures,
dry-run diffs, and per-item outcomes keep changes reviewable and prevent a markup change from corrupting
the catalog. Single-run execution and bounded retrieval are considerate and operationally simple.

**Alternatives considered**: Parsing directly into EF entities couples source markup to core data.
Failing the entire run for one malformed optional field prevents useful progress; silently accepting
malformed required data risks duplicates and corruption. Automatic overwrites conflict with normal
admin ownership of imported records.

## Managed content

**Decision**: Provide a bounded set of typed homepage/company/contact content slots and one business
profile, not a general page builder.

**Rationale**: Safe routine editing stays accessible and testable without CMS complexity.

**Alternatives considered**: A headless CMS or arbitrary rich page builder adds dependencies,
sanitization exposure, and flexibility absent from the specification.

## Operations and observability

**Decision**: Use structured logs with correlation IDs, health/readiness endpoints, security audit
records, latency/error metrics, dependency health checks, automated database backups, object retention,
and a rehearsed restore procedure.

**Rationale**: These controls are sufficient for two runtime processes without premature distributed
tracing infrastructure.

**Alternatives considered**: No observability makes failures opaque; a full distributed telemetry
stack is disproportionate until operations demonstrate need.
