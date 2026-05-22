/**
 * Reconciliation report — compares Observatory's canonical JSONs against the
 * data Bridge accumulated during its standalone phase.
 *
 * Bridge is in /Users/juansebastianfonseca/WORK/RIAC/WEB ACE/ace-bridge, running
 * against the local Docker Postgres. This script reads the Bridge DB and the
 * Observatory JSONs, then reports overlap / gap / conflict.
 *
 * Run with:
 *   cd ace-data-observatory && \
 *   DATABASE_URL="postgresql://ace:ace_dev_only@localhost:5432/ace_bridge" \
 *   npx tsx scripts/reconcile-bridge.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import pg from "pg";

const DATA_DIR = join(__dirname, "..", "data");
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://ace:ace_dev_only@localhost:5432/ace_bridge";

type ObsLoi = {
  edition: string;
  editionLabel: string;
  kind: string;
  partyA: string;
  countryA: string;
  partyB: string;
  countryB: string;
  purpose: string;
  delegate: string;
};

type ObsParticipant = {
  id: string;
  name: string;
  countryId: string;
  organization: string;
  role: string | null;
  sectorIds: string[];
  actorType: string | null;
  editionIds: string[];
  areasOfInterest: string[];
  website: string | null;
  source: string;
  photoUrl: string | null;
};

type ObsMemphisParticipant = {
  id: number;
  name: string;
  title: string;
  organization: string;
  country: string;
  photo: string;
  expertise: string[];
  bio: string;
};

function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  const lois = JSON.parse(readFileSync(join(DATA_DIR, "_lois.json"), "utf-8")) as ObsLoi[];
  const histParts = JSON.parse(
    readFileSync(join(DATA_DIR, "_historical-participants.json"), "utf-8"),
  ) as ObsParticipant[];
  const memphisParts = JSON.parse(
    readFileSync(join(DATA_DIR, "_memphis-participants.json"), "utf-8"),
  ) as ObsMemphisParticipant[];

  console.log("=".repeat(72));
  console.log("OBSERVATORY CANONICAL DATA");
  console.log("=".repeat(72));
  console.log(`LOIs:                    ${lois.length}`);
  console.log(`Historical participants: ${histParts.length}`);
  console.log(`Memphis participants:    ${memphisParts.length}`);

  // LOIs by edition
  const loisByEdition = new Map<string, number>();
  for (const l of lois) {
    loisByEdition.set(l.edition, (loisByEdition.get(l.edition) ?? 0) + 1);
  }
  console.log("\nLOIs by edition:");
  for (const [ed, n] of [...loisByEdition.entries()].sort()) {
    console.log(`  ${ed.padEnd(28)} ${n}`);
  }

  // Photos coverage
  const withPhoto = histParts.filter((p) => p.photoUrl).length;
  console.log(`\nHistorical participants with photo: ${withPhoto} / ${histParts.length}`);

  // Connect to Bridge DB
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  const bridgeAgreements = await client.query(`
    SELECT a.code, a.subject, a."partyAId", a."partyBId", a."editionId",
           pa.name AS party_a, pb.name AS party_b,
           e.name AS edition_name
    FROM "Agreement" a
    JOIN "Institution" pa ON pa.id = a."partyAId"
    JOIN "Institution" pb ON pb.id = a."partyBId"
    JOIN "Edition" e ON e.id = a."editionId"
    WHERE a."deletedAt" IS NULL
    ORDER BY a.code;
  `);
  const bridgeParts = await client.query(`
    SELECT count(*)::int AS n FROM "Participant" WHERE "deletedAt" IS NULL;
  `);
  const bridgeInsts = await client.query(`
    SELECT count(*)::int AS n FROM "Institution" WHERE "deletedAt" IS NULL;
  `);

  console.log("\n" + "=".repeat(72));
  console.log("BRIDGE DB STATE");
  console.log("=".repeat(72));
  console.log(`Bridge agreements:    ${bridgeAgreements.rowCount}`);
  console.log(`Bridge participants:  ${bridgeParts.rows[0].n}`);
  console.log(`Bridge institutions:  ${bridgeInsts.rows[0].n}`);

  // ── Reconcile LOIs ────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(72));
  console.log("LOI RECONCILIATION (Bridge ACE22 LOIs vs _lois.json Córdoba)");
  console.log("=".repeat(72));

  const obsCordoba = lois.filter((l) => l.edition === "ace-22-cordoba-2025");
  console.log(`Observatory has ${obsCordoba.length} Córdoba LOIs in _lois.json.`);
  console.log(`Bridge has ${bridgeAgreements.rowCount} agreements total.`);

  // Match by normalized party pair
  const obsKeys = new Set(
    obsCordoba.map((l) => `${normalize(l.partyA)}__${normalize(l.partyB)}`),
  );
  const obsReverseKeys = new Set(
    obsCordoba.map((l) => `${normalize(l.partyB)}__${normalize(l.partyA)}`),
  );

  let matched = 0;
  let onlyInBridge = 0;
  const bridgeOrphans: string[] = [];
  for (const a of bridgeAgreements.rows) {
    if (!a.code.startsWith("ACE22-CBA-")) continue;
    const key = `${normalize(a.party_a)}__${normalize(a.party_b)}`;
    if (obsKeys.has(key) || obsReverseKeys.has(key)) {
      matched++;
    } else {
      onlyInBridge++;
      bridgeOrphans.push(`  ${a.code}: ${a.party_a} ↔ ${a.party_b}`);
    }
  }
  console.log(`\nMatched Cordoba LOIs (Bridge ↔ Observatory): ${matched}`);
  console.log(`Only in Bridge:  ${onlyInBridge}`);
  if (bridgeOrphans.length > 0) {
    console.log("\nBridge LOIs NOT in Observatory _lois.json:");
    bridgeOrphans.forEach((s) => console.log(s));
  }

  // ── Reconcile participants ────────────────────────────────────────────────
  console.log("\n" + "=".repeat(72));
  console.log("PARTICIPANT GAP ANALYSIS");
  console.log("=".repeat(72));

  const bridgeParticipants = await client.query(`
    SELECT p."fullName" AS name, i.name AS institution, i.country
    FROM "Participant" p
    JOIN "Institution" i ON i.id = p."institutionId"
    WHERE p."deletedAt" IS NULL
    ORDER BY p."fullName"
    LIMIT 5000;
  `);

  const obsByNormalizedName = new Map<string, ObsParticipant[]>();
  for (const p of histParts) {
    const key = normalize(p.name);
    if (!obsByNormalizedName.has(key)) obsByNormalizedName.set(key, []);
    obsByNormalizedName.get(key)!.push(p);
  }
  for (const p of memphisParts) {
    const key = normalize(p.name);
    if (!obsByNormalizedName.has(key)) obsByNormalizedName.set(key, []);
  }

  let bridgeInObs = 0;
  let bridgeOnly = 0;
  for (const b of bridgeParticipants.rows) {
    if (obsByNormalizedName.has(normalize(b.name))) bridgeInObs++;
    else bridgeOnly++;
  }
  console.log(`Bridge participants found in Observatory canonical: ${bridgeInObs}`);
  console.log(`Bridge participants NOT in Observatory: ${bridgeOnly}`);

  // Memphis edition coverage in Bridge
  console.log("\n" + "=".repeat(72));
  console.log("MEMPHIS COVERAGE");
  console.log("=".repeat(72));
  const memphisCountries = new Set(memphisParts.map((p) => p.country));
  const memphisWithBio = memphisParts.filter((p) => p.bio && p.bio.length > 50).length;
  const memphisWithPhoto = memphisParts.filter((p) => p.photo).length;
  console.log(`Memphis countries represented: ${memphisCountries.size}`);
  console.log(`Memphis participants with bio (>50 chars): ${memphisWithBio}`);
  console.log(`Memphis participants with photo: ${memphisWithPhoto}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
