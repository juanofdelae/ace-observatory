"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { editions } from "@/data/editions";
import { countryById } from "@/data/countries";
import { cityById } from "@/data/cities";
import { states as statesData } from "@/data/states";
import { ATLAS_COLORS } from "./mapStyles";
import { formatDateRange, editionRegion } from "@/lib/utils";

// --- Projection -----------------------------------------------------------
// Web Mercator projected into a fixed viewBox. Mercator preserves country
// shapes (good for a poster) but inflates polar regions; clipping the
// north bound at 72° keeps Greenland from dominating.

type LatLng = { lat: number; lng: number };
type Bounds = { west: number; east: number; north: number; south: number };

const BOUNDS: Bounds = { west: -168, east: -34, north: 72, south: -56 };

function mercatorY(latDeg: number): number {
  // Standard mercator y in "degrees" units (so it stays comparable to lng).
  const phi = (latDeg * Math.PI) / 180;
  return (Math.log(Math.tan(Math.PI / 4 + phi / 2)) * 180) / Math.PI;
}

const Y_TOP = mercatorY(BOUNDS.north);
const Y_BOT = mercatorY(BOUNDS.south);
const X_RANGE = BOUNDS.east - BOUNDS.west;
const Y_RANGE = Y_TOP - Y_BOT;

// Map area + dedicated label gutters on each side AND top/bottom strips.
// TOP_INSET hosts a band of labels above the map; BOTTOM_INSET reserves
// room for the Special Editions card stack at the bottom-right.
const MAP_W = 1000;
const SIDE_MARGIN = 200;
const TOP_INSET = 110;
const BOTTOM_INSET = 230;
const MAP_H = Math.round((MAP_W * Y_RANGE) / X_RANGE);
const VB_W = MAP_W + 2 * SIDE_MARGIN;
const VB_H = TOP_INSET + MAP_H + BOTTOM_INSET;

function project(lng: number, lat: number): [number, number] {
  const x = SIDE_MARGIN + ((lng - BOUNDS.west) / X_RANGE) * MAP_W;
  const y = TOP_INSET + ((Y_TOP - mercatorY(lat)) / Y_RANGE) * MAP_H;
  return [x, y];
}

// Convert a GeoJSON Polygon/MultiPolygon to a single SVG `d` string. We
// truncate to 1 decimal — the viewBox is large enough that sub-pixel
// detail isn't visible, and shorter paths render faster.
type Ring = number[][];
type Polygon = Ring[];

function ringToPath(ring: Ring): string {
  let out = "";
  for (let i = 0; i < ring.length; i++) {
    const [lng, lat] = ring[i];
    const [x, y] = project(lng, lat);
    out += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return out + "Z";
}

function geomToPath(geom: GeoJSON.Geometry): string {
  if (geom.type === "Polygon") {
    return (geom.coordinates as Polygon).map(ringToPath).join(" ");
  }
  if (geom.type === "MultiPolygon") {
    return (geom.coordinates as Polygon[])
      .map(poly => poly.map(ringToPath).join(" "))
      .join(" ");
  }
  return "";
}

// Project a country geometry into a small bounding rect — used for the
// Special Editions inset to draw Germany/Israel/Armenia at thumbnail scale.
function projectToRect(
  geom: GeoJSON.Geometry,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number,
): string {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  function visit(c: unknown): void {
    if (Array.isArray(c) && typeof c[0] === "number" && typeof c[1] === "number") {
      const lng = c[0] as number;
      const lat = c[1] as number;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      return;
    }
    if (Array.isArray(c)) for (const x of c) visit(x);
  }
  if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
    visit(geom.coordinates);
  }

  const lngSpan = maxLng - minLng || 1;
  const latSpan = maxLat - minLat || 1;
  const scale = Math.min(rectW / lngSpan, rectH / latSpan);
  const drawnW = lngSpan * scale;
  const drawnH = latSpan * scale;
  const offsetX = rectX + (rectW - drawnW) / 2;
  const offsetY = rectY + (rectH - drawnH) / 2;

  function p(lng: number, lat: number): [number, number] {
    return [offsetX + (lng - minLng) * scale, offsetY + (maxLat - lat) * scale];
  }
  function ringPath(ring: Ring): string {
    let s = "";
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = p(ring[i][0], ring[i][1]);
      s += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return s + "Z";
  }

  if (geom.type === "Polygon") {
    return (geom.coordinates as Polygon).map(ringPath).join(" ");
  }
  if (geom.type === "MultiPolygon") {
    return (geom.coordinates as Polygon[]).map(poly => poly.map(ringPath).join(" ")).join(" ");
  }
  return "";
}

