// Letters of Intent signed across ACE editions. The JSON is produced
// by scripts/import_lois.py from the program team's source workbooks
// (Córdoba 2025, Belém 2025, Illinois 2025). This is the single
// source of truth for LOI counts shown on the executive page.
//
// To add more editions: drop the new Excel into /data, extend the
// import script with the appropriate column mapping, re-run it. The
// script is idempotent and dedupes by (edition, partyA, partyB,
// countryA, countryB).

import raw from "./_lois.json";

export interface LOI {
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

export const lois: LOI[] = raw as LOI[];

export const loisCount = lois.length;

// Cross-border = the two parties are from different countries. Headline
// number on the executive page comes from this.
export const crossBorderLois = lois.filter(
  l =>
    l.countryA &&
    l.countryB &&
    l.countryA.trim().toLowerCase() !== l.countryB.trim().toLowerCase(),
).length;

// Unique country pairs touched by at least one LOI.
export const uniqueCountryPairs = new Set(
  lois
    .filter(l => l.countryA && l.countryB)
    .map(l => {
      const [a, b] = [l.countryA!.trim(), l.countryB!.trim()].sort();
      return `${a}↔${b}`;
    }),
).size;

// LOI count per edition — useful for the evidence pipeline / per-edition
// breakdowns on the executive page.
export const loisByEdition: Array<{ edition: string; label: string; count: number }> =
  Object.entries(
    lois.reduce<Record<string, { label: string; count: number }>>((acc, l) => {
      const key = l.edition;
      if (!acc[key]) acc[key] = { label: l.editionLabel, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {}),
  )
    .map(([edition, v]) => ({ edition, label: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count);
