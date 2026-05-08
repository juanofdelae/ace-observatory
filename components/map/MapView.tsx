"use client";
import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
  LayersControl,
  LayerGroup,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import type { Coordinates } from "@/types";
import { asset } from "@/lib/asset-path";

// Fix Leaflet's default marker icon paths for Next.js bundler.
// (react-leaflet 4 + Next.js needs explicit icon URLs.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: asset("/leaflet/marker-icon-2x.png"),
  iconUrl: asset("/leaflet/marker-icon.png"),
  shadowUrl: asset("/leaflet/marker-shadow.png"),
});

export interface MapPoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  /** host edition / participant-only / site */
  kind: "host" | "participant" | "site";
  meta?: string;
  radius?: number;
}

interface Props {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  onSelect?: (p: MapPoint) => void;
  selectedId?: string;
  className?: string;
  flyTo?: { center: [number, number]; zoom: number };
}

const COLOR: Record<MapPoint["kind"], string> = {
  host: "#F05A28",
  participant: "#2F80ED",
  site: "#2FB7B2",
};

function FlyToController({ flyTo }: { flyTo?: { center: [number, number]; zoom: number } }) {
  const map = useMap();
  const prev = useRef<string>("");
  useEffect(() => {
    if (!flyTo) return;
    const key = `${flyTo.center[0]}|${flyTo.center[1]}|${flyTo.zoom}`;
    if (key === prev.current) return;
    prev.current = key;
    map.flyTo(flyTo.center, flyTo.zoom, { duration: 0.9 });
  }, [flyTo, map]);
  return null;
}

export default function MapView({
  points,
  center = [15, -75],
  zoom = 3,
  onSelect,
  selectedId,
  className,
  flyTo,
}: Props) {
  return (
    <div className={className} style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
        worldCopyJump
        minZoom={2}
        maxZoom={14}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Light" checked>
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Voyager">
            <TileLayer
              attribution='&copy; CARTO &copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay name="Host cities" checked>
            <LayerGroup>
              {points.filter(p => p.kind === "host").map(p => (
                <PointMarker key={p.id} p={p} onSelect={onSelect} selected={selectedId === p.id} />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Participating countries" checked>
            <LayerGroup>
              {points.filter(p => p.kind === "participant").map(p => (
                <PointMarker key={p.id} p={p} onSelect={onSelect} selected={selectedId === p.id} />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Visited sites" checked>
            <LayerGroup>
              {points.filter(p => p.kind === "site").map(p => (
                <PointMarker key={p.id} p={p} onSelect={onSelect} selected={selectedId === p.id} />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>

        <FlyToController flyTo={flyTo} />
      </MapContainer>
    </div>
  );
}

function PointMarker({
  p,
  onSelect,
  selected,
}: {
  p: MapPoint;
  onSelect?: (p: MapPoint) => void;
  selected: boolean;
}) {
  const baseR = p.radius ?? (p.kind === "host" ? 8 : p.kind === "participant" ? 6 : 5);
  return (
    <CircleMarker
      center={[p.coordinates.lat, p.coordinates.lng]}
      radius={selected ? baseR + 3 : baseR}
      pathOptions={{
        color: selected ? "#0B1F3A" : "#ffffff",
        weight: selected ? 3 : 2,
        fillColor: COLOR[p.kind],
        fillOpacity: 0.9,
      }}
      eventHandlers={{
        click: () => onSelect?.(p),
      }}
    >
      <Tooltip direction="top" offset={[0, -4]}>
        <span style={{ fontWeight: 600 }}>{p.name}</span>
        {p.meta && <div style={{ fontSize: 11, opacity: 0.75 }}>{p.meta}</div>}
      </Tooltip>
    </CircleMarker>
  );
}
