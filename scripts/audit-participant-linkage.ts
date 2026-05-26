/**
 * How well are Participant rows linked to Institution rows?
 *
 * Most historical participants arrived with an `organizationLabel` (free
 * text from Observatory's source data) but no `institutionId`. This script
 * measures the gap and reports how many of those participants could be
 * cleanly auto-linked against existing institutions by normalized name +
 * country.
 *
 * Read-only. Run anytime.
 */
import { prisma } from "@/prisma/seed/_lib";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const [participants, institutions] = await Promise.all([
    prisma.participant.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        fullName: true,
        institutionId: true,
        organizationLabel: true,
        countryId: true,
      },
    }),
    prisma.institution.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, countryId: true },
    }),
  ]);

  const total = participants.length;
  const linked = participants.filter((p) => p.institutionId !== null).length;
  const unlinked = participants.filter((p) => p.institutionId === null);
  const withLabel = unlinked.filter(
    (p) => p.organizationLabel && p.organizationLabel.trim().length > 0,
  );
  const withoutLabel = unlinked.length - withLabel.length;

  console.log(`Participants: ${total}`);
  console.log(`  ✓ linked to an Institution:           ${linked}  (${pct(linked, total)}%)`);
  console.log(`  ✗ unlinked, no organizationLabel:     ${withoutLabel}`);
  console.log(`  ? unlinked, HAS organizationLabel:    ${withLabel.length}  ← linkage opportunity\n`);

  // Index institutions by normalized name (+ country when present) so the
  // matcher can cheaply look up candidates without rescanning the list.
  const instByKey = new Map<string, typeof institutions>();
  const instByName = new Map<string, typeof institutions>();
  for (const inst of institutions) {
    const nameKey = normalize(inst.name);
    const withCountry = `${nameKey}|${inst.countryId ?? ""}`;
    instByKey.set(withCountry, [...(instByKey.get(withCountry) ?? []), inst]);
    instByName.set(nameKey, [...(instByName.get(nameKey) ?? []), inst]);
  }

  let exactWithCountry = 0;
  let nameOnly = 0;
  let noMatch = 0;
  const sampleNoMatch: typeof withLabel = [];
  const sampleAmbiguous: Array<{
    p: (typeof withLabel)[number];
    candidates: typeof institutions;
  }> = [];

  for (const p of withLabel) {
    const orgKey = normalize(p.organizationLabel!);
    const candidates = instByKey.get(`${orgKey}|${p.countryId ?? ""}`);
    if (candidates && candidates.length === 1) {
      exactWithCountry++;
    } else if (candidates && candidates.length > 1) {
      if (sampleAmbiguous.length < 5) sampleAmbiguous.push({ p, candidates });
    } else {
      // Fall back to name-only (no country) — useful for international orgs
      // with mismatched country tags.
      const byNameOnly = instByName.get(orgKey);
      if (byNameOnly && byNameOnly.length >= 1) {
        nameOnly++;
      } else {
        noMatch++;
        if (sampleNoMatch.length < 12) sampleNoMatch.push(p);
      }
    }
  }

  console.log(`Matching results for ${withLabel.length} unlinked-with-label:`);
  console.log(`  Exact match (name + country):  ${exactWithCountry}`);
  console.log(`  Name-only match (country diff): ${nameOnly}`);
  console.log(`  Ambiguous (>1 candidate):       ${sampleAmbiguous.length} (sample shown)`);
  console.log(`  No match → org doesn't exist:   ${noMatch}\n`);

  if (sampleAmbiguous.length > 0) {
    console.log("── Sample ambiguous matches:");
    for (const a of sampleAmbiguous) {
      console.log(`   "${a.p.organizationLabel}" (participant: ${a.p.fullName})`);
      for (const c of a.candidates) {
        console.log(`      candidate: "${c.name}" (${c.countryId ?? "-"})`);
      }
    }
    console.log("");
  }

  if (sampleNoMatch.length > 0) {
    console.log("── Sample of orgs with no Institution row (could be backfilled):");
    for (const p of sampleNoMatch) {
      console.log(
        `   ${p.fullName.padEnd(36)}  org="${p.organizationLabel}"  country=${p.countryId ?? "-"}`,
      );
    }
    if (noMatch > sampleNoMatch.length) console.log(`   … +${noMatch - sampleNoMatch.length} more`);
  }
}

function pct(n: number, d: number): string {
  if (d === 0) return "0";
  return ((n / d) * 100).toFixed(1);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
