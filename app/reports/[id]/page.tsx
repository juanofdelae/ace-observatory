import Link from "next/link";
import { notFound } from "next/navigation";
import { reports, reportById } from "@/data/reports";
import { cityById } from "@/data/cities";
import { participantsByEdition } from "@/data/participants";
import { ReportKPIGrid } from "@/components/reports/ReportKPIGrid";
import { ReportSectorBoard } from "@/components/reports/ReportSectorBoard";
import { ReportHostSitesGrid } from "@/components/reports/ReportHostSitesGrid";
import { ReportCollaborationsChart } from "@/components/reports/ReportCollaborationsChart";
import { ReportPartnershipsChart } from "@/components/reports/ReportPartnershipsChart";
import { ReportKnowledgeChart } from "@/components/reports/ReportKnowledgeChart";
import { ReportFeedbackChart } from "@/components/reports/ReportFeedbackChart";
import { ReportMediaImpact } from "@/components/reports/ReportMediaImpact";
import { ReportTestimonials } from "@/components/reports/ReportTestimonials";
import { ReportSourceBlock, ReportVerificationChip } from "@/components/reports/ReportSourceBlock";
import { ReportSubNav } from "@/components/reports/ReportSubNav";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Globe2,
  Map as MapIcon,
  ExternalLink,
} from "lucide-react";

export function generateStaticParams() {
  return reports.map(r => ({ id: r.id }));
}

const SECTIONS = [
  { id: "executive-summary", label: "Executive Summary" },
  { id: "geographic-footprint", label: "Geographic Footprint" },
  { id: "sector-coverage", label: "Sector Coverage" },
  { id: "host-sites", label: "Host Sites" },
  { id: "collaborations", label: "New Collaborations" },
  { id: "partnerships", label: "New Partnerships" },
  { id: "knowledge", label: "Knowledge Gain" },
  { id: "feedback", label: "Feedback" },
  { id: "media", label: "Media & Comms" },
  { id: "testimonials", label: "Testimonials" },
  { id: "source", label: "Source PDF" },
];

