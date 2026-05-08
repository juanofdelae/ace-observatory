"use client";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip } from "react-leaflet";
import type { PathOptions, Layer } from "leaflet";
import type { Feature, Geometry } from "geojson";
import Link from "next/link";
import { editions } from "@/data/editions";
import { countryById } from "@/data/countries";
import { cityById } from "@/data/cities";
import { states } from "@/data/states";
import { ATLAS_COLORS } from "./mapStyles";
import { ArrowLeft } from "lucide-react";
import { formatDateRange } from "@/lib/utils";
import { asset } from "@/lib/asset-path";

// Maps internal country IDs (lowercase ISO-2) to the ISO-3 codes used as the
// top-level `id` field of features in `/public/countries.geo.json`.
const HOST_ISO3: Record<string, string> = {
  us: "USA",
  mx: "MEX",
  ca: "CAN",
  ar: "ARG",
  cl: "CHL",
  ec: "ECU",
  pa: "PAN",
  br: "BRA",
};
const HOST_ISO_VALUES = new Set(Object.values(HOST_ISO3));

const HOST_STATE_NAMES = new Set<string>(
  states.filter(s => s.editionIds.length > 0).map(s => s.name),
);

// Special editions held outside the Americas. They render as a separate
// list in the side rail rather than as map markers.
const SPECIAL_EDITIONS = ["ace-9-germany-israel-2018", "ace-19-armenia-2024"];

const HOST_STYLE: PathOptions = {
  color: ATLAS_COLORS.navyDeep,
  weight: 0.6,
  fillColor: ATLAS_COLORS.navyDeep,
  fillOpacity: 0.85,
};

const NEUTRAL_STYLE: PathOptions = {
  color: "#94A3B8",
  weight: 0.3,
  fillColor: "#E2E8F0",
  fillOpacity: 0.5,
};

const HOVER_STYLE: PathOptions = {
  color: ATLAS_COLORS.hostOrange,
  weight: 1.5,
  fillColor: ATLAS_COLORS.hostOrange,
  fillOpacity: 0.9,
};

// Bounding box that frames the Americas (Alaska/Greenland down to Tierra del
// Fuego). Used as both initial fit and a hard cap so users can't pan into
// Europe/Africa where the poster has nothing to show.
const AMERICAS_BOUNDS: [[number, number], [number, number]] = [
  [-56, -170],
  [72, -32],
];

