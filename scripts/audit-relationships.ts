/**
 * Read-only audit of the Participant ↔ Institution ↔ Agreement triangle.
 *
 * Surfaces:
 *   A. Duplicate participants (same person, multiple rows) — direct cause
 *      of the Radin Rahimzadeh case (he was 2 participants → his LOIs got
 *      duplicated 3 → 6).
 *   B. Duplicate agreements (same partyA + partyB + normalized subject).
 *      Likely artifacts of seeding twice or person-duplication cascading.
 *   C. Orphan participants (no institution AND no LOIs).
 *   D. Orphan institutions (no participants AND no LOIs).
 *   E. Participants whose institutionId doesn't match their organizationLabel
 *      text (probably a relinking opportunity).
 *
 * Mutates nothing. Run anytime.
 *
 *   npx tsx scripts/audit-relationships.ts
 */
import { prisma } from "@/prisma/seed/_lib";

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const [participants, institutions, agreements] = await Promise.all([
    prisma.participant.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        fullName: true,
        institutionId: true,
        organizationLabel: true,
        position: true,
        countryId: true,
      },
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
        partyAId: true,
        partyBId: true,
        signerAId: true,
        signerBId: true,
        subject: true,
        partyA: { select: { name: true } },
        partyB: { select: { name: true } },
      },
    }),
  ]);

  console.log(`\nAudit on ${participants.length} participants, ${institutions.length} institutions, ${agreements.length} agreements.\n`);

  const instById = new Map(institutions.map((i) => [i.id, i]));
  const partById = new Map(participants.map((p) => [p.id, p]));

  // ──── A. Duplicate participants ──────────────────────────────────────────
  const pByName = new Map<string, typeof participants>();
  for (const p of participants) {
    const k = normalize(p.fullName);
    if (!k) continue;
    const arr = pByName.get(k) ?? [];
    arr.push(p);
    pByName.set(k, arr);
  }
  const dupParticipants = [...pByName.entries()].filter(([, v]) => v.length > 1);

  console.log(`──── A. Duplicate participants by name: ${dupParticipants.length} cluster(s)`);
  for (const [name, group] of dupParticipants.slice(0, 15)) {
    console.log(`     "${name}"  ×${group.length}`);
    for (const p of group) {
      const inst = p.institutionId ? instById.get(p.institutionId)?.name ?? "?" : "—";
      console.log(`        ${p.id}  inst="${inst}"  orgLabel="${p.organizationLabel ?? "—"}"  country=${p.countryId ?? "-"}`);
    }
  }
  if (dupParticipants.length > 15) console.log(`     … +${dupParticipants.length - 15} more`);
  console.log("");

  // ──── B. Duplicate agreements (same parties + normalized subject) ────────
  const agByKey = new Map<string, typeof agreements>();
  for (const a of agreements) {
    // Pair-order-insensitive: sort party ids alphabetically so A↔B and B↔A
    // collide. Subject normalized to handle whitespace/case variance.
    const partyKey = [a.partyAId, a.partyBId].sort().join("|");
    const subjKey = normalize(a.subject).slice(0, 200);
    const key = `${partyKey}::${subjKey}`;
    const arr = agByKey.get(key) ?? [];
    arr.push(a);
    agByKey.set(key, arr);
  }
  const dupAgreements = [...agByKey.entries()].filter(([, v]) => v.length > 1);

  console.log(`──── B. Duplicate agreements (same parties + same subject): ${dupAgreements.length} cluster(s)`);
  for (const [, group] of dupAgreements.slice(0, 15)) {
    const first = group[0]!;
    console.log(`     ${first.partyA.name} ↔ ${first.partyB.name}  ×${group.length}`);
    for (const a of group) {
      const signerA = a.signerAId ? partById.get(a.signerAId)?.fullName ?? "?" : "—";
      const signerB = a.signerBId ? partById.get(a.signerBId)?.fullName ?? "?" : "—";
      console.log(`        ${a.code}  signers: ${signerA} / ${signerB}`);
    }
    console.log(`        subject: ${first.subject.slice(0, 150)}`);
  }
  if (dupAgreements.length > 15) console.log(`     … +${dupAgreements.length - 15} more`);
  console.log("");

  // ──── C. Orphan participants (no institution + no agreement signer) ──────
  const signerIds = new Set<string>();
  for (const a of agreements) {
    if (a.signerAId) signerIds.add(a.signerAId);
    if (a.signerBId) signerIds.add(a.signerBId);
  }
  const orphanParticipants = participants.filter(
    (p) => !p.institutionId && !signerIds.has(p.id),
  );
  console.log(`──── C. Orphan participants (no institution + no LOI signature): ${orphanParticipants.length}`);
  for (const p of orphanParticipants.slice(0, 8)) {
    console.log(`     ${p.fullName}  orgLabel="${p.organizationLabel ?? "—"}"  country=${p.countryId ?? "-"}`);
  }
  if (orphanParticipants.length > 8) console.log(`     … +${orphanParticipants.length - 8} more`);
  console.log("");

  // ──── D. Orphan institutions (no participants + no agreement parties) ────
  const partyIds = new Set<string>();
  for (const a of agreements) {
    partyIds.add(a.partyAId);
    partyIds.add(a.partyBId);
  }
  const partInstIds = new Set(
    participants.filter((p) => p.institutionId).map((p) => p.institutionId!),
  );
  const orphanInstitutions = institutions.filter(
    (i) => !partyIds.has(i.id) && !partInstIds.has(i.id),
  );
  console.log(`──── D. Orphan institutions (no LOI party, no participants): ${orphanInstitutions.length}`);
  for (const i of orphanInstitutions.slice(0, 10)) {
    console.log(`     ${i.name}  (${i.countryId ?? "-"})`);
  }
  if (orphanInstitutions.length > 10) console.log(`     … +${orphanInstitutions.length - 10} more`);
  console.log("");

  // ──── E. Participant.institutionId doesn't match organizationLabel ───────
  let mismatch = 0;
  const mismatchSamples: Array<{
    p: (typeof participants)[number];
    instName: string;
  }> = [];
  for (const p of participants) {
    if (!p.institutionId || !p.organizationLabel) continue;
    const inst = instById.get(p.institutionId);
    if (!inst) continue;
    if (normalize(inst.name) !== normalize(p.organizationLabel)) {
      mismatch++;
      if (mismatchSamples.length < 10) mismatchSamples.push({ p, instName: inst.name });
    }
  }
  console.log(`──── E. Participant linked to institution whose name ≠ organizationLabel: ${mismatch}`);
  for (const s of mismatchSamples) {
    console.log(`     ${s.p.fullName}`);
    console.log(`        linked inst:  "${s.instName}"`);
    console.log(`        orgLabel:     "${s.p.organizationLabel}"`);
  }
  if (mismatch > 10) console.log(`     … +${mismatch - 10} more`);
  console.log("");

  console.log("Done (read-only).\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
