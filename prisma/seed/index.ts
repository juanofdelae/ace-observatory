/**
 * Seed orchestrator. Runs all phases in dependency order against the merged
 * Observatory DB. Idempotent: every phase uses upsert keyed on the entity's
 * stable identifier (id, externalId, slug, or composite unique).
 *
 *   npm run db:seed
 *   npm run db:seed -- --only=countries,editions  (filter phases)
 */
import { spawn } from "node:child_process";
import { join } from "node:path";

const phases: Array<{ key: string; file: string }> = [
  { key: "countries", file: "01-countries.ts" },
  { key: "editions", file: "02-editions.ts" },
  { key: "participants", file: "03-participants.ts" },
  { key: "agreements", file: "04-agreements.ts" },
  { key: "surveys", file: "05-surveys.ts" },
];

function run(file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["tsx", join(__dirname, file)], {
      stdio: "inherit",
      env: process.env,
    });
    proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${file} exited ${code}`))));
  });
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",")) : null;

  for (const p of phases) {
    if (only && !only.has(p.key)) {
      console.log(`— skipped ${p.key}`);
      continue;
    }
    console.log(`\n▶ ${p.key}`);
    await run(p.file);
  }
  console.log("\n✓ All seed phases done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
