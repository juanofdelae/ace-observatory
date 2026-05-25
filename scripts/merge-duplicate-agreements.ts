/**
 * Merge agreement rows that share the same pair of parties AND the same
 * (normalized) subject. The seed for ACE-20 Illinois ran twice — codes -001
 * to -016 each have a paired -017 to -032 with identical content.
 *
 * Strategy per cluster:
 *   - Canonical = the agreement with the lowest code (lexical sort —
 *     "...-001" < "...-017"). Same intent as "oldest seeded".
 *   - For each non-canonical dup, repoint its child rows (Survey,
 *     StatusChange, SupportRequest) to the canonical id, then soft-delete
 *     the dup. Wrapped in a transaction per cluster.
 *
 * Pair-order-insensitive: agreement A↔B and B↔A with the same subject
 * collide and are de-duped together.
 *
 * Default: dry-run. Pass --apply to execute.
 *
 *   npx tsx scripts/merge-duplicate-agreements.ts           # dry-run
 *   npx tsx scripts/merge-duplicate-agreements.ts --apply   # execute
 */
import { prisma } from "@/prisma/seed/_lib";

const APPLY = process.argv.includes("--apply");

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const agreements = await prisma.agreement.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      code: true,
      partyAId: true,
      partyBId: true,
      subject: true,
    },
  });

  const byKey = new Map<string, typeof agreements>();
  for (const a of agreements) {
    const partyKey = [a.partyAId, a.partyBId].sort().join("|");
    const key = `${partyKey}::${normalize(a.subject).slice(0, 200)}`;
    const arr = byKey.get(key) ?? [];
    arr.push(a);
    byKey.set(key, arr);
  }

  const clusters = [...byKey.values()].filter((g) => g.length > 1);
  console.log(`Found ${clusters.length} duplicate agreement cluster(s) across ${agreements.length} agreements.\n`);

  let totalMerged = 0;

  for (const cluster of clusters) {
    cluster.sort((a, b) => a.code.localeCompare(b.code));
    const canonical = cluster[0]!;
    const dups = cluster.slice(1);

    console.log(`▶ keep "${canonical.code}"  (${canonical.id})`);
    for (const d of dups) {
      console.log(`     merge "${d.code}"  (${d.id})`);
    }

    if (!APPLY) continue;

    await prisma.$transaction(async (tx) => {
      for (const dup of dups) {
        // Repoint child rows so we don't lose any historical survey /
        // status-change / support data accidentally attached to the dup.
        await tx.survey.updateMany({
          where: { agreementId: dup.id },
          data: { agreementId: canonical.id },
        });
        await tx.statusChange.updateMany({
          where: { agreementId: dup.id },
          data: { agreementId: canonical.id },
        });
        await tx.supportRequest.updateMany({
          where: { agreementId: dup.id },
          data: { agreementId: canonical.id },
        });
        await tx.agreement.update({
          where: { id: dup.id },
          data: { deletedAt: new Date() },
        });
      }
    });
    totalMerged += dups.length;
  }

  console.log(
    APPLY
      ? `\n✓ Soft-deleted ${totalMerged} duplicate agreement(s) across ${clusters.length} cluster(s).`
      : `\nDry-run only. Re-run with --apply to execute.`,
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
