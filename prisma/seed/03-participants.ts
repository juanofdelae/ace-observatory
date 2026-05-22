/**
 * Seed Participant + Institution + EditionParticipant rows from Observatory's
 * canonical JSONs. Order of precedence when names collide:
 *   1. Memphis participants (rich: bio, photo, expertise, base64 email)
 *   2. Historical participants from TablePress (broad coverage, photos only sometimes)
 *   3. Memphis organizers / special guests (role context)
 *
 * Institutions are inferred from `organization` strings — one institution per
 * unique (name, countryId) pair. Avoids creating bare-string duplicates.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  inferInstitutionType,
  mapActorType,
  prisma,
  SECTOR_MAP,
  slug,
} from "./_lib";

const DATA_DIR = join(__dirname, "..", "..", "data");
type Sector =
  | "INNOVATION" | "SMES" | "AGRITECH" | "LOGISTICS" | "EDTECH" | "TOURISM"
  | "MANUFACTURING" | "FINTECH" | "HEALTH" | "ENERGY" | "CLEAN_ENERGY"
  | "SMART_CITIES" | "CREATIVE_INDUSTRIES" | "ENTREPRENEURIAL_ECOSYSTEM"
  | "TRADE" | "OTHER";

type ActorType =
  | "GOVERNMENT" | "PRIVATE_SECTOR" | "ACADEMIA" | "INTERNATIONAL_ORG" | "OTHER";

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));
}

interface HistoricalRecord {
  id: string;
  name: string;
  countryId: string | null;
  organization: string | null;
  role: string | null;
  sectorIds: string[];
  actorType: string | null;
  editionIds: string[];
  areasOfInterest: string[];
  website: string | null;
  source: string;
  photoUrl: string | null;
}

interface MemphisRecord {
  id: number;
  name: string;
  title: string | null;
  organization: string | null;
  country: string | null;
  photo: string | null;
  flag: string | null;
  expertise: string[];
  website: string | null;
  email: string | null; // base64
  linkedin: string | null;
  sectors: string[];
  bio: string | null;
}

interface MemphisAux {
  name: string;
  title: string | null;
  organization: string | null;
  section: string | null;
  photo: string | null;
  type: "organizer" | "special-guest";
}

const COUNTRY_LABEL_TO_ID: Record<string, string> = {
  argentina: "ar",
  brazil: "br",
  brasil: "br",
  canada: "ca",
  colombia: "co",
  chile: "cl",
  ecuador: "ec",
  germany: "de",
  guatemala: "gt",
  mexico: "mx",
  panama: "pa",
  paraguay: "py",
  peru: "pe",
  perú: "pe",
  "united states": "us",
  uruguay: "uy",
};

function memphisCountryToId(label: string | null): string | null {
  if (!label) return null;
  return COUNTRY_LABEL_TO_ID[label.trim().toLowerCase()] ?? null;
}

function expertiseToSectors(items: string[]): Sector[] {
  const out = new Set<Sector>();
  for (const item of items.map((s) => s.toLowerCase())) {
    if (item.includes("agri") || item.includes("food")) out.add("AGRITECH");
    if (item.includes("manufactur")) out.add("MANUFACTURING");
    if (item.includes("logist") || item.includes("trade")) out.add("LOGISTICS");
    if (item.includes("innov") || item.includes("r&d")) out.add("INNOVATION");
    if (item.includes("energy") || item.includes("clean")) out.add("CLEAN_ENERGY");
    if (item.includes("smart") || item.includes("urban")) out.add("SMART_CITIES");
    if (item.includes("health")) out.add("HEALTH");
    if (item.includes("educat") || item.includes("talent")) out.add("EDTECH");
    if (item.includes("entrepre")) out.add("ENTREPRENEURIAL_ECOSYSTEM");
    if (item.includes("creative")) out.add("CREATIVE_INDUSTRIES");
    if (item.includes("fintech") || item.includes("financ")) out.add("FINTECH");
    if (item.includes("touris")) out.add("TOURISM");
  }
  return [...out];
}

function mapSectorIds(ids: string[]): Sector[] {
  const out = new Set<Sector>();
  for (const id of ids) {
    const mapped = SECTOR_MAP[id];
    if (mapped) out.add(mapped as Sector);
  }
  return [...out];
}

/** name+country → cached institutionId. */
const institutionCache = new Map<string, string>();

