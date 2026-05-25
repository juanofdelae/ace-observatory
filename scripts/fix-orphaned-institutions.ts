/**
 * Cleanup two specific institution-table bugs surfaced by the audit:
 *
 *   1. "</em>" — HTML artifact from a parser that mis-split Mariano Ortega's
 *      position string. Real org is "Association for Social Business
 *      Development (ADSE)", which doesn't exist in the DB; the position
 *      string preserves it, so we null Mariano's institutionId rather than
 *      guess the country/type for a freshly-minted ADSE. The orphaned demo
 *      agreement (DEMO-PHASE-CONTACTED) gets deleted; the demo seeder
 *      recreates it on next run with a clean partyA.
 *
 *   2. "ARETHA REGIS" — person, not institution. She's the Director of
 *      Investment Coordination at Government of Saint Lucia (which DOES
 *      exist as an institution). Repoint her 2 LOIs (Belém 003 + 004) to
 *      that institution, fix her participant.institutionId, soft-delete
 *      the bogus ARETHA REGIS row.
 *
 * Default: dry-run. Pass --apply to execute.
 *
 *   npx tsx scripts/fix-orphaned-institutions.ts           # dry-run
 *   npx tsx scripts/fix-orphaned-institutions.ts --apply   # execute
 */
import { prisma } from "@/prisma/seed/_lib";

const APPLY = process.argv.includes("--apply");

async function fixEmTag() {
  console.log("──── Fix 1: </em> institution\n");
  const inst = await prisma.institution.findFirst({
    where: { name: "</em>", deletedAt: null },
  });
  if (!inst) {
    console.log("  (already cleaned)\n");
    return;
  }

  const [agreements, participants] = await Promise.all([
    prisma.agreement.findMany({
      where: { OR: [{ partyAId: inst.id }, { partyBId: inst.id }] },
      select: { id: true, code: true },
    }),
    prisma.participant.findMany({
      where: { institutionId: inst.id },
      select: { id: true, fullName: true },
    }),
  ]);

  console.log(`  institution id: ${inst.id}`);
  console.log(`  agreements referencing it: ${agreements.map((a) => a.code).join(", ") || "none"}`);
  console.log(`  participants linked: ${participants.map((p) => p.fullName).join(", ") || "none"}`);

  if (!APPLY) {
    console.log(`  [dry-run] would: delete ${agreements.length} demo agreement(s),`);
    console.log(`            null institutionId on ${participants.length} participant(s),`);
    console.log(`            soft-delete the </em> row.\n`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Delete the demo agreement(s) — they get re-created by the demo seeder
    // on next run with a clean partyA. (Production agreements wouldn't be
    // expected here; if any non-DEMO row appears, this transaction will
    // fail safely.)
    for (const a of agreements) {
      if (!a.code.startsWith("DEMO-")) {
        throw new Error(
          `Non-demo agreement ${a.code} attached to </em>. Aborting — manual repoint required.`,
        );
      }
      await tx.agreement.delete({ where: { id: a.id } });
    }
    await tx.participant.updateMany({
      where: { institutionId: inst.id },
      data: { institutionId: null },
    });
    await tx.institution.update({
      where: { id: inst.id },
      data: { deletedAt: new Date() },
    });
  });
  console.log(`  ✓ deleted ${agreements.length} demo agreement(s), nulled ${participants.length} participant(s), soft-deleted </em>.\n`);
}

async function fixArethaRegis() {
  console.log("──── Fix 2: ARETHA REGIS (person-as-institution)\n");
  const bogus = await prisma.institution.findFirst({
    where: { name: "ARETHA REGIS", deletedAt: null },
  });
  if (!bogus) {
    console.log("  (already cleaned)\n");
    return;
  }
  const target = await prisma.institution.findFirst({
    where: {
      name: "Government of Saint Lucia",
      countryId: "lc",
      deletedAt: null,
    },
  });
  if (!target) {
    console.log("  ✗ target institution 'Government of Saint Lucia' not found — aborting fix.\n");
    return;
  }

  const [agreementsA, agreementsB, participantsLinked] = await Promise.all([
    prisma.agreement.findMany({
      where: { partyAId: bogus.id },
      select: { id: true, code: true },
    }),
    prisma.agreement.findMany({
      where: { partyBId: bogus.id },
      select: { id: true, code: true },
    }),
    prisma.participant.findMany({
      where: { institutionId: bogus.id },
      select: { id: true, fullName: true },
    }),
  ]);

  console.log(`  bogus institution id: ${bogus.id}`);
  console.log(`  target Government of Saint Lucia: ${target.id}`);
  console.log(`  agreements partyA: ${agreementsA.map((a) => a.code).join(", ") || "none"}`);
  console.log(`  agreements partyB: ${agreementsB.map((a) => a.code).join(", ") || "none"}`);
  console.log(`  participants linked: ${participantsLinked.map((p) => p.fullName).join(", ") || "none"}`);

  if (!APPLY) {
    console.log(`  [dry-run] would: repoint ${agreementsA.length + agreementsB.length} agreement(s),`);
    console.log(`            move ${participantsLinked.length} participant(s) to Government of Saint Lucia,`);
    console.log(`            soft-delete ARETHA REGIS.\n`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.agreement.updateMany({
      where: { partyAId: bogus.id },
      data: { partyAId: target.id },
    });
    await tx.agreement.updateMany({
      where: { partyBId: bogus.id },
      data: { partyBId: target.id },
    });
    await tx.participant.updateMany({
      where: { institutionId: bogus.id },
      data: { institutionId: target.id },
    });
    await tx.institution.update({
      where: { id: bogus.id },
      data: { deletedAt: new Date() },
    });
  });
  console.log(
    `  ✓ repointed ${agreementsA.length + agreementsB.length} agreement(s) + ${participantsLinked.length} participant(s), soft-deleted ARETHA REGIS.\n`,
  );
}

async function main() {
  await fixEmTag();
  await fixArethaRegis();
  console.log(
    APPLY
      ? "Done. Run `npx tsx scripts/seed-phase-demos.ts` to re-create the demo agreement(s) with clean institutions."
      : "Dry-run only. Re-run with --apply to execute.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
