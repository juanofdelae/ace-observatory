/**
 * Seed the Country table from Observatory's static registry.
 * Source: data/countries.ts (curated, includes regions + coordinates).
 */
import { countries } from "../../data/countries";
import { prisma } from "./_lib";

async function main() {
  console.log(`Seeding ${countries.length} countries…`);
  for (const c of countries) {
    await prisma.country.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        flagAssetUrl: `/flags/${c.id}.svg`,
      },
      update: {
        name: c.name,
        flagAssetUrl: `/flags/${c.id}.svg`,
      },
    });
  }
  const total = await prisma.country.count();
  console.log(`✓ Countries: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
