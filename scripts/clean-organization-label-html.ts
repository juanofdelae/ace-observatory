/**
 * Strip HTML tags from Participant.organizationLabel. Same parser bug that
 * created the </em> institution row also left `<br><em>Current: …</em>`
 * fragments inside many participants' organizationLabel.
 *
 * Cleanup:
 *   "Caribbean Chapter</em>"
 *     → "Caribbean Chapter"
 *   "Americas Business Dialogue <br><em>Current: President, Colombia
 *    Productiva</em>"
 *     → "Americas Business Dialogue · Current: President, Colombia Productiva"
 *
 * Strategy: replace `<br>` with " · " (preserves the "then/now" reading),
 * strip remaining tags, collapse whitespace, trim. Leading "· " (from rows
 * that started with `<br>`) gets dropped.
 *
 * Default: dry-run. Pass --apply to execute.
 */
import { prisma } from "@/prisma/seed/_lib";

const APPLY = process.argv.includes("--apply");

function clean(raw: string): string {
  return raw
    .replace(/<br\s*\/?\s*>/gi, " · ")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .replace(/^[\s·]+/, "")
    .trim();
}

async function main() {
  const rows = await prisma.participant.findMany({
    where: {
      deletedAt: null,
      OR: [
        { organizationLabel: { contains: "<" } },
        { organizationLabel: { contains: "&" } },
      ],
    },
    select: { id: true, fullName: true, organizationLabel: true },
  });

  console.log(`Found ${rows.length} participant(s) with HTML in organizationLabel.\n`);

  let changed = 0;
  for (const row of rows) {
    const before = row.organizationLabel ?? "";
    const after = clean(before);
    if (after === before) continue;
    changed++;

    console.log(`▶ ${row.fullName}`);
    console.log(`     before:  "${before}"`);
    console.log(`     after :  "${after}"`);

    if (APPLY) {
      await prisma.participant.update({
        where: { id: row.id },
        data: { organizationLabel: after },
      });
    }
  }

  console.log(
    APPLY
      ? `\n✓ Cleaned ${changed} participant(s).`
      : `\nDry-run only (${changed} would change). Re-run with --apply.`,
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
