/**
 * Read-only audit of the Institution table. Flags rows that smell like
 * data-quality bugs from the seed: HTML artifacts in names, names that
 * look like a person rather than an organization, exact collisions with
 * Participant.fullName, and obvious duplicates (case/whitespace).
 *
 * Outputs counts + sample rows. Mutates nothing.
 *
 * Run:
 *   npx tsx scripts/audit-institutions.ts
 */
import { prisma } from "@/prisma/seed/_lib";

const ORG_KEYWORDS = [
  // English
  "university",
  "college",
  "ministry",
  "chamber",
  "department",
  "institute",
  "school",
  "agency",
  "company",
  "corp",
  "inc",
  "llc",
  "ltd",
  "foundation",
  "association",
  "council",
  "office",
  "centre",
  "center",
  "lab",
  "labs",
  "group",
  "bureau",
  "academy",
  "alliance",
  "network",
  "consortium",
  "league",
  // Spanish
  "universidad",
  "ministerio",
  "cámara",
  "camara",
  "instituto",
  "secretaría",
  "secretaria",
  "gobierno",
  "empresa",
  "fundación",
  "fundacion",
  "asociación",
  "asociacion",
  "consejo",
  "oficina",
  "centro",
  "agencia",
  "corporación",
  "corporacion",
  "sociedad",
  "compañía",
  "compania",
  "parque",
  "polo",
  "red",
  // Portuguese
  "universidade",
  "ministério",
  "ministerio",
  "câmara",
  "associação",
  "fundação",
  "agência",
  "sociedade",
];

function looksLikeOrg(name: string): boolean {
  const lower = name.toLowerCase();
  return ORG_KEYWORDS.some((kw) => lower.includes(kw));
}

function looksLikePersonName(name: string): boolean {
  // Heuristic: 2-4 words, each starts uppercase, none in keyword list,
  // contains no digits, no punctuation other than periods/hyphens/apostrophes.
  const trimmed = name.trim();
  if (trimmed.length < 4 || trimmed.length > 60) return false;
  if (/[<>{}[\]@#$%&*=+/\\]/.test(trimmed)) return false;
  if (/\d/.test(trimmed)) return false;
  if (looksLikeOrg(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  // Each word starts with uppercase letter (incl. accented)
  return words.every((w) => /^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'.-]*$/.test(w));
}

function hasHtmlArtifact(name: string): boolean {
  return /<\/?[a-z]+>|&[a-z]+;|&#\d+;/i.test(name);
}

function isEmptyish(name: string): boolean {
  const t = name.trim();
  return t.length === 0 || t === "-" || t === "—" || t === "N/A" || t === "TBD";
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const [institutions, participants] = await Promise.all([
    prisma.institution.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, type: true, countryLabel: true },
    }),
    prisma.participant.findMany({
      where: { deletedAt: null },
      select: { id: true, fullName: true },
    }),
  ]);

  console.log(`\nAudit on ${institutions.length} institutions, ${participants.length} participants.\n`);

  const participantNames = new Set(participants.map((p) => normalize(p.fullName)));

  const buckets = {
    htmlArtifact: [] as typeof institutions,
    emptyish: [] as typeof institutions,
    matchesParticipant: [] as typeof institutions,
    looksLikePerson: [] as typeof institutions,
    suspiciousType: [] as typeof institutions, // OTHER + looks like person
    duplicates: [] as Array<{ canonical: string; ids: string[]; names: string[] }>,
  };

  // Group by normalized name for duplicates
  const byNorm = new Map<string, typeof institutions>();
  for (const inst of institutions) {
    const k = normalize(inst.name);
    const arr = byNorm.get(k) ?? [];
    arr.push(inst);
    byNorm.set(k, arr);
  }
  for (const [canonical, group] of byNorm) {
    if (group.length > 1) {
      buckets.duplicates.push({
        canonical,
        ids: group.map((g) => g.id),
        names: group.map((g) => g.name),
      });
    }
  }

  for (const inst of institutions) {
    if (hasHtmlArtifact(inst.name)) buckets.htmlArtifact.push(inst);
    else if (isEmptyish(inst.name)) buckets.emptyish.push(inst);
    else if (participantNames.has(normalize(inst.name)))
      buckets.matchesParticipant.push(inst);
    else if (looksLikePersonName(inst.name)) {
      buckets.looksLikePerson.push(inst);
      if (inst.type === "OTHER") buckets.suspiciousType.push(inst);
    }
  }

  function report(label: string, rows: typeof institutions, sample = 10) {
    console.log(`──── ${label}: ${rows.length}`);
    for (const r of rows.slice(0, sample)) {
      console.log(
        `      ${r.name.padEnd(48)}  type=${r.type.padEnd(10)} country=${r.countryLabel ?? "-"}`,
      );
    }
    if (rows.length > sample) console.log(`      … +${rows.length - sample} more`);
    console.log("");
  }

  report("HTML artifacts in name", buckets.htmlArtifact);
  report("Empty / placeholder names", buckets.emptyish);
  report("Exact match to a Participant.fullName", buckets.matchesParticipant);
  report("Looks like a person name (heuristic)", buckets.looksLikePerson);
  report("Person-shaped AND type=OTHER (highest confidence)", buckets.suspiciousType);

  console.log(`──── Duplicate names (case/accent-insensitive): ${buckets.duplicates.length}`);
  for (const d of buckets.duplicates.slice(0, 10)) {
    console.log(`      "${d.canonical}"  →  ${d.ids.length} rows: ${d.names.join(" | ")}`);
  }
  if (buckets.duplicates.length > 10)
    console.log(`      … +${buckets.duplicates.length - 10} more`);

  console.log("\nDone (read-only — no mutations).\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
