"use client";
import { GeoJSON } from "react-leaflet";
import type { Feature, Geometry } from "geojson";
import type { PathOptions, Layer } from "leaflet";
import { states } from "@/data/states";
import { useEffect, useState } from "react";
import {
  COUNTRY_HOVER,
  COUNTRY_RESTING_HOST,
  COUNTRY_RESTING_PARTICIPANT,
  selectedPolygonStyle,
  type DrillLevelKey,
} from "./mapStyles";

interface Props {
  selectedStateId?: string;
  onSelectState: (stateId: string) => void;
  /** Drives selected-fill opacity (state 0.08, city 0.03, site hidden). */
  level?: DrillLevelKey;
}

// Mirrors GeoJSON `properties.name` → state id used in /data/states.ts.
const NAME_TO_ID: Record<string, string> = {
  Alabama: "us-al", Alaska: "us-ak", Arizona: "us-az", Arkansas: "us-ar",
  California: "us-ca", Colorado: "us-co", Connecticut: "us-ct", Delaware: "us-de",
  "District of Columbia": "us-dc", Florida: "us-fl", Georgia: "us-ga", Hawaii: "us-hi",
  Idaho: "us-id", Illinois: "us-il", Indiana: "us-in", Iowa: "us-ia",
  Kansas: "us-ks", Kentucky: "us-ky", Louisiana: "us-la", Maine: "us-me",
  Maryland: "us-md", Massachusetts: "us-ma", Michigan: "us-mi", Minnesota: "us-mn",
  Mississippi: "us-ms", Missouri: "us-mo", Montana: "us-mt", Nebraska: "us-ne",
  Nevada: "us-nv", "New Hampshire": "us-nh", "New Jersey": "us-nj", "New Mexico": "us-nm",
  "New York": "us-ny", "North Carolina": "us-nc", "North Dakota": "us-nd", Ohio: "us-oh",
  Oklahoma: "us-ok", Oregon: "us-or", Pennsylvania: "us-pa", "Puerto Rico": "us-pr",
  "Rhode Island": "us-ri", "South Carolina": "us-sc", "South Dakota": "us-sd", Tennessee: "us-tn",
  Texas: "us-tx", Utah: "us-ut", Vermont: "us-vt", Virginia: "us-va",
  Washington: "us-wa", "West Virginia": "us-wv", Wisconsin: "us-wi", Wyoming: "us-wy",
};

function styleFor(
  stateId: string | undefined,
  selected: boolean,
  hovered: boolean,
  level: DrillLevelKey,
): PathOptions {
  if (selected) {
    const lvl: DrillLevelKey = level === "city" || level === "site" ? level : "state";
    return selectedPolygonStyle(lvl);
  }
  if (hovered) return COUNTRY_HOVER;
  if (!stateId) return COUNTRY_RESTING_PARTICIPANT;
  const st = states.find(s => s.id === stateId);
  return st && st.editionIds.length > 0 ? COUNTRY_RESTING_HOST : COUNTRY_RESTING_PARTICIPANT;
}

export function StatesLayer({ selectedStateId, onSelectState, level = "state" }: Props) {
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/us-states.geo.json")
      .then(r => r.json())
      .then(setGeo)
      .catch(() => setGeo(null));
  }, []);

  if (!geo) return null;

  const key = `states-${selectedStateId ?? "none"}-${level}`;

  return (
    <GeoJSON
      key={key}
      data={geo}
      style={(f?: Feature<Geometry>) => {
        const name = (f?.properties as { name?: string })?.name ?? "";
        const stateId = NAME_TO_ID[name];
        return styleFor(stateId, stateId === selectedStateId, false, level);
      }}
      onEachFeature={(feature, layer) => {
        const name = (feature.properties as { name?: string })?.name ?? "";
        const stateId = NAME_TO_ID[name];

        layer.bindTooltip(name, {
          sticky: true,
          direction: "top",
          offset: [0, -4],
          className: "ace-country-tooltip",
        });

        layer.on({
          mouseover: (e) => {
            const l = e.target as Layer & { setStyle?: (s: PathOptions) => void };
            if (stateId !== selectedStateId && l.setStyle) {
              l.setStyle({ ...styleFor(stateId, false, true, level) });
            }
          },
          mouseout: (e) => {
            const l = e.target as Layer & { setStyle?: (s: PathOptions) => void };
            if (stateId !== selectedStateId && l.setStyle) {
              l.setStyle({ ...styleFor(stateId, false, false, level) });
            }
          },
          click: () => {
            if (stateId) onSelectState(stateId);
          },
        });
      }}
    />
  );
}
