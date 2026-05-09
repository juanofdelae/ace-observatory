"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Calendar,
  Globe2,
  Users,
  MapPin,
  Sparkles,
  GalleryHorizontalEnd,
  ArrowRight,
  Map as MapIcon,
  FileText,
  Building2,
  Layers,
  Share2,
  Award,
  type LucideIcon,
} from "lucide-react";
import { KPIGrid, KPICard } from "@/components/KPICard";
import { Button } from "@/components/ui/Button";
import { editions } from "@/data/editions";
import { editionRegion } from "@/lib/utils";
import { asset } from "@/lib/asset-path";
import { visitedSites } from "@/data/visited-sites";
import { sectors } from "@/data/sectors";
import { cityById } from "@/data/cities";
import { countryById } from "@/data/countries";
import { media } from "@/data/media";
import { participants } from "@/data/participants";
import { reports } from "@/data/reports";
import { outcomes } from "@/data/outcomes";
import { EditionCard } from "@/components/EditionCard";
import { LatestReportIntelligenceCard } from "@/components/LatestReportIntelligenceCard";
import { OverviewInsightRail } from "@/components/OverviewInsightRail";
import { ParticipantWorldMap } from "@/components/ParticipantWorldMap";

const MapMini = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-subtle animate-pulse rounded-2xl" />
  ),
});

