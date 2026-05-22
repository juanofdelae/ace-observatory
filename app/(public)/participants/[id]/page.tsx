import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  participants,
  participantsByEdition,
} from "@/data/participants";
import { editions, editionById } from "@/data/editions";
import { countryById } from "@/data/countries";
import { sectors } from "@/data/sectors";
import { organizationById } from "@/data/organizations";
import {
  ArrowLeft,
  Calendar,
  Globe2,
  Building,
  Linkedin,
  Twitter,
  Facebook,
  ExternalLink,
  Users,
  Tag,
  Share2,
} from "lucide-react";
import { formatDateRange, editionRegion } from "@/lib/utils";

const sectorById = (id: string) => sectors.find(s => s.id === id);

export function generateStaticParams() {
  return participants.map(p => ({ id: p.id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// The merged participants array uses the WINNER's id after the dedup
// pass — which means a historical id like p-hist-ar-virginia-avila
// can disappear in favour of p-memphis-45-virginia-avila when the
// person also attended Memphis. To keep deep-links working we fall
// back to matching on the trailing name slug (the bit after the last
// "-{role}-" prefix).
function findParticipantByLooseId(rawId: string) {
  const direct = participants.find(p => p.id === rawId);
  if (direct) return direct;
  // Strip the prefix bucket ("p-hist-ar-", "p-memphis-NN-", "p-hist-intl-")
  // and match on the remaining slug suffix.
  const slug = rawId.replace(/^p-(hist-[a-z]+-|memphis-\d+-)/, "");
  if (!slug) return undefined;
  return participants.find(p => p.id.endsWith(slug));
}

export default async function ParticipantProfilePage(props: PageProps) {
  const params = await props.params;
  const p = findParticipantByLooseId(params.id);
  if (!p) notFound();

  const country = countryById(p.countryId);
  const org = p.organizationId ? organizationById(p.organizationId) : undefined;
  const attendedEditions = p.editionIds
    .map(id => editionById(id))
    .filter((e): e is NonNullable<ReturnType<typeof editionById>> => !!e)
    .sort((a, b) => b.number - a.number);

  // Connection set: any other delegate who shares ≥1 sector AND ≥1 edition.
  const peers = participants
    .filter(o => o.id !== p.id)
    .filter(o => o.editionIds.some(e => p.editionIds.includes(e)))
    .filter(o => o.sectorIds.some(s => p.sectorIds.includes(s)))
    .map(o => ({
      peer: o,
      sharedEditions: o.editionIds.filter(e => p.editionIds.includes(e)),
      sharedSectors: o.sectorIds.filter(s => p.sectorIds.includes(s)),
    }))
    .sort(
      (a, b) =>
        b.sharedEditions.length * 2 + b.sharedSectors.length
        - (a.sharedEditions.length * 2 + a.sharedSectors.length),
    )
    .slice(0, 30);

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      <div>
        <Link
          href="/participants"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-ink"
        >
          <ArrowLeft size={12} /> Back to participants
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* ── Profile column ─────────────────────────────────────── */}
        <div className="space-y-5">
          <header className="bg-white rounded-2xl border border-surface-border shadow-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-surface-muted shrink-0 border border-surface-border">
                {p.photoUrl ? (
                  <Image
                    src={p.photoUrl}
                    alt={p.name}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <Users size={36} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-blue">
                  Alumni profile
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight mt-1">
                  {p.name}
                </h1>
                <div className="text-sm text-text-secondary mt-1">{p.role}</div>
                <div className="text-sm text-text-secondary mt-0.5">
                  {p.organization}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                  {country && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-muted text-text-secondary">
                      <Globe2 size={11} /> {country.name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink text-white font-semibold">
                    {p.actorType}
                  </span>
                  {org && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold"
                      style={{
                        background: `${org.color}15`,
                        color: org.color,
                        border: `1px solid ${org.color}33`,
                      }}
                    >
                      <Building size={11} /> {org.shortName}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href={`/network?participantId=${p.id}`}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-blue hover:text-ink"
                  >
                    <Share2 size={12} /> See connections
                  </Link>
                  {p.social?.linkedin && (
                    <a
                      href={p.social.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-text-muted hover:text-brand-blue-bright"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={14} />
                    </a>
                  )}
                  {p.social?.twitter && (
                    <a
                      href={p.social.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="text-text-muted hover:text-brand-blue-bright"
                      aria-label="Twitter"
                    >
                      <Twitter size={14} />
                    </a>
                  )}
                  {p.social?.facebook && (
                    <a
                      href={p.social.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="text-text-muted hover:text-brand-blue-bright"
                      aria-label="Facebook"
                    >
                      <Facebook size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {p.shortBio && (
              <p className="mt-6 text-sm text-text-secondary leading-relaxed border-t border-surface-border pt-5">
                {p.shortBio}
              </p>
            )}
          </header>

          {/* Sectors */}
          {p.sectorIds.length > 0 && (
            <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5 md:p-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted mb-3">
                Sectors of work
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.sectorIds.map(id => {
                  const s = sectorById(id);
                  if (!s) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: `${s.color}15`,
                        color: s.color,
                        border: `1px solid ${s.color}33`,
                      }}
                    >
                      <Tag size={9} /> {s.name}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* Editions attended */}
          <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                ACE editions attended
              </div>
              <span className="text-[11px] font-bold text-ink tabular-nums">
                {attendedEditions.length}
              </span>
            </div>
            <ul className="space-y-1.5">
              {attendedEditions.map(e => {
                const co = countryById(e.countryId);
                return (
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
                          ACE {e.number} — {editionRegion(e)}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {formatDateRange(e.startDate, e.endDate)} · {co?.name}
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-text-muted shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* ── Connections rail ───────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-4 h-fit">
          <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                Connections
              </div>
              <span className="text-[11px] font-bold text-ink tabular-nums">
                {peers.length}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
              Other alumni who attended at least one of the same ACE editions
              and share at least one sector of work.
            </p>
            {peers.length === 0 ? (
              <div className="text-xs text-text-muted">
                No matching alumni found in the directory.
              </div>
            ) : (
              <ul className="space-y-1 max-h-[480px] overflow-y-auto thin-scroll pr-1">
                {peers.map(({ peer, sharedEditions, sharedSectors }) => {
                  const co = countryById(peer.countryId);
                  return (
                    <li key={peer.id}>
                      <Link
                        href={`/participants/${peer.id}`}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-subtle"
                      >
                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface-muted shrink-0 border border-surface-border">
                          {peer.photoUrl ? (
                            <Image
                              src={peer.photoUrl}
                              alt={peer.name}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted">
                              <Users size={13} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-semibold text-ink truncate">
                            {peer.name}
                          </div>
                          <div className="text-[10px] text-text-muted truncate">
                            {co?.name ?? peer.countryId.toUpperCase()} ·{" "}
                            {sharedEditions.length} shared ACE{sharedEditions.length === 1 ? "" : "s"} · {sharedSectors.length} sector{sharedSectors.length === 1 ? "" : "s"}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-surface-border shadow-card p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted mb-2.5">
              At a glance
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-text-muted">Editions attended</span>
                <span className="font-semibold text-ink tabular-nums">{attendedEditions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Distinct countries</span>
                <span className="font-semibold text-ink tabular-nums">
                  {new Set(attendedEditions.map(e => e.countryId)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Sectors</span>
                <span className="font-semibold text-ink tabular-nums">{p.sectorIds.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Connections in directory</span>
                <span className="font-semibold text-ink tabular-nums">{peers.length}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
