# Bridge × Observatory merge plan

## Why we're merging

`ace-bridge` (admin) and `ace-data-observatory` (public) were built as
separate Next.js apps targeting the same domain. They have complementary
gaps:

| | `ace-bridge` | `ace-data-observatory` |
|---|---|---|
| Public routes | none | 12+ (participants, editions, sites, network, map, reports, compare, impact, executive, media, countries, about) |
| Admin shell | sidebar + auth-gated | none |
| Data layer | Prisma + Postgres | static JSON files (775 hist + 47 Memphis + 161 LOIs + per-edition surveys) |
| Auth | NextAuth magic link | none |
| Mutations | server actions, transitions, soft-delete | none |
| Storage | Supabase Storage (PDF uploads) | none |
| Stack | Next 16 + React 19 + Tailwind 4 + Prisma 7 | Next 14 + React 18 + Tailwind 3 |
| Real curated content | seeded from inferior TablePress dump | photoUrl, bio, sectorIds, actorType, expertise[] |

Keeping them split means duplicating institutions/participants forever and
manually reconciling. Bad. They become **one Next.js app** with both modes.

## Strategic decision: Observatory absorbs Bridge

This repo (`ace-data-observatory`) stays as the base. Bridge's admin code +
infrastructure migrate INTO it. Reasons:

