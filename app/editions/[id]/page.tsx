import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { editionById, editions } from "@/data/editions";
import { countryById } from "@/data/countries";
import { cityById } from "@/data/cities";
import { stateById } from "@/data/states";
import { sitesByEdition } from "@/data/visited-sites";
import { participantsByEdition } from "@/data/participants";
import { outcomesByEdition } from "@/data/outcomes";
import { mediaByEdition } from "@/data/media";
import { sectors } from "@/data/sectors";
import { organizerById } from "@/data/organizers";
import { documentsByEdition } from "@/data/documents";
import { hasSurvey, surveyByEdition } from "@/data/surveys";
import { formatDateRange, editionRegion } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { Participant } from "@/types";
import { OutcomeCard } from "@/components/OutcomeCard";
import { MediaCard } from "@/components/MediaCard";
import {
  MapPin, Calendar, Users, Sparkles, GalleryHorizontalEnd, FileText, ExternalLink, ArrowLeft, Globe,
} from "lucide-react";

const MapMini = dynamic(() => import("@/components/map/MapView"), { ssr: false });
const SurveyDashboard = dynamic(() => import("@/components/SurveyDashboard").then(m => m.SurveyDashboard), { ssr: false });

export function generateStaticParams() {
  return editions.map(e => ({ id: e.id }));
}

