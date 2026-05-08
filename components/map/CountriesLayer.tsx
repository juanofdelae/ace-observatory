"use client";
import { GeoJSON } from "react-leaflet";
import type { Feature, Geometry } from "geojson";
import type { PathOptions, Layer } from "leaflet";
import { countries } from "@/data/countries";
import { useEffect, useState } from "react";
import {
  COUNTRY_HOVER,
  COUNTRY_RESTING_HOST,
  COUNTRY_RESTING_PARTICIPANT,
  HIDDEN_POLYGON,
  POLYGON_OPACITY,
  selectedPolygonStyle,
  type DrillLevelKey,
} from "./mapStyles";

/**
 * World country polygons. Resting state is intentionally desaturated so the
 * basemap remains the dominant visual; selection lights the country up in
 * the brand blue at the per-level opacity (Country 0.10, City 0.03 etc.).
 *
 * GeoJSON `feature.id` is an ISO-3 code → matched to Country.isoCode.
 */

interface Props {
  selectedIsoCode?: string;
  onSelectCountry: (isoCode: string) => void;
  onHoverCountry?: (isoCode: string | undefined) => void;
  /** Selection drill level — drives the selected fill opacity per spec. */
  level?: DrillLevelKey;
  /** ISO-3 codes to render fully transparent (used when an inner layer like
   *  US states is overlaid). */
  suppressIsoCodes?: string[];
}

const DEFAULT_STYLE: PathOptions = {
  color: "#E2E8F0",
  weight: 0.4,
  fillColor: "transparent",
  fillOpacity: 0,
};

function styleFor(
  isoCode: string,
  selected: boolean,
  hovered: boolean,
  level: DrillLevelKey,
): PathOptions {
  const c = countries.find(x => x.isoCode === isoCode);
  if (selected) {
    // For inner drill levels (state/city/site) we draw the country polygon
    // very faint so it stays as background context but never dominates.
    const lvlForFill: DrillLevelKey =
      level === "state" || level === "city" || level === "site" ? level : "country";
    return selectedPolygonStyle(lvlForFill);
  }
  if (hovered && c) return COUNTRY_HOVER;
  if (c?.hasHostedEdition) return COUNTRY_RESTING_HOST;
  if (c) return COUNTRY_RESTING_PARTICIPANT;
  return DEFAULT_STYLE;
}

export function CountriesLayer({
  selectedIsoCode,
  onSelectCountry,
  onHoverCountry,
  level = "global",
  suppressIsoCodes,
}: Props) {
  const suppressed = new Set(suppressIsoCodes ?? []);
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/countries.geo.json")
      .then(r => r.json())
      .then(setGeo)
      .catch(() => setGeo(null));
  }, []);

  if (!geo) return null;

  // Re-mount when selection / suppression / level changes so styles refresh.
  const key = `${selectedIsoCode ?? "none"}|${level}|${[...suppressed].sort().join(",")}|${POLYGON_OPACITY[level]}`;

  return (
    <GeoJSON
      key={key}
      data={geo}
      style={(f?: Feature<Geometry>) => {
        const iso = (f?.id as string) ?? "";
        if (suppressed.has(iso)) return HIDDEN_POLYGON;
        return styleFor(iso, iso === selectedIsoCode, false, level);
      }}
      onEachFeature={(feature, layer) => {
        const iso = feature.id as string;
        const name = (feature.properties as { name?: string })?.name ?? iso;
        const known = countries.some(c => c.isoCode === iso);

        if (suppressed.has(iso)) return;

        layer.bindTooltip(name, {
          sticky: true,
          direction: "top",
          offset: [0, -4],
          className: "ace-country-tooltip",
        });

        layer.on({
          mouseover: (e) => {
            const l = e.target as Layer & { setStyle?: (s: PathOptions) => void };
            if (iso !== selectedIsoCode && known && l.setStyle) {
              l.setStyle({ ...styleFor(iso, false, true, level) });
            }
            onHoverCountry?.(iso);
          },
          mouseout: (e) => {
            const l = e.target as Layer & { setStyle?: (s: PathOptions) => void };
            if (iso !== selectedIsoCode && l.setStyle) {
              l.setStyle({ ...styleFor(iso, false, false, level) });
            }
            onHoverCountry?.(undefined);
          },
          click: () => {
            // Clicking ANY country polygon counts: known countries select
            // them; non-ACE countries (or the catch-all click handler at the
            // map level — see AtlasMap) clear the selection. The clear is
            // dispatched by passing an empty string so the parent can route.
            if (known) onSelectCountry(iso);
            else onSelectCountry("");
          },
        });
      }}
    />
  );
}