// --- Hosts -----------------------------------------------------------------

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
  statesData.filter(s => s.editionIds.length > 0).map(s => s.name),
);

// Limits the country path-render to features in (or near) the Americas
// viewport. The world geojson has ~250 features; rendering all of them
// pollutes the DOM and the bounding box clips them anyway.
const AMERICAS_ISO3 = new Set([
  "USA", "MEX", "CAN", "GRL", "BLZ", "CRI", "CUB", "DOM", "SLV", "GTM",
  "HTI", "HND", "JAM", "NIC", "PAN", "BHS", "BRB", "TTO", "PRI",
  "ARG", "BOL", "BRA", "CHL", "COL", "ECU", "GUY", "PRY", "PER", "SUR",
  "URY", "VEN", "FLK", "GUF",
]);

const SPECIAL_EDITIONS = ["ace-9-germany-israel-2018", "ace-19-armenia-2024"];

// Per-edition label side. "top" routes to a horizontal band above the map
// (frees up the right gutter, which would otherwise crowd 12+ labels).
// Pacific/West-coast hosts go LEFT; Atlantic/East-coast goes RIGHT.
type LabelSide = "left" | "right" | "top";
const LABEL_SIDE: Record<string, LabelSide> = {
  "ace-2-mexico-2014": "left",
  "ace-5-arizona-california-2016": "left",
  "ace-7-texas-2017": "left",
  "ace-10-northern-california-2018": "left",
  "ace-12-chile-2019": "left",
  "ace-13-colorado-2021": "left",
  "ace-15-ecuador-2022": "left",
  "ace-16-seattle-2023": "left",
  "ace-17-panama-2024": "left",
  "ace-3-midwest-2015": "top",
  "ace-6-ontario-2016": "top",
  "ace-18-michigan-2024": "top",
  "ace-20-illinois-2025": "top",
  "ace-23-memphis-2026": "top",
};

// Side gutters and the top band where the "top" zone labels sit.
const LABEL_X_LEFT = 24;
const LABEL_X_RIGHT = VB_W - 24;
const LABEL_Y_TOP = 38;
const LABEL_TOP_PAD = TOP_INSET + 30;
const LABEL_BOTTOM_PAD = BOTTOM_INSET + 30;
const LABEL_MIN_SPACING = 56;
const LABEL_TOP_MIN_X_SPACING = 200;

// --- Component -------------------------------------------------------------

interface CountriesGeo {
  type: "FeatureCollection";
  features: Array<{
    id?: string;
    properties?: { name?: string };
    geometry: GeoJSON.Geometry;
  }>;
}

interface StatesGeo {
  type: "FeatureCollection";
  features: Array<{
    properties?: { name?: string };
    geometry: GeoJSON.Geometry;
  }>;
}

