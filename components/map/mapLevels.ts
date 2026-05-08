import type { AtlasSelection } from "@/types";

// Canonical zoom levels per drill step. Tuned so context isn't lost — the
// site-level zoom intentionally stays below 16 so neighborhood streets remain
// visible (per Atlas guideline: "don't zoom so close context is lost").
export const ZOOM_BY_LEVEL: Record<AtlasSelection["level"], number> = {
  global: 3,
  country: 5,
  // The edition level zooms slightly closer than country so the host-city pin
  // cluster reads — but stays wide enough to show the full delegation route.
  edition: 6,
  state: 6,
  city: 11,
  site: 14,
};

// US deserves a slightly wider country zoom because the geography spans
// continental + Alaska + Hawaii + PR.
export const US_COUNTRY_ZOOM = 4;
