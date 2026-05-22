import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL not set — check .env.local");
}

const adapter = new PrismaPg({ connectionString: url });
export const prisma = new PrismaClient({ adapter });

/** Slugify for synthetic emails, codes, etc. */
export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Country names appearing in LOI strings → ISO alpha-2 lowercase. */
const COUNTRY_NAME_TO_ID: Record<string, string> = {
  argentina: "ar",
  armenia: "am",
  bahamas: "bs",
  "the bahamas": "bs",
  barbados: "bb",
  belize: "bz",
  bolivia: "bo",
  brazil: "br",
  brasil: "br",
  canada: "ca",
  chile: "cl",
  colombia: "co",
  "costa rica": "cr",
  dominica: "dm",
  "dominican republic": "do",
  ecuador: "ec",
  "el salvador": "sv",
  germany: "de",
  grenada: "gd",
  guatemala: "gt",
  "invest guatemala": "gt",
  guatemla: "gt",
  guyana: "gy",
  haiti: "ht",
  honduras: "hn",
  jamaica: "jm",
  mexico: "mx",
  méxico: "mx",
  panama: "pa",
  panamá: "pa",
  paraguay: "py",
  peru: "pe",
  perú: "pe",
  "saint lucia": "lc",
  "st. lucia": "lc",
  "st lucia": "lc",
  "st. kitts & nevis": "kn",
  "antigua & barbuda": "ag",
  spain: "es",
  españa: "es",
  suriname: "sr",
  "trinidad and tobago": "tt",
  "trinidad & tobago": "tt",
  "united kingdom": "gb",
  "united states": "us",
  "united states of america": "us",
  "u.s.": "us",
  usa: "us",
  uruguay: "uy",
  cyprus: "cy",
  estonia: "ee",
  georgia: "ge",
  israel: "il",
  korea: "kr",
  "south korea": "kr",
  norway: "no",
  "saudi arabia": "sa",
};

export function countryNameToId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return COUNTRY_NAME_TO_ID[key] ?? null;
}

/** Observatory sector ids → unified Prisma Sector enum values. */
export const SECTOR_MAP: Record<string, string> = {
  "sec-innovation": "INNOVATION",
  "sec-entrepreneurship": "ENTREPRENEURIAL_ECOSYSTEM",
  "sec-digital": "OTHER",
  "sec-advanced-manufacturing": "MANUFACTURING",
  "sec-logistics": "LOGISTICS",
  "sec-agrifood": "AGRITECH",
  "sec-clean-energy": "CLEAN_ENERGY",
  "sec-smart-cities": "SMART_CITIES",
  "sec-talent": "EDTECH",
  "sec-health": "HEALTH",
};

/** Observatory actor labels → ActorType enum. */
export function mapActorType(
  raw: string | null | undefined,
): "GOVERNMENT" | "PRIVATE_SECTOR" | "ACADEMIA" | "INTERNATIONAL_ORG" | "OTHER" | null {
  if (!raw) return null;
  const k = raw.trim().toLowerCase();
  if (k === "government") return "GOVERNMENT";
  if (k === "private sector" || k === "private") return "PRIVATE_SECTOR";
  if (k === "academia" || k === "university") return "ACADEMIA";
  if (k === "international organization" || k === "international org") return "INTERNATIONAL_ORG";
  return "OTHER";
}

/** Infer InstitutionType from name + actorType heuristics. */
export function inferInstitutionType(
  name: string,
  actor: string | null,
): "GOVERNMENT" | "UNIVERSITY" | "COMPANY" | "NGO" | "CHAMBER" | "OTHER" {
  const n = name.toLowerCase();
  if (n.includes("universit") || n.includes("college") || n.includes("instituto tec"))
    return "UNIVERSITY";
  if (n.includes("chamber") || n.includes("cámara") || n.includes("camara")) return "CHAMBER";
  if (n.includes("ministr") || n.includes("government") || n.includes("gobierno"))
    return "GOVERNMENT";
  if (actor === "Government") return "GOVERNMENT";
  if (actor === "Academia") return "UNIVERSITY";
  if (actor === "Private Sector") return "COMPANY";
  return "OTHER";
}
