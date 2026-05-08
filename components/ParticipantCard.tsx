import Image from "next/image";
import Link from "next/link";
import type { Participant } from "@/types";
import { countryById } from "@/data/countries";
import { organizationById } from "@/data/organizations";
import { sectors } from "@/data/sectors";
import { Badge } from "@/components/ui/Badge";
import { Linkedin, Twitter, Facebook, Globe, Building, Share2 } from "lucide-react";

// Regional-indicator emoji for a 2-letter country code (ISO-3166 alpha-2).
// Returns an empty string for the non-flag buckets ("intl") so the UI can
// fall back to a globe icon.
function flagEmoji(countryId: string): string {
  if (!countryId || countryId === "intl") return "";
  const code = countryId.toUpperCase();
  if (code.length !== 2) return "";
  return String.fromCodePoint(
    ...[...code].map(c => 0x1F1A5 + c.charCodeAt(0))
  );
}

// Extract the edition number from an edition id like "ace-18-michigan-2024".
function editionNumber(id: string): number {
  const m = /^ace-(\d+)-/.exec(id);
  return m ? Number(m[1]) : 0;
}

export function ParticipantCard({ p }: { p: Participant }) {
  const country = countryById(p.countryId);
  const org = p.organizationId ? organizationById(p.organizationId) : undefined;
  const initials = p.name.split(" ").slice(0, 2).map(n => n[0]).join("");
  const flag = flagEmoji(p.countryId);
  const sortedEditionNumbers = [...p.editionIds]
    .map(editionNumber)
    .filter(n => n > 0)
    .sort((a, b) => a - b);

  return (
    <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-ink/10 flex items-center justify-center shrink-0">
          {p.photoUrl ? (
            <Image
              src={p.photoUrl}
              alt={p.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-ink">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/participants/${p.id}`}
            className="font-semibold text-ink text-sm truncate block hover:text-brand-blue-bright transition-colors"
          >
            {p.name}
          </Link>
          <div className="text-xs text-text-secondary truncate">{p.role}</div>
          <div className="text-xs text-text-muted truncate">{p.organization}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {p.countryId === "intl" && org ? (
          // Institutional-only participants (no home country in the roster)
          // render the organization chip tinted with the org's accent colour.
          <div
            className="inline-flex items-center gap-1.5 border rounded-full pl-0.5 pr-2 py-0.5"
            style={{ borderColor: `${org.color}55`, backgroundColor: `${org.color}10` }}
            title={org.name}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: org.color }}
              aria-hidden
            >
              <Building size={10} />
            </span>
            <span className="text-[11px] font-semibold" style={{ color: org.color }}>
              {org.shortName}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-surface-subtle border border-surface-border rounded-full pl-0.5 pr-2 py-0.5 max-w-[240px]">
            <span
              className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[14px] leading-none overflow-hidden shrink-0 ring-1 ring-surface-border/70"
              aria-hidden
            >
              {flag || (
                p.countryId === "intl" && p.organization
                  ? <Building size={11} className="text-text-muted" />
                  : <Globe size={11} className="text-text-muted" />
              )}
            </span>
            <span className="text-[11px] font-medium text-text-secondary truncate">
              {p.countryId === "intl" && p.organization
                ? p.organization
                : (country?.name ?? "—")}
            </span>
          </div>
        )}
        <Badge variant="outline" className="text-[10px]">{p.actorType}</Badge>
      </div>

      {p.sectorIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {p.sectorIds.slice(0, 3).map((id) => {
            const s = sectors.find(x => x.id === id);
            if (!s) return null;
            return (
              <Badge key={id} variant="sector" color={s.color} className="text-[10px]">
                {s.name}
              </Badge>
            );
          })}
        </div>
      )}

      {p.shortBio && (
        <p className="mt-3 text-[11px] text-text-secondary leading-relaxed line-clamp-3">
          {p.shortBio}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-surface-border space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
          <span className="font-medium text-ink/70">
            {sortedEditionNumbers.length} edition{sortedEditionNumbers.length !== 1 && "s"}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Cross-link to the ACE Network view, pre-selecting this
                delegate so the connections panel opens straight away. */}
            <Link
              href={`/network?participantId=${p.id}`}
              aria-label={`See ${p.name}'s connections in the ACE Network`}
              title="See connections in the ACE Network"
              className="text-text-muted hover:text-brand-blue-bright transition-colors inline-flex items-center"
            >
              <Share2 size={12} />
            </Link>
          {p.social && (
            <>
              {p.social.linkedin && (
                <a
                  href={p.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${p.name} on LinkedIn`}
                  className="text-text-muted hover:text-brand-blue-bright transition-colors"
                >
                  <Linkedin size={12} />
                </a>
              )}
              {p.social.twitter && (
                <a
                  href={p.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${p.name} on Twitter/X`}
                  className="text-text-muted hover:text-brand-blue-bright transition-colors"
                >
                  <Twitter size={12} />
                </a>
              )}
              {p.social.facebook && (
                <a
                  href={p.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${p.name} on Facebook`}
                  className="text-text-muted hover:text-brand-blue-bright transition-colors"
                >
                  <Facebook size={12} />
                </a>
              )}
            </>
          )}
          </div>
        </div>
        {sortedEditionNumbers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sortedEditionNumbers.map(n => (
              <span
                key={n}
                className="inline-block text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange"
              >
                ACE {n}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
