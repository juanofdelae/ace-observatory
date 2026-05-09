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

  const docs = documentsByEdition(e.id);
  const hasDocs =
    docs.length > 0
    || e.links.finalReport
    || e.links.tripBook
    || e.links.photos
    || e.links.website;
  const organizerNames = e.organizerIds
    .map(id => organizerById(id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 pb-8">
      {/* Hero — split panel: white logo zone + dark info zone */}
      <div className="relative rounded-3xl overflow-hidden mt-6 shadow-panel bg-white border border-surface-border">
        <Link
          href="/editions"
          className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-ink bg-white/90 backdrop-blur border border-surface-border rounded-full px-2.5 py-1 shadow-soft"
        >
          <ArrowLeft size={11} /> Back to editions
        </Link>

        <div className="grid md:grid-cols-12">
          {/* Logo panel — white bg, object-contain so the full logo is visible */}
          <div className="md:col-span-5 lg:col-span-4 relative bg-white min-h-[220px] md:min-h-[360px] border-b md:border-b-0 md:border-r border-surface-border">
            {e.heroImage && (
              <Image
                src={e.heroImage}
                alt={e.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-contain p-8 md:p-10"
              />
            )}
          </div>

          {/* Info panel — dark navy with title, meta, summary, sectors */}
          <div className="md:col-span-7 lg:col-span-8 bg-ink text-white p-6 md:p-9 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-white/12 px-2 py-1 rounded">
                Edition {e.number}
              </span>
              {e.status === "upcoming" && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-orange text-white px-2 py-1 rounded">
                  Upcoming
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold leading-tight">
              ACE {e.number} — {editionRegion(e)}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-white/85">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {mainCity?.name}
                {state ? `, ${state.abbreviation}` : ""}, {country?.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {formatDateRange(e.startDate, e.endDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                {parts.length || "—"} participants
              </span>
            </div>
            <p className="mt-5 text-sm text-white/80 leading-relaxed max-w-2xl">
              {e.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {e.sectorIds.map(id => {
                const s = sectors.find(x => x.id === id);
                return s ? (
                  <Badge key={id} variant="sector" color={s.color} className="text-[11px]">
                    {s.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="py-6 space-y-6">
        {/* Key data — horizontal KPI strip + meta + documents */}
        <Card>
          <CardContent className="p-5 md:p-6 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-4">
              <Stat value={`${e.representedCountryIds.length}`} label="Countries" />
              <Stat value={`${sites.length}`} label="Sites visited" />
              <Stat value={`${e.sectorIds.length}`} label="Sectors" />
              <Stat value={`${outs.length}`} label="Outcomes" />
              <Stat value={`${parts.length || "—"}`} label="Participants" />
              <Stat
                value={mainCity?.name ?? "—"}
                label={state ? `${state.abbreviation}, ${country?.name}` : country?.name ?? "Host"}
              />
            </div>

            {(organizerNames.length > 0 || hasDocs) && (
              <div className="pt-4 border-t border-surface-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {organizerNames.length > 0 && (
                  <div className="text-xs text-text-secondary">
                    <span className="text-text-muted">Organized by </span>
                    <span className="text-ink font-medium">
                      {organizerNames.join(" · ")}
                    </span>
                  </div>
                )}
                {hasDocs && (
                  <div className="flex flex-wrap gap-2">
                    {docs.map(d => (
                      <DocLink key={d.filename} label={`${d.label} (${d.pages}p)`} href={d.url} />
                    ))}
                    {docs.length === 0 && e.links.finalReport && (
                      <DocLink label="Final Report" href={e.links.finalReport} />
                    )}
                    {docs.length === 0 && e.links.tripBook && (
                      <DocLink label="Trip Book" href={e.links.tripBook} />
                    )}
                    {e.links.photos && (
                      <DocLink label="Photos on Flickr" href={e.links.photos} />
                    )}
                    {e.links.website && <DocLink label="Website" href={e.links.website} />}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="text-2xl md:text-[28px] font-bold text-ink leading-none tracking-tight truncate">
        {value}
      </div>
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mt-1.5 truncate">
        {label}
      </div>
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
