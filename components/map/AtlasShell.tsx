"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AtlasBreadcrumb } from "./AtlasBreadcrumb";
import { AtlasPanel } from "./AtlasPanel";
import { AtlasStatsOverlay } from "./AtlasStatsOverlay";
import { MapLayerControl } from "./MapLayerControl";
import { countries } from "@/data/countries";
import { cities } from "@/data/cities";
import { visitedSites } from "@/data/visited-sites";
import { stateById, statesByCountry } from "@/data/states";
import { editions } from "@/data/editions";
import { editionRegion } from "@/lib/utils";
import { participantsByEdition } from "@/data/participants";
import type { AtlasSelection } from "@/types";
import type { AtlasMarker } from "./AtlasMap";
import { categoryFor } from "./siteTypeConfig";
import { DEFAULT_LAYER_VISIBILITY, type LayerVisibility } from "./mapLayers";
import { ZOOM_BY_LEVEL, US_COUNTRY_ZOOM } from "./mapLevels";
import { Globe2, Crosshair, PanelRight, Search, LayoutGrid } from "lucide-react";
import { AtlasSearch } from "./AtlasSearch";
import Link from "next/link";

const AtlasMap = dynamic(() => import("./AtlasMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

/**
 * Quadratic Bezier curve between two map coordinates. Sampled into
 * `segments` points so Leaflet's Polyline renders a smooth arc instead
 * of a straight line. The control point is offset perpendicular to the
 * from→to vector by `bow` × the segment distance — gives every line a
 * subtle institutional curvature without blowing up at long distances.
 */
function bezierArc(
  from: [number, number],
  to: [number, number],
  segments = 30,
  bow = 0.18,
): [number, number][] {
  const [fLat, fLng] = from;
  const [tLat, tLng] = to;
  const midLat = (fLat + tLat) / 2;
  const midLng = (fLng + tLng) / 2;
  const dLat = tLat - fLat;
  const dLng = tLng - fLng;
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);
  if (dist === 0) return [from, to];
  // Perpendicular to from→to, normalized, scaled by `bow * dist`.
  const offset = bow * dist;
  const perpLat = -dLng / dist * offset;
  const perpLng = dLat / dist * offset;
  const ctrlLat = midLat + perpLat;
  const ctrlLng = midLng + perpLng;
  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    const lat = u * u * fLat + 2 * u * t * ctrlLat + t * t * tLat;
    const lng = u * u * fLng + 2 * u * t * ctrlLng + t * t * tLng;
    points.push([lat, lng]);
  }
  return points;
}

function MapSkeleton() {
  return (
    <div className="w-full h-full bg-linear-to-br from-surface-subtle via-white to-surface-subtle animate-pulse flex items-center justify-center">
      <div className="text-text-muted text-sm">Loading ACE Atlas…</div>
    </div>
  );
}

/**
 * Progressive-disclosure marker logic.
 *
 *  - GLOBAL: ONE pin per ACE edition, anchored at the edition's main host
 *    city (cityIds[0]). When two editions share a host city (e.g. Córdoba
 *    hosted ACE 4 + ACE 22), they collapse to a single pin with an "N
 *    editions" meta. Visited sites are NOT shown — the global view stays
 *    institutional and uncluttered.
 *
 *  - COUNTRY: All host-city pins of that country (still grouped per main
 *    host city) + every visited site of the country (filtered by the
 *    layer visibility toggles). The user wants context: where the
 *    delegation visited inside the country.
 *
 *  - STATE: Same shape as COUNTRY, scoped to the US state.
 *
 *  - CITY / SITE: Visited sites of the city; the SITE level keeps siblings
 *    visible so the user can hop between sites without re-opening the
 *    city panel.
 *
 * Layer visibility ("host-cities", "companies", …) gates each kind; if a
 * toggle is off the corresponding markers disappear.
 */
