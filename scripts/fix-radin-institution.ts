/**
 * Post-agreement-dedup, "Radin Rahimzadeh" as an institution still has 3
 * legitimate LOIs (the duplicates -021/-022/-029 went away in the previous
 * step). Repoint those to his real company FloFore Transit — his first
 * Participant row, which is the one originally tied to ACE 20 Illinois.
 *
 * Then soft-delete the bogus Radin Rahimzadeh institution row.
 *
 * The two Participant rows for him (FloFore Transit + City-Scan AI) are
 * left alone — they represent two genuine affiliations and will be merged
 * by the participant-dedup script in the next step.
 *
 * Default: dry-run. Pass --apply to execute.
 */
import { prisma } from "@/prisma/seed/_lib";

const APPLY = process.argv.includes("--apply");

async function main() {
  const radin = await prisma.institution.findFirst({
    where: { name: "Radin Rahimzadeh", deletedAt: null },
  });
  if (!radin) {
    console.log("(already cleaned)");
    return;
  }
  const flofore = await prisma.institution.findFirst({
    where: { name: "FloFore Transit", deletedAt: null },
  });
  if (!flofore) {
    throw new Error("FloFore Transit not found — aborting.");
  }

  const [aA, aB, ps] = await Promise.all([
    prisma.agreement.findMany({
      where: { partyAId: radin.id, deletedAt: null },
      select: { id: true, code: true },
    }),
    prisma.agreement.findMany({
      where: { partyBId: radin.id, deletedAt: null },
      select: { id: true, code: true },
    }),
    prisma.participant.findMany({
      where: { institutionId: radin.id },
      select: { id: true, fullName: true },
    }),
  ]);

  console.log(`Radin Rahimzadeh institution:  ${radin.id}`);
  console.log(`Target FloFore Transit:        ${flofore.id}`);
  console.log(`Agreements partyA: ${aA.map((a) => a.code).join(", ") || "none"}`);
  console.log(`Agreements partyB: ${aB.map((a) => a.code).join(", ") || "none"}`);
  console.log(`Participants linked: ${ps.map((p) => p.fullName).join(", ") || "none"}\n`);

  if (!APPLY) {
    console.log("Dry-run. Re-run with --apply.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.agreement.updateMany({
      where: { partyAId: radin.id },
      data: { partyAId: flofore.id },
    });
    await tx.agreement.updateMany({
      where: { partyBId: radin.id },
      data: { partyBId: flofore.id },
    });
    await tx.participant.updateMany({
      where: { institutionId: radin.id },
      data: { institutionId: flofore.id },
    });
    await tx.institution.update({
      where: { id: radin.id },
      data: { deletedAt: new Date() },
    });
  });
  console.log(`✓ Repointed ${aA.length + aB.length} agreement(s) + ${ps.length} participant(s) to FloFore Transit. Soft-deleted Radin row.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