export default function ReportIntelligencePage({ params }: { params: { id: string } }) {
  const report = reportById(params.id);
  if (!report) notFound();

  const cities = report.cityIds
    .map(id => cityById(id))
    .filter((c): c is NonNullable<ReturnType<typeof cityById>> => !!c);

  // Bridge the report KPIs with the live participants directory: when we
  // have ingested delegates for this edition, swap the hard-coded values
  // for the live counts so the headline stays consistent with the
  // participants page. Untouched when no records exist yet.
  const liveDelegates = participantsByEdition(report.editionId);
  const liveCountries = new Set(liveDelegates.map(p => p.countryId)).size;
  const liveKpis = liveDelegates.length > 0
    ? report.kpis.map(k => {
        const l = k.label.toLowerCase();
        if (l.includes("delegate")) {
          return { ...k, value: liveDelegates.length, hint: `From the participants directory · click "View directory" below to filter` };
        }
        if (l.includes("countries represented") || l === "countries") {
          return { ...k, value: liveCountries, hint: "Distinct countries with at least one delegate in the directory" };
        }
        return k;
      })
    : report.kpis;

  const primaryCountry = report.countryIds[0];
  const atlasHref = primaryCountry ? `/map?country=${primaryCountry}` : "/map";

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Hero — rounded panel inside the canvas */}
      <div className="relative rounded-3xl bg-linear-to-br from-ink via-[#102347] to-brand-blue-bright/80 text-white overflow-hidden shadow-panel">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(47,183,178,0.5) 0%, transparent 45%)",
          }}
        />
        <div className="relative px-7 md:px-10 py-9 md:py-12">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft size={12} /> Back to reports
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
              Report Intelligence
            </span>
            <ReportVerificationChip status={report.verificationStatus} />
          </div>
          <h1 className="text-3xl md:text-display-2 font-bold leading-tight max-w-3xl tracking-tight">
            {report.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {report.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {report.dates}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe2 size={14} /> {report.countryIds.length} country
              {report.countryIds.length === 1 ? "" : "ies"} hosting
            </span>
            <Link
              href={`/editions/${report.editionId}`}
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full px-3.5 py-2 transition-colors"
            >
              View edition page <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        <ReportSubNav items={SECTIONS} />

        {/* Executive Summary */}
        <section id="executive-summary" className="scroll-mt-24 space-y-4">
          <SectionHeader number="01" title="Executive Summary" />
          <ReportKPIGrid kpis={liveKpis} />
          {liveDelegates.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Link
                href={`/participants?editionId=${report.editionId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-white font-semibold hover:bg-ink/90 transition-colors"
              >
                View directory ({liveDelegates.length})
                <ExternalLink size={11} />
              </Link>
              <span className="inline-flex items-center gap-1.5 text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live counts from {liveDelegates.length} ingested delegate{liveDelegates.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </section>

        {/* Geographic Footprint */}
        <section id="geographic-footprint" className="scroll-mt-24 space-y-4">
          <SectionHeader number="02" title="Geographic Footprint" />
          <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-bold text-ink">Cities & towns visited</div>
                <p className="text-xs text-text-muted mt-1">
                  The delegation crossed {cities.length} localities across the host region.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {cities.length === 0 && (
                    <span className="text-xs text-text-muted italic">
                      Cities not yet linked in the atlas.
                    </span>
                  )}
                  {cities.map(c => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle border border-surface-border px-3 py-1 text-xs font-semibold text-ink"
                    >
                      <MapPin size={12} className="text-brand-blue-bright" />
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={atlasHref}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-ink hover:bg-ink-700 rounded-md px-3 py-2"
              >
                <MapIcon size={14} /> View in ACE Atlas
              </Link>
            </div>
          </div>
        </section>

        {/* Sector Coverage */}
        <section id="sector-coverage" className="scroll-mt-24 space-y-4">
          <SectionHeader number="03" title="Sector Coverage" />
          <ReportSectorBoard sectors={report.sectors} />
        </section>

        {/* Host Sites */}
        <section id="host-sites" className="scroll-mt-24 space-y-4">
          <SectionHeader number="04" title="Host Sites" />
          <ReportHostSitesGrid sectors={report.sectors} hostSites={report.hostSites} />
        </section>

        {/* New Collaborations */}
        <section id="collaborations" className="scroll-mt-24 space-y-4">
          <SectionHeader number="05" title="New Collaborations" />
          <ReportCollaborationsChart collaborations={report.collaborations} />
        </section>

        {/* New Partnerships */}
        <section id="partnerships" className="scroll-mt-24 space-y-4">
          <SectionHeader number="06" title="New Partnerships" />
          <ReportPartnershipsChart
            partnerships={report.partnerships}
            loiSummary={report.loiSummary}
          />
        </section>

        {/* Knowledge Gain */}
        <section id="knowledge" className="scroll-mt-24 space-y-4">
          <SectionHeader number="07" title="Knowledge Gain" />
          <ReportKnowledgeChart knowledgeGain={report.knowledgeGain} />
        </section>

        {/* Feedback */}
        <section id="feedback" className="scroll-mt-24 space-y-4">
          <SectionHeader number="08" title="Delegate Feedback" />
          <ReportFeedbackChart feedback={report.feedback} />
        </section>

        {/* Media */}
        <section id="media" className="scroll-mt-24 space-y-4">
          <SectionHeader number="09" title="Media & Communications Impact" />
          <ReportMediaImpact metrics={report.mediaImpact} />
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="scroll-mt-24 space-y-4">
          <SectionHeader
            number="10"
            title="Testimonials"
            subtitle={
              report.testimonials.some(t => t._sample)
                ? "Sample testimonials — to be replaced with quotes from the Final Report."
                : undefined
            }
          />
          <ReportTestimonials testimonials={report.testimonials} />
        </section>

        {/* Source */}
        <section id="source" className="scroll-mt-24 space-y-4 pb-8">
          <SectionHeader number="11" title="Source Document" />
          <ReportSourceBlock report={report} />
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue">
            Section {number}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-ink tracking-tight mt-1">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-text-muted mt-1.5">{subtitle}</p>}
        </div>
      </div>
      {/* Subtle gradient divider — replaces a hard hr to keep the rhythm soft */}
      <div
        aria-hidden
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(11,31,58,0.18) 0%, rgba(11,31,58,0.08) 30%, rgba(11,31,58,0) 100%)",
        }}
      />
    </div>
  );
}
