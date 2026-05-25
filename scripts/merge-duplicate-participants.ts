/**
 * Merge participant rows that share the same normalized fullName + country.
 * Bridge's seed sometimes created 2+ rows for the same person (different
 * affiliations, parser splits, dup imports). After this pass each person
 * has a single row.
 *
 * Strategy per cluster:
 *   - Canonical = the row with the most attached relations (signedAsA +
 *     signedAsB + editions), then oldest createdAt.
 *   - Repoint Agreement.signerAId / signerBId from dups to canonical.
 *   - For EditionParticipant (composite PK editionId+participantId): if the
 *     canonical already has the same edition, delete the dup's row;
 *     otherwise repoint.
 *   - Soft-delete the dup.
 *
 * Default: dry-run. Pass --apply to execute.
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

async function refsOf(id: string): Promise<number> {
  const [a, b, e] = await Promise.all([
    prisma.agreement.count({ where: { signerAId: id, deletedAt: null } }),
    prisma.agreement.count({ where: { signerBId: id, deletedAt: null } }),
    prisma.editionParticipant.count({ where: { participantId: id } }),
  ]);
  return a + b + e;
}

async function main() {
  const participants = await prisma.participant.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      fullName: true,
      countryId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, typeof participants>();
  for (const p of participants) {
    const k = `${normalize(p.fullName)}|${p.countryId ?? ""}`;
    if (!normalize(p.fullName)) continue;
    const arr = groups.get(k) ?? [];
    arr.push(p);
    groups.set(k, arr);
  }

  const clusters = [...groups.values()].filter((g) => g.length > 1);
  console.log(`Found ${clusters.length} duplicate participant cluster(s) across ${participants.length} participants.\n`);

  let totalMerged = 0;

  for (const cluster of clusters) {
    const scored = await Promise.all(
      cluster.map(async (p) => ({ p, refs: await refsOf(p.id) })),
    );
    scored.sort((x, y) => {
      if (y.refs !== x.refs) return y.refs - x.refs;
      return x.p.createdAt.getTime() - y.p.createdAt.getTime();
    });
    const canonical = scored[0]!.p;
    const dups = scored.slice(1).map((s) => s.p);

    console.log(`▶ "${canonical.fullName}"  (canonical ${canonical.id})  ← ${dups.length} dup(s)`);
    for (const d of dups) {
      const r = scored.find((s) => s.p.id === d.id)!.refs;
      console.log(`     merge ${d.id}  refs=${r}`);
    }

    if (!APPLY) continue;

    await prisma.$transaction(async (tx) => {
      for (const dup of dups) {
        await tx.agreement.updateMany({
          where: { signerAId: dup.id },
          data: { signerAId: canonical.id },
        });
        await tx.agreement.updateMany({
          where: { signerBId: dup.id },
          data: { signerBId: canonical.id },
        });

        // EditionParticipant: handle composite-PK conflict before repointing.
        const dupEps = await tx.editionParticipant.findMany({
          where: { participantId: dup.id },
          select: { editionId: true },
        });
        for (const ep of dupEps) {
          const exists = await tx.editionParticipant.findUnique({
            where: {
              editionId_participantId: {
                editionId: ep.editionId,
                participantId: canonical.id,
              },
            },
          });
          if (exists) {
            await tx.editionParticipant.delete({
              where: {
                editionId_participantId: {
                  editionId: ep.editionId,
                  participantId: dup.id,
                },
              },
            });
          } else {
            await tx.editionParticipant.update({
              where: {
                editionId_participantId: {
                  editionId: ep.editionId,
                  participantId: dup.id,
                },
              },
              data: { participantId: canonical.id },
            });
          }
        }

        await tx.participant.update({
          where: { id: dup.id },
          data: { deletedAt: new Date() },
        });
      }
    });
    totalMerged += dups.length;
  }

  console.log(
    APPLY
      ? `\n✓ Soft-deleted ${totalMerged} duplicate participant(s) across ${clusters.length} cluster(s).`
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
