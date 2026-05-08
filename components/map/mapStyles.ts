import type { PathOptions } from "leaflet";

// ACE Atlas color tokens — kept here so the map components import a single
// palette source and stay aligned with Tailwind tokens (which mirror these).
export const ATLAS_COLORS = {
  navyDeep: "#0B1F3A",
  primaryBlue: "#2563EB",
  hostOrange: "#F97316",
  siteTeal: "#14B8A6",
  universityPurple: "#7C3AED",
  govNavy: "#0B1F3A",
  infraAmber: "#F59E0B",
  researchCyan: "#0891B2",
  border: "#E2E8F0",
  textNeutral: "#334155",
  textMuted: "#64748B",
  // Selected polygon fill — spec calls for rgba(37,99,235,0.10).
  selectedFill: "#2563EB",
} as const;

// Per-drill-level polygon opacity. Lower numbers = more transparent fill so
// the basemap and markers stay readable.
export const POLYGON_OPACITY = {
  global: 0.15,
  country: 0.10,
  edition: 0.10,
  state: 0.08,
  city: 0.03,
  site: 0,
} as const;

export type DrillLevelKey = keyof typeof POLYGON_OPACITY;

// Country polygon styles — soft monochrome resting state, blue highlight on
// hover/selection. Stroke is intentionally thin so the basemap labels read.
export const COUNTRY_RESTING_HOST: PathOptions = {
  color: "#94A3B8",
  weight: 0.5,
  fillColor: "#94A3B8",
  fillOpacity: 0.18,
};

export const COUNTRY_RESTING_PARTICIPANT: PathOptions = {
  color: "#CBD5E1",
  weight: 0.4,
  fillColor: "#CBD5E1",
  fillOpacity: 0.14,
};

export const COUNTRY_HOVER: PathOptions = {
  color: ATLAS_COLORS.primaryBlue,
  weight: 1.2,
  fillColor: ATLAS_COLORS.primaryBlue,
  fillOpacity: 0.18,
};

// Selected fills follow the per-level opacity table. Stroke stays the same
// across levels so the active border is consistent.
export function selectedPolygonStyle(level: DrillLevelKey): PathOptions {
  return {
    color: ATLAS_COLORS.primaryBlue,
    weight: 2,
    fillColor: ATLAS_COLORS.primaryBlue,
    fillOpacity: POLYGON_OPACITY[level],
  };
}

export const HIDDEN_POLYGON: PathOptions = {
  color: "transparent",
  weight: 0,
  fillColor: "transparent",
  fillOpacity: 0,
};
