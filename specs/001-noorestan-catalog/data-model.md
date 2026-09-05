# Data Model: Noorestan Product Catalog

## Conventions

- Use UUID identifiers, UTC timestamps, and database-enforced foreign keys and unique constraints.
- Editable aggregate roots expose an opaque concurrency token returned by the API and required on
  updates/deletes.
- Normalize searchable Persian text on write while retaining original display text.
- Permanent deletion is a transaction and removes database metadata only after object deletion is
  confirmed or queued in a durable cleanup record.
- Audit events are append-only and never contain passwords, cookies, object credentials, or image
  binary content.

## Entities

### AdministratorAccount

Identity-managed account extended with `id`, `displayName`, normalized unique `email`, `isActive`,
`isOwner`, `createdAt`, `deactivatedAt`, `lastLoginAt`, and `concurrencyToken`.

Rules:

- Each person has one account; email is unique after normalization.
- Exactly one active account is owner.
- Only the owner can create/deactivate accounts or transfer ownership.
- The owner cannot be deactivated until ownership is atomically transferred to another active account.
- Deactivation invalidates active sessions; it does not erase attributed audit history.

### Category

Fields: `id`, unique `slug`, `nameFa`, `normalizedNameFa`, optional `descriptionFa`, `displayOrder`,
`isVisible`, timestamps, and `concurrencyToken`.

Relationships: owns many `SpecificationDefinition` records and classifies many `Product` records.

Rules:

- Slug and Persian name are required; display order is non-negative.
- A visible category is publicly listed only when it has at least one published product.
- Deletion is blocked while any non-archived product references it. Archived products may retain the
  category reference until they are reassigned or permanently deleted.

### SpecificationDefinition

Fields: `id`, `categoryId`, `key`, `labelFa`, `valueType` (`text`, `number`, `boolean`, `choice`),
optional `unitFa`, `isRequired`, `isFilterable`, `displayOrder`, timestamps, and `concurrencyToken`.

Relationships: belongs to one category; owns zero or more `SpecificationChoice` records; is referenced
by product specification values.

Rules:

- `key` is unique within a category and remains stable after values exist.
- Choice definitions require at least one active choice. Only boolean, choice, and bounded-value
  definitions may be filterable; a text field cannot become filterable without an explicit supported
  filter mode.
- Type changes are blocked while incompatible product values exist; the admin must migrate or clear
  those values explicitly.

### SpecificationChoice

Fields: `id`, `definitionId`, stable `key`, `labelFa`, `displayOrder`, and `isActive`.

Rules: key is unique per definition; a referenced choice may be deactivated but not silently deleted.

### Product

Fields: `id`, unique `slug`, optional `mazinoorProductCode`, optional `sourceUrl`, optional
`sourceContentHash`, optional `lastImportedAt`, `categoryId`, `nameFa`, `normalizedNameFa`,
`shortDescriptionFa`, `descriptionFa`, optional `technicalNotesFa`, `status`
(`draft`, `published`, `hidden`, `archived`), optional `publishedAt`, optional `archivedAt`,
`displayOrder`, timestamps, and `concurrencyToken`.

Relationships: belongs to one category; owns ordered `ProductFeature`, `ProductSpecificationValue`,
and `ProductImage` records.

Rules:

- Category, slug, name, and descriptions required for publication; a product must have a primary
  ready image and all required specification values before publishing.
- Public queries include only `published`; `hidden`, `draft`, and `archived` are never public.
- `draft` or `hidden` -> `published` after validation; `published` -> `hidden`; any non-archived state
  -> `archived`; `archived` -> `draft` on restore; only `archived` -> permanent deletion.
- Category change clears or explicitly maps values not defined by the new category in one transaction.
- Mazinoor product code is the preferred unique import identity. Canonical source URL is the fallback
  identity when no product code exists. Source URL/code are retained for traceability; neither is used
  by public runtime reads, and imported business fields remain editable.

### ProductFeature

Fields: `id`, `productId`, `textFa`, and `displayOrder`.

Rules: non-empty text; order unique within product.

### ProductSpecificationValue

Fields: `id`, `productId`, `definitionId`, and exactly one applicable value among `textValue`,
`numericValue`, `booleanValue`, or `choiceId`; includes normalized text where needed.

Rules:

- One value per product and definition; definition must belong to the product's category.
- Stored value must match the definition type and required/unit/choice constraints.
- Numeric values use fixed precision suitable for catalog measurements, never floating point.

### ProductImage

Fields: `id`, `productId`, `originalObjectKey`, `status` (`processing`, `ready`, `failed`), `mediaType`,
`byteSize`, `width`, `height`, `checksum`, `altTextFa`, `displayOrder`, `isPrimary`, timestamps, and
`concurrencyToken`.

