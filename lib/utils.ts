import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatDateRange(start: string, end: string): string {
  // YYYY-MM-DD strings parse to UTC midnight, so we must format in UTC too —
  // otherwise SSR (UTC) and the client (local TZ) produce different day
  // labels and React throws a hydration mismatch.
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  const optDayMonth: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC" };
  const optFull: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  if (sameMonth) {
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}–${e.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" })}, ${e.getUTCFullYear()}`;
  }
  if (sameYear) {
    return `${s.toLocaleDateString("en-US", optDayMonth)} – ${e.toLocaleDateString("en-US", optFull)}`;
  }
  return `${s.toLocaleDateString("en-US", optFull)} – ${e.toLocaleDateString("en-US", optFull)}`;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function groupBy<T, K extends string | number>(arr: T[], key: (item: T) => K): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Canonical country-name table — used to dedupe country strings that
// arrive from heterogeneous sources (QuestionPro free-text, CSV
// exports, etc.). Keys are accent-stripped and lowercased; values are
// the canonical display form. Add new aliases here when they show up
// duplicated in any country chart.
const COUNTRY_CANONICAL: Record<string, string> = {
  "united states": "United States",
  "united states of america": "United States",
  "usa": "United States",
  "u.s.a.": "United States",
  "u.s.": "United States",
  "us": "United States",
  "estados unidos": "United States",
  "brazil": "Brazil",
  "brasil": "Brazil",
  "mexico": "Mexico",
  "méxico": "Mexico",
  "panama": "Panama",
  "panamá": "Panama",
  "canada": "Canada",
  "canadá": "Canada",
  "uruguay": "Uruguay",
  "ecuador": "Ecuador",
  "argentina": "Argentina",
  "guatemala": "Guatemala",
  "jamaica": "Jamaica",
  "colombia": "Colombia",
  "saudi arabia": "Saudi Arabia",
  "costa rica": "Costa Rica",
  "dominican republic": "Dominican Republic",
  "república dominicana": "Dominican Republic",
  "republica dominicana": "Dominican Republic",
  "trinidad and tobago": "Trinidad and Tobago",
  "trinidad & tobago": "Trinidad and Tobago",
  "germany": "Germany",
  "alemania": "Germany",
  "israel": "Israel",
  "armenia": "Armenia",
  "barbados": "Barbados",
};

export function canonicalCountry(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  const key = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return COUNTRY_CANONICAL[key] ?? trimmed;
}

// Aggregate `{ country, count }` rows by canonical name.
export function dedupeCountryDist<T extends { country: string; count: number }>(
  rows: readonly T[],
): Array<{ country: string; count: number }> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const c = canonicalCountry(r.country);
    if (!c) continue;
    map.set(c, (map.get(c) ?? 0) + r.count);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({ country, count }));
}

// Per-edition display overrides used wherever the edition's regional label
// is shown. Some `editions.ts` names list every host city/region, which is
// accurate but reads awkwardly in compact UI ("Quito & Guayaquil" → simpler
// "Ecuador"; "US Midwest" → user-preferred "Minneapolis"). Add to this map
// when the formal name in editions.ts shouldn't drive UI copy.
const EDITION_REGION_OVERRIDES: Record<string, string> = {
  "ace-3-midwest-2015": "Minneapolis",
  "ace-6-ontario-2016": "Canada",
  "ace-12-chile-2019": "Chile",
  "ace-15-ecuador-2022": "Ecuador",
  "ace-19-armenia-2024": "Armenia",
};

interface EditionLike {
  id: string;
  name: string;
}

// Returns the regional label for an edition — the part after " — " in
// `editions.ts`, or an override when one exists. Used everywhere the UI
// would otherwise print the full "ACE I — US Southeast" string.
export function editionRegion(e: EditionLike): string {
  return EDITION_REGION_OVERRIDES[e.id] ?? e.name.split(" — ")[1]?.trim() ?? e.name;
}

// Convenience: "ACE {region}" — the short title used on cards, list rows,
// and the poster map.
export function editionTitle(e: EditionLike): string {
  return `ACE ${editionRegion(e)}`;
}
