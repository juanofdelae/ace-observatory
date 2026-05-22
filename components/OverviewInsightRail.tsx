"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Calendar,
  MapPin,
  Sparkles,
  FileText,
  Filter,
  Database,
  Globe2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { editions } from "@/data/editions";
import { reports } from "@/data/reports";
import {
  participants,
  leadersIngested,
  cumulativeParticipations,
} from "@/data/participants";
import { cityById } from "@/data/cities";
import { countryById } from "@/data/countries";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/asset-path";

/**
 * OverviewInsightRail — right contextual rail on the Overview, in the
 * spirit of the tablet UI reference. Compact, glanceable, useful.
 *
 * Modules (top → bottom):
 *  - Latest edition (last completed)
 *  - Upcoming edition
 *  - Recently added report
 *  - Featured insight (a single editorial highlight)
 *  - Quick filters (preset entry points into Atlas / Reports)
 *  - Data freshness footer
 *
 * Designed to be sticky on `xl` screens so it stays in view while the
 * main canvas scrolls. Falls below the canvas on mobile/tablet.
 */

function RailCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-surface-border shadow-card p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

function RailEyebrow({
  label,
  accent = "blue",
}: {
  label: string;
  accent?: "blue" | "orange" | "teal" | "purple" | "amber";
}) {
  const colors: Record<string, string> = {
    blue: "text-accent-blue",
    orange: "text-accent-orange-cta",
    teal: "text-accent-teal-soft",
    purple: "text-accent-purple-soft",
    amber: "text-accent-amber",
  };
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <span className={cn("w-1 h-1 rounded-full", colors[accent].replace("text-", "bg-"))} />
      <span
        className={cn(
          "text-[9.5px] font-bold uppercase tracking-[0.18em]",
          colors[accent],
        )}
      >
        {label}
      </span>
    </div>
  );
}

function FilterChip({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 px-2.5 py-2 rounded-xl border border-surface-border bg-surface-canvas/50 hover:bg-white hover:border-accent-blue/30 transition-colors"
    >
      <Icon
        size={13}
        strokeWidth={1.75}
        className="text-text-muted group-hover:text-accent-blue"
      />
      <span className="text-[11.5px] font-semibold text-ink">{label}</span>
      <ArrowUpRight
        size={11}
        className="ml-auto text-text-muted group-hover:text-accent-blue"
      />
    </Link>
  );
}

