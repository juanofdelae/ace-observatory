"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Quote,
  MapPin,
  Calendar,
  Map as MapIcon,
  Share2,
  FileText,
  Sparkles,
  Handshake,
  ScrollText,
  CheckCircle2,
} from "lucide-react";
import { editions } from "@/data/editions";
import { participants, cumulativeParticipations } from "@/data/participants";
import { visitedSites } from "@/data/visited-sites";
import { outcomes } from "@/data/outcomes";
import { countries } from "@/data/countries";
import { cityById } from "@/data/cities";
import { loisCount, crossBorderLois } from "@/data/lois";
import { asset } from "@/lib/asset-path";

// 90-second executive cover for an institutional audience. Light
// palette inspired by OAS / IDB / World Bank / OECD reports. Seven
// strategic sections, all numbers pulled from the live data layer
// so the home, sidebar and this cover never disagree. Renders
// without sidebar via DashboardLayout's FULL_SCREEN_PATHS.
//
// Editorial rule: use "verified", "documented", "mapped",
// "reported", "potential", "initial evidence layer" — never claim
// ROI, mobilized capital, active agreements, or impact percentages
// that aren't backed by data in this repo.
export default function ExecutiveCoverPage() {
  // ── HEADLINE NUMBERS (all live, no rounding for marketing) ────
  const totalEditions = editions.length;
  const totalDelegates = participants.length;
  const totalSites = visitedSites.length;
  const countriesRepresented = new Set(
    participants.map(p => p.countryId).filter(c => c && c !== "intl"),
  ).size;
  const totalParticipations = cumulativeParticipations;
  const hostCountries = new Set(editions.map(e => e.countryId)).size;
  const hostCities = new Set(editions.flatMap(e => e.cityIds)).size;
  const documentedOutcomes = outcomes.length;

  // ── ACTOR MIX (four buckets, conic-gradient rings) ────────────
  const actorMix = (() => {
    const counts: Record<string, number> = {
      Government: 0,
      "Private Sector": 0,
      Academia: 0,
      Other: 0,
    };
    for (const p of participants) {
      if (p.actorType === "Government") counts.Government += 1;
      else if (p.actorType === "Private Sector") counts["Private Sector"] += 1;
      else if (p.actorType === "Academia") counts.Academia += 1;
      else counts.Other += 1;
    }
    const total = totalDelegates;
    const order = [
      {
        label: "Government",
        count: counts.Government,
        color: "#2563EB",
        tagline: "Ministers, agency heads, public officials",
      },
      {
        label: "Private Sector",
        count: counts["Private Sector"],
        color: "#F97316",
        tagline: "CEOs, executives, business leaders",
      },
      {
        label: "Academia",
        count: counts.Academia,
        color: "#0B7A4A",
        tagline: "University presidents, researchers, deans",
      },
      {
        label: "Other ecosystems",
        count: counts.Other,
        color: "#7C3AED",
        tagline: "International orgs, ecosystem builders",
      },
    ];
    return order.map(b => ({ ...b, pct: total > 0 ? (b.count / total) * 100 : 0 }));
  })();

  // ── TOP COUNTRIES (delegate roster) ──────────────────────────
  const topCountries = (() => {
    const counts: Record<string, number> = {};
    for (const p of participants) {
      if (!p.countryId || p.countryId === "intl") continue;
      counts[p.countryId] = (counts[p.countryId] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([cid, n]) => ({
        country: countries.find(c => c.id === cid),
        count: n,
      }))
      .filter((x): x is { country: NonNullable<typeof x.country>; count: number } =>
        Boolean(x.country),
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  })();

  // ── FEATURED TESTIMONIAL (named, sourced from ACE 16 survey) ─
  const featuredTestimonial = {
    text:
      "Potential project with Panama on sustainable agriculture practices. Potential project with IEDC, Puget Sound Regional Council, Starbucks Foundation, and the Pan American Development Foundation on resilient economy — transition to coffee from coca.",
    name: "Joe McKinney",
    country: "United States",
    edition: "ACE 16 · Seattle",
  };

  // ── MEMPHIS PREVIEW ──────────────────────────────────────────
  const memphis = editions.find(e => e.id === "ace-23-memphis-2026");
  const memphisCity = memphis?.cityIds[0] ? cityById(memphis.cityIds[0]) : undefined;

  return (
    <div className="min-h-screen bg-surface-canvas text-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(1200px 700px at 18% 0%, rgba(37, 99, 235, 0.06) 0%, transparent 60%), radial-gradient(900px 500px at 92% 100%, rgba(249, 115, 22, 0.05) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-20 space-y-24 md:space-y-32">
        {/* ════ 1 · HERO ════ */}
        <section className="text-center">
          <Link
            href="/"
            aria-label="Back to ACE Observatory"
            className="inline-flex flex-col items-center gap-3 mb-10 group"
          >
            <Image
              src={asset("/logos/ace-logo.png")}
              alt="ACE — Americas Competitiveness Exchange"
              width={180}
              height={180}
              priority
              className="object-contain group-hover:scale-105 transition-transform duration-500"
            />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-text-muted">
              ACE Observatory · Executive cover
            </span>
          </Link>
          <h1 className="text-4xl md:text-6xl lg:text-[68px] font-bold tracking-tight leading-[1.04] text-ink max-w-5xl mx-auto">
            Turning a decade of exchange
            <br />
            into a living intelligence platform
            <br />
            for the Americas.
          </h1>
          <p className="mt-7 text-base md:text-lg text-text-secondary leading-relaxed max-w-3xl mx-auto">
            The Americas Competitiveness Exchange has connected leaders,
            cities, institutions and innovation ecosystems across the
            hemisphere. The ACE Observatory makes that legacy{" "}
            <span className="font-semibold text-ink">visible, searchable, and actionable</span>.
          </p>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            <CoverKPI value={totalEditions} label="ACE editions" />
            <CoverKPI value={countriesRepresented} label="Countries represented" />
            <CoverKPI value={totalDelegates} label="Verified delegates" />
            <CoverKPI value={totalSites} label="Institutions visited" />
          </div>
        </section>

        {/* ════ 2 · SCALE — dark thesis band ════ */}
        <section className="relative overflow-hidden rounded-3xl bg-ink text-white px-8 md:px-14 py-14 md:py-20 shadow-panel">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-accent-orange-cta/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-16 w-96 h-96 rounded-full bg-accent-blue/15 blur-3xl"
          />
          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent-orange-cta mb-5">
              Scale
            </div>
            <h2 className="text-3xl md:text-[44px] font-bold tracking-tight leading-[1.08] max-w-4xl">
              ACE has built one of the most active
              <br className="hidden md:block" />
              competitiveness networks in the hemisphere.
            </h2>
            <p className="mt-6 text-base md:text-lg text-white/75 leading-relaxed max-w-3xl">
              Across government, private sector, academia and innovation
              ecosystems, ACE connects people and institutions that
              would otherwise take years to reach each other.
            </p>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <ScaleTile value={totalEditions} label="ACE editions" />
              <ScaleTile value={countriesRepresented} label="Countries in roster" />
              <ScaleTile value={totalDelegates} label="Verified delegates" />
              <ScaleTile value={totalSites} label="Institutions visited" />
            </div>
          </div>
        </section>

        {/* ════ 3 · REACH — geographic ════ */}
        <Section
          eyebrow="Reach"
          title="Where ACE has activated ecosystems"
        >
          <p className="text-text-secondary leading-relaxed max-w-2xl">
            From host cities to visited institutions, the Observatory
            maps where ACE has activated ecosystems, connected
            delegations and documented collaboration opportunities.
            Every dot below tells a visit, a connection or an
            opportunity.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <FootprintStat value={hostCountries} label="Host countries" />
            <FootprintStat value={hostCities} label="Host cities" />
            <FootprintStat value={totalSites} label="Institutions visited" />
            <FootprintStat value={countriesRepresented} label="Delegate countries" />
          </div>
          <div className="mt-8 bg-white border border-surface-border rounded-2xl shadow-card overflow-hidden">
            <ExecutiveMap />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ink hover:bg-ink/85 text-white text-[13.5px] font-semibold transition-colors"
            >
              <MapIcon size={15} />
              Explore the Atlas
              <ArrowRight size={14} />
            </Link>
            <span className="text-[12px] text-text-muted">
              Drill from country → state → city → specific institutions.
            </span>
          </div>
        </Section>

        {/* ════ 4 · CONNECTIONS — actor mix + top countries ════ */}
        <Section
          eyebrow="Connections"
          title={`From Canada to Argentina: a verified network of ${totalDelegates.toLocaleString()} decision-makers`}
        >
          <p className="text-text-secondary leading-relaxed max-w-2xl">
            ACE connects people and institutions that would otherwise
            take years to reach each other. A balanced, cross-sector
            roster — not a single-actor club. {totalParticipations.toLocaleString()}{" "}
            cumulative participations mean dozens of alumni have
            returned to multiple editions, multiplying the network
            effect.
          </p>

          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {actorMix.map(a => (
              <ActorRing key={a.label} {...a} />
            ))}
          </div>

          <div className="mt-10 bg-white border border-surface-border rounded-2xl shadow-card p-7">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted mb-5">
              Most represented countries
            </div>
            <div className="space-y-4">
              {topCountries.map((row, i) => {
                const max = topCountries[0]?.count ?? 1;
                const widthPct = (row.count / max) * 100;
                return (
                  <div key={row.country.id} className="flex items-center gap-4">
                    <span className="w-32 md:w-44 text-sm font-semibold text-ink truncate">
                      {row.country.name}
                    </span>
                    <div className="flex-1 h-2.5 bg-surface-canvas rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-blue"
                        style={{
                          width: `${widthPct}%`,
                          transitionDelay: `${i * 60}ms`,
                        }}
                      />
                    </div>
                    <span className="text-base font-bold text-ink tabular-nums w-12 text-right">
                      {row.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/network"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ink hover:bg-ink/85 text-white text-[13.5px] font-semibold transition-colors"
            >
              <Share2 size={15} />
              View ACE Network
              <ArrowRight size={14} />
            </Link>
          </div>
        </Section>

        {/* ════ 5 · EVIDENCE — pipeline + named testimonial ════ */}
        <Section
          eyebrow="Evidence"
          title="ACE impact is measured by what continues after each edition."
        >
          <p className="text-text-secondary leading-relaxed max-w-2xl">
            The Observatory is building an initial evidence layer
            extracted from final reports and verified records. The
            pipeline below is anchored on the most recent verifiable
            cohort — ACE Córdoba 2025 — and will be backfilled as
            earlier editions are consolidated.
          </p>

          {/* 3-stage pipeline */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <PipelineStage
              icon={Handshake}
              tone="blue"
              stage="Stage 1"
              label="Connection made"
              value={totalDelegates}
              caption="Verified delegates who have met on the ground across 23 editions."
            />
            <PipelineStage
              icon={ScrollText}
              tone="orange"
              stage="Stage 2"
              label="Letter of intent"
              value={loisCount}
              caption={`Signed at ACE Córdoba 2025. ${crossBorderLois} are cross-border (${Math.round(
                (crossBorderLois / Math.max(loisCount, 1)) * 100,
              )}%).`}
            />
            <PipelineStage
              icon={CheckCircle2}
              tone="green"
              stage="Stage 3"
              label="Documented outcome"
              value={documentedOutcomes}
              caption="Partnerships, derived projects and policy alignments traced to a specific edition."
            />
          </div>

          {/* Methodology line — exact wording requested */}
          <p className="mt-6 text-[12px] text-text-muted leading-relaxed italic max-w-3xl">
            Initial documented evidence layer extracted from available
            final reports and verified records. The full pipeline,
            including post-event follow-up tracking, will be expanded
            edition by edition.
          </p>

          {/* Named testimonial — peer validation */}
          <div className="mt-10 relative bg-white border border-surface-border rounded-2xl shadow-card p-7 md:p-10">
            <Quote
              size={36}
              className="absolute top-6 left-6 text-accent-orange-cta/35"
              strokeWidth={1.5}
            />
            <blockquote className="pl-12 text-lg md:text-[20px] text-ink/90 leading-relaxed italic">
              “{featuredTestimonial.text}”
            </blockquote>
            <div className="mt-6 pl-12 flex items-center gap-4 border-t border-surface-border pt-5">
              <span className="w-12 h-12 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center font-bold text-base shrink-0">
                {featuredTestimonial.name
                  .split(" ")
                  .slice(0, 2)
                  .map(s => s[0])
                  .join("")}
              </span>
              <div>
                <div className="text-[15px] font-bold text-ink">
                  {featuredTestimonial.name}
                </div>
                <div className="text-[12px] text-text-secondary">
                  {featuredTestimonial.country} ·{" "}
                  <span className="text-text-muted">
                    {featuredTestimonial.edition} delegate
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/impact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ink hover:bg-ink/85 text-white text-[13.5px] font-semibold transition-colors"
            >
              <Sparkles size={15} />
              Track Outcomes
              <ArrowRight size={14} />
            </Link>
          </div>
        </Section>

        {/* ════ 6 · INTELLIGENCE — capabilities ════ */}
        <Section
          eyebrow="Intelligence"
          title="The Observatory turns institutional memory into actionable intelligence."
        >
          <p className="text-text-secondary leading-relaxed max-w-2xl">
            Four core capabilities are live today. The Observatory will
            grow as edition data is consolidated.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <CapabilityCard
              href="/map"
              icon={MapIcon}
              accent="#2563EB"
              eyebrow="Geography"
              title="ACE Atlas"
              body="Country → state → city → institution drill-down across every host edition."
            />
            <CapabilityCard
              href="/network"
              icon={Share2}
              accent="#7C3AED"
              eyebrow="People"
              title="ACE Network"
              body="Delegate roster, institutional affiliations and cross-border connections across editions."
            />
            <CapabilityCard
              href="/reports"
              icon={FileText}
              accent="#0B7A4A"
              eyebrow="Reports"
              title="Reports Intelligence"
              body="Final reports turned into searchable indicators, outcomes and documented partnerships."
            />
            <CapabilityCard
              href="/impact"
              icon={Sparkles}
              accent="#F05A28"
              eyebrow="Impact"
              title="Impact & Outcomes"
              body="Letters of intent, derived projects, partnerships and follow-up actions traced edition by edition."
            />
          </div>

          {/* Next layer — modules under development */}
          <div className="mt-8 bg-white border border-dashed border-surface-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                Next layer · in development
              </span>
              <span className="w-1 h-1 rounded-full bg-text-muted/40" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Not yet published
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px] text-text-secondary">
              <NextLayerItem
                title="Smart Connections"
                body="Suggested alumni-to-alumni introductions based on shared sectors and complementary capabilities."
              />
              <NextLayerItem
                title="Ecosystem Match"
                body="Side-by-side comparison of two regions to surface shared sectors, capability gaps and partnership pathways."
              />
              <NextLayerItem
                title="Partnership Pathways"
                body="Traceable thread from encounter → letter of intent → follow-up → documented outcome, per delegate."
              />
            </div>
          </div>
        </Section>

        {/* ════ 7 · FINAL CTA + Memphis preview ════ */}
        <section className="space-y-8">
          {memphis && (
            <div className="bg-white border border-surface-border rounded-2xl shadow-card p-7 md:p-10">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-orange-cta mb-3">
                Next opportunity
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-center">
                <div>
                  <h2 className="text-2xl md:text-[30px] font-bold text-ink tracking-tight leading-tight">
                    ACE XXIII — Memphis 2026
                  </h2>
                  <p className="mt-3 text-text-secondary leading-relaxed">
                    {memphis.summary?.split(".")[0] ??
                      "Upcoming 23rd ACE edition in Memphis, Tennessee — logistics, health-tech and the redefinition of mid-size American cities."}
                    .
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-text-secondary">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} className="text-accent-orange-cta" />
                      {memphisCity?.name ?? "Memphis"}, Tennessee · USA
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} className="text-accent-orange-cta" />
                      May 2026
                    </span>
                  </div>
                </div>
                {memphis.heroImage && (
                  <div className="relative aspect-[4/3] bg-surface-canvas rounded-2xl overflow-hidden border border-surface-border">
                    <Image
                      src={memphis.heroImage}
                      alt="ACE Memphis 2026"
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-contain p-6"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Final CTA cluster — three doors back into the Observatory */}
          <div className="text-center pt-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted mb-4">
              Explore deeper
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-ink hover:bg-ink/85 text-white text-[14px] font-bold tracking-tight shadow-lg transition-colors"
              >
                <MapIcon size={16} />
                Explore ACE Atlas
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/reports"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-surface-subtle border border-surface-border text-ink text-[14px] font-bold tracking-tight shadow-soft transition-colors"
              >
                <FileText size={16} />
                Open Reports Intelligence
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/network"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-surface-subtle border border-surface-border text-ink text-[14px] font-bold tracking-tight shadow-soft transition-colors"
              >
                <Share2 size={16} />
                View ACE Network
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-7 text-[11px] uppercase tracking-[0.2em] text-text-muted font-semibold">
              Americas Competitiveness Exchange · Organization of American States
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function CoverKPI({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white border border-surface-border shadow-card px-4 py-5 md:py-6">
      <div className="text-[40px] md:text-[56px] font-bold text-ink tabular-nums tracking-tight leading-none">
        {value.toLocaleString()}
      </div>
      <div className="mt-3 text-[10.5px] md:text-[11.5px] font-semibold uppercase tracking-[0.16em] text-text-muted">
        {label}
      </div>
    </div>
  );
}

// Scale tile — same shape as CoverKPI but for dark backgrounds.
function ScaleTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] border border-white/12 backdrop-blur px-4 py-5">
      <div className="text-[34px] md:text-[44px] font-bold text-white tabular-nums tracking-tight leading-none">
        {value.toLocaleString()}
      </div>
      <div className="mt-2.5 text-[10.5px] md:text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/65">
        {label}
      </div>
    </div>
  );
}

function FootprintStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-white border border-surface-border shadow-card px-4 py-4">
      <div className="text-[28px] font-bold text-ink tabular-nums leading-none">
        {value.toLocaleString()}
      </div>
      <div className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </div>
    </div>
  );
}

// One pipeline stage. The three together communicate the "what
// continues after the encounter" story without claiming follow-up
// tracking we don't yet have.
function PipelineStage({
  icon: Icon,
  tone,
  stage,
  label,
  value,
  caption,
}: {
  icon: typeof Handshake;
  tone: "blue" | "orange" | "green";
  stage: string;
  label: string;
  value: number;
  caption: string;
}) {
  const accent =
    tone === "blue" ? "#2563EB" : tone === "orange" ? "#F97316" : "#0B7A4A";
  return (
    <div
      className="relative bg-white border border-surface-border rounded-2xl shadow-card p-5 md:p-6 flex flex-col"
      style={{ borderTop: `4px solid ${accent}` }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: accent }}
        >
          {stage}
        </span>
      </div>
      <div className="text-[36px] md:text-[44px] font-bold text-ink tabular-nums leading-none">
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-[14px] font-bold text-ink leading-tight">
        {label}
      </div>
      <div className="mt-2 text-[12.5px] text-text-secondary leading-relaxed">
        {caption}
      </div>
    </div>
  );
}

function ActorRing({
  label,
  count,
  pct,
  color,
  tagline,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
  tagline: string;
}) {
  const ringStyle = {
    background: `conic-gradient(${color} ${pct}%, rgba(11,31,58,0.08) 0)`,
  } as const;
  return (
    <div className="bg-white border border-surface-border rounded-2xl shadow-card p-5 flex flex-col items-center text-center">
      <div className="relative w-28 h-28 rounded-full mb-4" style={ringStyle}>
        <div className="absolute inset-2 rounded-full bg-white flex flex-col items-center justify-center">
          <div className="text-[26px] font-bold text-ink tabular-nums leading-none">
            {Math.round(pct)}%
          </div>
          <div className="text-[10.5px] text-text-muted tabular-nums mt-1">
            {count.toLocaleString()}
          </div>
        </div>
      </div>
      <div className="text-sm font-bold text-ink leading-tight">{label}</div>
      <div className="mt-1.5 text-[11.5px] text-text-secondary leading-snug max-w-[180px]">
        {tagline}
      </div>
    </div>
  );
}

function CapabilityCard({
  href,
  icon: Icon,
  accent,
  eyebrow,
  title,
  body,
}: {
  href: string;
  icon: typeof MapIcon;
  accent: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden bg-white border border-surface-border rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition flex flex-col p-6"
    >
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
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
      <h3 className="text-[19px] font-bold text-ink tracking-tight leading-tight">
        {title}
      </h3>
      <p className="mt-2 text-[13.5px] text-text-secondary leading-relaxed">
        {body}
      </p>
      <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-muted group-hover:text-ink transition-colors">
        Open
        <ArrowRight
          size={12}
          strokeWidth={2}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}

function NextLayerItem({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-[13px] font-bold text-ink leading-tight mb-1">
        {title}
      </div>
      <div className="text-[12px] text-text-muted leading-relaxed">{body}</div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-orange-cta mb-3">
        {eyebrow}
      </div>
      <h2 className="text-2xl md:text-[34px] font-bold text-ink tracking-tight leading-[1.1] max-w-3xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Mini map with subtle country outlines + orange dots for every host
// city. Zoomed to fit Americas plus the three non-American host
// cities on the right (Tel Aviv, Berlin, Yerevan).
function ExecutiveMap() {
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  useEffect(() => {
    fetch(asset("/countries.geo.json"))
      .then(r => r.json())
      .then(setGeo)
      .catch(() => setGeo(null));
  }, []);

  const W = 1000;
  const H = 540;
  const LON_MIN = -160;
  const LON_MAX = 50;
  const LAT_MIN = -55;
  const LAT_MAX = 72;
  const project = (lat: number, lng: number): [number, number] => {
    const x = ((lng - LON_MIN) / (LON_MAX - LON_MIN)) * W;
    const y = H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;
    return [x, y];
  };

  const cityIds = new Set<string>();
  for (const e of editions) {
    for (const cid of e.cityIds) cityIds.add(cid);
  }
  const dots = Array.from(cityIds)
    .map(cid => cityById(cid))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map(c => {
      const [x, y] = project(c.coordinates.lat, c.coordinates.lng);
      return { name: c.name, x, y };
    });

  const geomToPath = (geom: GeoJSON.Geometry): string => {
    if (geom.type !== "Polygon" && geom.type !== "MultiPolygon") return "";
    const polys =
      geom.type === "Polygon"
        ? [geom.coordinates as number[][][]]
        : (geom.coordinates as number[][][][]);
    let d = "";
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach((pt, i) => {
          const [x, y] = project(pt[1], pt[0]);
          d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
        });
        d += "Z ";
      }
    }
    return d.trim();
  };

  return (
    <div className="p-3 md:p-5">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        aria-label="Host cities of ACE across the Americas, Europe and the Caucasus"
      >
        <defs>
          <pattern id="execGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="rgba(11,31,58,0.07)" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#execGrid)" />

        {geo &&
          geo.features.map((f, i) => (
            <path
              key={f.id ?? i}
              d={geomToPath(f.geometry)}
              fill="rgba(11,31,58,0.04)"
              stroke="rgba(11,31,58,0.18)"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}

        {dots.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r={10} fill="#F97316" opacity="0.18" />
            <circle
              cx={d.x}
              cy={d.y}
              r={5}
              fill="#F97316"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <title>{d.name}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}
