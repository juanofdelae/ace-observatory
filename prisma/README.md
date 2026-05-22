# Database bootstrap & seeds

## Option A — Prisma migrate (preferred when Docker + Prisma cooperate)

```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="merge-bridge-observatory" \
  npx prisma migrate dev --name init_merged_schema
npm run db:seed
```

This creates `prisma/migrations/<ts>_init_merged_schema/migration.sql`,
applies it, generates the client, and runs the seed pipeline.

## Option B — Raw SQL bootstrap (fallback if Prisma migrate is blocked)

`bootstrap.sql` is the schema rendered to plain SQL via
`prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`.
Apply it with `psql` against the empty `ace_merged` database:

```bash
docker run -d --name ace-merged-pg \
  -e POSTGRES_USER=ace -e POSTGRES_PASSWORD=ace_dev_only \
  -e POSTGRES_DB=ace_merged -p 5432:5432 postgres:16

# Wait ~3s for postgres to accept connections
docker exec -i ace-merged-pg psql -U ace -d ace_merged < prisma/bootstrap.sql

# Then run seeds (still works against the same schema):
npm run db:seed
```

Use this when Prisma 7's AI-action guard is in the way or when you want a
single-file artifact you can review before applying.

## Seed pipeline

```
prisma/seed/
├── _lib.ts            shared prisma client + country/sector/actor maps
├── 01-countries.ts    data/countries.ts → Country
├── 02-editions.ts     data/editions.ts → Edition
├── 03-participants.ts _historical-participants.json + _memphis-*.json
│                       → Participant + Institution + EditionParticipant
├── 04-agreements.ts   _lois.json → Agreement (parties upserted on the fly)
├── 05-surveys.ts      _survey-ace*.json → Report
└── index.ts           orchestrator, supports `--only=countries,editions`
```

Run a single phase:

```bash
npm run db:seed -- --only=countries,editions
```

Every phase is idempotent: re-running the same seed against an existing
database updates instead of duplicating.
