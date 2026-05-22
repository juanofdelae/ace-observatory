import Link from "next/link";
import { notFound } from "next/navigation";
import { countries, countryById } from "@/data/countries";
import { editions, editionsByCountry } from "@/data/editions";
import { citiesByCountry } from "@/data/cities";
import { sitesByCountry } from "@/data/visited-sites";
import { participants } from "@/data/participants";
import { sectors } from "@/data/sectors";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  Users,
  Globe2,
  ArrowRight,
  Map as MapIcon,
} from "lucide-react";
import { formatDateRange } from "@/lib/utils";

export function generateStaticParams() {
  return countries.map(c => ({ id: c.id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CountryProfilePage(props: PageProps) {
  const params = await props.params;
  const country = countryById(params.id);
  if (!country) notFound();

  const hostedEditions = editionsByCountry(country.id).sort(
    (a, b) => a.number - b.number,
  );
  const hostCities = citiesByCountry(country.id);
  const visitedSites = sitesByCountry(country.id);

  // Delegates whose home country is this one — uses the live participants
  // directory rather than per-city ids on the static dataset.
  const homeDelegates = participants.filter(p => p.countryId === country.id);
  // Editions ANY participant from this country attended (regardless of
  // whether the country hosted). Surfaces "outbound" engagement —
  // important for participating-only countries.
  const editionsTouched = new Set<string>();
  for (const p of homeDelegates) {
    for (const eid of p.editionIds) editionsTouched.add(eid);
  }
  const sectorsTouched = new Set<string>();
  for (const s of visitedSites) s.sectorIds.forEach(id => sectorsTouched.add(id));

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      <div>
        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-ink"
        >
          <ArrowLeft size={12} /> Back to ACE Atlas
        </Link>
      </div>

      <header className="bg-white rounded-2xl border border-surface-border shadow-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-blue">
              Country profile
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight mt-1 flex items-center gap-3">
              {country.name}
              <span className="text-sm font-mono text-text-muted">{country.isoCode}</span>
            </h1>
            <div className="text-xs text-text-muted mt-0.5">{country.region}</div>
          </div>
          <Link
            href={`/map?country=${country.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-blue hover:text-ink"
          >
            <MapIcon size={12} /> Open in Atlas
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Stat label="Editions hosted" value={hostedEditions.length} accent="#0B1F3A" />
          <Stat label="Host cities" value={hostCities.length} accent="#2563EB" />
          <Stat label="Visited sites" value={visitedSites.length} accent="#14B8A6" />
          <Stat label="Home delegates" value={homeDelegates.length} accent="#F97316" />
          <Stat label="Editions attended" value={editionsTouched.size} accent="#7C3AED" />
          <Stat label="Sectors covered" value={sectorsTouched.size} accent="#0891B2" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hosted editions */}
        <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                ACE editions hosted
              </div>
              <h2 className="text-lg font-bold text-ink mt-0.5">
                On the host side
              </h2>
            </div>
            <span className="text-[11px] font-bold text-ink tabular-nums">
              {hostedEditions.length}
            </span>
          </div>
          {hostedEditions.length === 0 ? (
            <div className="text-xs text-text-muted">
              {country.name} has not yet hosted an ACE edition. It is a
              participating country only.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {hostedEditions.map(e => (
                <li key={e.id}>
                  <Link
                    href={`/editions/${e.id}`}
                    className="flex items-center gap-3 px-3 py-2 -mx-3 rounded-lg hover:bg-surface-subtle"
                  >
                    <span className="w-9 h-9 rounded-md bg-brand-orange/10 text-brand-orange font-bold text-[12px] flex items-center justify-center shrink-0">
                      {e.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink truncate">
                        {e.name}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {formatDateRange(e.startDate, e.endDate)}
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-text-muted shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Outbound participation */}
        <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                Editions attended
              </div>
              <h2 className="text-lg font-bold text-ink mt-0.5">
                On the travelling side
              </h2>
            </div>
            <span className="text-[11px] font-bold text-ink tabular-nums">
              {editionsTouched.size}
            </span>
          </div>
          {editionsTouched.size === 0 ? (
            <div className="text-xs text-text-muted">
              No delegates from {country.name} are recorded in the directory yet.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {[...editionsTouched]
                .map(id => editions.find(e => e.id === id))
                .filter(Boolean)
                .sort((a, b) => (a!.number - b!.number))
                .map(e => e && (
                  <Link
                    key={e.id}
                    href={`/editions/${e.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider px-2 py-1 rounded-full bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white transition-colors"
                    title={e.name}
                  >
                    ACE {e.number}
                  </Link>
                ))}
            </div>
          )}
        </section>
      </div>

      {/* Host cities */}
      {hostCities.length > 0 && (
        <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                Host cities
              </div>
              <h2 className="text-lg font-bold text-ink mt-0.5">
                Where the delegations went
              </h2>
            </div>
            <span className="text-[11px] font-bold text-ink tabular-nums">
              {hostCities.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {hostCities.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-canvas border border-surface-border"
              >
                <MapPin size={14} className="text-accent-orange-cta shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink truncate">{c.name}</div>
                  <div className="text-[10px] text-text-muted">
                    {c.editionIds.length} ed · {c.visitedSiteIds.length} sites
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sectors */}
      {sectorsTouched.size > 0 && (
        <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                Sectors visited
              </div>
              <h2 className="text-lg font-bold text-ink mt-0.5">What the delegations explored</h2>
            </div>
            <span className="text-[11px] font-bold text-ink tabular-nums">
              {sectorsTouched.size}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...sectorsTouched]
              .map(id => sectors.find(s => s.id === id))
              .filter(Boolean)
              .map(s => s && (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: `${s.color}15`,
                    color: s.color,
                    border: `1px solid ${s.color}33`,
                  }}
                >
                  {s.name}
                </span>
              ))}
          </div>
        </section>
      )}

      {/* Top home delegates */}
      {homeDelegates.length > 0 && (
        <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                Home delegates
              </div>
              <h2 className="text-lg font-bold text-ink mt-0.5">
                Who represented {country.name}
              </h2>
            </div>
            <Link
              href={`/participants?countryId=${country.id}`}
              className="text-[11px] font-semibold text-accent-blue hover:text-ink inline-flex items-center gap-1"
            >
              See all <ArrowRight size={11} />
            </Link>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {homeDelegates
              .sort((a, b) => b.editionIds.length - a.editionIds.length)
              .slice(0, 16)
              .map(p => (
                <li key={p.id}>
                  <Link
                    href={`/participants/${p.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-subtle"
                  >
                    <Users size={13} className="text-text-muted shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-ink truncate">{p.name}</div>
                      <div className="text-[11px] text-text-muted truncate">{p.organization}</div>
                    </div>
                    <span className="text-[10px] font-bold text-text-muted tabular-nums shrink-0">
                      {p.editionIds.length} ed
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl bg-surface-canvas border border-surface-border px-3.5 py-3">
      <div
        className="text-2xl md:text-[26px] font-bold leading-none tracking-tight tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </div>
    </div>
  );
}
