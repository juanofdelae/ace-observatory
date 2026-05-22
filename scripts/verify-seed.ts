/**
 * Quick smoke test for the seed pipeline. Runs after `npm run db:seed` to
 * confirm expected row counts landed. No assertions — just prints.
 *
 *   npx tsx scripts/verify-seed.ts
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const [countries, editions, institutions, participants, editionParticipants, agreements, reports] =
    await Promise.all([
      prisma.country.count(),
      prisma.edition.count(),
      prisma.institution.count(),
      prisma.participant.count(),
      prisma.editionParticipant.count(),
      prisma.agreement.count(),
      prisma.report.count(),
    ]);

  const fmt = (n: number) => String(n).padStart(6);

  console.log("┌────────────────────────┬────────┐");
  console.log("│ Table                  │  Count │");
  console.log("├────────────────────────┼────────┤");
  console.log(`│ Country                │ ${fmt(countries)} │`);
  console.log(`│ Edition                │ ${fmt(editions)} │`);
  console.log(`│ Institution            │ ${fmt(institutions)} │`);
  console.log(`│ Participant            │ ${fmt(participants)} │`);
  console.log(`│ EditionParticipant     │ ${fmt(editionParticipants)} │`);
  console.log(`│ Agreement              │ ${fmt(agreements)} │`);
  console.log(`│ Report                 │ ${fmt(reports)} │`);
  console.log("└────────────────────────┴────────┘");

  const cordobaAgreements = await prisma.agreement.count({
    where: { editionId: "ace-22-cordoba-2025" },
  });
  console.log(`\nCórdoba 2025 agreements: ${cordobaAgreements}`);

  const sampleAgreement = await prisma.agreement.findFirst({
    include: {
      partyA: { select: { name: true, countryId: true } },
      partyB: { select: { name: true, countryId: true } },
      edition: { select: { name: true } },
    },
  });
  if (sampleAgreement) {
    console.log(`\nSample agreement (${sampleAgreement.code}):`);
    console.log(`  ${sampleAgreement.partyA.name} [${sampleAgreement.partyA.countryId}]`);
    console.log(`  ↔ ${sampleAgreement.partyB.name} [${sampleAgreement.partyB.countryId}]`);
    console.log(`  edition: ${sampleAgreement.edition.name}`);
    console.log(`  subject: ${sampleAgreement.subject.slice(0, 80)}…`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
