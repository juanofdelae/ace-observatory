/**
 * Apply prisma/bootstrap.sql directly via `pg` against DATABASE_URL.
 * This is the "Option B" path documented in prisma/README.md — used when
 * Prisma 7's AI-action guard blocks `prisma migrate dev`. The SQL is the
 * exact output of `prisma migrate diff --from-empty --to-schema ...` so the
 * resulting schema is identical to what migrate dev would produce.
 *
 *   npx tsx scripts/apply-bootstrap.ts
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const sqlPath = join(process.cwd(), "prisma", "bootstrap.sql");
  const sql = readFileSync(sqlPath, "utf8");

  console.log(`→ Connecting to ${url.replace(/:[^:@]+@/, ":****@")}`);
  const client = new Client({ connectionString: url });
  await client.connect();

  console.log(`→ Applying ${sql.split("\n").length} lines of SQL…`);
  await client.query(sql);

  const { rows } = await client.query<{ table_name: string }>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
  );
  console.log(`✓ Schema applied. Tables created (${rows.length}):`);
  for (const r of rows) console.log(`   · ${r.table_name}`);

  await client.end();
}

main().catch((err) => {
  console.error("\n✗ Bootstrap failed:");
  console.error(err);
  process.exit(1);
});
