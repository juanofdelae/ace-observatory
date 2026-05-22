import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * The shape `data/_lois.json` already has, mirrored from `data/lois.ts`'s
 * `LOI` interface. The public Observatory build reads this file at build
 * time. Our exporter must write objects that match this contract exactly —
 * any drift breaks the public site.
 */
export interface LoiRecord {
  edition: string;
  editionLabel: string;
  kind: "delegates" | "academia";
  partyA: string;
  countryA: string | null;
  partyB: string;
  countryB: string | null;
  purpose: string | null;
  delegate: string | null;
}

const COUNTRY_NAMES: Record<string, string> = {
  ar: "Argentina",
  am: "Armenia",
  bb: "Barbados",
  bo: "Bolivia",
  br: "Brazil",
  bs: "The Bahamas",
  bz: "Belize",
  ca: "Canada",
  cl: "Chile",
  co: "Colombia",
  cr: "Costa Rica",
  de: "Germany",
  dm: "Dominica",
  do: "Dominican Republic",
  ec: "Ecuador",
  es: "Spain",
  gt: "Guatemala",
  gy: "Guyana",
  hn: "Honduras",
  ht: "Haiti",
  jm: "Jamaica",
  kn: "St. Kitts & Nevis",
  lc: "Saint Lucia",
  mx: "Mexico",
  no: "Norway",
  pa: "Panama",
  pe: "Peru",
  py: "Paraguay",
  sa: "Saudi Arabia",
  sr: "Suriname",
  sv: "El Salvador",
  tt: "Trinidad & Tobago",
  uy: "Uruguay",
  us: "United States",
};

function countryLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return COUNTRY_NAMES[id] ?? id.toUpperCase();
}

/**
 * Read every non-deleted Agreement from the database and project into the
 * `_lois.json` shape. Deterministic ordering (edition asc, partyA asc, partyB
 * asc) keeps diffs small and reviewable in pull requests.
 */
export async function exportLois(): Promise<LoiRecord[]> {
  const rows = await prisma.agreement.findMany({
    where: { deletedAt: null },
    orderBy: [
      { editionId: "asc" },
      { partyA: { name: "asc" } },
      { partyB: { name: "asc" } },
    ],
    include: {
      edition: { select: { id: true, name: true, year: true } },
      partyA: { select: { name: true, countryId: true } },
      partyB: { select: { name: true, countryId: true } },
    },
  });

  return rows.map((row) => {
    // editionLabel mirrors what the Observatory UI displays — short form,
    // e.g. "ACE 22 · Córdoba". We strip the leading "ACE N — " prefix and
    // re-format from the registry name.
    const shortName = row.edition.name.replace(/^ACE [\dIVX]+\s*[—-]\s*/, "");
    const editionLabel = `ACE ${row.edition.id.match(/ace-(\d+)-/)?.[1] ?? ""} · ${shortName}`;

    const kind: LoiRecord["kind"] = row.tags.includes("academia") ? "academia" : "delegates";

    return {
      edition: row.editionId,
      editionLabel,
      kind,
      partyA: row.partyA.name,
      countryA: countryLabel(row.partyA.countryId),
      partyB: row.partyB.name,
      countryB: countryLabel(row.partyB.countryId),
      purpose: row.subject || null,
      delegate: row.delegate,
    };
  });
}
