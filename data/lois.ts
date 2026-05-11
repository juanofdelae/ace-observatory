// Letters of Intent signed at ACE editions — currently sourced from
// the two Córdoba 2025 source workbooks (Delegates + Academia). The
// JSON is produced by scripts/import_cordoba_lois.py and is the
// single source of truth for executive-page LOI counts.
//
// When LOIs from earlier editions are consolidated, extend the import
// script to merge them into _cordoba-lois.json (or rename the JSON if
// the scope grows beyond Córdoba).

import raw from "./_cordoba-lois.json";

export interface LOI {
  kind: "delegates" | "academia";
  edition: string;
  number: number;
  partyA: string;
  countryA: string | null;
  partyB: string;
  countryB: string | null;
  detail: string | null;
  delegate: string | null;
}

export const lois: LOI[] = raw as LOI[];

export const loisCount = lois.length;

// Cross-border = the two parties are from different countries. The
// 87% headline number on the executive page comes from this.
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
