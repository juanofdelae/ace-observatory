/**
 * Some institution names arrived wrapped in parentheses from the seed —
 * "(First Ecuadorian Unicorn)", "(STEM Empresa Activa)" etc. Strip the
 * outer pair when (and only when) the parens enclose the whole string and
 * are balanced — leaves inner parens (e.g., "Acme (Subsidiary)") untouched.
 *
 * Default: dry-run. Pass --apply to execute.
 */
import { prisma } from "@/prisma/seed/_lib";

const APPLY = process.argv.includes("--apply");

// Returns the input with the outermost matched parens stripped, or the input
// unchanged if it doesn't start with "(" / end with ")" or the opening paren
// closes before the end of the string.
function stripWrappingParens(s: string): string {
  const trimmed = s.trim();
  if (!trimmed.startsWith("(") || !trimmed.endsWith(")")) return trimmed;
  let depth = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth === 0 && i < trimmed.length - 1) return trimmed;
  }
  return trimmed.slice(1, -1).trim();
}

async function main() {
  const candidates = await prisma.institution.findMany({
    where: {
      deletedAt: null,
      name: { startsWith: "(" },
    },
    select: { id: true, name: true },
  });

  console.log(`Found ${candidates.length} institution(s) starting with "(".\n`);

  let changed = 0;
  for (const c of candidates) {
    const next = stripWrappingParens(c.name);
    if (next === c.name) continue;
    changed++;
    console.log(`  "${c.name}"  →  "${next}"`);
    if (APPLY) {
      await prisma.institution.update({
        where: { id: c.id },
        data: { name: next },
      });
    }
  }

  console.log(
    APPLY
      ? `\n✓ Cleaned ${changed} institution name(s).`
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
