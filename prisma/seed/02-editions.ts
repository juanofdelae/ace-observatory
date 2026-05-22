/**
 * Seed Edition rows from Observatory's static registry.
 * Source: data/editions.ts + data/cities.ts (first city = canonical host city label).
 */
import { cities } from "../../data/cities";
import { editions } from "../../data/editions";
import { prisma } from "./_lib";

function hostCityLabel(cityIds: readonly string[]): string {
  if (cityIds.length === 0) return "Unknown";
  const first = cities.find((c) => c.id === cityIds[0]);
  if (!first) return cityIds[0]?.replace(/^city-/, "") ?? "Unknown";
  if (cityIds.length === 1) return first.name;
  return `${first.name} +${cityIds.length - 1}`;
}

async function main() {
  console.log(`Seeding ${editions.length} editions…`);
  let created = 0;
  let updated = 0;
  for (const e of editions) {
    const data = {
      name: e.name,
      shortLabel: `ACE ${e.number}`,
      year: new Date(e.startDate).getUTCFullYear(),
      hostCity: hostCityLabel(e.cityIds),
      hostCountryId: e.countryId,
      startDate: new Date(e.startDate),
      endDate: new Date(e.endDate),
      description: e.summary,
      heroImageUrl: e.heroImage,
    };
    const existing = await prisma.edition.findUnique({ where: { id: e.id } });
    if (existing) {
      await prisma.edition.update({ where: { id: e.id }, data });
      updated++;
    } else {
      await prisma.edition.create({ data: { id: e.id, ...data } });
      created++;
    }
  }
  const total = await prisma.edition.count();
  console.log(`✓ Editions: total=${total} created=${created} updated=${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
