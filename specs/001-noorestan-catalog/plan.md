# Implementation Plan: Noorestan Product Catalog Website

**Branch**: `001-noorestan-catalog` | **Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-noorestan-catalog/spec.md`

## Summary

Deliver a Persian-first catalog and company website with public product discovery, direct contact
conversion, and a protected owner/admin content interface. Use an Angular 22 application backed by
a single ASP.NET Core Web API modular monolith. Persist catalog, identity, content, and audit metadata
in PostgreSQL through Entity Framework Core; store optimized image objects in S3-compatible object
storage and only their references in PostgreSQL. Public routes use server rendering for discoverability
and first-load quality; administration remains client-rendered. An explicit owner-triggered import
module retrieves the authorized initial catalog from Mazinoor's official website, copies images, and
writes ordinary draft products through the same catalog rules. It is absent from all public request
paths and never runs continuously.

## Technical Context

**Language/Version**: TypeScript with Angular 22 strict mode; C# with ASP.NET Core 10 LTS and a pinned
.NET 10 SDK feature band

**Primary Dependencies**: Angular Router, HttpClient, Signals, RxJS, strictly typed Reactive Forms,
Tailwind CSS; ASP.NET Core Web API, ASP.NET Core Identity, Entity Framework Core, Npgsql; S3-compatible
object-storage client; OpenAPI tooling

**Storage**: PostgreSQL for relational data; private S3-compatible object storage with controlled
public delivery for generated image variants; no image binaries in PostgreSQL

**Testing**: Angular unit/component tests and browser-level accessibility/journey tests; .NET unit,
API integration, authorization, persistence, and import tests using disposable PostgreSQL; OpenAPI
contract validation

**Target Platform**: Contemporary mobile/tablet/desktop browsers; Linux-hosted Angular SSR process,
ASP.NET Core API, managed PostgreSQL, and S3-compatible object storage

**Project Type**: Web application with frontend, backend API, and isolated source-specific import module

**Performance Goals**: Public catalog/search/filter interactions meet SC-004 (90% within two seconds);
responsive image variants prevent original uploads from blocking listing pages; administrative writes
complete within two seconds under normal load excluding image transfer time

**Constraints**: Persian-first RTL and accessible; no commerce or inquiry persistence; backend is the
authorization boundary; no `any`, nested subscriptions, microservices, CQRS, MediatR, generic
repositories, or image blobs in the relational database; low-cost single-region deployment; premium
dark architectural-lighting visual identity implemented through centralized Tailwind/CSS tokens

**Scale/Scope**: Small-to-medium catalog baseline of up to 10,000 products, 100 categories, 100
specification definitions per category, 20 images per product, 10 administrator accounts, and 100
concurrent public visitors; paginate all unbounded collections

## Constitution Check

*GATE: Passed before research and re-checked after Phase 1 design.*

| Principle or gate | Design evidence | Result |
|-------------------|-----------------|--------|
| Strict, explicit TypeScript | Strict workspace, typed API DTOs/forms, checked OpenAPI types, `unknown` at import boundaries | PASS |
| Modern Angular/reactivity | Standalone lazy routes; Signals for synchronous state; RxJS for HTTP, cancellation, upload, and concurrency | PASS |
| Feature-based simplicity | Public catalog, content, auth, and admin features; one API modular monolith; direct EF Core use | PASS |
| RTL, responsive, accessible | Persian root direction, logical layouts, semantic UI, keyboard and breakpoint validation | PASS |
| Secure and testable delivery | Server authorization, Identity, secure cookies, CSRF controls, validation, audit events, layered tests | PASS |
| Dependency restraint | Framework capabilities first; database provider and object-storage client are the material additions | PASS |
| Quality gates | Formatting, linting, strict builds, tests, accessibility checks, and contract validation before merge | PASS |

Post-design re-check: the data model enforces lifecycle and ownership invariants, the API contract
separates public and protected surfaces, and quickstart scenarios cover RTL, accessibility, security,
archive/restore, category integrity, import isolation, and image failure paths. No exception is needed.

## Visual System Implementation

### Design language

- The public experience uses near-black and very dark navy foundations, elevated dark surfaces,
  off-white primary text, muted blue-gray secondary text, and soft ice-blue accents inspired by
  architectural lighting. Pure flat black and scattered arbitrary colors are prohibited.
- Product and architectural photography carry the visual hierarchy. Layout, borders, and glow support
  imagery rather than competing with it. Blue glow is restricted to selected hero accents, focus or
  hover feedback, primary actions, and important image framing; large neon fields are prohibited.
- Typography uses a Persian-capable variable font with a deliberate display/body scale, comfortable
  line height, and tabular/numeric treatment where technical specifications benefit. Contrast remains
  compliant in default, hover, focus, disabled, error, and muted states.
- The administration area consumes the same tokens and typography but defaults to quieter surfaces,
  denser information layouts, and minimal glow so forms, tables, validation, and destructive actions
  remain unambiguous.

### Token strategy

Define semantic CSS custom properties in `frontend/src/styles.css` and expose them through Tailwind:

```text
--color-bg                  near-black / dark navy page background
--color-bg-elevated         subtly lighter background band
--color-surface             cards, panels, fields
--color-surface-strong      active or emphasized surfaces
--color-text                white/off-white primary text
--color-text-muted          accessible muted blue-gray text
--color-border              subtle cool border
--color-border-strong       focus/selected border
--color-primary             ice-blue action color
--color-primary-contrast    text/icon color on primary
--color-glow                translucent restrained blue glow
--color-danger/success      accessible semantic states
--radius-sm/md/lg/xl        controlled corner hierarchy
--space-section             responsive section rhythm
--shadow-surface/glow       controlled elevation and accent effects
--duration-fast/base        restrained interaction timing
```

Components MUST reference semantic tokens or named Tailwind theme utilities. One-off values require a
documented exceptional visual need. Tokens MUST support forced-colors/high-contrast behavior where
applicable and MUST NOT encode meaning through color alone.

### Page composition

- Homepage: an image-led architectural hero with large premium Persian typography, restrained ambient
  glow, representative positioning, primary catalog CTA, and secondary contact CTA; followed by
  categories, featured products, why Noorestan, company introduction, and a final contact CTA.
- Catalog: spacious image-first cards with subtle borders, name, category, and product code when
  present; restrained lift/border/image transitions; controls remain compact, readable, and clearly
  distinct from commerce controls.
- Product detail: dominant responsive gallery, title/code/category hierarchy, structured technical
  specifications, description, contextual related products when meaningful data exists, and persistent
  but non-obstructive direct-contact actions. There is no purchase action.
- Administration: responsive forms and data views use clear grouping, visible labels, persistent
  validation, readable tables/cards, and restrained decoration. Dense tables adapt to mobile without
  forcing unreadable columns.

### Motion and performance

- Use CSS-first opacity, transform, border, and image transitions with short durations; avoid layout
  thrashing, autoplay motion, parallax, and animation libraries without demonstrated need.
- Honor `prefers-reduced-motion` by removing non-essential reveal and movement while preserving state
  feedback. Content MUST remain immediately usable if animation or JavaScript fails.
- Hero and product images use responsive variants, explicit aspect ratios/dimensions, lazy loading
  below the fold, and priority only for the true largest-contentful image. Glow and blur effects MUST
  be bounded and performance-tested on representative mobile hardware.

### Responsive and RTL rules

- Design and validate mobile, tablet, and desktop compositions directly in RTL; do not mirror a
  completed left-to-right layout afterward.
- Use logical spacing, alignment, border, inset, and icon semantics. Directional icons are mirrored
  only when their meaning changes with direction; technical/product symbols retain their meaning.
- Navigation, cards, gallery controls, filters, specification rows, forms, tables, dialogs, and toast
  placement MUST retain reading order, focus order, touch-target size, and legibility at all breakpoints.

## Project Structure

### Documentation (this feature)

```text
specs/001-noorestan-catalog/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- openapi.yaml
|   `-- mazinoor-extraction.schema.json
|-- checklists/
|   `-- requirements.md
`-- tasks.md                 # Created later by $speckit-tasks
```

