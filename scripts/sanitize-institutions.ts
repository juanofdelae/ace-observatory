/**
 * Strip HTML tags + decode entities from Institution names.
 *
 * The TablePress / Observatory imports left raw HTML in some institution
 * `name` fields (e.g. "<br><em>Current: Coordinator of the Observatory of
 * Foreign Trade, UNED</em>"). The UI renders these as literal text in
 * selects + cards, which is ugly.
 *
 * Idempotent: rows without HTML or with already-clean text pass through.
 *
 *   npx tsx scripts/sanitize-institutions.ts          # dry run
 *   npx tsx scripts/sanitize-institutions.ts --apply  # writes
 */
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

const APPLY = process.argv.includes("--apply");

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function clean(raw: string): string {
  let out = raw;
  // Numeric entities first (&#123;).
  out = out.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
  // Named entities.
  for (const [from, to] of Object.entries(ENTITIES)) {
    out = out.replaceAll(from, to);
  }
  // Strip tags.
  out = out.replace(/<[^>]+>/g, " ");
  // Collapse whitespace.
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const client = new Client({ connectionString: url });
  await client.connect();

  const { rows } = await client.query<{ id: string; name: string }>(
    `SELECT id, name FROM "Institution" WHERE name ~ '<[^>]+>' OR name ~ '&[a-zA-Z#0-9]+;' OR name ~ '\\s{2,}'`,
  );

  let changed = 0;
  let unchanged = 0;
  const samples: Array<{ before: string; after: string }> = [];

  for (const row of rows) {
    const cleaned = clean(row.name);
    if (cleaned === row.name) {
      unchanged++;
      continue;
    }
    if (!cleaned) {
      console.warn(`  ! skipping ${row.id}: cleaning produced empty name`);
      continue;
    }
    if (samples.length < 10) samples.push({ before: row.name, after: cleaned });
    changed++;
    if (APPLY) {
      await client.query(
        `UPDATE "Institution" SET name = $1, "updatedAt" = NOW() WHERE id = $2`,
        [cleaned, row.id],
      );
    }
  }

  console.log(`\nScanned ${rows.length} candidates`);
  console.log(`  will change : ${changed}`);
  console.log(`  unchanged   : ${unchanged}`);
  console.log(`\nFirst 10 changes:`);
  for (const s of samples) {
    console.log(`  - ${s.before.slice(0, 80)}`);
    console.log(`  + ${s.after.slice(0, 80)}`);
  }

  if (!APPLY) {
    console.log(`\nDry run — pass --apply to write changes to the database.`);
  } else {
    console.log(`\n✓ Applied ${changed} updates.`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
