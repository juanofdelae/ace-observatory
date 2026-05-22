import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  Globe,
  Layers,
  MapPin,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { siteById, visitedSites } from "@/data/visited-sites";
import { countryById } from "@/data/countries";
import { cityById } from "@/data/cities";
import { stateById } from "@/data/states";
import { editionById } from "@/data/editions";
import { sectors as allSectors } from "@/data/sectors";
import { participantsByEdition } from "@/data/participants";
import { outcomes } from "@/data/outcomes";
import { mediaById } from "@/data/media";
import { reportsByEdition } from "@/data/reports";
import { OutcomeCard } from "@/components/OutcomeCard";
import { Badge } from "@/components/ui/Badge";

export function generateStaticParams() {
  return visitedSites.map(s => ({ id: s.id }));
}

export default async function SiteDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const site = siteById(params.id);
  if (!site) notFound();

  const country = countryById(site.countryId);
  const state = site.stateId ? stateById(site.stateId) : undefined;
  const city = cityById(site.cityId);

  const editions = site.relatedEditionIds
    .map(id => editionById(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const siteSectors = site.sectorIds
    .map(id => allSectors.find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Outcomes that touch ANY edition this site participated in. Filtered
  // again by countryId so we don't surface unrelated outcomes from
  // other countries that happened to share an edition.
  const relatedOutcomes = outcomes.filter(o =>
    o.editionIds.some(eid => site.relatedEditionIds.includes(eid))
    && o.countryIds.includes(site.countryId),
  );

  const relatedReports = Array.from(
    new Map(
      site.relatedEditionIds
        .flatMap(eid => reportsByEdition(eid))
        .map(r => [r.id, r]),
    ).values(),
  );

  // Delegates who attended any of the editions where this site appeared
  // — a rough but useful "visited by" roster. Deduped by participant id.
  const visitedBy = Array.from(
    new Map(
      site.relatedEditionIds
        .flatMap(eid => participantsByEdition(eid))
        .map(p => [p.id, p]),
    ).values(),
  );

  const linkedMedia = site.mediaIds
    .map(id => mediaById(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 pb-10">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mt-6 shadow-panel bg-white border border-surface-border">
        <Link
          href="/sites"
          className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-ink bg-white/90 backdrop-blur-sm border border-surface-border rounded-full px-2.5 py-1 shadow-soft"
        >
          <ArrowLeft size={11} /> Back to sites
        </Link>

        <div className="grid md:grid-cols-12">
          {/* Image panel — show photo if present, fallback to gradient
              placeholder with the type icon. */}
          <div className="md:col-span-5 relative bg-surface-subtle min-h-sidebar-w md:min-h-[320px] border-b md:border-b-0 md:border-r border-surface-border">
            {site.image ? (
              <Image
                src={site.image}
                alt={site.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-linear-to-br from-ink/95 to-ink-700 flex items-center justify-center text-white/40">
                <Building2 size={64} strokeWidth={1.25} />
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="md:col-span-7 p-6 md:p-9 flex flex-col justify-center">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue">
                Visited institution
              </span>
              <span className="w-1 h-1 rounded-full bg-text-muted/40" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                {site.type}
              </span>
              {site.verificationStatus === "pending_verification" && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-amber/15 text-accent-amber px-2 py-0.5 rounded">
                  Pending verification
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight tracking-tight">
              {site.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-text-secondary">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {city?.name}
                {state ? `, ${state.abbreviation}` : ""}, {country?.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {editions.length} edition
                {editions.length !== 1 ? "s" : ""}
              </span>
            </div>
            {site.description && (
              <p className="mt-5 text-[14px] text-text-secondary leading-relaxed line-clamp-6">
                {site.description}
              </p>
            )}
            {site.website && (
              <a
                href={site.website}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-blue hover:text-ink"
              >
                <Globe size={13} />
                {site.website.replace(/^https?:\/\//, "")}
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="py-6 space-y-6">
        {/* Sectors */}
        {siteSectors.length > 0 && (
          <Section icon={Layers} title="Sectors" count={siteSectors.length}>
            <div className="flex flex-wrap gap-1.5">
              {siteSectors.map(s => (
                <Badge
                  key={s.id}
                  variant="sector"
                  color={s.color}
                  className="text-[12px]"
                >
                  {s.name}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Editions */}
        {editions.length > 0 && (
          <Section icon={Calendar} title="ACE editions" count={editions.length}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {editions.map(e => {
                const ec = countryById(e.countryId);
                return (
                  <Link
                    key={e.id}
                    href={`/editions/${e.id}`}
                    className="group flex items-center justify-between bg-white border border-surface-border rounded-xl px-4 py-3 hover:border-accent-blue/40 hover:shadow-card transition"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-accent-blue">
                        ACE {e.number}
                      </div>
                      <div className="text-sm font-semibold text-ink truncate">
                        {e.name}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">
                        {ec?.name}
                      </div>
                    </div>
                    <ArrowLeft
                      size={14}
                      className="text-text-muted rotate-180 group-hover:text-accent-blue shrink-0"
                    />
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* Featured speakers (on-site hosts), if curated */}
        {site.featuredSpeakers && site.featuredSpeakers.length > 0 && (
          <Section
            icon={Users}
            title="Featured speakers"
            count={site.featuredSpeakers.length}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {site.featuredSpeakers.map(s => (
                <div
                  key={s.name}
                  className="bg-white border border-surface-border rounded-xl px-4 py-3"
                >
                  <div className="text-sm font-semibold text-ink">{s.name}</div>
                  <div className="text-[12px] text-text-secondary mt-0.5">
                    {s.title}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Visited by — touring delegates from those editions */}
        {visitedBy.length > 0 && (
          <Section icon={Users} title="Visited by" count={visitedBy.length}>
            <div className="bg-white border border-surface-border rounded-xl divide-y divide-surface-border">
              {visitedBy.slice(0, 12).map(p => {
                const c = countryById(p.countryId);
                return (
                  <Link
                    key={p.id}
                    href={`/participants/${p.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink truncate">
                        {p.name}
                      </div>
                      <div className="text-[11.5px] text-text-secondary truncate">
                        {p.role} · {p.organization}
                      </div>
                    </div>
                    <span className="text-[11px] text-text-muted shrink-0">
                      {c?.name ?? ""}
                    </span>
                  </Link>
                );
              })}
            </div>
            {visitedBy.length > 12 && (
              <div className="mt-2 text-[12px] text-text-muted">
                +{visitedBy.length - 12} more delegates touched this site
                across all the listed editions.
              </div>
            )}
          </Section>
        )}

        {/* Related outcomes */}
        {relatedOutcomes.length > 0 && (
          <Section
            icon={Sparkles}
            title="Related outcomes"
            count={relatedOutcomes.length}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedOutcomes.map(o => (
                <OutcomeCard key={o.id} o={o} />
              ))}
            </div>
          </Section>
        )}

        {/* Related reports */}
        {relatedReports.length > 0 && (
          <Section
            icon={Tag}
            title="Related reports"
            count={relatedReports.length}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {relatedReports.map(r => (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="group bg-white border border-surface-border rounded-xl px-4 py-3 hover:border-accent-blue/40 hover:shadow-card transition flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-accent-blue">
                      Report
                    </div>
                    <div className="text-sm font-semibold text-ink truncate">
                      {r.title}
                    </div>
                    <div className="text-[11px] text-text-muted truncate">
                      {r.location}
                    </div>
                  </div>
                  <ArrowLeft
                    size={14}
                    className="text-text-muted rotate-180 group-hover:text-accent-blue shrink-0"
                  />
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Photos and videos */}
        {linkedMedia.length > 0 && (
          <Section icon={Tag} title="Photos & videos" count={linkedMedia.length}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {linkedMedia.map(m => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-4/3 rounded-xl overflow-hidden bg-surface-subtle border border-surface-border block"
                >
                  {m.thumbnailUrl && (
                    <Image
                      src={m.thumbnailUrl}
                      alt={m.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  )}
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof Users;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-bold text-ink flex items-center gap-2">
          <Icon size={16} className="text-accent-blue" />
          {title}
        </h2>
        <span className="text-xs text-text-muted">{count} total</span>
      </div>
      {children}
    </section>
  );
}