function buildMarkers(selection: AtlasSelection, visibility: LayerVisibility): AtlasMarker[] {
  // --- helpers ---
  const hostCityPin = (cityId: string, eds: typeof editions): AtlasMarker | null => {
    const city = cities.find(c => c.id === cityId);
    if (!city) return null;
    return {
      id: `city-${city.id}`,
      name: city.name,
      coordinates: city.coordinates,
      kind: "host-city" as const,
      meta: eds.length === 1
        ? `ACE ${eds[0].number}`
        : `${eds.length} ACE editions`,
    };
  };

  const groupEditionsByMainHost = (
    pred: (e: (typeof editions)[number]) => boolean,
  ): Map<string, typeof editions> => {
    const m = new Map<string, typeof editions>();
    for (const e of editions) {
      if (!pred(e)) continue;
      const mainCityId = e.cityIds[0];
      if (!mainCityId) continue;
      const arr = m.get(mainCityId) ?? [];
      arr.push(e);
      m.set(mainCityId, arr);
    }
    return m;
  };

  const sitePin = (s: (typeof visitedSites)[number]): AtlasMarker => ({
    id: `site-${s.id}`,
    name: s.name,
    coordinates: s.coordinates,
    kind: "site" as const,
    siteType: s.type,
    meta: categoryFor(s.type).label,
  });

  // --- GLOBAL ---
  // Per analyst spec: at global zoom show ONLY country / regional markers.
  // The country-polygon layer (CountriesLayer) already paints every ACE
  // country in tinted navy, so the level-1 indicator is the polygon itself.
  // No marker pins at global — they would re-introduce the level-2 noise
  // the user explicitly asked us to avoid.
  if (selection.level === "global") {
    return [];
  }

  // --- COUNTRY ---
  // Per the analyst spec: country click reveals CITIES only — never sites.
  // Sites would clutter the country zoom and break the cities → sites
  // progressive disclosure rule. Each visited city of an ACE edition gets
  // a host-city pin (even cities that are not the main host).
  //
  // SPECIAL CASE — United States: state is a required navigation level. At
  // country=us we replace city pins with one aggregated state badge per
  // ACE-related state. The user must click into a state before any city
  // pins appear. This stops 30+ city pins from carpeting the map the
  // moment the US is selected.
  if (selection.level === "country" && selection.countryId === "us") {
    return statesByCountry("us")
      .filter(s => s.editionIds.length > 0)
      .map(s => {
        const stateCities = cities.filter(c => c.stateId === s.id);
        const stateSites = visitedSites.filter(v => v.stateId === s.id);
        return {
          id: `state-${s.id}`,
          name: s.name,
          coordinates: s.coordinates,
          kind: "state" as const,
          stateAbbr: s.abbreviation,
          meta: `${s.editionIds.length} ed · ${stateCities.length} cit${stateCities.length === 1 ? "y" : "ies"} · ${stateSites.length} sites`,
        };
      });
  }

  // Non-US countries: country click reveals EDITION markers (one pin per
  // ACE edition hosted in that country). Even when two editions share the
  // same city — e.g. Córdoba hosted ACE 4 (2015) and ACE 22 (2025) — we
  // render two separate pins, slightly offset so they don't visually
  // overlap. Sites and host-city pins do NOT appear at country level any
  // more; that's now a property of the edition level below.
  if (selection.level === "country" && selection.countryId) {
    const countryEds = editions.filter(e => e.countryId === selection.countryId);

    // Group editions sharing the same anchor city, then spread them apart.
    // Anchor coords come from the edition's main host city (cityIds[0]).
    const byCity = new Map<string, typeof countryEds>();
    for (const e of countryEds) {
      const key = e.cityIds[0] ?? "_no_city";
      const arr = byCity.get(key) ?? [];
      arr.push(e);
      byCity.set(key, arr);
    }

    const markers: AtlasMarker[] = [];
    for (const [cityKey, eds] of byCity) {
      const anchor = cities.find(c => c.id === cityKey)?.coordinates;
      if (!anchor) continue;
      // Spread N editions across roughly ±0.5° longitude so the pins read as
      // separate clickable targets at country zoom (~5).
      const span = 0.5;
      const step = eds.length > 1 ? span / (eds.length - 1) : 0;
      eds.forEach((e, i) => {
        const offsetLng = eds.length > 1 ? -span / 2 + i * step : 0;
        markers.push({
          id: `edition-${e.id}`,
          name: `ACE ${e.number} — ${editionRegion(e)}`,
          coordinates: { lat: anchor.lat, lng: anchor.lng + offsetLng },
          kind: "edition" as const,
          editionNumber: e.number,
          meta: `${new Date(e.startDate).getFullYear()}`,
        });
      });
    }
    return markers;
  }

  // --- EDITION (non-US drill-down) ---
  // Edition click reveals the edition's host cities only — never sites.
  // Cities and sites visited under this edition are scoped by edition.cityIds
  // (no global "all cities of country" leakage).
  if (selection.level === "edition" && selection.editionId) {
    if (!visibility["host-cities"]) return [];
    const ed = editions.find(e => e.id === selection.editionId);
    if (!ed) return [];
    return ed.cityIds
      .map((cid): AtlasMarker | null => {
        const city = cities.find(c => c.id === cid);
        if (!city) return null;
        return {
          id: `city-${city.id}`,
          name: city.name,
          coordinates: city.coordinates,
          kind: "host-city",
          meta: `ACE ${ed.number}`,
        };
      })
      .filter((m): m is AtlasMarker => !!m);
  }

  // --- STATE (US drill-down) ---
  // Same rule as country: cities only, no sites.
  if (selection.level === "state" && selection.stateId) {
    if (!visibility["host-cities"]) return [];
    return cities
      .filter(c => c.stateId === selection.stateId)
      .filter(c => c.editionIds.length > 0)
      .map(c => {
        const eds = c.editionIds
          .map(id => editions.find(e => e.id === id))
          .filter((e): e is (typeof editions)[number] => !!e);
        return hostCityPin(c.id, eds);
      })
      .filter((m): m is AtlasMarker => !!m);
  }

  // --- CITY ---
  // When the user drilled in via an edition (selection.editionId set), only
  // show that edition's sites — Córdoba 2015 vs 2025 must not bleed.
  if (selection.level === "city" && selection.cityId) {
    return visitedSites
      .filter(s => s.cityId === selection.cityId)
      .filter(s => !selection.editionId || s.relatedEditionIds.includes(selection.editionId))
      .filter(s => visibility[categoryFor(s.type).layerId])
      .map(sitePin);
  }

  // --- SITE (siblings preserved per UX spec) ---
  if (selection.level === "site" && selection.siteId) {
    const selected = visitedSites.find(x => x.id === selection.siteId);
    if (!selected) return [];
    const cityId = selection.cityId ?? selected.cityId;
    return visitedSites
      .filter(s => s.cityId === cityId)
      .filter(s => !selection.editionId || s.relatedEditionIds.includes(selection.editionId))
      .filter(s => visibility[categoryFor(s.type).layerId])
      .map(sitePin);
  }

  return [];
}

