/**
 * Merge institutions that differ only by case / whitespace / accents.
 *
 * For each cluster of duplicates:
 *   1. Pick canonical = the row with the most attached relations (agreements
 *      where party A/B + participants), breaking ties by oldest createdAt.
 *   2. Repoint every Agreement.partyAId / partyBId and Participant.institutionId
 *      from the non-canonical rows to the canonical one.
 *   3. Soft-delete (deletedAt) the non-canonical rows.
 *
 * Wrapped in one transaction per cluster so partial failures don't leave
 * orphaned FKs. Idempotent — re-running with no new duplicates is a no-op.
 *
 * Default: dry-run. Pass --apply to execute.
 *
 *   npx tsx scripts/merge-institution-duplicates.ts           # dry-run
 *   npx tsx scripts/merge-institution-duplicates.ts --apply   # execute
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

type Inst = {
  id: string;
  name: string;
  countryId: string | null;
  createdAt: Date;
};

async function attachedCount(id: string): Promise<number> {
  const [a, b, p] = await Promise.all([
    prisma.agreement.count({ where: { partyAId: id } }),
    prisma.agreement.count({ where: { partyBId: id } }),
    prisma.participant.count({ where: { institutionId: id } }),
  ]);
  return a + b + p;
}

async function main() {
  const all: Inst[] = await prisma.institution.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, countryId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by (normalized name + country) so two unrelated orgs with the same
  // ambiguous name in different countries don't collide.
  const groups = new Map<string, Inst[]>();
  for (const inst of all) {
    const key = `${normalize(inst.name)}|${inst.countryId ?? ""}`;
    const arr = groups.get(key) ?? [];
    arr.push(inst);
    groups.set(key, arr);
  }

  const clusters = [...groups.values()].filter((g) => g.length > 1);
  console.log(`Found ${clusters.length} duplicate cluster(s) across ${all.length} institutions.\n`);

  let totalMerged = 0;

  for (const cluster of clusters) {
    // Score each candidate by attached references; pick max.
    const scored = await Promise.all(
      cluster.map(async (c) => ({ inst: c, refs: await attachedCount(c.id) })),
    );
    scored.sort((x, y) => {
      if (y.refs !== x.refs) return y.refs - x.refs;
      return x.inst.createdAt.getTime() - y.inst.createdAt.getTime();
    });
    const canonical = scored[0]!.inst;
    const dups = scored.slice(1).map((s) => s.inst);

    console.log(`▶ "${canonical.name}" (${canonical.id})  ← ${dups.length} dup(s)`);
    for (const d of dups) {
      const refs = scored.find((s) => s.inst.id === d.id)!.refs;
      console.log(`    merging  "${d.name}" (${d.id})  refs=${refs}`);
    }

    if (!APPLY) continue;

    await prisma.$transaction(async (tx) => {
      for (const dup of dups) {
        await tx.agreement.updateMany({
          where: { partyAId: dup.id },
          data: { partyAId: canonical.id },
        });
        await tx.agreement.updateMany({
          where: { partyBId: dup.id },
          data: { partyBId: canonical.id },
        });
        await tx.participant.updateMany({
          where: { institutionId: dup.id },
          data: { institutionId: canonical.id },
        });
        await tx.institution.update({
          where: { id: dup.id },
          data: { deletedAt: new Date() },
        });
      }
    });
    totalMerged += dups.length;
  }

  console.log(
    APPLY
      ? `\n✓ Merged ${totalMerged} duplicate row(s) across ${clusters.length} cluster(s).`
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