### Source Code (repository root)

```text
frontend/
|-- src/app/
|   |-- core/                # bootstrap, API base, auth, interceptors, global errors
|   |-- shared/              # proven reusable UI and formatting only
|   `-- features/
|       |-- home/
|       |-- catalog/
|       |-- company/
|       |-- contact/
|       |-- auth/
|       `-- admin/
|           |-- products/
|           |-- categories/
|           |-- content/
|           `-- accounts/
|-- src/styles.css
|-- src/app.routes.ts
`-- tests/e2e/

backend/
|-- src/
|   |-- Noorestan.Api/
|   |   |-- Features/        # vertical endpoint/use-case folders, direct DbContext access
|   |   |-- Infrastructure/  # EF, Identity, object storage, image processing, auditing
|   |   `-- Program.cs
|   `-- Noorestan.MazinoorImport/ # official-site fetch/parser adapter, invoked only by import runs
`-- tests/
    |-- Noorestan.Api.UnitTests/
    |-- Noorestan.Api.IntegrationTests/
    `-- Noorestan.MazinoorImport.Tests/
```

**Structure Decision**: Use one deployable Angular frontend and one deployable API. Organize each by
business feature rather than technical layer. Keep official-site retrieval and parsing in a separate
source-specific module behind a narrow import interface. The API records an owner-triggered durable
import run and processes it outside the request; public/catalog features do not reference the Mazinoor
module. EF Core `DbContext` is the persistence abstraction; add services only for real workflows.

## Delivery Sequence

1. Establish workspace, strict quality gates, OpenAPI contract, PostgreSQL migrations, Identity,
   owner bootstrap, and test infrastructure.
2. Build public content and catalog browse, normalized Persian search, category filters, product
   details, responsive images, and direct contact links.
3. Build admin shell and typed forms for categories, specifications, products, lifecycle, images,
   and managed content.
4. Add owner-only account lifecycle and transfer, audit history, concurrency responses, and security
   hardening.
5. Build the isolated official-site importer, extraction fixtures, owner trigger/status UI, dry-run,
   malformed-source handling, image copying, and idempotency; review drafts from an authorized run.
6. Complete accessibility, RTL, responsive, security, recovery, performance, and acceptance tests;
   publish backup/restore and image-retention procedures.

## Complexity Tracking

No constitution violations require justification. The Mazinoor module is a source adapter, not a
service or architecture tier; it isolates a manually triggered integration from core and public paths.
