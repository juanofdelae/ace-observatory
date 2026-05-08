"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { editions } from "@/data/editions";
import { participantsByEdition } from "@/data/participants";
import { sitesByEdition } from "@/data/visited-sites";
import { reports } from "@/data/reports";
import { countryById } from "@/data/countries";
import { cityById } from "@/data/cities";
import { sectors } from "@/data/sectors";
import { ArrowLeft, ArrowRight, Calendar, GitCompareArrows, MapPin, Users, Building2, Tag, FileSignature } from "lucide-react";
import { formatDateRange } from "@/lib/utils";

const sectorById = (id: string) => sectors.find(s => s.id === id);

export default function ComparePage() {
  const sortedEditions = [...editions].sort((a, b) => a.number - b.number);

  // Pre-pick a useful pair: first vs last by default. Easy to swap from
  // the dropdowns. Cordoba 2015 vs Cordoba 2025 is the iconic pair the
  // observatory was built to surface.
  const [aId, setAId] = useState<string>(
    editions.find(e => e.id === "ace-4-cordoba-2015")?.id ?? sortedEditions[0]?.id ?? "",
  );
  const [bId, setBId] = useState<string>(
    editions.find(e => e.id === "ace-22-cordoba-2025")?.id ?? sortedEditions[sortedEditions.length - 1]?.id ?? "",
  );

  const a = useMemo(() => buildView(aId), [aId]);
  const b = useMemo(() => buildView(bId), [bId]);

  const sharedSectors = useMemo(() => {
    if (!a || !b) return [];
    return [...a.sectors].filter(s => b.sectors.has(s));
  }, [a, b]);

  const sharedCountries = useMemo(() => {
    if (!a || !b) return [];
    return [...a.originCountries].filter(c => b.originCountries.has(c));
  }, [a, b]);

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      <div>
        <Link
          href="/editions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-ink"
        >
          <ArrowLeft size={12} /> Back to editions
        </Link>
      </div>

      <header className="bg-white rounded-2xl border border-surface-border shadow-card p-6 md:p-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-blue mb-2">
          Side-by-side comparison
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight flex items-center gap-3">
          <GitCompareArrows size={26} className="text-accent-blue" />
          Compare two editions
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-3xl">
          Pick any two ACE editions and read them side by side — host
          cities, sectors, delegate roster size, origin countries, sites,
          reports and overlap. The default pair (Córdoba 2015 vs Córdoba
          2025) shows what changed in a decade for the same region.
        </p>

        {/* Selectors */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditionPicker label="Edition A" value={aId} onChange={setAId} options={sortedEditions} />
          <EditionPicker label="Edition B" value={bId} onChange={setBId} options={sortedEditions} />
        </div>
      </header>

      {/* Side-by-side cards */}
      {a && b && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditionPanel view={a} accent="#0B1F3A" />
            <EditionPanel view={b} accent="#F97316" />
          </div>

          {/* Numeric delta strip */}
          <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5 md:p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted mb-4">
              Delta
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <DeltaTile label="Delegates" a={a.delegates.length} b={b.delegates.length} />
              <DeltaTile label="Origin countries" a={a.originCountries.size} b={b.originCountries.size} />
              <DeltaTile label="Host cities" a={a.cities.length} b={b.cities.length} />
              <DeltaTile label="Visited sites" a={a.sites.length} b={b.sites.length} />
              <DeltaTile label="Sectors" a={a.sectors.size} b={b.sectors.size} />
            </div>
          </section>

          {/* Overlap panel */}
          <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5 md:p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted mb-3">
              Overlap
            </div>
            <h2 className="text-lg font-bold text-ink tracking-tight">
              What both editions share
            </h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Sectors in common · {sharedSectors.length}
                </div>
                {sharedSectors.length === 0 ? (
                  <div className="text-xs text-text-muted">
                    No sector overlap between {a.edition.name} and {b.edition.name}.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {sharedSectors.map(id => {
                      const s = sectorById(id);
                      return s ? (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${s.color}15`,
                            color: s.color,
                            border: `1px solid ${s.color}33`,
                          }}
                        >
                          <Tag size={9} /> {s.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Origin countries in common · {sharedCountries.length}
                </div>
                {sharedCountries.length === 0 ? (
                  <div className="text-xs text-text-muted">
                    No country overlap among delegates.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {sharedCountries.map(id => {
                      const c = countryById(id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary"
                        >
                          {c?.name ?? id.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

interface EditionView {
  edition: (typeof editions)[number];
  cities: { id: string; name: string }[];
  sites: { id: string; name: string; type: string }[];
  delegates: ReturnType<typeof participantsByEdition>;
  originCountries: Set<string>;
  sectors: Set<string>;
  report?: (typeof reports)[number];
}

function buildView(eid: string): EditionView | null {
  const edition = editions.find(e => e.id === eid);
  if (!edition) return null;
  const cities = edition.cityIds
    .map(id => cityById(id))
    .filter((c): c is NonNullable<ReturnType<typeof cityById>> => !!c)
    .map(c => ({ id: c.id, name: c.name }));
  const sites = sitesByEdition(eid).map(s => ({ id: s.id, name: s.name, type: s.type }));
  const delegates = participantsByEdition(eid);
  const originCountries = new Set<string>();
  for (const p of delegates) if (p.countryId !== "intl") originCountries.add(p.countryId);
  const sectorSet = new Set<string>();
  for (const s of sites) {
    const site = sitesByEdition(eid).find(x => x.id === s.id);
    site?.sectorIds.forEach(id => sectorSet.add(id));
  }
  const report = reports.find(r => r.editionId === eid);
  return {
    edition,
    cities,
    sites,
    delegates,
    originCountries,
    sectors: sectorSet,
    report,
  };
}

function EditionPicker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: typeof editions;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white border border-surface-border rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:border-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
      >
        {options.map(e => (
          <option key={e.id} value={e.id}>
            ACE {e.number} — {e.name} ({new Date(e.startDate).getFullYear()})
          </option>
        ))}
      </select>
    </label>
  );
}

function EditionPanel({ view, accent }: { view: EditionView; accent: string }) {
  const country = countryById(view.edition.countryId);
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
      <div className="h-1.5" style={{ background: accent }} />
      <div className="p-5 md:p-6 space-y-4">
        <div>
          <div
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: accent }}
          >
            ACE {view.edition.number}
          </div>
          <h3 className="text-lg md:text-xl font-bold text-ink leading-tight mt-1">
            {view.edition.name}
          </h3>
          <div className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
            <Calendar size={11} />
            {formatDateRange(view.edition.startDate, view.edition.endDate)}
            <span>·</span>
            {country?.name}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Delegates" value={view.delegates.length} icon={Users} />
          <Stat label="Origin countries" value={view.originCountries.size} icon={MapPin} />
          <Stat label="Host cities" value={view.cities.length} icon={MapPin} />
          <Stat label="Visited sites" value={view.sites.length} icon={Building2} />
        </div>

        {view.cities.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Host cities
            </div>
            <div className="flex flex-wrap gap-1">
              {view.cities.map(c => (
                <span
                  key={c.id}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {view.sectors.size > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Sectors
            </div>
            <div className="flex flex-wrap gap-1">
              {[...view.sectors].map(id => {
                const s = sectorById(id);
                return s ? (
                  <span
                    key={id}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${s.color}15`,
                      color: s.color,
                      border: `1px solid ${s.color}33`,
                    }}
                  >
                    {s.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {view.report?.loiSummary && (
          <div className="rounded-lg bg-surface-canvas border border-surface-border px-3 py-2 flex items-center gap-2">
            <FileSignature size={14} className="text-accent-blue" />
            <div className="text-[12px] text-text-secondary">
              <strong className="text-ink">{view.report.loiSummary.total}</strong> Letters of intent documented
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-surface-border space-y-1.5">
          <Link
            href={`/editions/${view.edition.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-blue hover:text-ink"
          >
            Open edition detail <ArrowRight size={11} />
          </Link>
          {view.report && (
            <div>
              <Link
                href={`/reports/${view.report.id}`}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-blue hover:text-ink"
              >
                Open report intelligence <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-lg bg-surface-canvas border border-surface-border px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
        <Icon size={11} />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-ink leading-none tabular-nums">
        {value}
      </div>
    </div>
  );
}

function DeltaTile({ label, a, b }: { label: string; a: number; b: number }) {
  const diff = b - a;
  const sign = diff > 0 ? "+" : diff < 0 ? "" : "";
  const color =
    diff > 0 ? "#10B981" : diff < 0 ? "#EF4444" : "#94A3B8";
  return (
    <div className="rounded-lg bg-surface-canvas border border-surface-border px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-ink leading-none tabular-nums">
        {sign}
        {diff}
      </div>
      <div className="mt-1.5 text-[10px] text-text-muted tabular-nums">
        {a} → {b}
      </div>
      <div
        className="mt-1.5 h-1 rounded-full"
        style={{ background: color, opacity: 0.6 }}
      />
    </div>
  );
}
