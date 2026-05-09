"use client";
import type { AtlasSelection, VisitedSite } from "@/types";
import { countryById } from "@/data/countries";
import { stateById, statesByCountry } from "@/data/states";
import { cityById, citiesByCountry, citiesByState } from "@/data/cities";
import { editions, editionsByCountry, editionById } from "@/data/editions";
import { siteById, sitesByCity, sitesByCountry, sitesByEdition } from "@/data/visited-sites";
import { participantsByEdition, participants, participantsByCountry } from "@/data/participants";
import { visitedSites } from "@/data/visited-sites";
import { mediaByEdition } from "@/data/media";
import { outcomesByCountry, outcomes } from "@/data/outcomes";
import { sectors } from "@/data/sectors";
import { Badge } from "@/components/ui/Badge";
import { formatDateRange, formatNumber, editionRegion } from "@/lib/utils";
import {
  Building2, Calendar, MapPin, Users, ChevronRight, Sparkles,
  Image as ImgIcon, ExternalLink, Globe2, Layers, Tag,
} from "lucide-react";
import Link from "next/link";
import { categoryFor, type SiteCategory } from "./siteTypeConfig";

interface Props {
  selection: AtlasSelection;
  onNavigate: (s: AtlasSelection) => void;
}

export function AtlasPanel({ selection, onNavigate }: Props) {
  return (
    <aside className="w-full lg:w-[380px] shrink-0 bg-white rounded-3xl border border-surface-border shadow-card overflow-hidden h-full">
      <div className="h-full overflow-y-auto thin-scroll p-5 md:p-6 space-y-5">
        {selection.level === "global" && <GlobalView onNavigate={onNavigate} />}
        {selection.level === "country" && selection.countryId && (
          <CountryView countryId={selection.countryId} onNavigate={onNavigate} />
        )}
        {selection.level === "edition" && selection.editionId && (
          <EditionView editionId={selection.editionId} onNavigate={onNavigate} />
        )}
        {selection.level === "state" && selection.stateId && (
          <StateView stateId={selection.stateId} onNavigate={onNavigate} />
        )}
        {selection.level === "city" && selection.cityId && (
          <CityView
            cityId={selection.cityId}
            editionId={selection.editionId}
            onNavigate={onNavigate}
          />
        )}
        {selection.level === "site" && selection.siteId && (
          <SiteView siteId={selection.siteId} onNavigate={onNavigate} />
        )}
      </div>
    </aside>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof Users;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-surface-border">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
        <Icon size={12} />
        {title}
      </div>
      {count !== undefined && (
        <Badge variant="outline" className="text-[10px]">{count}</Badge>
      )}
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-surface-muted rounded-lg p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-0.5 text-lg font-bold" style={{ color: color ?? "#0B1F3A" }}>
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
    </div>
  );
}

