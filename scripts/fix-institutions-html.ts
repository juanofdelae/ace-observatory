/**
 * Delete the HTML-artifact institution row (`</em>`).
 *
 * Safety: before deleting, lists any Agreement / Participant FKs pointing at
 * it. If anything references it, the script ABORTS — caller must repoint
 * those rows first. (For this dataset, the </em> row is orphaned.)
 *
 * Default: dry-run (reports, doesn't write). Pass --apply to execute.
 *
 * Run:
 *   npx tsx scripts/fix-institutions-html.ts           # dry-run
 *   npx tsx scripts/fix-institutions-html.ts --apply   # execute
 */
import { prisma } from "@/prisma/seed/_lib";

const APPLY = process.argv.includes("--apply");

async function main() {
  const offenders = await prisma.institution.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: "</" } },
        { name: { contains: "<em>" } },
        { name: { contains: "&lt;" } },
        { name: { contains: "&amp;" } },
      ],
    },
    select: { id: true, name: true },
  });

  if (offenders.length === 0) {
    console.log("✓ No institutions with HTML artifacts. Nothing to do.");
    return;
  }

  console.log(`Found ${offenders.length} institution(s) with HTML artifacts:\n`);

  for (const inst of offenders) {
    const [agreementsA, agreementsB, participants] = await Promise.all([
      prisma.agreement.count({ where: { partyAId: inst.id } }),
      prisma.agreement.count({ where: { partyBId: inst.id } }),
      prisma.participant.count({ where: { institutionId: inst.id } }),
    ]);
    const refs = agreementsA + agreementsB + participants;
    console.log(`  ${inst.id}  "${inst.name}"`);
    console.log(`     ↳ ${agreementsA} agreements as partyA, ${agreementsB} as partyB, ${participants} participants`);

    if (refs > 0) {
      console.log(`     ✗ HAS REFERENCES — skipping. Manual repoint required.`);
      continue;
    }

    if (!APPLY) {
      console.log(`     [dry-run] would soft-delete (set deletedAt)`);
    } else {
      await prisma.institution.update({
        where: { id: inst.id },
        data: { deletedAt: new Date() },
      });
      console.log(`     ✓ soft-deleted`);
    }
  }

  console.log(
    APPLY
      ? "\nDone."
      : "\nDry-run only. Re-run with --apply to execute.",
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