1. Observatory already has the richer dataset and the visual identity.
2. Observatory has more code worth preserving (12+ public routes vs Bridge's 9 admin routes).
3. The merged app keeps the same canonical URL (`/ACE/observatory/*` or
   wherever Observatory lives in prod) — public users feel zero change.

Trade-off: Observatory needs to upgrade Next 14 → 16, React 18 → 19,
Tailwind 3 → 4, plus gain Prisma + NextAuth + Supabase wiring.

## Reconciliation findings (Bridge ↔ Observatory)

Ran `scripts/reconcile-bridge.ts` on 2026-05-22:

- Observatory has **161 LOIs** structured in `_lois.json` (33 ACE 20 Illinois +
  25 ACE 21 Belém + 103 ACE 22 Córdoba).
- Bridge transcribed only **34 LOIs** by hand from PDFs. Of those, only
  **10 match Observatory's Córdoba list** by normalized party names.
- The 24 "only in Bridge" LOIs probably exist in `_lois.json` under slightly
  different naming. Observatory's are authoritative.
- Observatory's `_historical-participants.json` has **775 participants with
  521 photos** + actorType + sectorIds + editionIds. Bridge has 803 from
  TablePress with no photos, generic actor type, no real edition linkage.
- **47 Memphis 2026 participants** in Observatory with bio + photo + expertise.
  Bridge has 0.

## ADRs

### ADR-001 — Observatory becomes the merged base

Move Bridge's `src/app/(admin)/*`, `src/lib/*`, `src/components/*` into this
repo. Bridge's standalone repo is archived once the merge is verified in
production.

### ADR-002 — Postgres replaces static JSONs as source of truth ~~(superseded)~~

> **SUPERSEDED 2026-05-22 by ADR-007 + ADR-008.** Original wording assumed
> "public pages read from DB at request time" — incompatible with the
> hybrid deploy model (B) chosen below. The Postgres-as-source-of-truth
> idea survives, but only on the admin side; public still reads from
> snapshot JSONs.

### ADR-003 — Wipe Bridge data, re-seed from Observatory JSONs

Bridge's current participants/institutions/LOIs are inferior copies of
Observatory data. Delete and re-import:

- `_historical-participants.json` → 775 Participants with photos, bios,
  sectors, actor types, edition linkage.
- `_memphis-participants.json` → 47 Memphis participants with bio + expertise.
- `_lois.json` → 161 Agreement records across ACE 20, 21, 22.
- Per-edition surveys (`_survey-ace*.json`) → Survey + SurveyResponse rows.

Loses ~1 day of import work in exchange for a clean data foundation.

### ADR-004 — Schema extends Bridge's, not Observatory's shape

Bridge's Prisma schema is the starting point. Add fields to match
Observatory's richness: `photoUrl`, `bio`, `sectorIds[]`, `actorType`,
`expertise[]`, `attendedEditions[]`, `externalId`. Keep audit/soft-delete
patterns. See `prisma/schema.prisma` (proposed below).

### ADR-005 — Memphis treated as a regular edition

`_memphis-participants.json` becomes Participants linked to the Memphis
edition record. The Bridge admin doesn't need a special "Memphis mode".
Special roles (organizers, special guests) get a `participantRole` enum
field rather than separate tables.

### ADR-006 — Auth boundary in proxy.ts

Public routes (`/participants`, `/editions`, `/map`, etc.) are open. Admin
routes (`/admin/*` route group) require NextAuth session. Same proxy file
gates the difference. In the hybrid model (ADR-007) the proxy only ships
in the admin build — the public build excludes `(admin)` entirely and
therefore needs no auth.

### ADR-007 — Hybrid deploy: public static on Apache, admin server on Vercel

Resolved 2026-05-22.

The merged repo produces **two build artifacts** from a single codebase:

| Target | `BUILD_TARGET=public` | `BUILD_TARGET=admin` |
|---|---|---|
| `next.config.js` mode | `output: "export"` + `basePath: /ACE/observatory` | full Next.js server (default) |
| Routes included | everything except `(admin)`, `(auth)`, `api/admin/*` | everything except expensive public statically-exported pages |
| Data source | `data/_*.json` at build time | Postgres at request time |
| Host | Apache at `riacevents.org/ACE/observatory` (unchanged) | Vercel (new project) |
| Auth | none | NextAuth magic link + session |
| Cron | n/a | Vercel cron (`/api/cron/dispatch-surveys` daily 13:00 UTC) |

**Why B over A (full-Vercel):** preserves the proven static public surface
(immune to runtime CVEs, fast on cheap hosting, current production URL
untouched). Trade-off: the publish flow (ADR-008) becomes the price of
keeping public static.

### ADR-008 — Publish flow: admin → snapshot JSONs → static rebuild

Resolved 2026-05-22. Replaces the invalidated half of ADR-002.

Public pages cannot read from DB at request time (no server runtime).
Instead, the admin app exports DB → `data/_*.json` snapshots and triggers
a public rebuild:

```text
Admin UI [Publish] →
  /api/admin/publish (Vercel)  →
    DB → JSON exporter         →
      git commit + push        →
        CI rebuild public      →
          deploy to Apache
```

Latency expectation: ~2 minutes from Publish click to live. Not real-time
WYSIWYG — an editorial control feature, not a bug. Reviewers see PR diffs
on the snapshot JSONs.

Public-side code does NOT change to read from DB. Bridge admin code adds
the export endpoint.

## Sequenced execution (after this plan lands)

| Phase | Work | Effort | Risk | Status |
|---|---|---|---|---|
| **M-Up1** | Upgrade Tailwind 3→4 (independent) | 1 day | M | ✓ done |
| **M-Up2** | Upgrade Next 14→16 + React 18→19 | 2-3 days | H | ✓ done |
| **M-Up3** | Verify Observatory still builds and renders | 1 day | M | pending verify |
| **M-Db** | Add Prisma + Postgres + initial schema | 1 day | L | ✓ schema done |
| **M-Seed** | Write seed scripts from JSONs | 2 days | L | ✓ scripts done |
| **M-Build** | Two-target build config (`BUILD_TARGET=public\|admin`) | 1 day | M | new (ADR-007) |
| **M-Auth** | Add NextAuth + proxy.ts gating admin routes | 1 day | L | — |
| **M-Admin** | Copy Bridge `(admin)`, `(auth)`, `api/`, `lib/`, components | 3-4 days | M | — |
| **M-Publish** | DB → JSON snapshot exporter + `/api/admin/publish` + CI trigger | 2 days | M | new (ADR-008) |
| **M-Storage** | Add Supabase Storage adapter (new uploads only — historical photos stay in repo) | 1 day | L | — |
| **M-Qa** | E2E sweep on both build targets + deploy | 2 days | L | — |

~~M-Public~~ removed — ADR-008 makes it unnecessary, public reads JSONs as today.

**Total remaining: ~2 weeks calendar.**

## What we are NOT doing in this PR

- Touching production. Everything happens on branch `feat/merge-bridge` until
  it's green.
- Adding new features. This is purely an architectural merge.
- Reaching for Drizzle / TypeORM / anything that isn't Prisma. Bridge already
  uses it, fine for both.
- Dual-write between DB and JSONs. Once Postgres lands, JSONs are seed only.

## Resolved questions (2026-05-22)

1. **Deploy target** — Hybrid (B). Public stays on Apache as static export
   at `riacevents.org/ACE/observatory`. Admin deploys to Vercel as a
   server app. Same repo, two build targets. See ADR-007.
2. **Historical photos** — Stay in repo at `public/participants/historical/`.
   No Supabase Storage migration for the 521 existing photos. Supabase
   Storage is reserved for new admin uploads (PDFs, future photos).
3. **Memphis base64 emails** — Decode at seed time, store plaintext in
   `Participant.email`. Protect via auth at the API layer (never serialize
   `email` in public route responses unless caller has admin session).
   Base64 is encoding not encryption; storing encoded breaks NextAuth
   magic links, unique indexes, search, validation.
