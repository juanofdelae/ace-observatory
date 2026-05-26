/**
 * Backfill Agreement.signerAId / signerBId from the `delegate` field in
 * Observatory's _lois.json. The seed loaded LOIs but never set the signer
 * FKs, so the DB knows partyA/partyB institutions but not who actually
 * signed on each side.
 *
 * Match strategy:
 *   1. Normalize each JSON LOI to a key  (editionId, normalized partyA,
 *      normalized partyB). Pair-order-insensitive — JSON might list parties
 *      A/B reversed vs DB.
 *   2. For each DB Agreement, build the same key and look up the JSON entry.
 *   3. Find the delegate by fullName as a Participant. Skip if 0 or >1
 *      match (ambiguous).
 *   4. Pick the signer side: if the participant's institutionId equals
 *      Agreement.partyAId → signerA; else if partyBId → signerB; otherwise
 *      fall back to the side whose party name matches the JSON party they
 *      were listed under (delegate side).
 *   5. Update the FK.
 *
 * Default: dry-run. Pass --apply to execute.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "@/prisma/seed/_lib";

const APPLY = process.argv.includes("--apply");

type LoiJson = {
  edition: string;
  editionLabel?: string;
  partyA: string;
  countryA: string;
  partyB: string;
  countryB: string;
  purpose: string | null;
  delegate: string | null;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Pair-order-insensitive: same key whether A↔B or B↔A.
function pairKey(edition: string, a: string, b: string): string {
  const [x, y] = [norm(a), norm(b)].sort();
  return `${edition}::${x}::${y}`;
}

async function main() {
  const path = join(process.cwd(), "data", "_lois.json");
  const lois: LoiJson[] = JSON.parse(readFileSync(path, "utf8"));

  // Index JSON LOIs by pair key. Multiple entries per key are possible (the
  // dataset has duplicates we removed in DB); keep the first non-empty
  // delegate.
  const delegateByPair = new Map<string, { delegate: string; partyA: string; partyB: string }>();
  for (const loi of lois) {
    if (!loi.delegate) continue;
    const k = pairKey(loi.edition, loi.partyA, loi.partyB);
    if (!delegateByPair.has(k)) {
      delegateByPair.set(k, { delegate: loi.delegate, partyA: loi.partyA, partyB: loi.partyB });
    }
  }

  const agreements = await prisma.agreement.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      code: true,
      editionId: true,
      partyAId: true,
      partyBId: true,
      signerAId: true,
      signerBId: true,
      partyA: { select: { name: true } },
      partyB: { select: { name: true } },
    },
  });

  const stats = {
    matched: 0,
    alreadyLinked: 0,
    noJsonMatch: 0,
    delegateNotFound: 0,
    delegateAmbiguous: 0,
    updated: 0,
  };
  const sampleNoJson: typeof agreements = [];
  const sampleNoDelegate: Array<{ code: string; delegate: string }> = [];

  for (const ag of agreements) {
    const k = pairKey(ag.editionId, ag.partyA.name, ag.partyB.name);
    const json = delegateByPair.get(k);
    if (!json) {
      stats.noJsonMatch++;
      if (sampleNoJson.length < 8) sampleNoJson.push(ag);
      continue;
    }
    stats.matched++;
    if (ag.signerAId || ag.signerBId) {
      stats.alreadyLinked++;
      continue;
    }

    const delegateName = json.delegate;
    const candidates = await prisma.participant.findMany({
      where: { deletedAt: null, fullName: delegateName },
      select: { id: true, fullName: true, institutionId: true },
    });
    if (candidates.length === 0) {
      stats.delegateNotFound++;
      if (sampleNoDelegate.length < 12)
        sampleNoDelegate.push({ code: ag.code, delegate: delegateName });
      continue;
    }
    if (candidates.length > 1) {
      // After participant-dedup we shouldn't see this, but guard anyway.
      stats.delegateAmbiguous++;
      continue;
    }
    const p = candidates[0]!;

    // Pick the signer side: prefer institution match, fall back to the side
    // the JSON listed the delegate under (matched against ag's parties).
    let side: "A" | "B";
    if (p.institutionId === ag.partyAId) side = "A";
    else if (p.institutionId === ag.partyBId) side = "B";
    else if (norm(json.partyA) === norm(ag.partyA.name)) side = "A";
    else side = "B";

    if (!APPLY) {
      stats.updated++;
      continue;
    }

    await prisma.agreement.update({
      where: { id: ag.id },
      data: side === "A" ? { signerAId: p.id } : { signerBId: p.id },
    });
    stats.updated++;
  }

  console.log("\nResults:");
  console.log(`  DB agreements scanned:            ${agreements.length}`);
  console.log(`  Matched a JSON LOI:               ${stats.matched}`);
  console.log(`  Already had a signer FK:          ${stats.alreadyLinked}`);
  console.log(`  No JSON match:                    ${stats.noJsonMatch}`);
  console.log(`  Delegate not in Participants:     ${stats.delegateNotFound}`);
  console.log(`  Delegate ambiguous (>1 match):    ${stats.delegateAmbiguous}`);
  console.log(`  ${APPLY ? "Updated" : "Would update"}: ${stats.updated}`);

  if (sampleNoJson.length > 0) {
    console.log("\nSample DB agreements with no JSON LOI counterpart:");
    for (const a of sampleNoJson) {
      console.log(`   ${a.code}  ${a.partyA.name}  ↔  ${a.partyB.name}`);
    }
  }
  if (sampleNoDelegate.length > 0) {
    console.log("\nSample delegates from JSON that aren't in Participants:");
    for (const d of sampleNoDelegate) {
      console.log(`   ${d.code}  delegate="${d.delegate}"`);
    }
  }
  console.log(
    APPLY
      ? "\nDone."
      : "\nDry-run only. Re-run with --apply to execute.",
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
