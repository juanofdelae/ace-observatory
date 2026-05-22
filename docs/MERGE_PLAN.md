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

### ADR-002 — Postgres replaces static JSONs as source of truth

JSONs in `data/_*.json` become **seed inputs**, loaded into Postgres tables
on first deploy. Subsequent edits go through admin UI → DB. Public pages
read from DB at request time (with caching).

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
gates the difference.

## Sequenced execution (after this plan lands)

| Phase | Work | Effort | Risk |
|---|---|---|---|
| **M-Up1** | Upgrade Tailwind 3→4 (independent) | 1 day | M |
| **M-Up2** | Upgrade Next 14→16 + React 18→19 | 2-3 days | H |
| **M-Up3** | Verify Observatory still builds and renders | 1 day | M |
| **M-Db** | Add Prisma + Postgres + initial schema | 1 day | L |
| **M-Seed** | Write seed scripts from JSONs | 2 days | L |
| **M-Auth** | Add NextAuth + admin proxy | 1 day | L |
| **M-Admin** | Move Bridge's admin pages, queries, actions | 3-4 days | M |
| **M-Public** | Rewire public pages to read from DB | 2-3 days | M |
| **M-Storage** | Add Supabase Storage adapter | 1 day | L |
| **M-Qa** | E2E sweep + deploy | 2 days | L |

**Total: ~3 weeks calendar.**

## What we are NOT doing in this PR

- Touching production. Everything happens on branch `feat/merge-bridge` until
  it's green.
- Adding new features. This is purely an architectural merge.
- Reaching for Drizzle / TypeORM / anything that isn't Prisma. Bridge already
  uses it, fine for both.
- Dual-write between DB and JSONs. Once Postgres lands, JSONs are seed only.

## Open questions before M-Up1

1. Where does the merged app deploy? Bridge points at Vercel; Observatory
   has out/ artifacts suggesting static export. Production target needs
   confirmation.
2. Do we keep Observatory's `public/participants/historical/*.jpeg` photos
   in the repo, move them to Supabase Storage, or accept the current layout?
3. The Memphis participants have base64-encoded emails (`vF2aWxhc2VyaW...`).
   That privacy pattern: do we preserve it (DB stores encoded) or decode +
   protect at the API layer?