async function upsertInstitution(args: {
  name: string;
  countryId: string | null;
  actorTypeRaw: string | null;
  sectorIds: Sector[];
  logoUrl: string | null;
  website: string | null;
}): Promise<string> {
  const key = `${args.name.toLowerCase().trim()}__${args.countryId ?? "null"}`;
  const cached = institutionCache.get(key);
  if (cached) return cached;

  const type = inferInstitutionType(args.name, args.actorTypeRaw);
  const actorType = mapActorType(args.actorTypeRaw);

  // Try to find by name + country first.
  const existing = await prisma.institution.findFirst({
    where: {
      name: args.name,
      countryId: args.countryId,
    },
  });
  if (existing) {
    institutionCache.set(key, existing.id);
    return existing.id;
  }

  const created = await prisma.institution.create({
    data: {
      name: args.name,
      type,
      actorType,
      countryId: args.countryId,
      countryLabel: args.countryId ?? "intl",
      logoUrl: args.logoUrl,
      website: args.website,
      sectorIds: args.sectorIds,
    },
  });
  institutionCache.set(key, created.id);
  return created.id;
}

async function seedHistorical(): Promise<void> {
  const records = readJson<HistoricalRecord[]>("_historical-participants.json");
  console.log(`  historical: ${records.length} records`);

  for (const r of records) {
    let institutionId: string | null = null;
    if (r.organization && r.organization.trim()) {
      institutionId = await upsertInstitution({
        name: r.organization.trim(),
        countryId: r.countryId,
        actorTypeRaw: r.actorType,
        sectorIds: mapSectorIds(r.sectorIds),
        logoUrl: null,
        website: r.website,
      });
    }

    // r.id is already unique and slug-safe (e.g. p-hist-ca-syeda-alia-abbas).
    // Using a truncated slug+suffix collided when two records shared the same
    // last 6 chars (rare, but it happens in real data).
    const syntheticEmail = `${r.id}@no-email.observatory.ace`;

    const participant = await prisma.participant.upsert({
      where: { externalId: r.id },
      create: {
        externalId: r.id,
        fullName: r.name,
        email: syntheticEmail,
        countryId: r.countryId,
        organizationLabel: r.organization,
        position: r.role,
        institutionId,
        photoUrl: r.photoUrl,
        sectorIds: mapSectorIds(r.sectorIds),
        actorType: mapActorType(r.actorType),
        source: r.source,
      },
      update: {
        fullName: r.name,
        countryId: r.countryId,
        organizationLabel: r.organization,
        position: r.role,
        institutionId,
        photoUrl: r.photoUrl,
        sectorIds: mapSectorIds(r.sectorIds),
        actorType: mapActorType(r.actorType),
      },
    });

    for (const editionId of r.editionIds) {
      await prisma.editionParticipant.upsert({
        where: { editionId_participantId: { editionId, participantId: participant.id } },
        create: { editionId, participantId: participant.id, role: "DELEGATE" },
        update: {},
      });
    }
  }
}

