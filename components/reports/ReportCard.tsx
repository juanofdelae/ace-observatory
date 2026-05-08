import Link from "next/link";
import type { ACEReport } from "@/data/reports";
import { Calendar, MapPin, Users, Globe2, Building2, Network, FileSignature, Megaphone, ArrowUpRight } from "lucide-react";
import { ReportVerificationChip } from "./ReportSourceBlock";
import { formatNumber } from "@/lib/utils";
import { participantsByEdition } from "@/data/participants";

interface Props {
  report: ACEReport;
}

// Pick a numeric KPI by partial label match. Returns undefined when not present
// so the card stays graceful for incomplete reports.
function findKpi(report: ACEReport, match: string): string | number | undefined {
  const k = report.kpis.find(k => k.label.toLowerCase().includes(match.toLowerCase()));
  return k?.value;
}

// Edition-number → accent color band. Cycles through the institutional accent
// palette so adjacent cards in the grid feel distinct without being noisy.
function stripeForEdition(editionId: string): string {
  const palette = [
    "linear-gradient(90deg, #2563EB 0%, #14B8A6 100%)",
    "linear-gradient(90deg, #F97316 0%, #F59E0B 100%)",
    "linear-gradient(90deg, #7C3AED 0%, #2563EB 100%)",
    "linear-gradient(90deg, #14B8A6 0%, #2563EB 100%)",
    "linear-gradient(90deg, #0B1F3A 0%, #2563EB 100%)",
    "linear-gradient(90deg, #F97316 0%, #7C3AED 100%)",
  ];
  const n = (editionId.match(/\d+/)?.[0] ?? "0").length;
  let h = 0;
  for (let i = 0; i < editionId.length; i++) h = (h + editionId.charCodeAt(i) * (i + n + 1)) % palette.length;
  return palette[h];
}

// Pluck "ACE-23" → "23"
function editionNumber(editionId: string): string {
  return editionId.match(/\d+/)?.[0] ?? "—";
}

export function ReportCard({ report }: Props) {
  // --- Live counts from the participants directory ---------------------
  // The Reports page used to read hard-coded KPI values from the report
  // PDF ("Delegates: 47") even when the platform already had a real
  // delegate roster ingested for that edition. That created a perceived
  // disconnect: the directory and the report could disagree silently.
  // We now prefer the live count whenever the directory has any records
  // for this edition, and fall back to the PDF KPI only when no
  // participants have been ingested yet (newer editions, work in
  // progress).
  const liveDelegates = participantsByEdition(report.editionId);
  const liveDelegateCount = liveDelegates.length;
  const liveCountries = new Set(liveDelegates.map(p => p.countryId)).size;
  const pdfDelegates = findKpi(report, "delegate");
  const pdfCountries = findKpi(report, "countries represented") ?? findKpi(report, "countries");
  const delegates = liveDelegateCount > 0 ? liveDelegateCount : pdfDelegates;
  const countries = liveCountries > 0 ? liveCountries : pdfCountries;

  const cities = report.cityIds.length;
  const sites = findKpi(report, "site") ?? `${report.hostSites.length}`;
  const connections = findKpi(report, "new connections");
  const lois = findKpi(report, "letters of intent");
  const igReach = findKpi(report, "instagram");

  const fmt = (v: string | number | undefined) =>
    v === undefined ? "—" : typeof v === "number" ? formatNumber(v) : v;

  return (
    <article className="group relative bg-white rounded-2xl border border-surface-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col">
      {/* Hero color stripe per edition */}
      <div
        aria-hidden
        className="h-1.5 w-full"
        style={{ background: stripeForEdition(report.editionId) }}
      />

      <div className="px-5 md:px-6 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-ink text-white px-2.5 py-0.5 text-[10px] font-bold tracking-wider">
                ACE {editionNumber(report.editionId)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-blue">
                Report Intelligence
              </span>
            </div>
            <h3 className="text-[17px] font-bold text-ink leading-snug tracking-tight">
              {report.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-text-muted" /> {report.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-text-muted" /> {report.dates}
              </span>
            </div>
          </div>
          <ReportVerificationChip status={report.verificationStatus} />
        </div>
      </div>

      {/* Mini KPI grid. Delegates + Countries link to the participants
          directory pre-filtered by edition so the user can jump from a
          report headline straight to the underlying roster. */}
      <div className="mx-5 md:mx-6 mb-4 rounded-xl bg-surface-canvas border border-surface-border px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <Stat
          icon={Users}
          label="Delegates"
          value={fmt(delegates)}
          href={liveDelegateCount > 0 ? `/participants?editionId=${report.editionId}` : undefined}
          live={liveDelegateCount > 0}
        />
        <Stat
          icon={Globe2}
          label="Countries"
          value={fmt(countries)}
          href={liveCountries > 0 ? `/participants?editionId=${report.editionId}` : undefined}
          live={liveCountries > 0}
        />
        <Stat icon={MapPin} label="Cities" value={cities} />
        <Stat icon={Building2} label="Sites" value={fmt(sites)} />
        <Stat icon={Network} label="Connections" value={fmt(connections)} />
        <Stat icon={FileSignature} label="LOIs" value={fmt(lois)} />
        <Stat icon={Megaphone} label="IG reach" value={fmt(igReach)} />
      </div>

      <div className="mt-auto px-5 md:px-6 py-3.5 border-t border-surface-border flex items-center justify-between">
        <Link
          href={`/reports/${report.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink group-hover:text-accent-blue transition-colors"
        >
          View Report Intelligence
          <ArrowUpRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
    </article>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  href,
  live,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  /** When set, the stat becomes a link (e.g. Delegates → directory). */
  href?: string;
  /** When true, the value is a live count from the platform's directory
   *  (not the PDF KPI). Surface a tiny "live" dot so the user understands
   *  the figure is queryable, not editorial. */
  live?: boolean;
}) {
  const body = (
    <>
      <Icon size={12} className="text-text-muted shrink-0" />
      <span className="text-text-muted shrink-0 text-[11px]">{label}</span>
      {live && (
        <span
          aria-hidden
          title="Live count from the participants directory"
          className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
        />
      )}
      <span className="text-ink font-bold ml-auto truncate tabular-nums">{value}</span>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center gap-2 min-w-0 hover:text-accent-blue transition-colors"
      >
        {body}
      </Link>
    );
  }
  return <div className="flex items-center gap-2 min-w-0">{body}</div>;
}
