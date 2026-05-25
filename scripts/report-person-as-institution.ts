/**
 * Report-only: institutions whose name exactly matches a Participant.fullName.
 * These are highly suspicious — usually a parser bug where a delegate's name
 * landed in the institution column.
 *
 * For each suspicious row, dumps the agreements pointing to it so YOU can
 * decide:
 *   (a) Delete the institution + drop / re-target the affected agreements
 *   (b) Reclassify (it's really a sole-proprietor / personal brand)
 *   (c) Repoint the agreements to a real institution
 *
 * No mutations. Run anytime:
 *   npx tsx scripts/report-person-as-institution.ts
 */
import { prisma } from "@/prisma/seed/_lib";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const [institutions, participants] = await Promise.all([
    prisma.institution.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, type: true, countryLabel: true },
    }),
    prisma.participant.findMany({
      where: { deletedAt: null },
      select: { id: true, fullName: true, position: true, organizationLabel: true },
    }),
  ]);

  const pByName = new Map<string, typeof participants>();
  for (const p of participants) {
    const k = normalize(p.fullName);
    const arr = pByName.get(k) ?? [];
    arr.push(p);
    pByName.set(k, arr);
  }

  const suspicious = institutions.filter((i) => pByName.has(normalize(i.name)));

  if (suspicious.length === 0) {
    console.log("✓ No institutions whose name matches a participant. Clean.");
    return;
  }

  console.log(`Found ${suspicious.length} institution(s) whose name matches a participant.\n`);

  for (const inst of suspicious) {
    const matchingParticipants = pByName.get(normalize(inst.name))!;
    const agreements = await prisma.agreement.findMany({
      where: { OR: [{ partyAId: inst.id }, { partyBId: inst.id }] },
      select: {
        id: true,
        code: true,
        partyAId: true,
        partyBId: true,
        partyA: { select: { name: true } },
        partyB: { select: { name: true } },
      },
    });

    console.log(`──── "${inst.name}"  (${inst.id})`);
    console.log(`     country=${inst.countryLabel ?? "-"}  type=${inst.type}`);
    console.log(`     matches participant(s):`);
    for (const p of matchingParticipants) {
      console.log(
        `       ${p.fullName}  · ${p.position ?? "—"}  · org=${p.organizationLabel ?? "—"}  (${p.id})`,
      );
    }
    console.log(`     attached agreements: ${agreements.length}`);
    for (const a of agreements) {
      const otherParty =
        a.partyAId === inst.id ? a.partyB.name : a.partyA.name;
      const role = a.partyAId === inst.id ? "partyA" : "partyB";
      console.log(`       ${a.code}  · this is ${role}  · counterparty: ${otherParty}`);
    }
    console.log("");
  }

  console.log("Recommendation:");
  console.log("  - If counterparty is the real org → repoint agreements to a new/existing");
  console.log("    Institution and soft-delete this row.");
  console.log("  - If the person genuinely is the org (sole consultancy) → leave it.");
  console.log("  - If unclear → ask the data owner. Don't auto-delete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
