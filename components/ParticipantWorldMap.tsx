"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { participants } from "@/data/participants";
import { countries } from "@/data/countries";
import { Globe2, X, ArrowRight, Users, Plus, Minus, RotateCcw } from "lucide-react";
import { asset } from "@/lib/asset-path";

// World-country geojson lives at /public/countries.geo.json — features
// keyed by ISO-3 (`id: "USA"`, etc.). We project the polygons through a
// simple equirectangular formula straight into an SVG viewBox so the
// component stays a static asset (no Leaflet, no tiles, no JS map lib).

const VB_W = 1000;
const VB_H = 500;

function project(lng: number, lat: number): [number, number] {
  // World viewport: -180..180 longitude, +85..-60 latitude (clip the
  // poles a touch — Antarctica + Arctic don't add information here).
  const NORTH = 85;
  const SOUTH = -60;
  const x = ((lng + 180) / 360) * VB_W;
  const y = ((NORTH - lat) / (NORTH - SOUTH)) * VB_H;
  return [x, y];
}

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
      .map((poly) => poly.map(ringToPath).join(" "))
      .join(" ");
  }
  return "";
}

interface CountriesGeo {
  type: "FeatureCollection";
  features: Array<{
    id?: string;
    properties?: { name?: string };
    geometry: GeoJSON.Geometry;
  }>;
}

// Zoom/pan transform state. We apply this as an SVG `transform` to a
// <g> wrapping every country path so the paths re-render at the new
// scale without recomputing.
interface ViewTransform {
  tx: number; // translate X in viewBox units
  ty: number;
  scale: number;
}
const INITIAL_VIEW: ViewTransform = { tx: 0, ty: 0, scale: 1 };
const MIN_SCALE = 1;
const MAX_SCALE = 8;
// px — under this we treat the gesture as a click, not a pan. Bumped
// from 4 because trackpads (especially Mac) often jitter the pointer
// by a few pixels on a single tap, which used to mark the gesture as
// "moved" and silently swallow the country click.
const PAN_DRAG_THRESHOLD = 10;

