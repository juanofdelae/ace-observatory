/**
 * Fix the second person-as-institution case ("Alma Peralta") missed by the
 * earlier audit because her participant row is "Alma Vanessa Peralta" (not
 * an exact fullName match against the institution name).
 *
 * Reality:
 *   - Participant "Alma Vanessa Peralta" exists, linked to
 *     "City of Tucson, Arizona District Export Council" via organizationLabel.
 *   - 7 LOIs have "Alma Peralta" as a party (artifact of the seed parser
 *     reading her delegate name as the partyA/B institution).
 *
 * Fix:
 *   - Repoint the 7 agreements' partyA/B from the bogus institution to
 *     City of Tucson, Arizona District Export Council (her real org).
 *   - Set the corresponding signer FK on each agreement to her participant
 *     row so the detail page shows who actually signed.
 *   - Soft-delete the bogus institution.
 *
 * Default: dry-run. Pass --apply to execute.
 */
import { prisma } from "@/prisma/seed/_lib";

const APPLY = process.argv.includes("--apply");

async function main() {
  const bogus = await prisma.institution.findFirst({
    where: { name: "Alma Peralta", deletedAt: null },
  });
  if (!bogus) {
    console.log("(already cleaned)");
    return;
  }
  const participant = await prisma.participant.findFirst({
    where: { fullName: "Alma Vanessa Peralta", deletedAt: null },
    select: { id: true, fullName: true, institutionId: true },
  });
  if (!participant?.institutionId) {
    throw new Error(
      "Couldn't resolve Alma Vanessa Peralta's real institutionId. Aborting.",
    );
  }
  const target = await prisma.institution.findUnique({
    where: { id: participant.institutionId },
    select: { id: true, name: true },
  });
  if (!target) throw new Error("Target institution missing.");

  const agreements = await prisma.agreement.findMany({
    where: {
      deletedAt: null,
      OR: [{ partyAId: bogus.id }, { partyBId: bogus.id }],
    },
    select: { id: true, code: true, partyAId: true, partyBId: true },
  });

  console.log(`Bogus institution:  ${bogus.id}  "${bogus.name}"`);
  console.log(`Real institution:   ${target.id}  "${target.name}"`);
  console.log(`Participant:        ${participant.id}  "${participant.fullName}"`);
  console.log(`Agreements to fix:  ${agreements.length}\n`);

  for (const a of agreements) {
    const side = a.partyAId === bogus.id ? "A" : "B";
    console.log(`  ${a.code}  party${side} → real institution + signer${side} = Alma`);
  }

  if (!APPLY) {
    console.log("\nDry-run. Re-run with --apply.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const a of agreements) {
      const isPartyA = a.partyAId === bogus.id;
      await tx.agreement.update({
        where: { id: a.id },
        data: isPartyA
          ? { partyAId: target.id, signerAId: participant.id }
          : { partyBId: target.id, signerBId: participant.id },
      });
    }
    await tx.institution.update({
      where: { id: bogus.id },
      data: { deletedAt: new Date() },
    });
  });

  console.log(`\n✓ Repointed ${agreements.length} agreement(s) and set signer FK. Soft-deleted Alma Peralta row.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