export default function OverviewPage() {
  const totalEditions = editions.length;
  const totalCities = Array.from(new Set(editions.flatMap((e) => e.cityIds))).length;
  const totalSites = visitedSites.length;
  const totalSectors = sectors.length;
  const totalMedia = media.length;
  const totalDelegates = participants.length;
  // Real countries represented across the alumni roster (excludes the
  // synthetic "intl" bucket used for institutional-only entries).
  const countriesRepresented = new Set(
    participants.map(p => p.countryId).filter(c => c && c !== "intl"),
  ).size;

  // Minimal map: all host cities (used inside Geographic Footprint module).
  const mapPoints = editions
    .flatMap((e) =>
      e.cityIds.map((cid) => {
        const c = cityById(cid);
        if (!c) return null;
        return {
          id: `o-${cid}`,
          name: c.name,
          coordinates: c.coordinates,
          kind: "host" as const,
          meta: `ACE ${e.number}`,
          radius: 6,
        };
      }),
    )
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const featured = [
    editions[editions.length - 1],
    editions[editions.length - 3],
    editions[editions.length - 4],
  ];

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-7">
      {/* ───────────────────────── HERO ─────────────────────────
         Two-column observatory hero. The dark navy stays, but is
         broken up by:
          - a faint dot-grid graticule (longitude/latitude texture)
          - a subtle Americas-shaped cluster of city dots + arcs
          - a soft right-side blue glow + a small bottom-left spark
         Right column hosts a translucent "footprint snapshot" card
         so the hero stops feeling like a banner and starts feeling
         like an observatory interface. */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink/95 to-ink-700 text-white shadow-panel">
        {/* SVG geographic layer — full hero, very low opacity */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1200 520"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <pattern
              id="hero-dotgrid"
              x="0"
              y="0"
              width="22"
              height="22"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="0.7" fill="currentColor" opacity="0.18" />
            </pattern>
            <radialGradient id="hero-soft" cx="80%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0B1F3A" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* dot grid */}
          <rect width="100%" height="100%" fill="url(#hero-dotgrid)" />
          {/* soft right glow */}
          <rect width="100%" height="100%" fill="url(#hero-soft)" />

          {/* Americas-like cluster of host city dots, manually placed
             across a vertical band on the left third of the hero. */}
          <g fill="currentColor">
            {/* North America */}
            <circle cx="180" cy="120" r="3" opacity="0.55" />
            <circle cx="220" cy="160" r="2.4" opacity="0.45" />
            <circle cx="160" cy="180" r="2.2" opacity="0.4" />
            <circle cx="240" cy="200" r="2" opacity="0.4" />
            {/* Caribbean */}
            <circle cx="270" cy="240" r="2" opacity="0.5" />
            {/* Central America */}
            <circle cx="240" cy="260" r="1.8" opacity="0.4" />
            {/* South America */}
            <circle cx="280" cy="300" r="2.4" opacity="0.5" />
            <circle cx="300" cy="350" r="2.6" opacity="0.55" />
            <circle cx="320" cy="400" r="2.4" opacity="0.5" />
            <circle cx="290" cy="450" r="2" opacity="0.4" />
          </g>
          {/* Connection arcs — institutional network feel */}
          <g
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeWidth="0.8"
          >
            <path d="M 180 120 Q 230 200 270 240" opacity="0.18" />
            <path d="M 220 160 Q 260 240 280 300" opacity="0.16" />
            <path d="M 270 240 Q 290 300 300 350" opacity="0.2" />
            <path d="M 280 300 Q 310 360 320 400" opacity="0.18" />
            <path d="M 300 350 Q 305 400 290 450" opacity="0.14" />
          </g>
        </svg>

        {/* Soft ambient orange spark — subtle institutional warmth */}
        <div
          aria-hidden
          className="absolute -bottom-24 left-10 w-72 h-72 rounded-full bg-accent-orange-cta/10 blur-3xl pointer-events-none"
        />

        <div className="relative px-7 md:px-12 py-12 md:py-16 max-w-5xl">
          {/* Executive cover — single statement, four hard numbers,
              two doors. Everything else lives below the fold. */}
          <h1 className="text-display-1 font-bold tracking-tight leading-[1.02]">
            ACE Observatory
          </h1>
          <p className="mt-3 text-base md:text-lg text-white/80 leading-relaxed max-w-3xl">
            Explore the data, network, and documented impact of the{" "}
            <span className="whitespace-nowrap">
              Americas Competitiveness Exchange.
            </span>
          </p>

          {/* Headline KPIs — every value is queryable from the live
              data layer below, not editorial. */}
          <div className="mt-9 grid grid-cols-2 md:grid-cols-4 gap-3">
            <HeroKPI value={totalEditions} label="Editions" />
            <HeroKPI value={countriesRepresented} label="Countries" />
            <HeroKPI value={totalDelegates} label="Verified delegates" />
            <HeroKPI value={totalSites} label="Institutions visited" />
          </div>

          {/* Two doors. Atlas (geographic intelligence) and Reports
              (analytical intelligence). Tertiary "Browse editions"
              moved below the fold. */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/map">
              <Button variant="accent" size="lg">
                <MapIcon size={16} strokeWidth={1.75} />
                Explore the Atlas
                <ArrowRight size={14} strokeWidth={1.75} />
              </Button>
            </Link>
            <Link href="/reports">
              <Button
                variant="ghost"
                size="lg"
                className="border border-white/20 text-white/90 hover:bg-white/8 hover:text-white hover:border-white/35 backdrop-blur-sm"
              >
                <FileText size={15} strokeWidth={1.75} />
                View Report Intelligence
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────── EXPLORE THE OBSERVATORY ────────────
          The four entry points, each disambiguated. Resolves the four
          most common new-user questions: Atlas vs Sites, Delegates vs
          Network, Reports vs Reports Intelligence, and what Impact
          actually contains. */}
      <section aria-label="Explore the Observatory">
        <div className="mb-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted mb-2">
            Explore the Observatory
          </div>
          <h2 className="text-2xl md:text-[28px] font-bold text-ink tracking-tight leading-[1.1]">
            Four entry points, depending on what you want to understand
          </h2>
          <p className="mt-2 text-[14px] text-text-secondary leading-relaxed max-w-2xl">
            Pick the lens — geography, people, reports or impact — and
            the Observatory will route you to the right deep dive.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EntryPointCard
            href="/map"
            icon={MapIcon}
            accent="#2563EB"
            eyebrow="Geography"
            title="ACE Atlas"
            pitch="Explore host cities, visited institutions, and regional innovation clusters."
            body="Use the Atlas to navigate ACE geographically — from countries and host cities to specific companies, universities, public agencies, innovation hubs, and sites visited during each edition."
          />
          <EntryPointCard
            href="/network"
            icon={Share2}
            accent="#7C3AED"
            eyebrow="People"
            title="ACE Network"
            pitch="Discover delegates, institutions, and cross-border connections."
            body="Explore the people and organizations that make up the ACE community, including participating leaders, countries represented, institutional affiliations, and connections across editions."
          />
          <EntryPointCard
            href="/reports"
            icon={FileText}
            accent="#0B7A4A"
            eyebrow="Reports"
            title="Reports Intelligence"
            pitch="Turn final reports into searchable indicators, outcomes, and documented partnerships."
            body="Access structured information extracted from ACE Final Reports, including letters of intent, documented outcomes, media results, partnerships, sites visited, and follow-up opportunities."
          />
          <EntryPointCard
            href="/impact"
            icon={Award}
            accent="#F05A28"
            eyebrow="Impact"
            title="Impact & Outcomes"
            pitch="Track documented results, agreements, collaborations, and follow-up actions generated through ACE."
            body="Review the concrete outputs linked to ACE editions, including partnerships, policy exchanges, derived projects, institutional commitments, and other evidence of regional impact."
          />
        </div>
      </section>

      {/* ──────────── ATLAS as protagonist ────────────
          Promoted right under the hero. The map IS the observatory's
          centerpiece — geographic intelligence is the strongest
          institutional asset ACE has. */}
      <section
        aria-label="Geographic intelligence"
        className="relative overflow-hidden rounded-3xl bg-white border border-surface-border shadow-card"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-5 p-7 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue">
                ACE Atlas
              </span>
              <span className="w-1 h-1 rounded-full bg-accent-blue/60" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Geographic intelligence layer
              </span>
            </div>
            <h2 className="text-[26px] md:text-[32px] font-bold text-ink tracking-tight leading-[1.05]">
              From countries to cities to innovation sites
            </h2>
            <p className="mt-3 text-[14px] text-text-secondary leading-relaxed max-w-md">
              Explore every ACE mission through a geographic intelligence
              layer. Drill from country to state to city to specific
              institutions — every visit, every cluster, every leader, on a
              single interactive map.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <FootprintStat
                label="Host countries"
                value={
                  Array.from(new Set(editions.map((e) => e.countryId))).length
                }
              />
              <FootprintStat label="Host cities" value={totalCities} />
              <FootprintStat label="Visited sites" value={totalSites} />
              <FootprintStat
                label="Countries represented"
                value={countriesRepresented}
              />
            </div>
            <div className="mt-7">
              <Link href="/map">
                <Button variant="primary" size="md">
                  <MapIcon size={14} />
                  Explore the Atlas
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7 h-[420px] lg:h-[560px] relative bg-surface-subtle border-t lg:border-t-0 lg:border-l border-surface-border">
            <MapMini points={mapPoints} center={[10, -75]} zoom={3} />
          </div>
        </div>
      </section>

      {/* ───────── DATA LAYER ─────────
          Editions, delegates, countries, sites, sectors. The factual
          spine of the observatory — counts, distributions, timelines,
          everything that answers "what happened, where and when". */}
      <LayerHeading
        eyebrow="Data layer"
        title="Activity across a decade"
        description="Editions, delegates, countries, host cities and visited institutions — the factual spine of the observatory."
      />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-9 space-y-7">
          {/* Edition timeline strip — visual proof of a decade of
              continuity, every edition clickable. */}
          <EditionTimeline />

          {/* Growth-over-time chart — institutional proof of decade-long
              expansion. Shows cumulative editions, delegates and countries
              represented. The line going up is the headline story. */}
          <GrowthChart />

          {/* Where participants come from — world map highlighting every
              country with at least one ACE delegate. */}
          <ParticipantWorldMap />
        </div>

        <div className="xl:col-span-3">
          <OverviewInsightRail />
        </div>
      </div>

      {/* ─────────── SECONDARY KPI strip ─────────── */}
      <section aria-label="Supporting indicators">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-1">
              Supporting indicators
            </div>
            <h2 className="text-lg md:text-xl font-bold text-ink tracking-tight">
              The observatory at a glance
            </h2>
          </div>
        </div>
        <KPIGrid>
          <KPICard label="Host cities" value={totalCities} icon={MapIcon} accent="blue" />
          <KPICard label="Visited sites" value={totalSites} icon={MapPin} accent="purple" />
          <KPICard label="Strategic sectors" value={totalSectors} icon={Sparkles} accent="turquoise" />
          <KPICard label="Media resources" value={totalMedia} icon={GalleryHorizontalEnd} accent="amber" />
        </KPIGrid>
      </section>

      {/* ─────────── FEATURED editions ─────────── */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-1">
              Featured
            </div>
            <h2 className="text-2xl font-bold text-ink tracking-tight">
              Highlighted editions
            </h2>
          </div>
          <Link
            href="/editions"
            className="text-sm font-semibold text-accent-blue hover:text-ink flex items-center gap-1"
          >
            See all 23 editions
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((e) => (
            <EditionCard key={e.id} edition={e} />
          ))}
        </div>
      </section>

      {/* ───────── IMPACT LAYER ─────────
          Letters of intent, alliances, derivative projects, testimonials
          and verifiable outcomes. Where the data layer says "what
          happened", the impact layer says "what changed because of it". */}
      <LayerHeading
        eyebrow="Impact layer"
        title="What changed because of ACE"
        description="Letters of intent, alliances, derivative projects, testimonials and verifiable outcomes — beyond activity counts."
        accent="orange"
      />

      {/* Outcome-led KPIs derived from live data (LOIs, partnerships,
          documented projects). Every card is queryable. */}
      <ResultsSection />

      {/* Latest report-intelligence anchor. */}
      <LatestReportIntelligenceCard />

      {/* Strongest testimonial pull-quote across all ingested reports. */}
      <FeaturedTestimonial />

      {/* ─────────── FOOTER credit ─────────── */}
      <footer className="pt-3 pb-2">
        <div className="rounded-2xl bg-white border border-surface-border px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-ink flex items-center justify-center">
              <Image
                src={asset("/logos/ace-logo.png")}
                alt="ACE"
                width={28}
                height={28}
                className="object-contain p-0.5"
              />
            </div>
            <div className="text-xs leading-relaxed text-text-secondary">
              <span className="font-semibold text-ink">ACE Observatory</span> ·
              built for the Americas Competitiveness Exchange
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-text-muted">
            <span>v0.1 · MVP preview</span>
            <span className="w-1 h-1 rounded-full bg-text-muted/50" />
            <span>OAS · 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


// Headline KPI tile rendered inside the dark hero. Glassy translucent
// fill + tabular-nums so the four cards line up cleanly on every
// breakpoint. Values are passed in from the live data layer.
function HeroKPI({ value, label }: { value: number | string; label: string }) {
  const display = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <div className="rounded-2xl bg-white/8 border border-white/12 backdrop-blur px-4 py-4 md:py-5">
      <div className="text-[34px] md:text-[42px] font-bold text-white tabular-nums tracking-tight leading-none">
        {display}
      </div>
      <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
        {label}
      </div>
    </div>
  );
}

// Section heading used to mark the Data layer / Impact layer split.
// `accent` controls the colored eyebrow + bullet so the two layers
// read as distinct rails on the page.
function LayerHeading({
  eyebrow,
  title,
  description,
  accent = "blue",
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent?: "blue" | "orange";
}) {
  const eyebrowColor = accent === "orange" ? "text-accent-orange-cta" : "text-accent-blue";
  const dotColor = accent === "orange" ? "bg-accent-orange-cta" : "bg-accent-blue";
  return (
    <div className="flex flex-col gap-1.5 pt-3">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${eyebrowColor}`}>
          {eyebrow}
        </span>
      </div>
      <h2 className="text-2xl md:text-[28px] font-bold text-ink tracking-tight leading-[1.1]">
        {title}
      </h2>
      <p className="text-[14px] text-text-secondary leading-relaxed max-w-2xl">
        {description}
      </p>
    </div>
  );
}

// Entry-point card for the "Explore the Observatory" grid. Whole
// surface is clickable; the colored accent rail signals which lens
// (geography / people / reports / impact) the destination represents.
function EntryPointCard({
  href,
  icon: Icon,
  accent,
  eyebrow,
  title,
  pitch,
  body,
}: {
  href: string;
  icon: LucideIcon;
  accent: string;
  eyebrow: string;
  title: string;
  pitch: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl bg-white border border-surface-border shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5 flex flex-col"
    >
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accent }}
      />
      <div className="p-6 md:p-7 flex-1 flex flex-col">
        <div className="flex items-center gap-2.5 mb-4">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accent}14`, color: accent }}
          >
            <Icon size={18} strokeWidth={1.75} />
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            {eyebrow}
          </span>
        </div>
        <h3 className="text-[20px] font-bold text-ink tracking-tight">
          {title}
        </h3>
        <p className="mt-1.5 text-[14px] font-semibold text-ink/85 leading-snug">
          {pitch}
        </p>
        <p className="mt-3 text-[13px] text-text-secondary leading-relaxed">
          {body}
        </p>
        <div className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-text-muted group-hover:text-ink transition-colors">
          Open
          <ArrowRight
            size={13}
            strokeWidth={2}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  );
}

function FootprintStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-canvas px-3.5 py-3 border border-surface-border">
      <div className="text-[22px] font-bold text-ink tracking-tight leading-none tabular-nums">
        {value}
        {suffix && (
          <span className="text-accent-orange-cta">{suffix}</span>
        )}
      </div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </div>
    </div>
  );
}

// ───────────────────────── RESULTS — outcome-led KPIs ─────────────────────────
function ResultsSection() {
  // Live counts pulled from the directory + reports + outcomes datasets.
  // These numbers are queryable: each card links into the page that
  // surfaces the underlying records.
  const totalAlumni = participants.length;
  const distinctCountries = new Set(participants.map((p) => p.countryId)).size;
  const sitesMapped = visitedSites.length;
  const documentedOutcomes = outcomes.length;
  // Letters of intent across reports that publish a structured LOI count.
  const totalLOIs = reports.reduce(
    (sum, r) => sum + (r.loiSummary?.total ?? 0),
    0,
  );

  const cards: {
    label: string;
    value: string;
    sub: string;
    href: string;
    accent: "navy" | "blue" | "turquoise" | "orange" | "purple";
  }[] = [
    {
      label: "Alumni",
      value: totalAlumni.toLocaleString(),
      sub: `Verified delegates from ${distinctCountries} countries`,
      href: "/participants",
      accent: "blue",
    },
    {
      label: "Institutions visited",
      value: sitesMapped.toLocaleString(),
      sub: "Universities, companies, public agencies & innovation hubs",
      href: "/sites",
      accent: "turquoise",
    },
    {
      label: "Letters of intent",
      value: totalLOIs > 0 ? `${totalLOIs}` : "Coming",
      sub: totalLOIs > 0
        ? "Documented partnerships from extracted Final Reports"
        : "Pending Final Report extraction",
      href: "/reports",
      accent: "orange",
    },
    {
      label: "Documented outcomes",
      value: documentedOutcomes.toLocaleString(),
      sub: "Partnerships, derived projects, policy and investment",
      href: "/impact",
      accent: "navy",
    },
  ];

  return (
    <section aria-label="Results that matter">
      <div className="flex items-end justify-between mb-4">
        <div className="max-w-2xl">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-orange-cta mb-1">
            Results that matter
          </div>
          <h2 className="text-lg md:text-xl font-bold text-ink tracking-tight">
            What a decade of ACE has produced
          </h2>
          <p className="mt-1.5 text-[12.5px] md:text-[13px] text-text-secondary leading-relaxed">
            Outcome-led indicators pulled directly from the participants
            directory, mapped institutions and Final Report extractions —
            every figure is a click away from its underlying record.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group relative bg-white rounded-2xl border border-surface-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all p-5 overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1"
              style={{
                background:
                  c.accent === "navy"
                    ? "#0B1F3A"
                    : c.accent === "blue"
                      ? "#2563EB"
                      : c.accent === "turquoise"
                        ? "#14B8A6"
                        : c.accent === "orange"
                          ? "#F97316"
                          : "#7C3AED",
              }}
            />
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              {c.label}
            </div>
            <div className="mt-3 text-4xl md:text-5xl font-bold text-ink tracking-tight tabular-nums leading-none">
              {c.value}
            </div>
            <div className="mt-3 text-[12px] text-text-secondary leading-relaxed">
              {c.sub}
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-accent-blue group-hover:gap-1.5 transition-all">
              Open
              <ArrowRight size={12} strokeWidth={2.2} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ───────────────────────── EDITION TIMELINE STRIP ─────────────────────────
function EditionTimeline() {
  // Sort chronologically (by edition number ascending) so the strip
  // reads left→right as a decade.
  const ordered = [...editions].sort((a, b) => a.number - b.number);

  return (
    <section aria-label="Edition timeline" className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-1">
            12 years on the road
          </div>
          <h2 className="text-lg md:text-xl font-bold text-ink tracking-tight">
            Every ACE, in order
          </h2>
        </div>
        <Link
          href="/editions"
          className="text-[11px] font-semibold text-accent-blue hover:text-ink inline-flex items-center gap-1"
        >
          All editions <ArrowRight size={11} />
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-surface-border shadow-card p-5">
        {/* Wrapped grid — every edition fits on the page without
            requiring a horizontal scroll. Scales from 4 cols on mobile
            to 8 cols on lg, 12 on xl so all 23 editions fit in 2-3 rows. */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2.5">
          {ordered.map((e) => {
            const country = countryById(e.countryId);
            const year = new Date(e.startDate).getFullYear();
            const mainCity = e.cityIds[0] ? cityById(e.cityIds[0]) : undefined;
            return (
              <Link
                key={e.id}
                href={`/editions/${e.id}`}
                className="group rounded-xl bg-surface-canvas border border-surface-border hover:border-accent-blue/40 hover:bg-white hover:shadow-card hover:-translate-y-0.5 transition-all px-2.5 py-3 text-left"
                title={`ACE ${e.number} — ${editionRegion(e)}`}
              >
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  {year}
                </div>
                <div className="mt-1 text-[15px] font-bold text-ink tracking-tight leading-none tabular-nums">
                  ACE {e.number}
                </div>
                <div className="mt-2 text-[11px] font-semibold text-ink truncate">
                  {mainCity?.name ?? editionRegion(e)}
                </div>
                <div className="text-[10px] text-text-muted truncate">
                  {country?.name ?? ""}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── FEATURED TESTIMONIAL ─────────────────────────
function FeaturedTestimonial() {
  // Pool every non-sample testimonial across every report, filtered to
  // ones with enough body to read well.
  const candidates = useMemo(
    () =>
      reports
        .flatMap((r) =>
          (r.testimonials ?? []).filter((t) => !t._sample).map((t) => ({ t, r })),
        )
        .filter(({ t }) => (t.quote?.length ?? 0) >= 120 && (t.quote?.length ?? 0) <= 800),
    [],
  );

  // Pick a random testimonial on mount and rotate it every ~12 seconds.
  // We seed with a fixed initial index (0) on the server so the SSR HTML
  // matches the first client render — preventing hydration warnings —
  // then a useEffect picks a random one and starts the rotation.
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (candidates.length <= 1) return;
    setIdx(Math.floor(Math.random() * candidates.length));
    const interval = setInterval(() => {
      setIdx((prev) => {
        let next = Math.floor(Math.random() * candidates.length);
        if (next === prev) next = (next + 1) % candidates.length;
        return next;
      });
    }, 12000);
    return () => clearInterval(interval);
  }, [candidates.length]);

  if (candidates.length === 0) return null;
  const { t, r } = candidates[idx] ?? candidates[0];

  return (
    <section aria-label="From the network">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-1">
            From the network
          </div>
          <h2 className="text-lg md:text-xl font-bold text-ink tracking-tight">
            What delegates say
          </h2>
        </div>
        {candidates.length > 1 && (
          <button
            type="button"
            onClick={() => {
              let next = Math.floor(Math.random() * candidates.length);
              if (next === idx) next = (next + 1) % candidates.length;
              setIdx(next);
            }}
            className="text-[11px] font-semibold text-accent-blue hover:text-ink inline-flex items-center gap-1.5"
            aria-label="Show another testimonial"
          >
            Another voice
            <ArrowRight size={11} />
          </button>
        )}
      </div>
      <figure className="relative bg-white rounded-2xl border border-surface-border shadow-card p-7 md:p-9">
        <span
          aria-hidden
          className="absolute top-4 left-5 text-7xl leading-none font-serif text-accent-orange-cta/15 select-none pointer-events-none"
        >
          “
        </span>
        <blockquote className="relative pl-2 text-[15px] md:text-[17px] text-ink leading-relaxed font-medium">
          {t.quote}
        </blockquote>
        <figcaption className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
          <span className="font-semibold text-ink">{t.name}</span>
          {t.role && <span>{t.role}</span>}
          {t.organization && <span className="text-text-muted">· {t.organization}</span>}
          <Link
            href={`/reports/${r.id}`}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-accent-blue hover:text-ink"
          >
            From {r.title}
            <ArrowRight size={11} />
          </Link>
        </figcaption>
      </figure>
    </section>
  );
}

// ───────────────────────── GROWTH OVER TIME ─────────────────────────
function GrowthChart() {
  // Build cumulative-by-year buckets the same way as before. The chart
  // below now plots a single series (editions), with the other two
  // metrics surfaced as headline stat cards above so each gets its own
  // honest scale and the reader doesn't have to compare 1,041 to 23 on
  // the same Y axis.
  const byYear = new Map<number, { editions: number; delegates: number; countries: Set<string> }>();
  for (const e of editions) {
    const y = new Date(e.startDate).getFullYear();
    let bucket = byYear.get(y);
    if (!bucket) {
      bucket = { editions: 0, delegates: 0, countries: new Set() };
      byYear.set(y, bucket);
    }
    bucket.editions += 1;
    const eParts = participants.filter(p => p.editionIds.includes(e.id));
    bucket.delegates += eParts.length;
    eParts.forEach(p => bucket!.countries.add(p.countryId));
  }

  const yearsSorted = [...byYear.keys()].sort((a, b) => a - b);
  let cumEditions = 0;
  let cumDelegates = 0;
  const cumCountries = new Set<string>();
  const series = yearsSorted.map(y => {
    const b = byYear.get(y)!;
    cumEditions += b.editions;
    cumDelegates += b.delegates;
    b.countries.forEach(c => cumCountries.add(c));
    return {
      year: y,
      editions: cumEditions,
      delegates: cumDelegates,
      countries: cumCountries.size,
    };
  });

  return (
    <section aria-label="ACE growth over time">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-orange-cta mb-1">
            Trajectory
          </div>
          <h2 className="text-lg md:text-xl font-bold text-ink tracking-tight">
            ACE growth over time
          </h2>
          <p className="mt-1.5 text-[12.5px] md:text-[13px] text-text-secondary leading-relaxed max-w-2xl">
            From {yearsSorted[0]} to {yearsSorted[yearsSorted.length - 1]}, the program expanded across editions,
            participants, and countries represented.
          </p>
        </div>
      </div>

      {/* Headline stat cards — one per metric so each lives at its own
          honest scale (no shared Y axis, no comparison illusion). */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <GrowthStatCard
          color="#0B1F3A"
          value={cumEditions.toLocaleString()}
          label="Editions"
          hint="Held since 2014"
        />
        <GrowthStatCard
          color="#F97316"
          value={cumDelegates.toLocaleString()}
          label="Delegate participations"
          hint="Including repeat alumni"
        />
        <GrowthStatCard
          color="#14B8A6"
          value={cumCountries.size.toLocaleString()}
          label="Countries represented"
          hint="Unique nationalities"
        />
      </div>

      {/* Single trajectory line — cumulative editions per year as a
          step chart. Editions are discrete events; a stepped line says
          that more honestly than a smooth diagonal. */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card p-5 md:p-6">
        <div className="mb-4">
          <h3 className="text-base md:text-lg font-bold text-ink tracking-tight">
            Cumulative ACE editions by year
          </h3>
          <p className="mt-1 text-[12.5px] text-text-muted leading-relaxed">
            Each step represents one new ACE mission added to the observatory.
          </p>
        </div>
        <GrowthSVGSingle series={series} />
      </div>
    </section>
  );
}

function GrowthStatCard({
  color, value, label, hint,
}: {
  color: string;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-5 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: color }}
      />
      <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-text-muted">
        {label}
      </div>
      <div
        className="mt-2 text-4xl md:text-5xl font-bold tabular-nums leading-none"
        style={{ color }}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-[12px] text-text-secondary leading-relaxed">
          {hint}
        </div>
      )}
    </div>
  );
}

function GrowthSVGSingle({
  series,
}: {
  series: { year: number; editions: number; delegates: number; countries: number }[];
}) {
  const W = 920;
  const H = 320;
  const padLeft = 70;   // space for Y axis title + tick labels
  const padRight = 30;
  const padTop = 80;    // room for milestone callouts
  const padBottom = 60; // room for X axis title under year labels
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;

  if (series.length === 0) return null;

  const maxValue = Math.max(...series.map((s) => s.editions), 1);
  const niceMax = Math.ceil((maxValue + 1) / 4) * 4; // 24 for max=23

  const xFor = (i: number) =>
    padLeft + (series.length > 1 ? (i / (series.length - 1)) * innerW : innerW / 2);
  const yFor = (v: number) => padTop + innerH - (v / niceMax) * innerH;

  // Build the line as a STEP path — each year's count is held flat
  // until the next year, then jumps up.
  const stepSegments: string[] = [`M${xFor(0)},${yFor(series[0].editions)}`];
  for (let i = 1; i < series.length; i++) {
    const prevY = yFor(series[i - 1].editions);
    const curX = xFor(i);
    const curY = yFor(series[i].editions);
    stepSegments.push(`L${curX},${prevY}`);
    stepSegments.push(`L${curX},${curY}`);
  }
  const linePath = stepSegments.join(" ");
  const areaPath =
    linePath +
    ` L${xFor(series.length - 1)},${padTop + innerH} L${xFor(0)},${padTop + innerH} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((i / 4) * niceMax));

  // Milestone annotations.
  const milestoneSpecs = [
    { year: 2014, label: "First editions" },
    { year: 2021, label: "Post-pause restart" },
    { year: 2024, label: "Acceleration" },
    {
      year: series[series.length - 1].year,
      label: `${series[series.length - 1].editions} editions`,
      isFinal: true,
    },
  ];
  const milestones = milestoneSpecs
    .map((m) => {
      const idx = series.findIndex((s) => s.year === m.year);
      if (idx === -1) return null;
      const s = series[idx];
      return { ...m, idx, x: xFor(idx), y: yFor(s.editions), value: s.editions };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Cumulative ACE editions per year"
    >
      <defs>
        <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B1F3A" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#0B1F3A" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Y-axis title (rotated) */}
      <text
        x={20}
        y={padTop + innerH / 2}
        fontSize={11}
        fontWeight={700}
        fill="#5E6B7A"
        textAnchor="middle"
        transform={`rotate(-90 20 ${padTop + innerH / 2})`}
        className="uppercase tracking-wider"
      >
        Editions (cumulative)
      </text>

      {/* Y grid lines + tick labels */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={padLeft}
            x2={padLeft + innerW}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="#EEF1F5"
            strokeDasharray="3 3"
          />
          <text
            x={padLeft - 8}
            y={yFor(v) + 3}
            fontSize={11}
            fill="#5E6B7A"
            textAnchor="end"
            className="tabular-nums"
            fontWeight={500}
          >
            {v}
          </text>
        </g>
      ))}

      {/* X-axis baseline */}
      <line
        x1={padLeft}
        x2={padLeft + innerW}
        y1={padTop + innerH}
        y2={padTop + innerH}
        stroke="#CBD5E1"
      />

      {/* Area under curve (very faint) */}
      <path d={areaPath} fill="url(#growth-area)" />

      {/* Step line */}
      <path
        d={linePath}
        fill="none"
        stroke="#0B1F3A"
        strokeWidth={2.5}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Data points + value labels above each point */}
      {series.map((s, i) => {
        const pointX = xFor(i);
        const pointY = yFor(s.editions);
        // For value labels we offset above the dot, but if a milestone
        // already labels this point we suppress the value to avoid clash.
        const isMilestone = milestones.some((m) => m.idx === i);
        return (
          <g key={s.year}>
            {!isMilestone && (
              <text
                x={pointX}
                y={pointY - 10}
                fontSize={11}
                fontWeight={700}
                fill="#475569"
                textAnchor="middle"
                className="tabular-nums"
              >
                {s.editions}
              </text>
            )}
            <circle
              cx={pointX}
              cy={pointY}
              r={4}
              fill="#FFFFFF"
              stroke="#0B1F3A"
              strokeWidth={2}
            />
            <title>{`${s.year}: ${s.editions} edition${s.editions === 1 ? "" : "s"} cumulative`}</title>
          </g>
        );
      })}

      {/* Milestone callouts — small pill-shaped labels above selected points */}
      {milestones.map((m) => {
        const labelY = Math.max(padTop - 32, m.y - 50);
        const isLast = m.idx === series.length - 1;
        const anchor: "start" | "middle" | "end" = isLast ? "end" : m.idx === 0 ? "start" : "middle";
        const labelX = isLast ? m.x - 4 : m.idx === 0 ? m.x + 4 : m.x;
        const color = m.isFinal ? "#F97316" : "#0B1F3A";
        return (
          <g key={`ms-${m.year}`}>
            {/* Vertical guide from data point up to the label */}
            <line
              x1={m.x}
              x2={m.x}
              y1={m.y - 8}
              y2={labelY + 12}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.55}
            />
            {/* Label text + value side-by-side */}
            <text
              x={labelX}
              y={labelY}
              fontSize={12}
              fontWeight={700}
              fill={color}
              textAnchor={anchor}
            >
              {m.label}
            </text>
            <text
              x={labelX}
              y={labelY + 14}
              fontSize={10.5}
              fill="#5E6B7A"
              textAnchor={anchor}
              className="tabular-nums"
            >
              {m.value} edition{m.value === 1 ? "" : "s"}
            </text>
            {/* Highlight the data point */}
            <circle
              cx={m.x}
              cy={m.y}
              r={5.5}
              fill={color}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          </g>
        );
      })}

      {/* X-axis year labels — show ALL years so each step has a tick */}
      {series.map((s, i) => (
        <text
          key={s.year}
          x={xFor(i)}
          y={padTop + innerH + 18}
          fontSize={10.5}
          fill="#5E6B7A"
          textAnchor="middle"
          className="tabular-nums"
          fontWeight={500}
        >
          {s.year}
        </text>
      ))}

      {/* X-axis title */}
      <text
        x={padLeft + innerW / 2}
        y={H - 10}
        fontSize={11}
        fontWeight={700}
        fill="#5E6B7A"
        textAnchor="middle"
        className="uppercase tracking-wider"
      >
        Year
      </text>
    </svg>
  );
}

// Old multi-line GrowthSVG removed — replaced by GrowthSVGSingle which
// renders a single step-line for cumulative editions and three
// dedicated stat cards for the per-metric totals.