export function ParticipantWorldMap() {
  const [geo, setGeo] = useState<CountriesGeo | null>(null);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [hoveredIso, setHoveredIso] = useState<string | null>(null);
  const [view, setView] = useState<ViewTransform>(INITIAL_VIEW);
  const svgRef = useRef<SVGSVGElement>(null);

  // Mutable refs for the pan gesture so we don't re-render on every
  // pointer move until the actual transform is applied.
  const panStateRef = useRef<{
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    startTx: number;
    startTy: number;
    moved: boolean;
  }>({
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startTx: 0,
    startTy: 0,
    moved: false,
  });

  useEffect(() => {
    fetch(asset("/countries.geo.json"))
      .then((r) => r.json())
      .then(setGeo)
      .catch(() => {});
  }, []);

  // Build the set of ISO-3 codes that have at least one participant +
  // a quick count map for the tooltip / sidebar + an ISO-3 → internal
  // country id index so click handlers can route to /countries/{id} +
  // a list of country markers (lat/lng + count) so the small Caribbean
  // island nations whose polygons aren't in Natural Earth's 50m geojson
  // (Barbados, St. Lucia, Grenada, etc.) still show up as visible dots.
  const { hostIso, hostCounts, isoToCountryId, totalCountries, totalDelegates, markers } = useMemo(() => {
    const counts: Record<string, number> = {};
    const isoToId: Record<string, string> = {};
    for (const c of countries) {
      isoToId[c.isoCode] = c.id;
    }
    for (const p of participants) {
      const c = countries.find((x) => x.id === p.countryId);
      if (!c) continue;
      counts[c.isoCode] = (counts[c.isoCode] ?? 0) + 1;
    }
    const set = new Set(Object.keys(counts));
    const markerList = countries
      .filter((c) => set.has(c.isoCode) && c.coordinates)
      .map((c) => {
        const [x, y] = project(c.coordinates.lng, c.coordinates.lat);
        return {
          isoCode: c.isoCode,
          countryId: c.id,
          name: c.name,
          x,
          y,
          count: counts[c.isoCode] ?? 0,
        };
      });
    return {
      hostIso: set,
      hostCounts: counts,
      isoToCountryId: isoToId,
      totalCountries: set.size,
      totalDelegates: participants.length,
      markers: markerList,
    };
  }, []);

  // Pre-compute SVG paths once geo loads. We render every country
  // (otherwise the map looks like floating scraps); host countries get
  // the navy fill, the rest stay light gray.
  const paths = useMemo(() => {
    if (!geo) return [];
    return geo.features
      .filter((f) => f.id && f.geometry)
      .map((f) => ({
        id: f.id!,
        name: f.properties?.name ?? "",
        d: geomToPath(f.geometry),
        isHost: hostIso.has(f.id!),
        count: hostCounts[f.id!] ?? 0,
      }));
  }, [geo, hostIso, hostCounts]);

  const sortedTop = useMemo(
    () =>
      countries
        .filter((c) => hostIso.has(c.isoCode))
        .map((c) => ({ name: c.name, count: hostCounts[c.isoCode] ?? 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    [hostIso, hostCounts],
  );

  // ── Zoom/pan handlers ─────────────────────────────────────────────
  // Convert a client (px) point to a viewBox coordinate so we can
  // zoom-toward-cursor and pan in viewBox units regardless of how the
  // SVG is scaled into its container.
  function clientToViewBox(clientX: number, clientY: number): { x: number; y: number } | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VB_W,
      y: ((clientY - rect.top) / rect.height) * VB_H,
    };
  }

  function clamp(scale: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  }

  function zoomAtPoint(factor: number, vbPoint?: { x: number; y: number }) {
    setView((prev) => {
      const newScale = clamp(prev.scale * factor);
      if (newScale === prev.scale) return prev;
      // Zoom centered at vbPoint if provided; otherwise keep the
      // viewBox center stable.
      const cx = vbPoint?.x ?? VB_W / 2;
      const cy = vbPoint?.y ?? VB_H / 2;
      // newTx = cx - (cx - prev.tx) * (newScale / prev.scale)
      const ratio = newScale / prev.scale;
      const tx = cx - (cx - prev.tx) * ratio;
      const ty = cy - (cy - prev.ty) * ratio;
      // When fully zoomed out, snap back to origin so the map re-centers.
      if (newScale === 1) return { tx: 0, ty: 0, scale: 1 };
      return { tx, ty, scale: newScale };
    });
  }

  function zoomBy(factor: number) {
    zoomAtPoint(factor);
  }

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    if (e.deltaY === 0) return;
    e.preventDefault();
    const point = clientToViewBox(e.clientX, e.clientY) ?? undefined;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    zoomAtPoint(factor, point);
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return;
    panStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startTx: view.tx,
      startTy: view.ty,
      moved: false,
    };
    // NOTE: setPointerCapture is intentionally deferred to the first
    // real drag in handlePointerMove. Capturing on every pointerdown
    // makes some browsers (notably Safari) deliver the synthetic
    // `click` event to the SVG instead of the actual <path>, which
    // silently breaks the country click handler.
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const s = panStateRef.current;
    if (s.pointerId !== e.pointerId) return;
    const dxPx = e.clientX - s.startClientX;
    const dyPx = e.clientY - s.startClientY;
    if (!s.moved && Math.hypot(dxPx, dyPx) < PAN_DRAG_THRESHOLD) return;
    if (!s.moved) {
      s.moved = true;
      // Now that we know this is a real pan, take pointer capture so
      // the drag keeps tracking even when the cursor leaves the SVG.
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    }
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dxVB = (dxPx / rect.width) * VB_W;
    const dyVB = (dyPx / rect.height) * VB_H;
    setView((prev) => ({ ...prev, tx: s.startTx + dxVB, ty: s.startTy + dyVB }));
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    const s = panStateRef.current;
    if (s.pointerId !== e.pointerId) {
      // pointer up on a different pointer or a sibling — reset moved flag
      // so future clicks aren't suppressed.
      panStateRef.current.moved = false;
      return;
    }
    panStateRef.current.pointerId = null;
    // Reset `moved` on the next tick so the path's onClick handler
    // (which fires synchronously after pointerup) sees the current
    // value first, then any subsequent click is treated as a fresh
    // gesture.
    setTimeout(() => {
      panStateRef.current.moved = false;
    }, 0);
  }

  return (
    <section aria-label="Participant origin map">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-1">
            Where participants come from
          </div>
          <h2 className="text-lg md:text-xl font-bold text-ink tracking-tight">
            A network across {totalCountries} countries
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px]">
          {/* Map */}
          <div className="relative bg-surface-canvas/40 p-4">
            {/* Zoom controls — top-right overlay */}
            <div className="absolute top-6 right-6 z-10 flex flex-col gap-1 bg-white rounded-lg border border-surface-border shadow-card p-1">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => zoomBy(1.5)}
                className="w-8 h-8 rounded-md hover:bg-surface-subtle flex items-center justify-center text-text-secondary hover:text-ink transition-colors disabled:opacity-40"
                disabled={view.scale >= MAX_SCALE}
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => zoomBy(1 / 1.5)}
                className="w-8 h-8 rounded-md hover:bg-surface-subtle flex items-center justify-center text-text-secondary hover:text-ink transition-colors disabled:opacity-40"
                disabled={view.scale <= MIN_SCALE}
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                aria-label="Reset zoom"
                onClick={() => setView(INITIAL_VIEW)}
                className="w-8 h-8 rounded-md hover:bg-surface-subtle flex items-center justify-center text-text-secondary hover:text-ink transition-colors disabled:opacity-40"
                disabled={view.scale === 1 && view.tx === 0 && view.ty === 0}
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-auto select-none touch-none"
              style={{
                maxHeight: 360,
                cursor: view.scale > 1 ? "grab" : "default",
              }}
              role="img"
              aria-label={`Map highlighting ${totalCountries} countries with ACE participants`}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
                {paths.map((c) => {
                  const targetId = isoToCountryId[c.id];
                  const clickable = c.isHost && Boolean(targetId);
                  const isSelected = selectedIso === c.id;
                  // Default host fill: dark slate gray. Hover/selected:
                  // ACE blue. Non-host countries stay light gray.
                  const fill = !c.isHost
                    ? "#E2E8F0"
                    : isSelected || hoveredIso === c.id
                      ? "#2563EB"
                      : "#475569";
                  const stroke = !c.isHost
                    ? "#CBD5E1"
                    : isSelected || hoveredIso === c.id
                      ? "#1E4E8C"
                      : "#334155";
                  return (
                    <path
                      key={c.id}
                      d={c.d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={0.4}
                      vectorEffect="non-scaling-stroke"
                      style={{ cursor: clickable ? "pointer" : "default", transition: "fill 120ms" }}
                      onPointerEnter={() => clickable && setHoveredIso(c.id)}
                      onPointerLeave={() =>
                        clickable && setHoveredIso((prev) => (prev === c.id ? null : prev))
                      }
                      onClick={() => {
                        // Skip the click if the user just dragged the map.
                        if (panStateRef.current.moved) return;
                        if (clickable) setSelectedIso(c.id);
                      }}
                    >
                      {c.isHost && (
                        <title>{`${c.name} — ${c.count} participant${c.count === 1 ? "" : "s"} · click for details`}</title>
                      )}
                    </path>
                  );
                })}
                {/* Country markers — small dots over each host country's
                    centroid. Catches the small Caribbean island nations
                    that don't have a polygon in the world geojson, and
                    gives a clearer "here's a participant origin" signal
                    when the polygon itself is too tiny to read. */}
                {markers.map((m) => {
                  const isSelected = selectedIso === m.isoCode;
                  return (
                    <g
                      key={m.isoCode}
                      className="cursor-pointer"
                      onClick={(e) => {
                        if (panStateRef.current.moved) return;
                        e.stopPropagation();
                        setSelectedIso(m.isoCode);
                      }}
                    >
                      <circle
                        cx={m.x}
                        cy={m.y}
                        r={isSelected ? 3.2 : 2.4}
                        fill={isSelected ? "#2563EB" : "#1E4E8C"}
                        stroke="#FFFFFF"
                        strokeWidth={0.8}
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: "r 120ms" }}
                      />
                      <title>{`${m.name} — ${m.count} participant${m.count === 1 ? "" : "s"} · click for details`}</title>
                    </g>
                  );
                })}
              </g>
            </svg>
            {/* Hint */}
            <div className="absolute bottom-2 left-6 text-[10.5px] text-text-muted bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
              Scroll to zoom · drag to pan
            </div>
          </div>

          {/* Side panel — swaps between the global "Reach + Most
              represented" view and a per-country detail view when a
              country is clicked on the map. */}
          {selectedIso ? (
            <CountryDetailPanel
              isoCode={selectedIso}
              count={hostCounts[selectedIso] ?? 0}
              countryId={isoToCountryId[selectedIso]}
              onClose={() => setSelectedIso(null)}
            />
          ) : (
            <div className="p-5 border-t lg:border-t-0 lg:border-l border-surface-border bg-white flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center shrink-0">
                  <Globe2 size={18} className="text-accent-blue" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">
                    Reach
                  </div>
                  <div className="text-3xl font-bold text-ink leading-none mt-0.5 tabular-nums">
                    {totalCountries}
                  </div>
                  <div className="text-[12px] text-text-secondary mt-1">
                    countries · {totalDelegates.toLocaleString()} delegates
                  </div>
                </div>
              </div>

              <div className="border-t border-surface-border pt-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-2">
                  Most represented
                </div>
                <ul className="space-y-1.5">
                  {sortedTop.map((row, i) => {
                    const max = sortedTop[0]?.count ?? 1;
                    const width = (row.count / max) * 100;
                    return (
                      <li key={row.name} className="flex items-center gap-2 text-[12px]">
                        <span className="text-ink font-medium w-24 truncate">{row.name}</span>
                        <div className="flex-1 bg-surface-subtle rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent-blue transition-all"
                            style={{
                              width: `${width}%`,
                              transitionDelay: `${i * 60}ms`,
                              transitionDuration: "700ms",
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-ink tabular-nums w-8 text-right">
                          {row.count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 text-[11px] text-text-muted leading-relaxed">
                  💡 Click any highlighted country on the map for details.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Detail panel shown on the right side when the user clicks a country.
// Pulls a quick summary (delegate count, top sectors, editions hosted)
// straight from the in-memory data tables.
function CountryDetailPanel({
  isoCode,
  count,
  countryId,
  onClose,
}: {
  isoCode: string;
  count: number;
  countryId: string | undefined;
  onClose: () => void;
}) {
  const country = countries.find((c) => c.isoCode === isoCode);
  const myParticipants = useMemo(
    () => participants.filter((p) => p.countryId === country?.id),
    [country],
  );
  const actorBreakdown = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const p of myParticipants) {
      buckets[p.actorType] = (buckets[p.actorType] ?? 0) + 1;
    }
    return Object.entries(buckets)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [myParticipants]);

  const editionsHosted = country?.aceEditionsCount ?? 0;

  return (
    <div className="p-6 border-t lg:border-t-0 lg:border-l border-surface-border bg-linear-to-br from-white to-surface-canvas/40 flex flex-col gap-5 relative min-h-[360px]">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close country details"
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-surface-border hover:bg-surface-subtle hover:border-text-muted flex items-center justify-center transition-all shadow-xs"
      >
        <X size={15} className="text-text-muted" />
      </button>

      {/* Header — region eyebrow + country name */}
      <div className="pr-10">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-1.5">
          {country?.region ?? "Country"}
        </div>
        <h3 className="text-2xl font-bold text-ink tracking-tight leading-tight">
          {country?.name ?? isoCode}
        </h3>
      </div>

      {/* Big stat — participants count, full row */}
      <div className="bg-white rounded-xl border border-surface-border p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
          <Users size={22} className="text-accent-blue" />
        </div>
        <div className="min-w-0">
          <div className="text-[42px] font-bold text-ink leading-none tabular-nums">
            {count}
          </div>
          <div className="text-[13px] text-text-secondary mt-1.5 font-medium">
            ACE participant{count === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* Editions hosted — only shown when > 0 */}
      {editionsHosted > 0 && (
        <div className="bg-accent-orange-cta/8 border border-accent-orange-cta/20 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-orange-cta/15 flex items-center justify-center shrink-0">
            <span className="text-accent-orange-cta font-bold text-lg tabular-nums">{editionsHosted}</span>
          </div>
          <div className="text-[13px] text-text-secondary leading-snug">
            ACE edition{editionsHosted === 1 ? "" : "s"} hosted in this country
          </div>
        </div>
      )}

      {/* Actor mix — proportional bars */}
      {actorBreakdown.length > 0 && count > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted font-bold mb-2.5">
            Actor mix
          </div>
          <ul className="space-y-2">
            {actorBreakdown.map(([type, n]) => {
              const pct = (n / count) * 100;
              return (
                <li key={type}>
                  <div className="flex items-center justify-between mb-1 text-[13px]">
                    <span className="text-ink font-semibold truncate pr-2">{type}</span>
                    <span className="text-ink tabular-nums">
                      <span className="font-bold">{n}</span>
                      <span className="text-text-muted ml-1 text-[11.5px]">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-surface-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-blue transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* CTA button */}
      {countryId && (
        <Link
          href={`/countries/${countryId}`}
          className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-3 bg-accent-blue hover:bg-ink text-white rounded-lg text-[14px] font-semibold transition-colors shadow-xs"
        >
          View country details
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
