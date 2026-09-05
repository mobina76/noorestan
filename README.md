# Noorestan

Persian-first product catalog and company website for **فروشگاه کالای برق نورستان** (Noorestan
Electrical Goods Store, representative: آقایان شرفی). The website presents Mazinoor lighting
products and routes visitors to direct phone, WhatsApp, or email contact; it has no cart, checkout,
payment, or online ordering.

## Prerequisites

- .NET SDK selected by `global.json` (.NET 10)
- Node.js and npm compatible with `frontend/package.json`
- A local PostgreSQL 17 instance (Docker Compose, a system install, or a portable/no-install
  distribution all work — see below)

## Local database

Any PostgreSQL 17 reachable from the connection string works. Two common options:

**Option A — Docker Compose** (if Docker is available):

```powershell
docker compose up -d
```

This also starts a MinIO object-storage container, which the API does **not** currently use (it
stores images on local disk in development — see "Known limitations" below), so it is optional for
running the app; only Postgres is required.

**Option B — no Docker**: install PostgreSQL 17 yourself (a system package, or a portable zip
distribution extracted anywhere) and create a database/role matching your connection string.

Whichever you choose, set `ConnectionStrings:Noorestan` in an ignored
`backend/src/Noorestan.Api/appsettings.Development.json` (copy the shape from
`appsettings.Development.example.json`), for example:

```json
{
  "ConnectionStrings": { "Noorestan": "Host=localhost;Port=5432;Database=noorestan;Username=noorestan;Password=change-me" },
  "ObjectStorage": { "PublicBaseUrl": "https://localhost:7117/media" },
  "OwnerBootstrap": { "Email": "owner@noorestan.local", "Password": "Owner!Change12345", "DisplayName": "مدیر نورستان" }
}
```

`OwnerBootstrap` is only read by the one-use `bootstrap-owner` command below; remove it (or change
the password) once the real owner account is created for anything beyond local development.

## Restore and validate

```powershell
dotnet restore backend/Noorestan.slnx
dotnet build backend/Noorestan.slnx --no-restore
dotnet test backend/Noorestan.slnx --no-build
npm.cmd ci --prefix frontend
npm.cmd run check --prefix frontend
```

## Database, owner bootstrap, and demo data

```powershell
dotnet ef database update --project backend/src/Noorestan.Api
dotnet run --project backend/src/Noorestan.Api -- bootstrap-owner
dotnet run --project backend/src/Noorestan.Api -- seed-demo-data
```

- `bootstrap-owner` is one-use and refuses to run once any owner account exists; it reads
  `OwnerBootstrap` from configuration (see above) and must never be left enabled outside local
  development.
- `seed-demo-data` is idempotent (it does nothing once any product exists) and populates a small,
  **real** representative Mazinoor catalog — product names, specifications, and photographs sourced
  directly from mazinoor.com (see `backend/src/Noorestan.Api/SeedData/mazinoor/`) — plus the real
  Noorestan business profile. No invented products, specifications, or images are used anywhere in
  the app.

## Run

The API must be reachable over **HTTPS** in Development (its `__Host-`-prefixed session/CSRF cookies
require a secure context; see "Known limitations"). Trust the local dev certificate once if you
haven't already:

```powershell
dotnet dev-certs https --trust
```

Then run both apps:

```powershell
dotnet run --project backend/src/Noorestan.Api
npm.cmd start --prefix frontend
```

- The API listens on `https://localhost:7117` (and `http://localhost:5117`) per
  `backend/src/Noorestan.Api/Properties/launchSettings.json`.
- `npm start` runs `ng serve`, which proxies `/api` and `/media` to the API per
  `frontend/proxy.conf.json` — open `http://localhost:4200`.
- Admin area: `http://localhost:4200/admin/login`, using the `OwnerBootstrap` credentials above (or
  whichever account you created).

## Tests

```powershell
dotnet test backend/Noorestan.slnx
npm.cmd run test:ci --prefix frontend
npm.cmd run test:e2e --prefix frontend
```

The Playwright e2e suite (`frontend/tests/e2e/`) exercises the real running stack — start the
backend and seed the demo data first, since several specs assert against the real seeded catalog and
business profile, and `tests/e2e/admin-catalog.spec.ts` signs in with the local `OwnerBootstrap`
credentials.

## Known limitations (local development)

- **Object storage** is a local-disk implementation (`DevelopmentObjectStorage`), not the
  S3-compatible store described in the original plan; MinIO in `compose.yaml` is provisioned but
  unused. Fine for local/demo use; production would need the real S3-compatible integration.
- **Backend integration tests** (API + real Postgres) are not implemented; only unit tests and the
  Mazinoor extraction/retrieval tests exist on the backend. Confidence instead comes from the
  Playwright e2e suite running against the real API and database.
- **Observability** (structured logging/correlation IDs/metrics), automated backups, and production
  container/deployment definitions are not implemented.

## Mazinoor import

The admin area (owner-only, `/admin/imports`) can fetch additional real products directly from
`https://www.mazinoor.com` at any time: paste one or more product-page URLs, choose dry-run or
commit, and review per-item outcomes. Re-running with the same URLs is idempotent (matched by source
URL, falling back to the extracted product code) and never overwrites a product that already exists,
so local edits are preserved. New products are always created as **drafts** for review before
publishing. See `specs/001-noorestan-catalog/quickstart.md` for full acceptance validation of the
rest of the feature set.