function viewportFor(selection: AtlasSelection): { center: [number, number]; zoom: number } {
  if (selection.level === "country" && selection.countryId) {
    const c = countries.find(x => x.id === selection.countryId);
    if (c) return {
      center: [c.coordinates.lat, c.coordinates.lng],
      zoom: selection.countryId === "us" ? US_COUNTRY_ZOOM : ZOOM_BY_LEVEL.country,
    };
  }
  if (selection.level === "edition" && selection.editionId) {
    const ed = editions.find(e => e.id === selection.editionId);
    const mainCity = ed?.cityIds[0]
      ? cities.find(c => c.id === ed.cityIds[0])
      : undefined;
    if (mainCity) return {
      center: [mainCity.coordinates.lat, mainCity.coordinates.lng],
      zoom: ZOOM_BY_LEVEL.edition,
    };
  }
  if (selection.level === "state" && selection.stateId) {
    const st = stateById(selection.stateId);
    if (st) return { center: [st.coordinates.lat, st.coordinates.lng], zoom: ZOOM_BY_LEVEL.state };
  }
  if (selection.level === "city" && selection.cityId) {
    const ct = cities.find(x => x.id === selection.cityId);
    if (ct) return { center: [ct.coordinates.lat, ct.coordinates.lng], zoom: ZOOM_BY_LEVEL.city };
  }
  if (selection.level === "site" && selection.siteId) {
    const st = visitedSites.find(x => x.id === selection.siteId);
    if (st) return { center: [st.coordinates.lat, st.coordinates.lng], zoom: ZOOM_BY_LEVEL.site };
  }
  return { center: [10, -75], zoom: ZOOM_BY_LEVEL.global };
}