async function seedMemphis(): Promise<void> {
  const records = readJson<MemphisRecord[]>("_memphis-participants.json");
  console.log(`  memphis participants: ${records.length} records`);

  for (const r of records) {
    const countryId = memphisCountryToId(r.country);
    const memphisSectors = expertiseToSectors(r.expertise);

    let institutionId: string | null = null;
    if (r.organization && r.organization.trim()) {
      institutionId = await upsertInstitution({
        name: r.organization.trim(),
        countryId,
        actorTypeRaw: r.sectors[0] ?? null,
        sectorIds: memphisSectors,
        logoUrl: null,
        website: r.website,
      });
    }

    const externalId = `p-memphis-${r.id}`;
    const syntheticEmail = `${slug(r.name)}-mph-${r.id}@no-email.observatory.ace`;

    await prisma.participant.upsert({
      where: { externalId },
      create: {
        externalId,
        fullName: r.name,
        email: syntheticEmail,
        emailEncoded: r.email,
        position: r.title,
        organizationLabel: r.organization,
        countryId,
        institutionId,
        photoUrl: r.photo ? `/memphis/${r.photo}` : null,
        bio: r.bio,
        expertise: r.expertise,
        sectorIds: memphisSectors,
        actorType: mapActorType(r.sectors[0] ?? null),
        linkedin: r.linkedin,
        source: "memphis-2025",
      },
      update: {
        fullName: r.name,
        emailEncoded: r.email,
        position: r.title,
        organizationLabel: r.organization,
        countryId,
        institutionId,
        photoUrl: r.photo ? `/memphis/${r.photo}` : null,
        bio: r.bio,
        expertise: r.expertise,
        sectorIds: memphisSectors,
        actorType: mapActorType(r.sectors[0] ?? null),
        linkedin: r.linkedin,
      },
    });

    // Memphis = ACE 22 (Memphis 2026). Edition id when present in registry.
    const memphisEditionId = "ace-23-memphis-2026";
    const editionExists = await prisma.edition.findUnique({ where: { id: memphisEditionId } });
    if (editionExists) {
      const p = await prisma.participant.findUnique({ where: { externalId } });
      if (p) {
        await prisma.editionParticipant.upsert({
          where: { editionId_participantId: { editionId: memphisEditionId, participantId: p.id } },
          create: { editionId: memphisEditionId, participantId: p.id, role: "DELEGATE" },
          update: {},
        });
      }
    }
  }
}

async function seedMemphisAux(file: string, role: "ORGANIZER" | "SPECIAL_GUEST"): Promise<void> {
  const records = readJson<MemphisAux[]>(file);
  console.log(`  ${file}: ${records.length} records`);
  for (const [idx, r] of records.entries()) {
    let institutionId: string | null = null;
    if (r.organization && r.organization.trim()) {
      institutionId = await upsertInstitution({
        name: r.organization.trim(),
        countryId: "us",
        actorTypeRaw: null,
        sectorIds: [],
        logoUrl: null,
        website: null,
      });
    }
    const externalId = `p-${r.type}-${idx + 1}`;
    const syntheticEmail = `${slug(r.name)}-${r.type}-${idx + 1}@no-email.observatory.ace`;
    await prisma.participant.upsert({
      where: { externalId },
      create: {
        externalId,
        fullName: r.name,
        email: syntheticEmail,
        position: r.title,
        organizationLabel: r.organization,
        countryId: "us",
        institutionId,
        photoUrl: r.photo ? `/memphis/${r.photo}` : null,
        participantRole: role,
        source: "memphis-2025",
      },
      update: {
        fullName: r.name,
        position: r.title,
        organizationLabel: r.organization,
        institutionId,
        photoUrl: r.photo ? `/memphis/${r.photo}` : null,
        participantRole: role,
      },
    });
  }
}

async function main() {
  console.log("Seeding participants & institutions…");
  await seedHistorical();
  await seedMemphis();
  await seedMemphisAux("_memphis-organizers.json", "ORGANIZER");
  await seedMemphisAux("_memphis-special-guests.json", "SPECIAL_GUEST");
  const pTotal = await prisma.participant.count();
  const iTotal = await prisma.institution.count();
  const epTotal = await prisma.editionParticipant.count();
  console.log(`✓ Participants: ${pTotal}, Institutions: ${iTotal}, EditionParticipants: ${epTotal}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