export function EditionsPosterSvg() {
  const [countriesGeo, setCountriesGeo] = useState<CountriesGeo | null>(null);
  const [statesGeo, setStatesGeo] = useState<StatesGeo | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    fetch("/countries.geo.json").then(r => r.json()).then(setCountriesGeo).catch(() => {});
    fetch("/us-states.geo.json").then(r => r.json()).then(setStatesGeo).catch(() => {});
  }, []);

  const ordered = useMemo(() => [...editions].sort((a, b) => a.number - b.number), []);
  const americas = ordered.filter(e => !SPECIAL_EDITIONS.includes(e.id));
  const special = ordered.filter(e => SPECIAL_EDITIONS.includes(e.id));

  // Group editions by primary host city so repeat hosts (e.g. Córdoba in
  // 2015 and 2025) collapse into a single dot + a single label that lists
  // every edition's date inline.
  const markers = useMemo(() => {
    const groups = new Map<string, (typeof editions)[number][]>();
    for (const e of americas) {
      const cid = e.cityIds[0];
      if (!cid) continue;
      const arr = groups.get(cid);
      if (arr) arr.push(e);
      else groups.set(cid, [e]);
    }

    const result: Array<{
      e: (typeof editions)[number];
      eds: (typeof editions)[number][];
      city: NonNullable<ReturnType<typeof cityById>>;
      x: number;
      y: number;
    }> = [];
    for (const [cityId, eds] of groups.entries()) {
      const city = cityById(cityId);
      if (!city) continue;
      const sorted = [...eds].sort((a, b) => a.number - b.number);
      const [x, y] = project(city.coordinates.lng, city.coordinates.lat);
      result.push({
        e: sorted[sorted.length - 1], // representative = most recent
        eds: sorted,
        city,
        x,
        y,
      });
    }
    return result;
  }, [americas]);

  // Three-zone label distribution: a horizontal band at the top, plus the
  // existing left/right side stacks. Each zone uses an anchor-and-push
  // collision algorithm — labels start at the geographic position of their
  // dot and only get nudged when they'd overlap the previous label.
  const labels = useMemo(() => {
    const split = { left: [] as typeof markers, right: [] as typeof markers, top: [] as typeof markers };
    for (const m of markers) {
      const mapCx = m.x - SIDE_MARGIN;
      const side = LABEL_SIDE[m.e.id] ?? (mapCx < MAP_W / 2 ? "left" : "right");
      split[side].push(m);
    }

    type Placed = (typeof markers)[number] & {
      labelX: number;
      labelY: number;
      anchor: "start" | "end" | "middle";
    };

    function distributeSide(items: typeof markers, sideX: number, side: "left" | "right"): Placed[] {
      const sorted = [...items].sort((a, b) => a.y - b.y);
      const TOP = LABEL_TOP_PAD;
      const BOT = VB_H - LABEL_BOTTOM_PAD;

      const placed: Placed[] = sorted.map(m => ({
        ...m,
        labelX: sideX,
        labelY: m.y,
        anchor: side === "left" ? "start" : "end",
      }));

      let prevY = TOP - LABEL_MIN_SPACING;
      for (const p of placed) {
        const desired = Math.max(TOP, p.labelY);
        p.labelY = Math.max(desired, prevY + LABEL_MIN_SPACING);
        prevY = p.labelY;
      }
      if (placed.length > 0 && placed[placed.length - 1].labelY > BOT) {
        placed[placed.length - 1].labelY = BOT;
        for (let i = placed.length - 2; i >= 0; i--) {
          const cap = placed[i + 1].labelY - LABEL_MIN_SPACING;
          if (placed[i].labelY > cap) placed[i].labelY = cap;
        }
      }
      return placed;
    }

    function distributeTop(items: typeof markers): Placed[] {
      const sorted = [...items].sort((a, b) => a.x - b.x);
      const LEFT = SIDE_MARGIN + 60;
      const RIGHT = VB_W - SIDE_MARGIN - 60;

      const placed: Placed[] = sorted.map(m => ({
        ...m,
        labelX: m.x,
        labelY: LABEL_Y_TOP,
        anchor: "middle",
      }));

      let prevX = LEFT - LABEL_TOP_MIN_X_SPACING;
      for (const p of placed) {
        const desired = Math.max(LEFT, p.labelX);
        p.labelX = Math.max(desired, prevX + LABEL_TOP_MIN_X_SPACING);
        prevX = p.labelX;
      }
      if (placed.length > 0 && placed[placed.length - 1].labelX > RIGHT) {
        placed[placed.length - 1].labelX = RIGHT;
        for (let i = placed.length - 2; i >= 0; i--) {
          const cap = placed[i + 1].labelX - LABEL_TOP_MIN_X_SPACING;
          if (placed[i].labelX > cap) placed[i].labelX = cap;
        }
      }
      return placed;
    }

    return [
      ...distributeSide(split.left, LABEL_X_LEFT, "left"),
      ...distributeSide(split.right, LABEL_X_RIGHT, "right"),
      ...distributeTop(split.top),
    ];
  }, [markers]);

  // Pre-build path strings for fills so we don't reproject on every render.
  const countryPaths = useMemo(() => {
    if (!countriesGeo) return [];
    return countriesGeo.features
      .filter(f => f.id && AMERICAS_ISO3.has(f.id))
      .map(f => ({
        id: f.id!,
        name: f.properties?.name ?? "",
        d: geomToPath(f.geometry),
        isHost: HOST_ISO_VALUES.has(f.id!),
      }));
  }, [countriesGeo]);

  const statePaths = useMemo(() => {
    if (!statesGeo) return [];
    return statesGeo.features
      .filter(f => HOST_STATE_NAMES.has(f.properties?.name ?? ""))
      .map(f => ({
        name: f.properties?.name ?? "",
        d: geomToPath(f.geometry),
      }));
  }, [statesGeo]);

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

      {/* Header */}
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

      {/* Map + rail */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 min-h-0">
        <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden relative min-h-0">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
            style={{ background: "#F8FAFC" }}
          >
            {/* Country fills (Americas only) */}
            {countryPaths.map(c => {
              const fill = c.isHost ? ATLAS_COLORS.navyDeep : "#E2E8F0";
              const isHovered = hovered === `country-${c.id}`;
              return (
                <path
                  key={c.id}
                  d={c.d}
                  fill={isHovered ? ATLAS_COLORS.hostOrange : fill}
                  stroke="#94A3B8"
                  strokeWidth={0.4}
                  vectorEffect="non-scaling-stroke"
                  className={c.isHost ? "cursor-pointer transition-colors duration-150" : ""}
                  onMouseEnter={() => c.isHost && setHovered(`country-${c.id}`)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    if (!c.isHost) return;
                    const countryId = Object.entries(HOST_ISO3).find(([, v]) => v === c.id)?.[0];
                    if (!countryId) return;
                    const eds = editions.filter(
                      e => e.countryId === countryId && !SPECIAL_EDITIONS.includes(e.id),
                    );
                    if (eds.length === 1) {
                      window.location.href = `/editions/${eds[0].id}`;
                    }
                  }}
                >
                  <title>{c.name}</title>
                </path>
              );
            })}

            {/* US state fills, painted on top of the USA polygon */}
            {statePaths.map(s => {
              const isHovered = hovered === `state-${s.name}`;
              return (
                <path
                  key={s.name}
                  d={s.d}
                  fill={isHovered ? ATLAS_COLORS.hostOrange : ATLAS_COLORS.navyDeep}
                  stroke="white"
                  strokeWidth={0.5}
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer transition-colors duration-150"
                  onMouseEnter={() => setHovered(`state-${s.name}`)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    const state = statesData.find(st => st.name === s.name);
                    if (!state) return;
                    const eds = editions.filter(e => e.stateId === state.id);
                    if (eds.length === 1) {
                      window.location.href = `/editions/${eds[0].id}`;
                    }
                  }}
                >
                  <title>{s.name}, US</title>
                </path>
              );
            })}

            {/* Leader lines + labels — drawn first so dots render on top.
                Title uses the edition's regional suffix (after " — ") so
                multi-city editions like ACE V "Arizona & California" or
                ACE I "US Southeast" read meaningfully without privileging
                an arbitrary primary city. */}
            {labels.map(({ e, eds, city, x, y, labelX, labelY, anchor }) => {
              const isHovered = hovered === `marker-${city.id}`;
              const isTop = anchor === "middle";
              const titleFontSize = isTop ? 17 : 21;
              const dateFontSize = isTop ? 12 : 15;
              // Resolves to either an EDITION_REGION_OVERRIDE in lib/utils
              // or the suffix after " — " in editions.ts.
              const titleText = `ACE ${editionRegion(e)}`;
              const showEditionPrefix = eds.length > 1;
              return (
                <g key={`label-${city.id}`}>
                  <path
                    d={`M${x},${y} L${labelX},${labelY}`}
                    stroke={isHovered ? ATLAS_COLORS.hostOrange : "#94A3B8"}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeDasharray="4,4"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={labelX}
                    y={labelY - (isTop ? 4 : 8)}
                    textAnchor={anchor}
                    fontSize={titleFontSize}
                    fontWeight={700}
                    fill={ATLAS_COLORS.navyDeep}
                    stroke="white"
                    strokeWidth={5}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                  >
                    {titleText}
                  </text>
                  {eds.map((ed, i) => (
                    <text
                      key={ed.id}
                      x={labelX}
                      y={labelY + (isTop ? 14 : 18) + i * (dateFontSize + 4)}
                      textAnchor={anchor}
                      fontSize={dateFontSize}
                      fontWeight={500}
                      fill="#1E293B"
                      stroke="white"
                      strokeWidth={4}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                    >
                      {showEditionPrefix
                        ? `ACE ${ed.number} · ${formatDateRange(ed.startDate, ed.endDate)}`
                        : formatDateRange(ed.startDate, ed.endDate)}
                    </text>
                  ))}
                </g>
              );
            })}

            {/* Numbered edition dots — one per host city. Repeat hosts get
                a small "stack" outline behind the main dot to hint that
                more than one edition lives at this location. */}
            {markers.map(({ e, eds, city, x, y }) => {
              const isHovered = hovered === `marker-${city.id}`;
              const stacked = eds.length > 1;
              return (
                <g
                  key={city.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered(`marker-${city.id}`)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => { window.location.href = `/editions/${e.id}`; }}
                >
                  {stacked && (
                    <circle
                      cx={x + 6}
                      cy={y - 6}
                      r={isHovered ? 16 : 13}
                      fill="#94A3B8"
                      stroke="white"
                      strokeWidth={2.5}
                      vectorEffect="non-scaling-stroke"
                      style={{ transition: "r 120ms" }}
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 18 : 15}
                    fill={ATLAS_COLORS.hostOrange}
                    stroke="white"
                    strokeWidth={3}
                    vectorEffect="non-scaling-stroke"
                    style={{ transition: "r 120ms" }}
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={15}
                    fontWeight={700}
                    fill="white"
                    pointerEvents="none"
                  >
                    {e.number}
                  </text>
                  <title>{stacked
                    ? `${city.name} · ${eds.map(ed => `ACE ${ed.number}`).join(" + ")}`
                    : `ACE ${e.number} — ${city.name} · ${formatDateRange(e.startDate, e.endDate)}`}</title>
                </g>
              );
            })}

            {/* Special Editions inset (bottom-left). Lifted out of the rail
                so the poster shows all 23 editions geographically — even the
                ones held by OAS Permanent Observers outside the Americas. */}
            {countriesGeo && (() => {
              const de = countriesGeo.features.find(f => f.id === "DEU");
              const il = countriesGeo.features.find(f => f.id === "ISR");
              const am = countriesGeo.features.find(f => f.id === "ARM");
              if (!de || !il || !am) return null;
              const INSET_X = 20;
              const INSET_Y = TOP_INSET + MAP_H + 6;
              const INSET_W = 450;
              const INSET_H = BOTTOM_INSET - 18;
              const card1X = INSET_X + 16;
              const card2X = INSET_X + 246;
              return (
                <g>
                  <rect
                    x={INSET_X}
                    y={INSET_Y}
                    width={INSET_W}
                    height={INSET_H}
                    fill="white"
                    stroke="#E2E8F0"
                    strokeWidth={1.5}
                    rx={14}
                  />
                  <text
                    x={INSET_X + INSET_W / 2}
                    y={INSET_Y + 26}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={700}
                    fill="#64748B"
                    letterSpacing={2.2}
                  >
                    SPECIAL EDITIONS
                  </text>
                  <text
                    x={INSET_X + INSET_W / 2}
                    y={INSET_Y + 44}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#94A3B8"
                  >
                    Hosted by OAS Permanent Observer countries
                  </text>

                  {/* Divider between the two cards */}
                  <line
                    x1={INSET_X + 230}
                    y1={INSET_Y + 64}
                    x2={INSET_X + 230}
                    y2={INSET_Y + INSET_H - 16}
                    stroke="#E2E8F0"
                    strokeWidth={1}
                  />

                  {/* Card 1 — ACE 9, Germany & Israel */}
                  <g
                    className="cursor-pointer"
                    onClick={() => { window.location.href = "/editions/ace-9-germany-israel-2018"; }}
                  >
                    <path
                      d={projectToRect(de.geometry, card1X, INSET_Y + 70, 90, 76)}
                      fill={ATLAS_COLORS.navyDeep}
                      stroke="white"
                      strokeWidth={0.6}
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d={projectToRect(il.geometry, card1X + 110, INSET_Y + 78, 28, 68)}
                      fill={ATLAS_COLORS.navyDeep}
                      stroke="white"
                      strokeWidth={0.6}
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={card1X + 12}
                      cy={INSET_Y + 80}
                      r={14}
                      fill="#6A4C93"
                      stroke="white"
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={card1X + 12}
                      y={INSET_Y + 80}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13}
                      fontWeight={700}
                      fill="white"
                      pointerEvents="none"
                    >
                      9
                    </text>
                    <text
                      x={card1X + 90}
                      y={INSET_Y + 174}
                      textAnchor="middle"
                      fontSize={15}
                      fontWeight={700}
                      fill={ATLAS_COLORS.navyDeep}
                    >
                      Germany &amp; Israel
                    </text>
                    <text
                      x={card1X + 90}
                      y={INSET_Y + 192}
                      textAnchor="middle"
                      fontSize={12}
                      fill="#475569"
                    >
                      Jun 24–29, 2018
                    </text>
                    <title>ACE 9 — Germany & Israel · Jun 24–29, 2018</title>
                  </g>

                  {/* Card 2 — ACE 19, Armenia */}
                  <g
                    className="cursor-pointer"
                    onClick={() => { window.location.href = "/editions/ace-19-armenia-2024"; }}
                  >
                    <path
                      d={projectToRect(am.geometry, card2X, INSET_Y + 70, 130, 76)}
                      fill={ATLAS_COLORS.navyDeep}
                      stroke="white"
                      strokeWidth={0.6}
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={card2X + 12}
                      cy={INSET_Y + 80}
                      r={14}
                      fill="#6A4C93"
                      stroke="white"
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={card2X + 12}
                      y={INSET_Y + 80}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13}
                      fontWeight={700}
                      fill="white"
                      pointerEvents="none"
                    >
                      19
                    </text>
                    <text
                      x={card2X + 100}
                      y={INSET_Y + 174}
                      textAnchor="middle"
                      fontSize={15}
                      fontWeight={700}
                      fill={ATLAS_COLORS.navyDeep}
                    >
                      Armenia
                    </text>
                    <text
                      x={card2X + 100}
                      y={INSET_Y + 192}
                      textAnchor="middle"
                      fontSize={12}
                      fill="#475569"
                    >
                      Sep 30 – Oct 4, 2024
                    </text>
                    <title>ACE 19 — Armenia · Sep 30 – Oct 4, 2024</title>
                  </g>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Side rail */}
        <aside className="flex flex-col gap-2.5 min-h-0 overflow-y-auto thin-scroll pr-1">
          <div>
            <SectionTitle>Editions in the Americas</SectionTitle>
            <ul className="mt-1.5 space-y-0.5">
              {americas.map(e => (
                <EditionRow
                  key={e.id}
                  e={e}
                  highlighted={hovered === `marker-${e.id}`}
                  onHover={h => setHovered(h ? `marker-${e.id}` : null)}
                />
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
                <EditionRow key={e.id} e={e} highlighted={false} onHover={() => {}} />
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

// Flag emojis used to give special editions a visual identity that the
// numbered navy badge can't carry on its own.
const SPECIAL_FLAGS: Record<string, string> = {
  "ace-9-germany-israel-2018": "🇩🇪 🇮🇱",
  "ace-19-armenia-2024": "🇦🇲",
};

function EditionRow({
  e,
  highlighted,
  onHover,
}: {
  e: (typeof editions)[number];
  highlighted: boolean;
  onHover: (hovering: boolean) => void;
}) {
  const country = countryById(e.countryId);
  const mainCity = e.cityIds[0] ? cityById(e.cityIds[0]) : undefined;
  const isSpecial = SPECIAL_EDITIONS.includes(e.id);
  const flag = SPECIAL_FLAGS[e.id];

  // For special editions the displayable location lives in the edition name
  // ("ACE IX (Special) — Germany & Israel"). Pull the trailing chunk so the
  // row reads naturally without exposing the "intl" countryId stub.
  const displayName = isSpecial
    ? e.name.split(" — ").pop() ?? e.name
    : mainCity?.name ?? e.name;
  const displayCountry = isSpecial ? "OAS Permanent Observer host" : country?.name;

  return (
    <li>
      <Link
        href={`/editions/${e.id}`}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        className={`group flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
          highlighted ? "bg-accent-blue/5" : "hover:bg-surface-subtle"
        }`}
      >
        <span
          className={`w-7 h-7 rounded font-bold text-[12px] flex items-center justify-center shrink-0 tabular-nums transition-colors ${
            isSpecial
              ? "bg-accent-purple text-white"
              : highlighted
                ? "bg-accent-orange text-white"
                : "bg-ink text-white"
          }`}
        >
          {e.number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-ink truncate group-hover:text-accent-blue leading-tight flex items-center gap-1">
            <span className="truncate">{displayName}</span>
            {flag && <span className="text-[12px] shrink-0">{flag}</span>}
          </div>
          <div className="text-[11px] text-text-muted truncate leading-tight">
            {displayCountry} · {formatDateRange(e.startDate, e.endDate)}
          </div>
        </div>
      </Link>
    </li>
  );
}