export function AtlasShell() {
  const [selection, setSelection] = useState<AtlasSelection>({ level: "global" });
  const [panelOpen, setPanelOpen] = useState(true);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY);
  const [searchOpen, setSearchOpen] = useState(false);
  // Bumps each time the user presses the Recenter button. Lets the user
  // re-fly to the same selection (after panning manually) — without it,
  // the FlyToController dedupes by value and the second click is a noop.
  const [recenterTick, setRecenterTick] = useState(0);

  // Cmd/Ctrl + K toggles the search modal — universal shortcut, doesn't
  // collide with native browser keymaps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const markers = useMemo(() => buildMarkers(selection, layerVisibility), [selection, layerVisibility]);
  const flyTo = useMemo(() => viewportFor(selection), [selection]);

  // Delegation arcs — rendered when the user is focused on an edition,
  // a US state, or a non-US country. Each arc links a host city to a
  // represented home country, weight = participant count. Tells the
  // institutional story spatially: who travelled, and from where.
  //
  // The arcs adapt to the current scope:
  //  - level "edition" → that one edition only.
  //  - level "state"   → the union of every edition held in that state.
  //  - level "country" → every edition held in that country (skipped for
  //    the US to avoid 13 overlapping fan-outs; the user is expected to
  //    drill into a state first).
  const connectionPaths = useMemo(() => {
    // Pick which editions feed the arcs given the current selection.
    let scopedEditions: typeof editions = [];
    if (selection.level === "edition" && selection.editionId) {
      const ed = editions.find(e => e.id === selection.editionId);
      if (ed) scopedEditions = [ed];
    } else if (selection.level === "state" && selection.stateId) {
      scopedEditions = editions.filter(e => e.stateId === selection.stateId);
    } else if (selection.level === "country" && selection.countryId && selection.countryId !== "us") {
      scopedEditions = editions.filter(e => e.countryId === selection.countryId);
    }
    if (scopedEditions.length === 0) return [];

    // Aggregate (host city, home country) → participant count across the
    // scoped editions. A delegate who attended two editions in the same
    // state is counted once per edition — the arcs are about traffic, not
    // unique people.
    const buckets = new Map<string, { fromLat: number; fromLng: number; toLat: number; toLng: number; weight: number }>();

    for (const ed of scopedEditions) {
      // Multi-city editions (e.g. ACE 2 Mexico City + Guadalajara, ACE 6
      // Toronto + KW + Hamilton) need arcs from EVERY host city, not just
      // the first one — otherwise the secondary cities sit on the map
      // disconnected from the network they're a part of.
      const hostCityList = ed.cityIds
        .map(cid => cities.find(c => c.id === cid))
        .filter((c): c is NonNullable<typeof c> => !!c);
      if (hostCityList.length === 0) continue;

      for (const p of participantsByEdition(ed.id)) {
        if (p.countryId === ed.countryId) continue; // skip the host country itself
        // Multilateral participants don't have a meaningful home country
        // centroid — arcs to a phantom (0,0) point would just confuse.
        if (p.countryId === "intl") continue;
        const country = countries.find(c => c.id === p.countryId);
        if (!country?.coordinates) continue;
        const { lat, lng } = country.coordinates;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        if (lat === 0 && lng === 0) continue;

        for (const hostCity of hostCityList) {
          const key = `${hostCity.id}|${p.countryId}`;
          const existing = buckets.get(key);
          if (existing) {
            existing.weight += 1;
          } else {
            buckets.set(key, {
              fromLat: hostCity.coordinates.lat,
              fromLng: hostCity.coordinates.lng,
              toLat: lat,
              toLng: lng,
              weight: 1,
            });
          }
        }
      }
    }

    const paths: { points: [number, number][]; weight: number }[] = [];
    for (const b of buckets.values()) {
      paths.push({
        points: bezierArc([b.fromLat, b.fromLng], [b.toLat, b.toLng], 30, 0.18),
        weight: b.weight,
      });
    }
    return paths;
  }, [selection]);

  const selectedCountry = selection.countryId ? countries.find(c => c.id === selection.countryId) : undefined;

  const handleCountryFromPolygon = (isoCode: string) => {
    // Empty string is the layer's signal that the user clicked a non-ACE
    // country (or the ocean) — collapse back to the global overview.
    if (!isoCode) {
      setSelection({ level: "global" });
      return;
    }
    const match = countries.find(c => c.isoCode === isoCode);
    if (!match) {
      setSelection({ level: "global" });
      return;
    }
    setSelection({ level: "country", countryId: match.id });
  };

  const handleSelectStateFromPolygon = (stateId: string) => {
    setSelection({ level: "state", countryId: "us", stateId });
  };

  // The US states layer overlays whenever the user is anywhere inside the US.
  const showUsStates = selection.countryId === "us" && selection.level !== "global";

  const selectedMarkerId = selection.siteId
    ? `site-${selection.siteId}`
    : selection.cityId
      ? `city-${selection.cityId}`
      : undefined;

  const handleSelectMarker = (m: AtlasMarker) => {
    if (m.id.startsWith("edition-")) {
      const editionId = m.id.replace("edition-", "");
      const ed = editions.find(e => e.id === editionId);
      if (!ed) return;
      setSelection({ level: "edition", countryId: ed.countryId, editionId });
      return;
    }
    if (m.id.startsWith("state-")) {
      const stateId = m.id.replace("state-", "");
      setSelection({ level: "state", countryId: "us", stateId });
      return;
    }
    if (m.id.startsWith("city-")) {
      const cityId = m.id.replace("city-", "");
      const city = cities.find(c => c.id === cityId);
      if (!city) return;
      // Detour: when clicking a US city directly from the global view, drill
      // through the state level first so the breadcrumb stays full.
      if (city.stateId && selection.level === "global") {
        setSelection({ level: "state", countryId: city.countryId, stateId: city.stateId });
        return;
      }
      // Preserve editionId so Córdoba 2015 vs 2025 stay scoped — when the
      // user drilled in through an edition pin we keep the filter.
      setSelection({
        level: "city",
        countryId: city.countryId,
        stateId: city.stateId,
        editionId: selection.editionId,
        cityId,
      });
    } else if (m.id.startsWith("site-")) {
      const siteId = m.id.replace("site-", "");
      const s = visitedSites.find(x => x.id === siteId);
      if (!s) return;
      setSelection({
        level: "site",
        countryId: s.countryId,
        stateId: s.stateId,
        editionId: selection.editionId,
        cityId: s.cityId,
        siteId,
      });
    }
  };

  return (
    <div className="px-4 md:px-6 pt-4 pb-6 max-w-canvas mx-auto">
      <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)] min-h-[640px]">
        {/* Map column — rounded outer shell with subtle inner border */}
        <div className="flex-1 relative min-w-0 h-full rounded-3xl overflow-hidden border border-surface-border bg-white shadow-card">
          <div className="absolute inset-0">
            <AtlasMap
              markers={markers}
              selectedMarkerId={selectedMarkerId}
              selectedIsoCode={selectedCountry?.isoCode}
              onSelectCountry={handleCountryFromPolygon}
              onSelectMarker={handleSelectMarker}
              flyTo={flyTo}
              showUsStates={showUsStates}
              selectedStateId={selection.stateId}
              onSelectState={handleSelectStateFromPolygon}
              connectionPaths={connectionPaths}
              recenterTick={recenterTick}
              level={selection.level}
              onClearOutside={() => {
                // Only collapse to global when there IS something to collapse;
                // a click on the basemap from the global view would be a noop.
                if (selection.level !== "global") {
                  setSelection({ level: "global" });
                }
              }}
            />
          </div>

          <AtlasStatsOverlay selection={selection} />

          {/* Breadcrumb pill — slim, white, glass, centered above the map */}
          <div className="absolute top-[92px] left-1/2 -translate-x-1/2 z-440 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md border border-white/70 shadow-panel rounded-full px-3.5 py-1.5">
              <AtlasBreadcrumb selection={selection} onNavigate={setSelection} />
            </div>
          </div>

          {/* Map controls cluster — top right, glass */}
          <div className="absolute top-4 right-4 z-445 flex flex-col gap-2 pointer-events-auto w-[280px]">
            <div className="flex gap-2 self-end flex-wrap justify-end">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-10 h-10 bg-white/95 backdrop-blur-md border border-white/70 shadow-card rounded-xl flex items-center justify-center text-ink hover:bg-white hover:shadow-card-hover transition"
                aria-label="Search the Atlas"
                title="Search · ⌘K"
              >
                <Search size={16} />
              </button>
              <Link
                href="/map/editions"
                className="w-10 h-10 bg-white/95 backdrop-blur-md border border-white/70 shadow-card rounded-xl flex items-center justify-center text-ink hover:bg-white hover:shadow-card-hover transition"
                aria-label="Map editions — poster view"
                title="Map editions"
              >
                <LayoutGrid size={16} />
              </Link>
              {selection.level !== "global" && (
                <button
                  onClick={() => setSelection({ level: "global" })}
                  className="w-10 h-10 bg-white/95 backdrop-blur-md border border-white/70 shadow-card rounded-xl flex items-center justify-center text-ink hover:bg-white hover:shadow-card-hover transition"
                  aria-label="Reset to global view"
                  title="Reset to global view"
                >
                  <Globe2 size={16} />
                </button>
              )}
              <button
                onClick={() => setRecenterTick(t => t + 1)}
                className="w-10 h-10 bg-white/95 backdrop-blur-md border border-white/70 shadow-card rounded-xl flex items-center justify-center text-ink hover:bg-white hover:shadow-card-hover transition"
                aria-label="Recenter on selection"
                title="Recenter on current selection"
              >
                <Crosshair size={16} />
              </button>
              <button
                onClick={() => setPanelOpen(o => !o)}
                className="w-10 h-10 bg-white/95 backdrop-blur-md border border-white/70 shadow-card rounded-xl flex items-center justify-center text-ink hover:bg-white transition lg:hidden"
                aria-label="Toggle panel"
              >
                <PanelRight size={16} />
              </button>
            </div>
            <MapLayerControl visibility={layerVisibility} onChange={setLayerVisibility} />
          </div>

          {selection.level === "global" && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-440 pointer-events-none">
              <div className="bg-ink/90 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide px-3.5 py-1.5 rounded-full shadow-panel">
                Click a colored country to explore
              </div>
            </div>
          )}
        </div>

        {/* Right rail panel */}
        {panelOpen && <AtlasPanel selection={selection} onNavigate={setSelection} />}

        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-445 bg-white border border-surface-border rounded-l-xl px-3 py-3 items-center gap-1.5 text-xs font-semibold text-ink shadow-panel hover:shadow-card-hover transition-shadow"
          >
            <PanelRight size={14} /> Details
          </button>
        )}
      </div>

      <AtlasSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(s) => setSelection(s)}
      />
    </div>
  );
}