function DrillRow({
  label,
  meta,
  category,
  onClick,
}: {
  label: string;
  meta?: string;
  category?: SiteCategory;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-2 px-2 -mx-2 rounded-md hover:bg-surface-subtle text-left group"
    >
      {category && (
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${category.color}1a`, border: `1px solid ${category.color}33` }}
        >
          <category.icon size={13} color={category.color} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink truncate">{label}</div>
        {meta && <div className="text-[11px] text-text-muted truncate">{meta}</div>}
      </div>
      <ChevronRight size={14} className="text-text-muted group-hover:text-ink shrink-0" />
    </button>
  );
}

function ActionButton({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "block text-center text-xs font-medium text-brand-blue-bright hover:text-brand-blue-mid py-2 border border-surface-border rounded-md hover:border-brand-blue-bright/50 transition-colors";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        <span className="inline-flex items-center gap-1.5">
          {children}
          <ExternalLink size={11} />
        </span>
      </a>
    );
  }
  return <Link href={href} className={className}>{children}</Link>;
}

// Group sites by their layer/category bucket so the city panel can list them
// by type instead of as a flat list.
function groupSitesByCategory(sites: VisitedSite[]) {
  const groups = new Map<string, { category: SiteCategory; sites: VisitedSite[] }>();
  for (const s of sites) {
    const cat = categoryFor(s.type);
    const key = cat.layerId;
    if (!groups.has(key)) groups.set(key, { category: cat, sites: [] });
    groups.get(key)!.sites.push(s);
  }
  return [...groups.values()];
}

// ---------- Level views ----------

function GlobalView({ onNavigate }: { onNavigate: Props["onNavigate"] }) {
  // All editions sorted newest-first so the most recent ACE shows up at top
  // of the list — matches user mental model of "what's happening now".
  const sortedEditions = [...editions].sort((a, b) => b.number - a.number);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue-bright">
          ACE Atlas · Overview
        </div>
        <h2 className="text-lg font-bold text-ink mt-1">Americas Competitiveness Exchange</h2>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          A decade-long OAS program connecting leaders across the Americas. Select a country or host city on the map to explore in detail.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label="Editions"
          value={`${editions.length}`}
          color="#0B1F3A"
        />
        <StatTile
          label="Countries represented"
          value={`${
            new Set(participants.map(p => p.countryId).filter(c => c && c !== "intl")).size
          }`}
          color="#2563EB"
        />
        <StatTile
          label="Verified delegates"
          value={`${participants.length}`}
          color="#14B8A6"
        />
        <StatTile
          label="Sites visited"
          value={`${visitedSites.length}`}
          color="#F97316"
        />
      </div>

      {/* Edition picker — primary drill target at the global level. Click
          jumps the map straight to the edition view (host cities of that
          ACE). Newest first so latest editions are above the fold. */}
      <div>
        <SectionTitle icon={Calendar} title="ACE editions" count={sortedEditions.length} />
        <div className="mt-2 space-y-0.5 max-h-[360px] overflow-y-auto thin-scroll pr-1">
          {sortedEditions.map(e => {
            const country = countryById(e.countryId);
            const mainCity = e.cityIds[0] ? cityById(e.cityIds[0]) : undefined;
            const year = new Date(e.startDate).getFullYear();
            const place = [mainCity?.name, country?.name].filter(Boolean).join(", ");
            return (
              <DrillRow
                key={e.id}
                label={`ACE ${e.number} — ${editionRegion(e)}`}
                meta={`${year}${formatDateRange(e.startDate, e.endDate) ? ` · ${formatDateRange(e.startDate, e.endDate)}` : ""}`}
                onClick={() => onNavigate({ level: "edition", countryId: e.countryId, editionId: e.id })}
              />
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-surface-border">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
          How to navigate
        </div>
        <ol className="text-xs text-text-secondary space-y-1.5 list-decimal pl-4">
          <li>Click any colored country to open its summary.</li>
          <li>Inside the US, drill into a state, then a city.</li>
          <li>From a city, open visited sites to see the full detail.</li>
        </ol>
      </div>

      <div className="pt-3 border-t border-surface-border">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
          <Layers size={12} /> Site categories
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          {([
            { label: "Universities", color: "#7C3AED" },
            { label: "Companies", color: "#14B8A6" },
            { label: "Innovation hubs", color: "#2563EB" },
            { label: "Research labs", color: "#0891B2" },
            { label: "Government", color: "#0B1F3A" },
            { label: "Infrastructure", color: "#F59E0B" },
          ]).map(c => (
            <div key={c.label} className="flex items-center gap-1.5 text-text-secondary">
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CountryView({ countryId, onNavigate }: { countryId: string; onNavigate: Props["onNavigate"] }) {
  const country = countryById(countryId);
  if (!country) return null;
  const countryEditions = editionsByCountry(countryId);
  const countryStates = statesByCountry(countryId);
  const countryCities = citiesByCountry(countryId);
  const countryParticipants = participantsByCountry(countryId);
  const countryOutcomes = outcomesByCountry(countryId);
  const countrySites = sitesByCountry(countryId);
  const countrySectorIds = new Set<string>();
  countrySites.forEach(s => s.sectorIds.forEach(id => countrySectorIds.add(id)));
  const countryInstitutions = countryCities.reduce((sum, c) => sum + c.institutionIds.length, 0);

  const isUS = countryId === "us";

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue-bright">
          Country
        </div>
        <h2 className="text-xl font-bold text-ink mt-1 flex items-center gap-2">
          {country.name}
          <span className="text-xs font-mono text-text-muted">{country.isoCode}</span>
        </h2>
        <p className="text-xs text-text-muted mt-0.5">{country.region}</p>
      </div>

      {isUS ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Editions" value={country.aceEditionsCount} color="#0B1F3A" />
            <StatTile label="ACE-related states" value={countryStates.length} color="#2563EB" />
            <StatTile label="Host cities" value={country.citiesCount} color="#F97316" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Delegates" value={country.participantsCount} color="#0891B2" />
            <StatTile label="Visited sites" value={countrySites.length} color="#14B8A6" />
            <StatTile label="Outcomes" value={countryOutcomes.length} color="#7C3AED" />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Editions" value={country.aceEditionsCount} color="#0B1F3A" />
            <StatTile label="Cities" value={country.citiesCount} color="#2563EB" />
            <StatTile label="Delegates" value={country.participantsCount} color="#F97316" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Visited sites" value={countrySites.length} color="#14B8A6" />
            <StatTile label="Institutions" value={countryInstitutions} color="#0891B2" />
            <StatTile label="Outcomes" value={countryOutcomes.length} color="#7C3AED" />
          </div>
        </>
      )}

      {isUS && countryStates.length > 0 && (
        <div>
          <SectionTitle icon={MapPin} title="ACE-related US states" count={countryStates.length} />
          <div className="mt-2 space-y-0.5">
            {countryStates.map(s => {
              const sCities = citiesByState(s.id);
              const sSites = sCities.flatMap(c => sitesByCity(c.id));
              return (
                <DrillRow
                  key={s.id}
                  label={`${s.name} · ${s.abbreviation}`}
                  meta={`${s.cityIds.length} host cit${s.cityIds.length === 1 ? "y" : "ies"} · ${s.editionIds.length} edition${s.editionIds.length === 1 ? "" : "s"} · ${sSites.length} site${sSites.length === 1 ? "" : "s"}`}
                  onClick={() => onNavigate({ level: "state", countryId, stateId: s.id })}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Non-US countries: editions are the primary drill target. Even when
          two editions share the same city (e.g. Córdoba 2015 vs 2025) each
          renders its own row so the user can pick a specific year. */}
      {!isUS && countryEditions.length > 0 && (
        <div>
          <SectionTitle icon={Calendar} title="Related ACE editions" count={countryEditions.length} />
          <div className="mt-2 space-y-0.5">
            {countryEditions.map(e => {
              const mainCity = e.cityIds[0] ? cityById(e.cityIds[0]) : undefined;
              return (
                <DrillRow
                  key={e.id}
                  label={`ACE ${e.number} — ${editionRegion(e)}`}
                  meta={`${formatDateRange(e.startDate, e.endDate)} · ${e.cityIds.length} cit${e.cityIds.length === 1 ? "y" : "ies"}`}
                  onClick={() => onNavigate({ level: "edition", countryId, editionId: e.id })}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* US: editions are listed below the states section (states are the
          primary drill target). Keeps the institutional read of "13 editions
          across 17 states" intact without breaking the state-aggregator UX. */}
      {isUS && countryEditions.length > 0 && (
        <div>
          <SectionTitle icon={Calendar} title="Related ACE editions" count={countryEditions.length} />
          <div className="mt-2 space-y-2">
            {countryEditions.map(e => (
              <Link
                key={e.id}
                href={`/editions/${e.id}`}
                className="block rounded-md border border-surface-border p-2.5 hover:border-ink/30 hover:bg-surface-subtle transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-ink">ACE {e.number}</div>
                  <span className="text-[10px] text-text-muted">{formatDateRange(e.startDate, e.endDate)}</span>
                </div>
                <div className="text-xs text-text-secondary mt-0.5">{editionRegion(e)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {countrySectorIds.size > 0 && (
        <div>
          <SectionTitle icon={Tag} title="Sectors" count={countrySectorIds.size} />
          <div className="mt-2 flex flex-wrap gap-1">
            {[...countrySectorIds].map(id => {
              const s = sectors.find(x => x.id === id);
              return s ? (
                <Badge key={id} variant="sector" color={s.color} className="text-[10px]">
                  {s.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}

      {countryParticipants.length > 0 && (
        <div>
          <SectionTitle icon={Users} title="Delegates" count={countryParticipants.length} />
          <div className="mt-2 text-xs text-text-secondary">
            {countryParticipants.slice(0, 5).map(p => p.name).join(" · ")}
            {countryParticipants.length > 5 && ` + ${countryParticipants.length - 5} more`}
          </div>
        </div>
      )}

      {countryOutcomes.length > 0 && (
        <div>
          <SectionTitle icon={Sparkles} title="Outcomes" count={countryOutcomes.length} />
          <div className="mt-2 space-y-1.5">
            {countryOutcomes.slice(0, 3).map(o => (
              <div key={o.id} className="text-xs">
                <span className="font-semibold text-ink">{o.title}</span>
                <span className="text-text-muted"> · {o.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear selection — return to global overview */}
      <div className="pt-3 border-t border-surface-border">
        <button
          onClick={() => onNavigate({ level: "global" })}
          className="block w-full text-center text-xs font-medium text-text-secondary hover:text-ink py-2 border border-surface-border rounded-md transition-colors"
        >
          ← Clear selection
        </button>
      </div>
    </div>
  );
}

function StateView({ stateId, onNavigate }: { stateId: string; onNavigate: Props["onNavigate"] }) {
  const state = stateById(stateId);
  if (!state) return null;
  const stateCities = citiesByState(stateId);
  const stateSites = stateCities.flatMap(c => sitesByCity(c.id));
  const stateSectorIds = new Set<string>();
  stateSites.forEach(s => s.sectorIds.forEach(id => stateSectorIds.add(id)));
  // Live participant count, deduped across all editions held in this
  // state. Falls back to the (often empty) per-city ids on the static
  // dataset only as a safety net.
  const stateParticipantIds = new Set<string>();
  for (const eid of state.editionIds) {
    for (const p of participantsByEdition(eid)) stateParticipantIds.add(p.id);
  }
  if (stateParticipantIds.size === 0) {
    stateCities.forEach(c => c.participantIds.forEach(id => stateParticipantIds.add(id)));
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue-bright">
          US State
        </div>
        <h2 className="text-xl font-bold text-ink mt-1">
          {state.name} <span className="text-sm font-mono text-text-muted">({state.abbreviation})</span>
        </h2>
        <button
          onClick={() => onNavigate({ level: "country", countryId: state.countryId })}
          className="text-[11px] text-text-muted hover:text-ink mt-0.5 flex items-center gap-1"
        >
          <Globe2 size={11} /> Back to United States
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Editions" value={state.editionIds.length} color="#0B1F3A" />
        <StatTile label="Host cities" value={state.cityIds.length} color="#2563EB" />
        <StatTile label="Visited sites" value={stateSites.length} color="#14B8A6" />
        {/* Participants share the orange of the delegation arcs on the
            map — same data, same colour, no cognitive whiplash. */}
        <StatTile label="Delegates" value={stateParticipantIds.size} color="#F97316" />
      </div>

      {stateCities.length > 0 && (
        <div>
          <SectionTitle icon={MapPin} title="Cities" count={stateCities.length} />
          <div className="mt-2 space-y-0.5">
            {stateCities.map(c => (
              <DrillRow
                key={c.id}
                label={c.name}
                meta={`${c.editionIds.length} edition${c.editionIds.length === 1 ? "" : "s"} · ${c.visitedSiteIds.length} site${c.visitedSiteIds.length === 1 ? "" : "s"}`}
                onClick={() => onNavigate({ level: "city", countryId: state.countryId, stateId, cityId: c.id })}
              />
            ))}
          </div>
        </div>
      )}

      {state.editionIds.length > 0 && (
        <div>
          <SectionTitle icon={Calendar} title="Related ACE editions" count={state.editionIds.length} />
          <div className="mt-2 space-y-2">
            {state.editionIds.map(id => {
              const e = editionById(id);
              if (!e) return null;
              return (
                <Link
                  key={e.id}
                  href={`/editions/${e.id}`}
                  className="block rounded-md border border-surface-border p-2.5 hover:border-ink/30 hover:bg-surface-subtle"
                >
                  <div className="text-sm font-semibold text-ink">ACE {e.number} — {editionRegion(e)}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {formatDateRange(e.startDate, e.endDate)}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {stateSectorIds.size > 0 && (
        <div>
          <SectionTitle icon={Tag} title="Sectors" count={stateSectorIds.size} />
          <div className="mt-2 flex flex-wrap gap-1">
            {[...stateSectorIds].map(id => {
              const s = sectors.find(x => x.id === id);
              return s ? (
                <Badge key={id} variant="sector" color={s.color} className="text-[10px]">
                  {s.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CityView({
  cityId,
  editionId,
  onNavigate,
}: {
  cityId: string;
  editionId?: string;
  onNavigate: Props["onNavigate"];
}) {
  const city = cityById(cityId);
  if (!city) return null;
  const country = countryById(city.countryId);
  const state = city.stateId ? stateById(city.stateId) : undefined;
  // When an editionId scopes the view, only show that edition's sites and
  // that edition card. This keeps Córdoba 2015 and Córdoba 2025 cleanly
  // separated even though they share the same cityId.
  const allCitySites = sitesByCity(cityId);
  const citySites = editionId
    ? allCitySites.filter(s => s.relatedEditionIds.includes(editionId))
    : allCitySites;
  const cityEditions = editionId
    ? city.editionIds.filter(id => id === editionId).map(id => editionById(id)).filter(Boolean)
    : city.editionIds.map(id => editionById(id)).filter(Boolean);
  const grouped = groupSitesByCategory(citySites);
  const citySectorIds = new Set<string>();
  citySites.forEach(s => s.sectorIds.forEach(id => citySectorIds.add(id)));

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue-bright">
          City
        </div>
        <h2 className="text-xl font-bold text-ink mt-1">{city.name}</h2>
        <div className="text-xs text-text-muted mt-0.5">
          {state ? `${state.name}, ` : ""}{country?.name}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Editions" value={cityEditions.length} color="#F97316" />
        <StatTile label="Sites" value={citySites.length} color="#14B8A6" />
        <StatTile label="Media" value={city.mediaIds.length} color="#2563EB" />
      </div>

      {cityEditions.length > 0 && (
        <div>
          <SectionTitle icon={Calendar} title="ACE editions held here" count={cityEditions.length} />
          <div className="mt-2 space-y-2">
            {cityEditions.map(e => e && (
              <Link
                key={e.id}
                href={`/editions/${e.id}`}
                className="block rounded-md border border-surface-border p-2.5 hover:border-ink/30 hover:bg-surface-subtle"
              >
                <div className="text-sm font-semibold text-ink">ACE {e.number}</div>
                <div className="text-[11px] text-text-muted">{formatDateRange(e.startDate, e.endDate)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {grouped.length > 0 && (
        <div>
          <SectionTitle icon={Building2} title="Sites visited" count={citySites.length} />
          <div className="mt-2 space-y-3">
            {grouped.map(g => (
              <div key={g.category.layerId}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                  {g.category.label} · {g.sites.length}
                </div>
                <div className="space-y-0.5">
                  {g.sites.map(s => (
                    <DrillRow
                      key={s.id}
                      label={s.name}
                      meta={s.type}
                      category={categoryFor(s.type)}
                      onClick={() => onNavigate({
                        level: "site",
                        countryId: city.countryId,
                        stateId: city.stateId,
                        editionId,
                        cityId,
                        siteId: s.id,
                      })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {citySectorIds.size > 0 && (
        <div>
          <SectionTitle icon={Tag} title="Sectors" count={citySectorIds.size} />
          <div className="mt-2 flex flex-wrap gap-1">
            {[...citySectorIds].map(id => {
              const s = sectors.find(x => x.id === id);
              return s ? (
                <Badge key={id} variant="sector" color={s.color} className="text-[10px]">
                  {s.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}

      {cityEditions.length > 0 && mediaByEdition(cityEditions[0]!.id).length > 0 && (
        <div>
          <SectionTitle icon={ImgIcon} title="Media" count={mediaByEdition(cityEditions[0]!.id).length} />
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {mediaByEdition(cityEditions[0]!.id).slice(0, 6).map(m => (
              <div
                key={m.id}
                className="aspect-square rounded-md bg-surface-muted bg-cover bg-center"
                style={m.thumbnailUrl ? { backgroundImage: `url(${m.thumbnailUrl})` } : undefined}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-surface-border space-y-2">
        {cityEditions.length > 0 && cityEditions[0] && (
          <ActionButton href={`/editions/${cityEditions[0].id}`}>
            Open edition detail
          </ActionButton>
        )}
        {country && (
          <button
            onClick={() => onNavigate(
              editionId
                ? { level: "edition", countryId: country.id, editionId }
                : state
                  ? { level: "state", countryId: country.id, stateId: state.id }
                  : { level: "country", countryId: country.id }
            )}
            className="block w-full text-center text-xs font-medium text-text-secondary hover:text-ink py-2 border border-surface-border rounded-md transition-colors"
          >
            Back to {editionId ? `ACE ${editionById(editionId)?.number ?? ""}` : state ? state.name : country.name}
          </button>
        )}
      </div>
    </div>
  );
}

function EditionView({ editionId, onNavigate }: { editionId: string; onNavigate: Props["onNavigate"] }) {
  const edition = editionById(editionId);
  if (!edition) return null;
  const country = countryById(edition.countryId);
  const editionCities = edition.cityIds
    .map(id => cityById(id))
    .filter((c): c is NonNullable<ReturnType<typeof cityById>> => !!c);
  const editionSites = sitesByEdition(editionId);
  const editionSectorIds = new Set<string>();
  editionSites.forEach(s => s.sectorIds.forEach(id => editionSectorIds.add(id)));
  // Live delegate roster from the participants directory. The
  // edition.participantIds array on the static editions dataset is empty
  // for older editions, so we always trust the live directory — same
  // signal the connection arcs draw from.
  const liveParticipants = participantsByEdition(editionId);
  const liveCountries = new Set(liveParticipants.map(p => p.countryId)).size;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue-bright">
          ACE Edition
        </div>
        <h2 className="text-xl font-bold text-ink mt-1">
          ACE {edition.number} <span className="text-text-muted font-medium">— {editionRegion(edition)}</span>
        </h2>
        <div className="text-xs text-text-muted mt-0.5">
          {formatDateRange(edition.startDate, edition.endDate)} · {country?.name}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Cities" value={editionCities.length} color="#2563EB" />
        <StatTile label="Visited sites" value={editionSites.length} color="#14B8A6" />
        <StatTile label="Delegates" value={liveParticipants.length} color="#F97316" />
        <StatTile label="Origin countries" value={liveCountries} color="#0891B2" />
      </div>

      {editionCities.length > 0 && (
        <div>
          <SectionTitle icon={MapPin} title="Host cities" count={editionCities.length} />
          <div className="mt-2 space-y-0.5">
            {editionCities.map(c => {
              const cSites = editionSites.filter(s => s.cityId === c.id);
              return (
                <DrillRow
                  key={c.id}
                  label={c.name}
                  meta={`${cSites.length} site${cSites.length === 1 ? "" : "s"} visited`}
                  onClick={() => onNavigate({
                    level: "city",
                    countryId: edition.countryId,
                    stateId: edition.stateId,
                    editionId,
                    cityId: c.id,
                  })}
                />
              );
            })}
          </div>
        </div>
      )}

      {editionSectorIds.size > 0 && (
        <div>
          <SectionTitle icon={Tag} title="Sectors" count={editionSectorIds.size} />
          <div className="mt-2 flex flex-wrap gap-1">
            {[...editionSectorIds].map(id => {
              const s = sectors.find(x => x.id === id);
              return s ? (
                <Badge key={id} variant="sector" color={s.color} className="text-[10px]">
                  {s.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-surface-border space-y-2">
        <ActionButton href={`/editions/${edition.id}`}>Open edition detail</ActionButton>
        {country && (
          <button
            onClick={() => onNavigate({ level: "country", countryId: country.id })}
            className="block w-full text-center text-xs font-medium text-text-secondary hover:text-ink py-2 border border-surface-border rounded-md transition-colors"
          >
            ← Back to {country.name}
          </button>
        )}
      </div>
    </div>
  );
}

function SiteView({ siteId, onNavigate }: { siteId: string; onNavigate: Props["onNavigate"] }) {
  const site = siteById(siteId);
  if (!site) return null;
  const country = countryById(site.countryId);
  const city = cityById(site.cityId);
  const cat = categoryFor(site.type);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue-bright">
          Visited Site
        </div>
        <div className="flex items-start gap-3 mt-1">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${cat.color}1a`, border: `1px solid ${cat.color}55` }}
          >
            <cat.icon size={18} color={cat.color} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink leading-tight">{site.name}</h2>
            <div className="text-xs text-text-muted mt-0.5">
              {cat.label} · {city?.name}, {country?.name}
            </div>
          </div>
        </div>
      </div>

      {site.image && (
        <div
          className="aspect-video rounded-lg bg-surface-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${site.image})` }}
        />
      )}

      <p className="text-sm text-text-secondary leading-relaxed">{site.description}</p>

      {site.sectorIds.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Sectors
          </div>
          <div className="flex flex-wrap gap-1">
            {site.sectorIds.map(id => {
              const s = sectors.find(x => x.id === id);
              return s ? (
                <Badge key={id} variant="sector" color={s.color} className="text-[10px]">
                  {s.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}

      <div>
        <SectionTitle icon={Calendar} title="Related editions" count={site.relatedEditionIds.length} />
        <div className="mt-2 space-y-1">
          {site.relatedEditionIds.map(id => {
            const e = editionById(id);
            if (!e) return null;
            return (
              <Link
                key={e.id}
                href={`/editions/${e.id}`}
                className="block text-xs text-ink font-medium hover:text-brand-blue-bright"
              >
                ACE {e.number} — {editionRegion(e)}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Other sites in this city — lets the user hop between sites without
          stepping back to the city panel. Per the user's interaction spec
          (preserves city/country/edition context). */}
      {(() => {
        const siblings = sitesByCity(site.cityId).filter(s => s.id !== site.id);
        if (siblings.length === 0) return null;
        return (
          <div>
            <SectionTitle icon={MapPin} title={`Other sites in ${city?.name ?? "this city"}`} count={siblings.length} />
            <div className="mt-2 space-y-0.5">
              {siblings.slice(0, 8).map(s => (
                <DrillRow
                  key={s.id}
                  label={s.name}
                  meta={s.type}
                  category={categoryFor(s.type)}
                  onClick={() => onNavigate({
                    level: "site",
                    countryId: s.countryId,
                    stateId: s.stateId,
                    cityId: s.cityId,
                    siteId: s.id,
                  })}
                />
              ))}
              {siblings.length > 8 && (
                <button
                  onClick={() => onNavigate({
                    level: "city",
                    countryId: site.countryId,
                    stateId: site.stateId,
                    cityId: site.cityId,
                  })}
                  className="text-[11px] text-brand-blue-bright hover:underline mt-1"
                >
                  + {siblings.length - 8} more — open city view
                </button>
              )}
            </div>
          </div>
        );
      })()}

      <div className="pt-3 border-t border-surface-border space-y-2">
        {site.website && (
          <ActionButton href={site.website} external>Visit website</ActionButton>
        )}
        {city && (
          <button
            onClick={() => onNavigate({
              level: "city",
              countryId: site.countryId,
              stateId: site.stateId,
              cityId: site.cityId,
            })}
            className="block w-full text-center text-xs font-medium text-text-secondary hover:text-ink py-2 border border-surface-border rounded-md transition-colors"
          >
            Back to {city.name}
          </button>
        )}
      </div>
    </div>
  );
}
