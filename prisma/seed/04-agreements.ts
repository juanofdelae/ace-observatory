/**
 * Seed Agreement rows from Observatory's `_lois.json`. Each LOI becomes one
 * Agreement with instrumentType=LOI, phase=SIGNED, alertStatus=NEEDS_ATTENTION
 * (so the program team can triage them on first login).
 *
 * Parties are upserted as Institutions on the fly, keyed by (name, countryId).
 * Signers are NOT created here — the LOI source only has a delegate's name,
 * which is informational; we keep it as Agreement.delegate (string) and let
 * the team link to a real Participant later.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  countryNameToId,
  inferInstitutionType,
  prisma,
  slug,
} from "./_lib";

const DATA_DIR = join(__dirname, "..", "..", "data");

interface LOI {
  edition: string;
  editionLabel: string;
  kind: "delegates" | "academia";
  partyA: string;
  countryA: string | null;
  partyB: string;
  countryB: string | null;
  purpose: string | null;
  delegate: string | null;
}

const institutionCache = new Map<string, string>();

async function upsertInstitution(name: string, countryId: string | null): Promise<string> {
  const key = `${name.toLowerCase().trim()}__${countryId ?? "null"}`;
  const cached = institutionCache.get(key);
  if (cached) return cached;

  const existing = await prisma.institution.findFirst({
    where: { name, countryId },
  });
  if (existing) {
    institutionCache.set(key, existing.id);
    return existing.id;
  }

  const created = await prisma.institution.create({
    data: {
      name,
      type: inferInstitutionType(name, null),
      countryId,
      countryLabel: countryId ?? "intl",
    },
  });
  institutionCache.set(key, created.id);
  return created.id;
}

async function main() {
  const lois: LOI[] = JSON.parse(readFileSync(join(DATA_DIR, "_lois.json"), "utf8"));
  console.log(`Seeding ${lois.length} LOIs…`);

  // Pre-fetch editions to use endDate as default signedDate.
  const editions = await prisma.edition.findMany({ select: { id: true, endDate: true } });
  const editionEndDates = new Map(editions.map((e) => [e.id, e.endDate]));

  // Per-edition counter for stable codes (LOI-{edition.shortLabel}-{seq}).
  const seqByEdition = new Map<string, number>();

  let inserted = 0;
  let skippedNoEdition = 0;
  for (const loi of lois) {
    const signedDate = editionEndDates.get(loi.edition);
    if (!signedDate) {
      skippedNoEdition++;
      continue;
    }

    const seq = (seqByEdition.get(loi.edition) ?? 0) + 1;
    seqByEdition.set(loi.edition, seq);

    const code = `LOI-${loi.edition.replace(/^ace-/, "ACE-").toUpperCase()}-${String(seq).padStart(3, "0")}`;
    const externalId = `obs-${loi.edition}-${slug(loi.partyA)}-${slug(loi.partyB)}-${seq}`;

    const partyAId = await upsertInstitution(loi.partyA, countryNameToId(loi.countryA));
    const partyBId = await upsertInstitution(loi.partyB, countryNameToId(loi.countryB));

    await prisma.agreement.upsert({
      where: { externalId },
      create: {
        externalId,
        code,
        editionId: loi.edition,
        instrumentType: "LOI",
        signedDate,
        partyAId,
        partyBId,
        subject: loi.purpose ?? "Letter of Intent",
        delegate: loi.delegate,
        primarySector: "OTHER",
        tags: loi.kind === "academia" ? ["academia"] : ["delegates"],
        phase: "SIGNED",
        alertStatus: "NEEDS_ATTENTION",
      },
      update: {
        code,
        editionId: loi.edition,
        partyAId,
        partyBId,
        subject: loi.purpose ?? "Letter of Intent",
        delegate: loi.delegate,
        tags: loi.kind === "academia" ? ["academia"] : ["delegates"],
      },
    });
    inserted++;
  }
  console.log(`✓ Agreements: inserted=${inserted} skippedNoEdition=${skippedNoEdition}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