const US_STATE_NAME_TO_ID: Record<string, string> = {
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

export function EditionsPosterMap() {
  const [countriesGeo, setCountriesGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  const [statesGeo, setStatesGeo] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch(asset("/countries.geo.json")).then(r => r.json()).then(setCountriesGeo).catch(() => {});
    fetch(asset("/us-states.geo.json")).then(r => r.json()).then(setStatesGeo).catch(() => {});
  }, []);

  const ordered = useMemo(() => [...editions].sort((a, b) => a.number - b.number), []);
  const americas = ordered.filter(e => !SPECIAL_EDITIONS.includes(e.id));
  const special = ordered.filter(e => SPECIAL_EDITIONS.includes(e.id));

  // One marker per Americas edition, anchored at its primary host city.
  // Editions without a city fall back to nothing (rare — most have at least one).
  const markers = useMemo(
    () =>
      americas
        .map(e => {
          const city = e.cityIds[0] ? cityById(e.cityIds[0]) : undefined;
          return city ? { e, city } : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [americas],
  );

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col gap-2 px-3 md:px-5 py-3">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-ink"
        >
          <ArrowLeft size={12} /> Back to ACE Atlas
        </Link>
        <div className="text-[11px] text-text-muted hidden md:block">
          Click any region, dot or row to open the corresponding edition.
        </div>
      </div>

      {/* Header — compact so the map gets the most room */}
      <header className="text-center shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue">
          Editions atlas · poster view
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight leading-tight mt-0.5">
          A decade of ACE across the Americas
        </h1>
        <p className="text-[11px] text-text-secondary mt-0.5">
          {editions.length} editions · {americas.length} held in the Americas ·{" "}
          {special.length} special editions hosted by OAS Permanent Observers.
        </p>
      </header>

      {/* Main: map + rail. flex-1 + min-h-0 lets both children shrink to fit */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3 min-h-0">
        {/* Map */}
        <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden relative min-h-0">
          <MapContainer
            bounds={AMERICAS_BOUNDS}
            maxBounds={AMERICAS_BOUNDS}
            maxBoundsViscosity={1}
            minZoom={2}
            maxZoom={6}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            zoomControl={false}
            attributionControl={false}
            style={{ height: "100%", width: "100%", background: "#F8FAFC" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              subdomains={["a", "b", "c", "d"]}
            />

            {countriesGeo && (
              <GeoJSON
                data={countriesGeo}
                style={(f?: Feature<Geometry>) => {
                  const iso = (f?.id as string | undefined) ?? "";
                  return HOST_ISO_VALUES.has(iso) ? HOST_STYLE : NEUTRAL_STYLE;
                }}
                onEachFeature={(feature, layer) => {
                  const iso = (feature.id as string | undefined) ?? "";
                  if (!HOST_ISO_VALUES.has(iso)) return;
                  const countryId = Object.entries(HOST_ISO3).find(([, v]) => v === iso)?.[0];
                  if (!countryId) return;
                  const eds = editions.filter(
                    e => e.countryId === countryId && !SPECIAL_EDITIONS.includes(e.id),
                  );
                  if (eds.length === 0) return;

                  const name = (feature.properties as { name?: string } | undefined)?.name ?? "";
                  layer.bindTooltip(
                    `<strong>${name}</strong><br/>` +
                      eds.map(e => `ACE ${e.number} — ${new Date(e.startDate).getFullYear()}`).join("<br/>"),
                    { sticky: true, direction: "top", className: "ace-country-tooltip" },
                  );

                  layer.on({
                    mouseover: ev => {
                      const l = ev.target as Layer & { setStyle?: (s: PathOptions) => void };
                      l.setStyle?.(HOVER_STYLE);
                    },
                    mouseout: ev => {
                      const l = ev.target as Layer & { setStyle?: (s: PathOptions) => void };
                      l.setStyle?.(HOST_STYLE);
                    },
                    click: () => {
                      if (eds.length === 1) {
                        window.location.href = asset(`/editions/${eds[0].id}`);
                      }
                    },
                  });
                }}
              />
            )}

            {statesGeo && (
              <GeoJSON
                data={statesGeo}
                style={(f?: Feature<Geometry>) => {
                  const name = (f?.properties as { name?: string } | undefined)?.name ?? "";
                  return HOST_STATE_NAMES.has(name)
                    ? HOST_STYLE
                    : { ...NEUTRAL_STYLE, fillOpacity: 0 };
                }}
                onEachFeature={(feature, layer) => {
                  const name = (feature.properties as { name?: string } | undefined)?.name ?? "";
                  if (!HOST_STATE_NAMES.has(name)) return;
                  const stateId = US_STATE_NAME_TO_ID[name];
                  const stateEds = editions.filter(e => e.stateId === stateId);
                  if (stateEds.length === 0) return;

                  layer.bindTooltip(
                    `<strong>${name}, US</strong><br/>` +
                      stateEds.map(e => `ACE ${e.number} — ${new Date(e.startDate).getFullYear()}`).join("<br/>"),
                    { sticky: true, direction: "top", className: "ace-country-tooltip" },
                  );

                  layer.on({
                    mouseover: ev => {
                      const l = ev.target as Layer & { setStyle?: (s: PathOptions) => void };
                      l.setStyle?.(HOVER_STYLE);
                    },
                    mouseout: ev => {
                      const l = ev.target as Layer & { setStyle?: (s: PathOptions) => void };
                      l.setStyle?.(HOST_STYLE);
                    },
                    click: () => {
                      if (stateEds.length === 1) {
                        window.location.href = asset(`/editions/${stateEds[0].id}`);
                      }
                    },
                  });
                }}
              />
            )}

            {/* Numbered edition dots — one per Americas edition */}
            {markers.map(({ e, city }) => (
              <CircleMarker
                key={e.id}
                center={[city.coordinates.lat, city.coordinates.lng]}
                radius={9}
                pathOptions={{
                  color: "#FFFFFF",
                  weight: 2,
                  fillColor: ATLAS_COLORS.hostOrange,
                  fillOpacity: 1,
                }}
                eventHandlers={{
                  click: () => {
                    window.location.href = asset(`/editions/${e.id}`);
                  },
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -6]}
                  className="ace-edition-tooltip"
                >
                  <strong>ACE {e.number}</strong> — {city.name}
                  <br />
                  <span style={{ fontSize: 10, color: "#64748B" }}>
                    {formatDateRange(e.startDate, e.endDate)}
                  </span>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Side rail — compact rows, internal scroll only if needed */}
        <aside className="flex flex-col gap-2.5 min-h-0 overflow-y-auto thin-scroll pr-1">
          <div>
            <SectionTitle>Editions in the Americas</SectionTitle>
            <ul className="mt-1.5 space-y-0.5">
              {americas.map(e => (
                <EditionRow key={e.id} e={e} />
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-surface-border">
            <SectionTitle>Special editions</SectionTitle>
            <p className="text-[10px] text-text-muted mt-0.5 mb-1.5">
              Hosted by OAS Permanent Observer countries.
            </p>
            <ul className="space-y-0.5">
              {special.map(e => (
                <EditionRow key={e.id} e={e} />
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
      {children}
    </div>
  );
}

function EditionRow({ e }: { e: (typeof editions)[number] }) {
  const country = countryById(e.countryId);
  const mainCity = e.cityIds[0] ? cityById(e.cityIds[0]) : undefined;
  return (
    <li>
      <Link
        href={`/editions/${e.id}`}
        className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-subtle"
      >
        <span className="w-6 h-6 rounded bg-ink text-white font-bold text-[10px] flex items-center justify-center shrink-0 tabular-nums">
          {e.number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold text-ink truncate group-hover:text-accent-blue leading-tight">
            {mainCity?.name ?? e.name}
          </div>
          <div className="text-[10px] text-text-muted truncate leading-tight">
            {country?.name} · {formatDateRange(e.startDate, e.endDate)}
          </div>
        </div>
      </Link>
    </li>
  );
}
