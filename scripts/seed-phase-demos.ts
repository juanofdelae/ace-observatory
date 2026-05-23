/**
 * Demo seeder — creates four synthetic agreements, one per Phase, so the
 * /admin/agreements table shows the full pipeline visualization (SIGNED →
 * CONTACTED → ACTIVE → RESULT) at once. Useful for screenshots and demos.
 *
 * Idempotent: upserts by code, so re-running just updates the same four rows.
 *
 * Codes are prefixed DEMO- so they're easy to spot, filter out, or drop:
 *   DEMO-PHASE-SIGNED
 *   DEMO-PHASE-CONTACTED
 *   DEMO-PHASE-ACTIVE
 *   DEMO-PHASE-RESULT
 *
 * Run:
 *   npx tsx scripts/seed-phase-demos.ts
 *
 * Cleanup later:
 *   npx prisma studio  (delete rows whose code starts with "DEMO-")
 *   -- OR --
 *   DELETE FROM "Agreement" WHERE code LIKE 'DEMO-%';
 */
import { prisma } from "@/prisma/seed/_lib";

type Demo = {
  code: string;
  phase: "SIGNED" | "CONTACTED" | "ACTIVE" | "RESULT";
  alertStatus: "ACTIVE" | "NEEDS_ATTENTION" | "CLOSED";
  documentUrl: string | null;
  resultSummary: string | null;
  resultDate: Date | null;
  subject: string;
  signedDaysAgo: number;
};

const DEMOS: Demo[] = [
  {
    code: "DEMO-PHASE-SIGNED",
    phase: "SIGNED",
    alertStatus: "ACTIVE",
    documentUrl: null,
    resultSummary: null,
    resultDate: null,
    subject:
      "Demo · acuerdo recién firmado, pendiente de contactar a las partes para activar el plan de trabajo.",
    signedDaysAgo: 2,
  },
  {
    code: "DEMO-PHASE-CONTACTED",
    phase: "CONTACTED",
    alertStatus: "ACTIVE",
    documentUrl: "https://example.com/demo-contacted.pdf",
    resultSummary: null,
    resultDate: null,
    subject:
      "Demo · primeras llamadas hechas, ambas partes confirmaron interés, pendiente agendar reunión de scope.",
    signedDaysAgo: 18,
  },
  {
    code: "DEMO-PHASE-ACTIVE",
    phase: "ACTIVE",
    alertStatus: "NEEDS_ATTENTION",
    documentUrl: "https://example.com/demo-active.pdf",
    resultSummary: null,
    resultDate: null,
    subject:
      "Demo · proyecto piloto en ejecución, requiere seguimiento operativo y recursos adicionales del lado A.",
    signedDaysAgo: 75,
  },
  {
    code: "DEMO-PHASE-RESULT",
    phase: "RESULT",
    alertStatus: "ACTIVE",
    documentUrl: "https://example.com/demo-result.pdf",
    resultSummary:
      "Piloto cerrado con éxito: 200 PyMEs onboardeadas en 3 ciudades, $1.2M USD movilizado, 4 contratos derivados en curso.",
    resultDate: new Date(),
    subject:
      "Demo · acuerdo con resultados medibles entregados, listo para cierre formal y archivo.",
    signedDaysAgo: 240,
  },
];

async function main() {
  const edition = await prisma.edition.findFirst({
    orderBy: [{ year: "desc" }],
    select: { id: true, name: true },
  });
  if (!edition) {
    throw new Error("No editions in DB — run the seed first.");
  }

  // Pick 8 distinct institutions (2 per demo). Prefer ones with a country
  // attached so the flag visualization also exercises real ISO codes.
  const institutions = await prisma.institution.findMany({
    where: { deletedAt: null, countryId: { not: null } },
    orderBy: { name: "asc" },
    take: 16,
    select: { id: true, name: true, countryId: true },
  });
  if (institutions.length < 8) {
    throw new Error(
      `Need at least 8 institutions with countryId to build demo pairs; found ${institutions.length}.`,
    );
  }

  // Pair up institutions from different countries when possible so the flags
  // in each row visibly differ.
  const pairs: Array<[(typeof institutions)[number], (typeof institutions)[number]]> = [];
  const used = new Set<string>();
  for (const a of institutions) {
    if (pairs.length === DEMOS.length) break;
    if (used.has(a.id)) continue;
    const b = institutions.find(
      (x) => !used.has(x.id) && x.id !== a.id && x.countryId !== a.countryId,
    );
    if (!b) continue;
    pairs.push([a, b]);
    used.add(a.id);
    used.add(b.id);
  }
  if (pairs.length < DEMOS.length) {
    throw new Error(
      `Couldn't form ${DEMOS.length} cross-country pairs; only got ${pairs.length}.`,
    );
  }

  const now = Date.now();
  for (let i = 0; i < DEMOS.length; i++) {
    const d = DEMOS[i]!;
    const [partyA, partyB] = pairs[i]!;
    const signedDate = new Date(now - d.signedDaysAgo * 86400_000);

    const data = {
      editionId: edition.id,
      instrumentType: "LOI" as const,
      signedDate,
      partyAId: partyA.id,
      partyBId: partyB.id,
      subject: d.subject,
      primarySector: "INNOVATION" as const,
      tags: ["demo"],
      phase: d.phase,
      alertStatus: d.alertStatus,
      documentUrl: d.documentUrl,
      resultSummary: d.resultSummary,
      resultDate: d.resultDate,
    };

    await prisma.agreement.upsert({
      where: { code: d.code },
      update: data,
      create: { code: d.code, ...data },
    });

    console.log(
      `  ✓ ${d.code.padEnd(24)} ${d.phase.padEnd(10)} ${partyA.countryId?.toUpperCase()} ↔ ${partyB.countryId?.toUpperCase()}  (${partyA.name.slice(0, 30)} / ${partyB.name.slice(0, 30)})`,
    );
  }

  console.log(`\nDone. 4 demo agreements upserted on edition "${edition.name}".`);
  console.log(
    "Cleanup later:  DELETE FROM \"Agreement\" WHERE code LIKE 'DEMO-%';\n",
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
