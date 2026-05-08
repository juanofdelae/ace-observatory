import Link from "next/link";
import { ArrowRight, MapPin, Calendar, FileText, Map as MapIcon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * LatestReportIntelligenceCard — featured anchor module on the Overview.
 *
 * Visually communicates that ACE Final Reports are transformed into
 * structured, explorable intelligence (not just downloadable PDFs).
 *
 * Layout: rounded white panel split into two columns.
 *   Left  — editorial: edition chip, title, dates, location, lead copy, CTAs.
 *   Right — 8-cell metric grid (Delegates, Countries, Sites, Connections,
 *           LOIs, Articles, LinkedIn, Instagram).
 */

interface Metric {
  label: string;
  value: string;
  hint?: string;
  accent: "navy" | "blue" | "orange" | "teal" | "purple" | "amber";
}

const metricAccent: Record<
  Metric["accent"],
  { fg: string; chip: string }
> = {
  navy: { fg: "text-ink", chip: "bg-ink/8" },
  blue: { fg: "text-accent-blue", chip: "bg-accent-blue/10" },
  orange: { fg: "text-accent-orange-cta", chip: "bg-accent-orange-cta/10" },
  teal: { fg: "text-accent-teal-soft", chip: "bg-accent-teal-soft/12" },
  purple: { fg: "text-accent-purple-soft", chip: "bg-accent-purple-soft/10" },
  amber: { fg: "text-accent-amber", chip: "bg-accent-amber/12" },
};

const metrics: Metric[] = [
  { label: "Delegates", value: "47", accent: "navy" },
  { label: "Countries", value: "15", accent: "blue" },
  { label: "Sites visited", value: "+30", accent: "teal" },
  { label: "New connections", value: "529", accent: "orange" },
  { label: "Letters of intent", value: "105", accent: "purple", hint: "Signed" },
  { label: "Media articles", value: "23", accent: "amber" },
  { label: "LinkedIn impressions", value: "+30K", accent: "blue" },
  { label: "Instagram reach", value: "+85K", accent: "teal" },
];

function MetricCell({ m }: { m: Metric }) {
  const a = metricAccent[m.accent];
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-surface-border p-3.5",
        "transition-shadow duration-200 hover:shadow-soft",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("text-2xl font-bold tracking-tight tabular-nums", a.fg)}>
          {m.value}
        </span>
        <span className={cn("h-1 w-6 rounded-full", a.chip.replace("/8", "/40").replace("/10", "/40").replace("/12", "/40"))} />
      </div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted leading-tight">
        {m.label}
      </div>
      {m.hint && (
        <div className="mt-0.5 text-[10px] text-text-muted">{m.hint}</div>
      )}
    </div>
  );
}

interface Props {
  /** Linked ACE edition id (used by the "View in ACE Atlas" CTA). */
  editionCountryId?: string;
}

export function LatestReportIntelligenceCard(_props: Props = {}) {
  return (
    <section
      aria-label="Latest report intelligence"
      className="relative overflow-hidden rounded-3xl bg-white border border-surface-border shadow-card"
    >
      {/* Soft accent wash on the left half */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(20,184,166,0.04) 45%, transparent 70%)",
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Editorial column */}
        <div className="lg:col-span-5 px-7 md:px-9 py-8 md:py-10 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-orange-cta">
              Latest report intelligence
            </span>
            <span className="w-1 h-1 rounded-full bg-accent-orange-cta/60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Featured
            </span>
          </div>

          <div className="inline-flex items-center self-start gap-2 px-3 py-1 rounded-full bg-ink text-white text-[10px] font-bold uppercase tracking-[0.16em]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-orange-cta" />
            ACE 22 · Córdoba
          </div>

          <h2 className="mt-4 text-[26px] md:text-[30px] font-bold text-ink tracking-tight leading-[1.08]">
            ACE Córdoba 2025
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="text-text-muted" />
              March 2025
            </span>
            <span className="w-1 h-1 rounded-full bg-text-muted/50" />
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-text-muted" />
              Córdoba, Argentina
            </span>
          </div>

          <p className="mt-5 text-[13.5px] text-text-secondary leading-relaxed max-w-md">
            Forty-seven leaders from fifteen countries, more than thirty sites
            across seven cities, and 105 letters of intent. The Final Report
            transformed into a structured, navigable intelligence layer.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/reports/ace-cordoba-2025">
              <Button variant="primary" size="md">
                <FileText size={14} strokeWidth={1.75} />
                View Report Intelligence
                <ArrowRight size={14} strokeWidth={1.75} />
              </Button>
            </Link>
            <Link href="/map">
              <Button variant="secondary" size="md">
                <MapIcon size={14} strokeWidth={1.75} />
                View in ACE Atlas
              </Button>
            </Link>
          </div>

          <div className="mt-auto pt-8 flex items-center gap-2 text-[10.5px] text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-teal-soft" />
            <span className="font-semibold tracking-wide uppercase text-text-secondary">
              Extracted from
            </span>
            <span>ACE22-REPORT-Córdoba.pdf</span>
          </div>
        </div>

        {/* Metric grid column */}
        <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-surface-border bg-surface-canvas/40 px-6 md:px-8 py-7 md:py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Outcomes at a glance
            </div>
            <div className="text-[10px] font-semibold text-text-muted">
              From the Final Report
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map((m) => (
              <MetricCell key={m.label} m={m} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