export default function EditionDetailPage({ params }: { params: { id: string } }) {
  const e = editionById(params.id);
  if (!e) notFound();

  const country = countryById(e.countryId);
  const state = e.stateId ? stateById(e.stateId) : undefined;
  const mainCity = e.cityIds[0] ? cityById(e.cityIds[0]) : undefined;
  const sites = sitesByEdition(e.id);
  const parts = participantsByEdition(e.id);
  const outs = outcomesByEdition(e.id);
  const mediaItems = mediaByEdition(e.id);

  const mapPoints = sites.map(s => ({
    id: `site-${s.id}`,
    name: s.name,
    coordinates: s.coordinates,
    kind: "site" as const,
    meta: s.type,
    radius: 6,
  }));

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 pb-8">
      {/* Hero — large rounded panel */}
      <div className="relative h-[360px] md:h-[440px] bg-ink overflow-hidden rounded-3xl mt-6 shadow-panel">
        {e.heroImage && (
          <>
            <Image src={e.heroImage} alt={e.name} fill priority className="object-cover opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" />
          </>
        )}
        <div className="relative h-full px-7 md:px-10 flex flex-col justify-end pb-9 text-white">
          <Link href="/editions" className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white mb-3">
            <ArrowLeft size={12} /> Back to editions
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] bg-white/15 backdrop-blur px-2 py-1 rounded">
              Edition {e.number}
            </span>
            {e.status === "upcoming" && (
              <span className="text-xs font-bold uppercase tracking-wider bg-brand-orange text-white px-2 py-1 rounded">
                Upcoming
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight max-w-3xl">ACE {e.number} — {editionRegion(e)}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/90">
            <span className="flex items-center gap-1.5"><MapPin size={14} />
              {mainCity?.name}{state ? `, ${state.abbreviation}` : ""}, {country?.name}
            </span>
            <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDateRange(e.startDate, e.endDate)}</span>
            <span className="flex items-center gap-1.5"><Users size={14} />{parts.length || "—"} participants</span>
            <span className="flex items-center gap-1.5"><Sparkles size={14} />{e.sectorIds.length} sectors</span>
          </div>
        </div>
      </div>

      <div className="py-7 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Summary + data */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Executive summary</CardTitle></CardHeader>
            <CardContent className="text-sm text-text-secondary leading-relaxed">
              <p>{e.summary}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {e.sectorIds.map(id => {
                  const s = sectors.find(x => x.id === id);
                  return s ? (
                    <Badge key={id} variant="sector" color={s.color} className="text-xs">{s.name}</Badge>
                  ) : null;
                })}
              </div>
            </CardContent>
          </Card>

          {/* Key data card */}
          <Card>
            <CardHeader><CardTitle>Key data</CardTitle></CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <DataRow label="Host country" value={country?.name} />
              {state && <DataRow label="Host state" value={state.name} />}
              <DataRow label="Host city" value={mainCity?.name} />
              <DataRow label="Dates" value={formatDateRange(e.startDate, e.endDate)} />
              <DataRow label="Countries represented" value={`${e.representedCountryIds.length}`} />
              <DataRow label="Sites visited" value={`${sites.length}`} />
              <DataRow label="Sectors" value={`${e.sectorIds.length}`} />
              <DataRow label="Outcomes" value={`${outs.length}`} />
              {e.organizerIds.length > 0 && (
                <DataRow
                  label="Organizers"
                  value={e.organizerIds.map(id => organizerById(id)?.name).filter(Boolean).join(" · ")}
                />
              )}
              {(() => {
                const docs = documentsByEdition(e.id);
                const hasAny = docs.length > 0 || e.links.finalReport || e.links.tripBook || e.links.website;
                if (!hasAny) return null;
                return (
                  <div className="pt-3 border-t border-surface-border flex flex-wrap gap-2">
                    {docs.map(d => (
                      <DocLink key={d.filename} label={`${d.label} (${d.pages}p)`} href={d.url} />
                    ))}
                    {docs.length === 0 && e.links.finalReport && <DocLink label="Final Report" href={e.links.finalReport} />}
                    {docs.length === 0 && e.links.tripBook && <DocLink label="Trip Book" href={e.links.tripBook} />}
                    {e.links.website && <DocLink label="Website" href={e.links.website} />}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Sites map */}
        {sites.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Visited sites</CardTitle></CardHeader>
            <div className="h-[360px]">
              <MapMini
                points={mapPoints}
                center={mainCity ? [mainCity.coordinates.lat, mainCity.coordinates.lng] : undefined}
                zoom={11}
              />
            </div>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {sites.map(s => (
                <div key={s.id} className="flex items-start gap-2 p-2 rounded hover:bg-surface-subtle">
                  <MapPin size={14} className="text-text-muted mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-ink">{s.name}</div>
                    <div className="text-xs text-text-muted">{s.type}</div>
                    {s.featuredSpeakers && s.featuredSpeakers.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {s.featuredSpeakers.map((sp, i) => (
                          <li key={i} className="text-[11px] text-text-secondary leading-snug">
                            <span className="font-semibold text-ink">{sp.name}</span>
                            <span className="text-text-muted"> — {sp.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Participants — full roster as a compact list (photo, role,
            institution, country) so every delegate is visible at a glance. */}
        {parts.length > 0 && (
          <section>
            <SectionHeader icon={Users} title="Delegates" count={parts.length} />
            <div className="bg-white border border-surface-border rounded-xl shadow-card divide-y divide-surface-border">
              {parts.map(p => <ParticipantListRow key={p.id} p={p} />)}
            </div>
          </section>
        )}

        {/* Exit-survey dashboard — auto-renders for any edition that has a
            registered QuestionPro survey in data/surveys.ts. */}
        {hasSurvey(e.id) && (
          <section>
            <SectionHeader
              icon={Sparkles}
              title="Exit-survey results"
              count={surveyByEdition(e.id)?.totalResponses ?? 0}
            />
            <SurveyDashboard editionId={e.id} />
          </section>
        )}

        {/* Outcomes */}
        {outs.length > 0 && (
          <section>
            <SectionHeader icon={Sparkles} title="Documented outcomes" count={outs.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {outs.map(o => <OutcomeCard key={o.id} o={o} />)}
            </div>
          </section>
        )}

        {/* Media */}
        {mediaItems.length > 0 && (
          <section>
            <SectionHeader icon={GalleryHorizontalEnd} title="Media & documents" count={mediaItems.length} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mediaItems.map(m => <MediaCard key={m.id} m={m} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-text-muted shrink-0">{label}</span>
      <span className="text-ink font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function DocLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-blue-bright hover:text-brand-blue-mid border border-surface-border rounded px-2.5 py-1.5 hover:bg-surface-subtle"
    >
      <FileText size={12} /> {label} <ExternalLink size={10} />
    </a>
  );
}

function SectionHeader({ icon: Icon, title, count }: { icon: typeof Users; title: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-lg font-bold text-ink flex items-center gap-2">
        <Icon size={16} className="text-brand-blue-bright" />
        {title}
      </h2>
      <span className="text-xs text-text-muted">{count} total</span>
    </div>
  );
}

function flagEmoji(countryId: string): string {
  if (!countryId || countryId === "intl") return "";
  const code = countryId.toUpperCase();
  if (code.length !== 2) return "";
  return String.fromCodePoint(...[...code].map(c => 0x1F1A5 + c.charCodeAt(0)));
}

function ParticipantListRow({ p }: { p: Participant }) {
  const country = countryById(p.countryId);
  const initials = p.name.split(" ").slice(0, 2).map(n => n[0]).join("");
  const flag = flagEmoji(p.countryId);
  const countryLabel =
    p.countryId === "intl" && p.organization ? p.organization : country?.name ?? "—";

  return (
    <Link
      href={`/participants/${p.id}`}
      className="flex items-center gap-4 px-4 py-3 hover:bg-surface-subtle transition-colors first:rounded-t-xl last:rounded-b-xl"
    >
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-ink/10 flex items-center justify-center shrink-0">
        {p.photoUrl ? (
          <Image src={p.photoUrl} alt={p.name} fill sizes="40px" className="object-cover" />
        ) : (
          <span className="text-[11px] font-bold text-ink">{initials}</span>
        )}
      </div>

      <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-0.5 items-center">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-ink truncate">{p.name}</div>
          <div className="text-xs text-text-secondary truncate md:hidden">{p.role}</div>
        </div>
        <div className="hidden md:block text-xs text-text-secondary truncate">{p.role}</div>
        <div className="text-xs text-text-muted truncate">{p.organization}</div>
      </div>

      <div className="hidden sm:inline-flex items-center gap-1.5 bg-surface-subtle border border-surface-border rounded-full pl-0.5 pr-2.5 py-0.5 shrink-0 max-w-[200px]">
        <span
          className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[14px] leading-none overflow-hidden shrink-0 ring-1 ring-surface-border/70"
          aria-hidden
        >
          {flag || <Globe size={11} className="text-text-muted" />}
        </span>
        <span className="text-[11px] font-medium text-text-secondary truncate">{countryLabel}</span>
      </div>
    </Link>
  );
}