Relationships: owns multiple `ImageVariant` records.

Rules:

- Object keys, never public provider URLs or binary content, are authoritative database values.
- At most one primary image per product; only a ready image may be primary.
- Allowed source formats and maximum size/dimensions are centrally configured and validated from
  file signatures, not extensions alone.
- Removing an image records a durable object-cleanup operation; replacing it never overwrites an
  existing key.

### ImageVariant

Fields: `id`, `productImageId`, `format`, `width`, `height`, `byteSize`, and unique `objectKey`.

Rules: `(productImageId, format, width)` is unique; variants become public only when the parent is
ready and the product is published.

### BusinessProfile

Singleton fields: `id`, `businessNameFa`, approved `representativeStatementFa`, optional `addressFa`,
`phoneNumbers`, `whatsAppNumber`, `email`, optional `operatingHoursFa`, social/contact links,
timestamps, and `concurrencyToken`.

Rules: business name and at least one direct contact method are required; phone, WhatsApp, email, and
URL values are normalized and validated. Public contact rendering derives only from this record.

### ManagedContent

Fields: `id`, unique `slotKey`, `titleFa`, `bodyFa`, optional `callToActionLabelFa`, optional
`callToActionTarget`, `isVisible`, timestamps, and `concurrencyToken`.

Rules: slot keys come from a bounded allowlist (home hero, home introduction, home highlights,
company introduction, contact introduction); content is plain structured text with a restricted link
target, not arbitrary executable markup.

### AuditEvent

Fields: `id`, `occurredAt`, optional `administratorId`, `eventType`, `entityType`, optional `entityId`,
`outcome`, `correlationId`, and redacted structured details.

Rules: append-only; captures authentication outcomes, account lifecycle/ownership changes, catalog
mutations, publication transitions, image changes, content changes, and permanent deletions.

### ImportRun and ImportItem

`ImportRun` fields: `id`, source base URL, extractor version, mode (`dryRun`, `commit`), status
(`queued`, `running`, `completed`, `completedWithWarnings`, `failed`, `cancelled`), requested scope,
started/completed timestamps, initiating owner ID, counts, and run-level error summary. `ImportItem`
fields: run ID, canonical source URL, optional Mazinoor product code, source content hash, outcome
(`new`, `unchanged`, `updated`, `skipped`, `invalid`, `failed`), resulting product ID, warnings/errors,
and fetched timestamp.

Rules:

- Only the owner can create a run; only one run may be active. There is no schedule or continuous sync.
- Product code is the idempotency key when present; otherwise canonical official source URL is used.
- Dry-run stores the report but mutates no category, product, or image records.
- Commit creates normal draft products. A rerun never creates a duplicate and does not automatically
  overwrite fields edited in Noorestan; proposed source changes are reported for explicit review.
- Missing/malformed required source identity or category data marks the item invalid. Missing optional
  content is a warning. One item failure does not discard other outcomes or the run report.
- Remote images are fetched only from configured official origins, validated, copied to Noorestan
  object storage, and then processed like admin uploads. No persisted public image URL hotlinks Mazinoor.

## Principal relationships

```text
AdministratorAccount 1 ---- * AuditEvent
Category             1 ---- * Product
Category             1 ---- * SpecificationDefinition
SpecificationDefinition 1 - * SpecificationChoice
Product              1 ---- * ProductFeature
Product              1 ---- * ProductSpecificationValue * ---- 1 SpecificationDefinition
Product              1 ---- * ProductImage 1 ---- * ImageVariant
ImportRun            1 ---- * ImportItem * ---- 0..1 Product
BusinessProfile      singleton
ManagedContent       bounded slots
```

## Query and index requirements

- Unique indexes: category/product slug, normalized admin email, definition key within category,
  choice key within definition, product value pair, image order and single primary image per product,
  non-null Mazinoor product code, non-null canonical source URL, and managed content slot.
- Public product query index begins with status/category and supports stable sort plus pagination.
- Search indexes normalized product name, category name, descriptions, features, and searchable
  specification values. Validate query plans against representative Persian data before adding
  database-specific trigram/full-text indexes.
- Admin lists index lifecycle status and updated timestamp. Audit events index occurred time,
  administrator, entity, and event type.

## Transaction boundaries

- Ownership transfer, category reassignment, publish validation/transition, archive/restore,
  permanent deletion metadata, primary-image switch, and commit of one imported product are atomic.
- Object writes occur before ready metadata is committed. Failed processing leaves a retryable failed
  record and cleanup key; database transactions do not pretend to include object storage.
- Concurrency-token mismatch returns a conflict with current version metadata and never overwrites a
  newer administrator edit.
