"use client";
import { MapContainer, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { CountriesLayer } from "./CountriesLayer";
import { StatesLayer } from "./StatesLayer";
import { SiteMarker } from "./SiteMarker";
import type { InstitutionType } from "@/types";
import type { Coordinates } from "@/types";
import type { DrillLevelKey } from "./mapStyles";
import { asset } from "@/lib/asset-path";

// Leaflet's default marker iconUrl resolution breaks under Next.js' bundler.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: asset("/leaflet/marker-icon-2x.png"),
  iconUrl: asset("/leaflet/marker-icon.png"),
  shadowUrl: asset("/leaflet/marker-shadow.png"),
});

export type AtlasMarkerKind = "host-city" | "site" | "state" | "edition";

export interface AtlasMarker {
  id: string;
  name: string;
  coordinates: Coordinates;
  kind: AtlasMarkerKind;
  /** Required when kind === "site" — drives icon + color via siteTypeConfig. */
  siteType?: InstitutionType;
  /** Required when kind === "state" — rendered as the badge label (e.g. "CA"). */
  stateAbbr?: string;
  /** Required when kind === "edition" — rendered as the pin number (e.g. 4, 22). */
  editionNumber?: number;
  meta?: string;
}

/**
 * Catches clicks that hit the basemap directly (ocean, blank land outside
 * any GeoJSON polygon, anywhere off a marker). Polygon and marker click
 * handlers stop propagation, so this only fires on "background" clicks.
 *
 * The user expects:
 *   - clicking ocean / non-ACE area → reset selection to global
 *   - clicking inside the active country/city polygon → keep context
 *
 * We don't reset when level === "global" (already there) and we don't reset
 * when the click is plausibly inside the active country/state polygon —
 * the polygon itself swallows those clicks before this handler runs.
 */
function MapClickClear({ onClearOutside }: { onClearOutside?: () => void }) {
  useMapEvents({
    click: () => {
      onClearOutside?.();
    },
  });
  return null;
}

function FlyToController({
  flyTo,
  recenterTick,
}: {
  flyTo?: { center: [number, number]; zoom: number };
  /** Counter that bumps on every "Recenter" click. Lets the user re-fly
   *  to the SAME selection (e.g. after they panned the map manually) —
   *  without it, value-based dedupe would swallow the second click. */
  recenterTick?: number;
}) {
  const map = useMap();
  const prev = useRef<string>("");
  useEffect(() => {
    if (!flyTo) return;
    const key = `${flyTo.center[0]}|${flyTo.center[1]}|${flyTo.zoom}|${recenterTick ?? 0}`;
    if (key === prev.current) return;
    prev.current = key;
    map.flyTo(flyTo.center, flyTo.zoom, { duration: 1.1 });
  }, [flyTo, map, recenterTick]);
  return null;
}

/**
 * Leaflet's tile grid breaks when the parent flex box hasn't been measured
 * before MapContainer mounts. A single invalidateSize is not enough — late
 * font/image loads and panel toggles still shift the layout. We retry on a
 * schedule AND watch the container with ResizeObserver.
 */
function SizeFix() {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize({ animate: false });
    const timers = [50, 200, 500, 1000, 2000].map(ms => setTimeout(invalidate, ms));

    const container = map.getContainer();
    const ro = new ResizeObserver(() => invalidate());
    ro.observe(container);

    window.addEventListener("resize", invalidate);

    return () => {
      timers.forEach(clearTimeout);
      ro.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);
  return null;
}

/** A delegation arc — one curve per home country participating in an
 *  edition. The thicker the line, the more delegates from that country. */
export interface ConnectionPath {
  /** Sampled curve points [lat, lng]. Pre-computed by the caller so the
   *  same arc geometry is shared across renders. */
  points: [number, number][];
  /** Number of participants from the source country — drives line weight. */
  weight: number;
}

interface Props {
  markers: AtlasMarker[];
  selectedMarkerId?: string;
  selectedIsoCode?: string;
  onSelectCountry: (iso: string) => void;
  onSelectMarker?: (m: AtlasMarker) => void;
  flyTo?: { center: [number, number]; zoom: number };
  center?: [number, number];
  zoom?: number;
  /** When true the US states layer overlays the country polygons. */
  showUsStates?: boolean;
  selectedStateId?: string;
  onSelectState?: (stateId: string) => void;
  /** Drill level — controls polygon opacity per spec. */
  level?: DrillLevelKey;
  /** Optional delegation arcs (host city → each represented country).
   *  Rendered when an edition is selected to show the network spatially. */
  connectionPaths?: ConnectionPath[];
  /** Bumps on every Recenter button click — re-flies to current selection
   *  even when the value-based dedupe key would otherwise suppress it. */
  recenterTick?: number;
  /** Called when the user clicks the basemap (no marker / no polygon under
   *  cursor). Useful for "click outside to clear" UX. */
  onClearOutside?: () => void;
}

export default function AtlasMap({
  markers,
  selectedMarkerId,
  selectedIsoCode,
  onSelectCountry,
  onSelectMarker,
  flyTo,
  center = [10, -75],
  zoom = 3,
  showUsStates,
  selectedStateId,
  connectionPaths,
  recenterTick,
  onSelectState,
  level = "global",
  onClearOutside,
}: Props) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      worldCopyJump
      minZoom={2}
      maxZoom={16}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
      />

      <CountriesLayer
        selectedIsoCode={selectedIsoCode}
        onSelectCountry={onSelectCountry}
        suppressIsoCodes={showUsStates ? ["USA"] : undefined}
        level={level}
      />

      {showUsStates && onSelectState && (
        <StatesLayer
          selectedStateId={selectedStateId}
          onSelectState={onSelectState}
          level={level}
        />
      )}

      {/* Delegation arcs — rendered BELOW the markers so pins stay on top.
          Line weight scales with the number of delegates from each home
          country, opacity is fixed for institutional-grade calm. */}
      {connectionPaths?.map((p, i) => (
        <Polyline
          key={`arc-${i}`}
          positions={p.points}
          pathOptions={{
            color: "#F97316",
            weight: Math.min(3, 0.8 + Math.log2(p.weight + 1)),
            opacity: 0.55,
            lineCap: "round",
            lineJoin: "round",
          }}
          interactive={false}
        />
      ))}

      {markers.map(m => (
        <SiteMarker
          key={m.id}
          id={m.id}
          name={m.name}
          coordinates={m.coordinates}
          type={m.kind === "site" ? m.siteType : undefined}
          stateAbbr={m.kind === "state" ? m.stateAbbr : undefined}
          editionNumber={m.kind === "edition" ? m.editionNumber : undefined}
          meta={m.meta}
          selected={m.id === selectedMarkerId}
          onSelect={() => onSelectMarker?.(m)}
        />
      ))}

      <FlyToController flyTo={flyTo} recenterTick={recenterTick} />
      <SizeFix />
      <MapClickClear onClearOutside={onClearOutside} />
    </MapContainer>
  );
}