export function OverviewInsightRail() {
  // Derive: latest completed + upcoming
  const sortedDesc = [...editions].sort(
    (a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const latestCompleted =
    sortedDesc.find((e) => e.status === "completed") ?? sortedDesc[1];
  const upcoming =
    sortedDesc.find((e) => e.status === "upcoming") ?? sortedDesc[0];

  const latestCity = latestCompleted?.cityIds[0]
    ? cityById(latestCompleted.cityIds[0])
    : undefined;
  const upcomingCity = upcoming?.cityIds[0]
    ? cityById(upcoming.cityIds[0])
    : undefined;

  const latestCountry = latestCompleted ? countryById(latestCompleted.countryId) : undefined;
  const upcomingCountry = upcoming ? countryById(upcoming.countryId) : undefined;

  const recentReport = reports[0];

  return (
    <aside
      aria-label="Edition intelligence rail"
      className="space-y-3 xl:sticky xl:top-20"
    >
      {/* Rail title — frames the whole column as a single contextual unit */}
      <div className="flex items-end justify-between px-1 mb-1">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-0.5">
            Edition intelligence
          </div>
          <h2 className="text-[14px] font-bold text-ink tracking-tight leading-tight">
            What&apos;s next, what&apos;s new
          </h2>
        </div>
        <Link
          href="/reports"
          className="text-[10.5px] font-semibold tracking-wide uppercase text-accent-blue hover:text-ink transition-colors flex items-center gap-1"
        >
          Reports
          <ArrowUpRight size={11} />
        </Link>
      </div>

      {/* Latest edition */}
      {latestCompleted && (
        <RailCard>
          <RailEyebrow label="Latest edition" accent="teal" />
          <Link
            href={`/editions/${latestCompleted.id}`}
            className="group flex gap-3"
          >
            <div className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-white border border-surface-border flex items-center justify-center p-1.5">
              <Image
                src={latestCompleted.heroImage || asset("/logos/ace-logo.png")}
                alt={latestCompleted.name}
                fill
                sizes="80px"
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-blue">
                ACE {latestCompleted.number}
              </div>
              <div className="text-[13px] font-bold text-ink leading-tight truncate">
                {latestCompleted.name.split("—")[1]?.trim() ?? latestCompleted.name}
              </div>
              <div className="text-[10.5px] text-text-muted mt-1 flex items-center gap-1">
                <MapPin size={10} />
                {latestCity?.name ?? latestCountry?.name ?? "—"}
              </div>
            </div>
            <ArrowUpRight
              size={14}
              className="text-text-muted group-hover:text-ink shrink-0"
            />
          </Link>
        </RailCard>
      )}

      {/* Upcoming edition */}
      {upcoming && (
        <RailCard className="bg-linear-to-br from-white to-accent-orange-cta/5 border-accent-orange-cta/20">
          <RailEyebrow label="Upcoming" accent="orange" />
          <Link
            href={`/editions/${upcoming.id}`}
            className="group flex gap-3"
          >
            <div className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-white border border-surface-border flex items-center justify-center p-1.5">
              <Image
                src={upcoming.heroImage || asset("/logos/ace-logo.png")}
                alt={upcoming.name}
                fill
                sizes="80px"
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-orange-cta">
                ACE {upcoming.number} · Next
              </div>
              <div className="text-[13px] font-bold text-ink leading-tight truncate">
                {upcoming.name.split("—")[1]?.trim() ?? upcoming.name}
              </div>
              <div className="text-[10.5px] text-text-muted mt-1 flex items-center gap-1">
                <Calendar size={10} />
                {new Date(upcoming.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
                {upcomingCity && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-text-muted/50 mx-1" />
                    <span>{upcomingCity.name}</span>
                  </>
                )}
                {!upcomingCity && upcomingCountry && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-text-muted/50 mx-1" />
                    <span>{upcomingCountry.name}</span>
                  </>
                )}
              </div>
            </div>
            <ArrowUpRight
              size={14}
              className="text-text-muted group-hover:text-ink shrink-0"
            />
          </Link>
        </RailCard>
      )}

      {/* Recently added report */}
      {recentReport && (
        <RailCard>
          <RailEyebrow label="Recently added report" accent="blue" />
          <Link
            href={`/reports/${recentReport.id}`}
            className="group block"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0">
                <FileText size={16} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-bold text-ink leading-tight">
                  {recentReport.title.split("—")[0].trim()}
                </div>
                <div className="text-[10.5px] text-text-muted mt-0.5">
                  {recentReport.dates} · {recentReport.location}
                </div>
              </div>
              <ArrowUpRight
                size={14}
                className="text-text-muted group-hover:text-ink shrink-0"
              />
            </div>
          </Link>
        </RailCard>
      )}

      {/* Featured insight */}
      <RailCard className="bg-linear-to-br from-ink to-ink/95 text-white border-ink">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles size={11} className="text-accent-orange-cta" />
          <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/70">
            Featured insight
          </span>
        </div>
        <div className="text-[13px] font-bold leading-snug">
          105 letters of intent
        </div>
        <p className="mt-1.5 text-[11.5px] text-white/70 leading-relaxed">
          Signed during ACE Córdoba 2025 across agtech, automotive and life
          sciences — a record across the program.
        </p>
        <Link
          href="/reports/ace-cordoba-2025"
          className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold tracking-wider uppercase text-accent-orange-cta hover:text-white"
        >
          Open report
          <ArrowUpRight size={11} />
        </Link>
      </RailCard>

      {/* Quick filters */}
      <RailCard>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Filter size={11} className="text-text-muted" />
            <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Quick filters
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          <FilterChip href="/map" icon={Globe2} label="Atlas · All Americas" />
          <FilterChip href="/editions" icon={Calendar} label="Editions · 2024–2026" />
          <FilterChip href="/participants" icon={Users} label="Leaders · By country" />
          <FilterChip href="/reports" icon={FileText} label="Reports · Latest" />
        </div>
      </RailCard>

      {/* Data freshness footer — three different ways of counting
          leaders are surfaced together with their definitions so the
          789 / 823 / 1,041 distinction is explicit instead of being
          reverse-engineered by the reader. */}
      <RailCard className="bg-surface-canvas/60 shadow-soft">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-teal-soft/15 text-accent-teal-soft flex items-center justify-center shrink-0">
            <Database size={13} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-2.5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
                Data status
              </div>
              <div className="text-[11.5px] font-semibold text-ink leading-tight">
                {editions.length} editions ingested
              </div>
            </div>
            <DataStatusMetric
              value={participants.length}
              label="verified delegates"
              description="Unique individuals verified across ACE records."
            />
            <DataStatusMetric
              value={cumulativeParticipations}
              label="cumulative participations"
              description="Total participations, including alumni who attended more than one edition."
            />
            <DataStatusMetric
              value={leadersIngested}
              label="leaders ingested"
              description="Internal database records processed for validation."
            />
          </div>
        </div>
      </RailCard>
    </aside>
  );
}

// Single-line metric with its definition underneath. Keeps the data
// status block scannable while letting the reader resolve the count
// in place (no tooltip / no separate page).
function DataStatusMetric({
  value,
  label,
  description,
}: {
  value: number;
  label: string;
  description: string;
}) {
  return (
    <div>
      <div className="text-[11.5px] text-ink leading-tight">
        <span className="font-bold tabular-nums">
          {value.toLocaleString()}
        </span>{" "}
        <span className="font-semibold">{label}</span>
      </div>
      <div className="text-[10.5px] text-text-muted leading-snug mt-0.5">
        {description}
      </div>
    </div>
  );
}
