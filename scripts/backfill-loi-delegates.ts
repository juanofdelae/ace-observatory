/**
 * For every _lois.json delegate that has no matching Participant row, create
 * one and immediately wire it as the signerA / signerB on every LOI they
 * appear on. Closes the participant↔institution↔agreement triangle for the
 * ~83 LOIs we couldn't link in the prior pass.
 *
 * Rules per delegate (collected from JSON entries):
 *   - Skip if the "name" is actually an email (contains "@") — those are
 *     upstream data-quality bugs; flag in the report, don't fabricate a
 *     person from an email handle.
 *   - Skip if a Participant with this fullName already exists (would
 *     duplicate; the prior link-agreement-delegates step already wired
 *     those).
 *   - infer Participant.institutionId from the FIRST agreement they signed:
 *     match the agreement's partyA institution by normalized name + country.
 *     If no match, leave institutionId null but still create.
 *   - infer Participant.countryId from the same partyA institution.
 *   - role = "Delegate", source = "loi-delegate-backfill".
 *
 * Then, for each newly-created delegate, set signerA / signerB on every
 * agreement they appear in (picking the side by partyA-name match).
 *
 * Default: dry-run. Pass --apply to execute.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "@/prisma/seed/_lib";

const APPLY = process.argv.includes("--apply");

type LoiJson = {
  edition: string;
  partyA: string;
  countryA: string;
  partyB: string;
  countryB: string;
  delegate: string | null;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pairKey(edition: string, a: string, b: string): string {
  const [x, y] = [norm(a), norm(b)].sort();
  return `${edition}::${x}::${y}`;
}

function looksLikeEmail(s: string): boolean {
  return /@/.test(s);
}

function looksLikeName(s: string): boolean {
  const t = s.trim();
  if (t.length < 3 || t.length > 80) return false;
  if (looksLikeEmail(t)) return false;
  return t.split(/\s+/).length >= 1;
}

async function main() {
  const path = join(process.cwd(), "data", "_lois.json");
  const lois: LoiJson[] = JSON.parse(readFileSync(path, "utf8"));

  // Index DB resources for matching.
  const [participants, institutions, agreements] = await Promise.all([
    prisma.participant.findMany({
      where: { deletedAt: null },
      select: { id: true, fullName: true },
    }),
    prisma.institution.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, countryId: true },
    }),
    prisma.agreement.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        code: true,
        editionId: true,
        partyAId: true,
        partyBId: true,
        signerAId: true,
        signerBId: true,
        partyA: { select: { name: true } },
        partyB: { select: { name: true } },
      },
    }),
  ]);

  const participantByName = new Map<string, (typeof participants)[number]>();
  for (const p of participants) participantByName.set(norm(p.fullName), p);

  const instByKey = new Map<string, (typeof institutions)[number]>();
  for (const i of institutions) {
    instByKey.set(`${norm(i.name)}|${i.countryId ?? ""}`, i);
  }

  const agreementByPairKey = new Map<string, (typeof agreements)[number]>();
  for (const a of agreements) {
    const k = pairKey(a.editionId, a.partyA.name, a.partyB.name);
    if (!agreementByPairKey.has(k)) agreementByPairKey.set(k, a);
  }

  // Bucket every JSON entry by delegate (skipping nulls + emails + already-existing).
  type DelegateContext = {
    name: string;
    occurrences: Array<{ loi: LoiJson; ag: (typeof agreements)[number] }>;
    // Best guess at affiliation: the partyA institution from the first match.
    inferredInstitution?: (typeof institutions)[number];
  };
  const delegates = new Map<string, DelegateContext>();
  let skippedEmail = 0;
  let skippedExisting = 0;
  let skippedNoAgreement = 0;

  for (const loi of lois) {
    if (!loi.delegate) continue;
    if (looksLikeEmail(loi.delegate)) {
      skippedEmail++;
      continue;
    }
    if (!looksLikeName(loi.delegate)) continue;
    if (participantByName.has(norm(loi.delegate))) {
      skippedExisting++;
      continue;
    }
    const ag = agreementByPairKey.get(pairKey(loi.edition, loi.partyA, loi.partyB));
    if (!ag) {
      skippedNoAgreement++;
      continue;
    }
    const ctx = delegates.get(norm(loi.delegate)) ?? {
      name: loi.delegate.trim(),
      occurrences: [],
    };
    ctx.occurrences.push({ loi, ag });
    delegates.set(norm(loi.delegate), ctx);
  }

  // Infer institution per delegate from the FIRST occurrence's partyA.
  for (const ctx of delegates.values()) {
    const first = ctx.occurrences[0]!;
    const partyAName = first.ag.partyA.name;
    const partyAInst = institutions.find((i) => i.id === first.ag.partyAId);
    ctx.inferredInstitution = partyAInst ?? instByKey.get(`${norm(partyAName)}|`);
  }

  console.log(`From _lois.json:`);
  console.log(`  delegates that are emails (skipped):     ${skippedEmail}`);
  console.log(`  delegates already as Participant:        ${skippedExisting}`);
  console.log(`  delegates with no matching DB agreement: ${skippedNoAgreement}`);
  console.log(`  delegates to create:                     ${delegates.size}\n`);

  for (const ctx of [...delegates.values()].slice(0, 8)) {
    console.log(
      `  ${ctx.name.padEnd(30)}  ${ctx.occurrences.length} LOI(s)  ` +
        `inst="${ctx.inferredInstitution?.name ?? "(none)"}"`,
    );
  }
  if (delegates.size > 8) console.log(`  … +${delegates.size - 8} more`);

  if (!APPLY) {
    console.log("\nDry-run. Re-run with --apply.");
    return;
  }

  let createdCount = 0;
  let linkedCount = 0;

  for (const ctx of delegates.values()) {
    const inst = ctx.inferredInstitution;
    const countryId = inst?.countryId ?? null;

    const created = await prisma.participant.create({
      data: {
        fullName: ctx.name,
        countryId,
        institutionId: inst?.id ?? null,
        organizationLabel: inst?.name ?? null,
        role: "Delegate",
        source: "loi-delegate-backfill",
      },
    });
    createdCount++;

    // Wire this delegate as the signer on every agreement they appear in.
    for (const occ of ctx.occurrences) {
      const isPartyA = norm(occ.loi.partyA) === norm(occ.ag.partyA.name);
      if (isPartyA && !occ.ag.signerAId) {
        await prisma.agreement.update({
          where: { id: occ.ag.id },
          data: { signerAId: created.id },
        });
        linkedCount++;
      } else if (!isPartyA && !occ.ag.signerBId) {
        await prisma.agreement.update({
          where: { id: occ.ag.id },
          data: { signerBId: created.id },
        });
        linkedCount++;
      }
    }
  }

  console.log(`\n✓ Created ${createdCount} new Participant(s), wired ${linkedCount} signer FK(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
