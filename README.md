# Noorestan

Persian-first product catalog and company website for Noorestan, an authorized representative of
Mazinoor lighting products. The website presents products and routes visitors to direct phone,
WhatsApp, or email contact; it has no cart, checkout, payment, or online ordering.

## Prerequisites

- .NET SDK selected by `global.json`
- Node.js and npm compatible with `frontend/package.json`
- Docker Compose for local PostgreSQL and S3-compatible object storage

## Local infrastructure

Copy `.env.example` to an ignored `.env`, replace every placeholder, then run:

```powershell
docker compose up -d
```

Copy `backend/src/Noorestan.Api/appsettings.Development.example.json` to the ignored
`appsettings.Development.Local.json`, replace secrets, and load it through local environment
configuration. Never commit local settings or bootstrap credentials.

## Restore and validate

```powershell
dotnet restore backend/Noorestan.slnx
dotnet build backend/Noorestan.slnx --no-restore
dotnet test backend/Noorestan.slnx --no-build
npm.cmd ci --prefix frontend
npm.cmd run check --prefix frontend
```

## Database and owner bootstrap

After implementation supplies migrations and the one-use bootstrap command:

```powershell
dotnet ef database update --project backend/src/Noorestan.Api
dotnet run --project backend/src/Noorestan.Api -- bootstrap-owner
```

The bootstrap secret must be supplied outside source control and invalidated immediately after use.

## Run

```powershell
dotnet run --project backend/src/Noorestan.Api
npm.cmd start --prefix frontend
```

See `specs/001-noorestan-catalog/quickstart.md` for full acceptance validation.
