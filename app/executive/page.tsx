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
  Activity,
  CheckCircle2,
} from "lucide-react";
import { editions } from "@/data/editions";
import { participants, cumulativeParticipations } from "@/data/participants";
import { visitedSites } from "@/data/visited-sites";
import { outcomes } from "@/data/outcomes";
import { countries } from "@/data/countries";
import { cityById } from "@/data/cities";
import {
  loisCount,
  crossBorderLois,
  loisByEdition,
  uniqueCountryPairs,
} from "@/data/lois";
import { asset } from "@/lib/asset-path";

// 90-second executive cover. Light institutional palette inspired by
// OAS / IDB / World Bank / OECD reports. Seven strategic sections,
// every number sourced from the live data layer so this cover, the
// home and the sidebar never disagree.
//
// Editorial rule: use "verified", "documented", "mapped", "reported",
// "potential", "initial evidence layer" — never claim ROI, mobilized
// capital, active agreements or impact percentages without backup.
// Numbers tagged below as TODO need verification before they can
// move from copy to live computation.
export default function ExecutiveCoverPage() {
  // ── HEADLINE NUMBERS — all live, all computed from current data ─
  const totalEditions = editions.length;
  const totalDelegates = participants.length;
  const totalSites = visitedSites.length;
  const countriesRepresented = new Set(
    participants.map(p => p.countryId).filter(c => c && c !== "intl"),
  ).size;
  const totalParticipations = cumulativeParticipations;
  const hostCountries = new Set(editions.map(e => e.countryId)).size;
  const hostCities = new Set(editions.flatMap(e => e.cityIds)).size;
  const totalOutcomes = outcomes.length;
  const crossBorderPct = Math.round(
    (crossBorderLois / Math.max(loisCount, 1)) * 100,
  );

  // ── EVIDENCE SUB-BREAKDOWN ────────────────────────────────────
  // We slice the 20 documented outcomes into the three categories the
  // brief calls out (partnerships / derived projects / policy
  // alignments). Any category not in those three rolls into "other".
  const outcomeMix = (() => {
    const map: Record<string, number> = {
      Partnership: 0,
      "Derived Project": 0,
      Policy: 0,
      Other: 0,
    };
    for (const o of outcomes) {
      if (o.category === "Partnership") map.Partnership += 1;
      else if (o.category === "Derived Project") map["Derived Project"] += 1;
      else if (o.category === "Policy") map.Policy += 1;
      else map.Other += 1;
    }
    return map;
  })();

  // ── YEARS OF CONTINUITY (verifiable, no "zero gap years" claim) ─
  const years = (() => {
    const sorted = [...editions].sort(
      (a, b) => +new Date(a.startDate) - +new Date(b.startDate),
    );
    const first = new Date(sorted[0].startDate).getUTCFullYear();
    const last = new Date(
      sorted[sorted.length - 1].startDate,
    ).getUTCFullYear();
    return { first, last, span: last - first + 1 };
  })();

  // ── ACTOR MIX ────────────────────────────────────────────────
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

  // ── TOP COUNTRIES ────────────────────────────────────────────
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
      {/* ════ 1 · HERO — atmospheric map background, content overlay ════
          The map is no longer a column with a visible rectangular
          frame. It lives as a full-bleed absolutely-positioned layer
          underneath the content, with a radial mask that fades its
          edges into the navy background. Content sits on top with a
          subtle right-side gradient to keep the text readable. */}
      <section className="relative overflow-hidden text-white">
        {/* Layered navy bg — soft directional gradient + a faint blue
            "globe halo" behind where the map lives. Together they give
            the hero atmospheric depth and a hint of curvature without
            a 3D globe. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 28% 50%, rgba(80,130,180,0.22) 0%, transparent 42%), linear-gradient(120deg, #071c35 0%, #06172b 55%, #081426 100%)",
          }}
        />

        {/* Globe-halo glow — large, soft, sits underneath the map so the
            map reads as illuminated/curved instead of flat. */}
        <div
          aria-hidden
          className="absolute pointer-events-none rounded-full"
          style={{
            left: "-15%",
            top: "0%",
            width: "85%",
            height: "100%",
            background:
              "radial-gradient(circle at 45% 50%, rgba(96,156,230,0.22) 0%, rgba(60,110,180,0.10) 32%, transparent 62%)",
            filter: "blur(30px)",
          }}
        />

        {/* Atmospheric map layer — extends well beyond the left edge,
            soft radial mask blends the map into the navy. No visible
            rectangular frame. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
        >
          <div
            className="absolute left-[-22%] -top-[6%] w-[110%] h-[112%] opacity-[0.78]"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 58% 60% at 42% 50%, #000 0%, #000 38%, rgba(0,0,0,0.55) 62%, transparent 88%)",
              maskImage:
                "radial-gradient(ellipse 58% 60% at 42% 50%, #000 0%, #000 38%, rgba(0,0,0,0.55) 62%, transparent 88%)",
              transform: "perspective(1400px) rotateY(-4deg) scale(1.02)",
              transformOrigin: "40% 50%",
            }}
          >
            <HeroMap />
          </div>
        </div>

        {/* Right-side darkening so text never fights the map. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none hidden lg:block"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, transparent 42%, rgba(6,23,43,0.55) 68%, rgba(6,23,43,0.88) 100%)",
          }}
        />

        {/* Top-right brand — aligned with the right-side content column
            so the logo sits with the text instead of fighting the map. */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-8 md:pt-10 flex justify-end">
          <Link
            href="/"
            aria-label="Back to ACE Observatory"
            className="inline-flex items-center gap-5 group"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55 hidden sm:inline">
              ACE Observatory · Executive cover
            </span>
            <Image
              src={asset("/logos/ace-logo.png")}
              alt="ACE"
              width={140}
              height={140}
              priority
              className="object-contain w-[96px] h-[96px] md:w-[128px] md:h-[128px] group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)]"
            />
          </Link>
        </div>

        {/* Hero content — right-aligned on desktop so it doesn't fight
            the map. Full-width centered on mobile. */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-20 md:pt-16 md:pb-28 min-h-[85vh] flex items-center">
          <div className="w-full lg:w-[55%] lg:ml-auto">
            <h1 className="text-[30px] md:text-[40px] lg:text-[52px] font-bold tracking-tight leading-[1.06] text-white">
              Connecting the innovation ecosystems of the Americas.
            </h1>
            <p className="mt-6 text-[15px] md:text-base text-white/70 leading-relaxed max-w-xl">
              For over a decade, ACE has connected leaders, institutions,
              cities, and industries across the hemisphere. The ACE
              Observatory transforms those relationships into a{" "}
              <span className="font-semibold text-white">
                living intelligence network
              </span>
              .
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-white/90 text-ink text-[14px] font-bold tracking-tight transition-colors"
              >
                Explore the Observatory
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/20 text-white text-[14px] font-bold tracking-tight backdrop-blur transition-colors"
              >
                <MapIcon size={15} />
                Open ACE Atlas
              </Link>
            </div>

            {/* KPIs — UDC reference style: vertical separator + big
                number + small label. No cards. */}
            <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-8 max-w-xl">
              <HeroKPI value={totalEditions} label="ACE editions" />
              <HeroKPI
                value={countriesRepresented}
                label="Countries represented"
              />
              <HeroKPI value={totalDelegates} label="Verified delegates" />
              <HeroKPI value={totalSites} label="Institutions visited" />
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 space-y-24 md:space-y-32">

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
              Scale · What ACE has built
            </div>
            <h2 className="text-3xl md:text-[44px] font-bold tracking-tight leading-[1.08] max-w-4xl">
              ACE has built one of the most active
              <br className="hidden md:block" />
              competitiveness networks in the hemisphere.
            </h2>
            <p className="mt-6 text-base md:text-lg text-white/75 leading-relaxed max-w-3xl">
              Across more than a decade, ACE has brought together
              leaders, institutions, cities and innovation ecosystems
              through a sustained program of executive exchanges —{" "}
              <span className="font-semibold text-white">
                {years.span} years of continuous regional engagement
              </span>
              .
            </p>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <ScaleTile value={years.span} label="Years of engagement" />
              <ScaleTile value={hostCountries} label="Host countries" />
              <ScaleTile value={hostCities} label="Host cities" />
              <ScaleTile
                value={totalParticipations}
                label="Cumulative participations"
              />
            </div>
          </div>
        </section>

        {/* ════ 3 · REACH — large geographic map ════ */}
        <Section
          eyebrow="Reach · Where ACE has activated ecosystems"
          title="The geographic footprint of a decade of executive exchanges"
        >
          <p className="text-text-secondary leading-relaxed max-w-2xl">
            From host cities to visited institutions, the ACE Observatory
            shows the geographic footprint of the program and the
            regional corridors it has helped activate. Every dot on the
            map below represents a city where ACE has landed a
            delegation.
          </p>
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

        {/* ════ 4 · NETWORK — actor mix + top countries ════ */}
        <Section
          eyebrow="Network · The network behind the numbers"
          title={`From Canada to Argentina: ${totalDelegates.toLocaleString()} verified decision-makers across ${countriesRepresented} countries`}
        >
          <p className="text-text-secondary leading-relaxed max-w-2xl">
            ACE connects people and institutions that would otherwise
            take years to reach each other. The network brings together
            public officials, business leaders, researchers,
            entrepreneurs, universities, innovation hubs and
            international organizations.{" "}
            <span className="font-semibold text-ink">
              {totalParticipations.toLocaleString()} cumulative participations
            </span>{" "}
            mean dozens of alumni have returned to multiple editions,
            multiplying the network effect.
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
          eyebrow="Evidence · What continues after each edition"
          title="ACE impact is measured by what continues after each edition."
        >
          <p className="text-text-secondary leading-relaxed max-w-2xl">
            The Observatory organizes an initial documented evidence
            layer from final reports and verified records — including
            letters of intent, partnerships, derived projects, policy
            alignment and follow-up opportunities.
          </p>

          {/* Four-stage pipeline — honest about the follow-up tracking
              layer being a work-in-progress rather than a finished
              capability. */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <PipelineStage
              icon={Handshake}
              tone="blue"
              stage="Stage 1"
              status="Verified"
              label="Connection made"
              value={totalDelegates}
              caption={`Delegates who have met on the ground across ${totalEditions} editions.`}
            />
            <PipelineStage
              icon={ScrollText}
              tone="orange"
              stage="Stage 2"
              status="Documented"
              label="Letter of intent"
              value={loisCount}
              caption={`Signed across ACE 20, 21 and 22. ${crossBorderLois} are cross-border (${crossBorderPct}%).`}
            />
            <PipelineStage
              icon={Activity}
              tone="muted"
              stage="Stage 3"
              status="In development"
              label="Follow-up action"
              value={null}
              caption="Post-event follow-up tracking is an upcoming Observatory capability."
            />
            <PipelineStage
              icon={CheckCircle2}
              tone="green"
              stage="Stage 4"
              status="Documented"
              label="Documented outcome"
              value={totalOutcomes}
              caption="Partnerships, derived projects and policy alignments traced to a specific edition."
            />
          </div>

          {/* LOI breakdown by edition + outcomes sub-breakdown */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-surface-border rounded-2xl shadow-card p-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted mb-4">
                Letters of intent by edition
              </div>
              <ul className="space-y-2.5">
                {loisByEdition.map(row => (
                  <li
                    key={row.edition}
                    className="flex items-center justify-between text-[13.5px]"
                  >
                    <span className="font-semibold text-ink">{row.label}</span>
                    <span className="text-text-secondary tabular-nums">
                      <span className="font-bold text-ink">{row.count}</span>{" "}
                      LOIs
                    </span>
                  </li>
                ))}
                <li className="flex items-center justify-between text-[12px] pt-2 mt-2 border-t border-surface-border text-text-muted">
                  <span className="font-semibold uppercase tracking-wider">
                    Across {uniqueCountryPairs} unique country pairs
                  </span>
                  <span className="tabular-nums">
                    {crossBorderPct}% cross-border
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-white border border-surface-border rounded-2xl shadow-card p-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted mb-4">
                Documented outcomes by type
              </div>
              <ul className="space-y-2.5">
                {[
                  { label: "Partnerships", count: outcomeMix.Partnership },
                  {
                    label: "Derived projects",
                    count: outcomeMix["Derived Project"],
                  },
                  { label: "Policy alignments", count: outcomeMix.Policy },
                  { label: "Other categories", count: outcomeMix.Other },
                ].map(row => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between text-[13.5px]"
                  >
                    <span className="font-semibold text-ink">{row.label}</span>
                    <span className="font-bold text-ink tabular-nums">
                      {row.count}
                    </span>
                  </li>
                ))}
                <li className="flex items-center justify-between text-[12px] pt-2 mt-2 border-t border-surface-border text-text-muted uppercase tracking-wider">
                  <span className="font-semibold">Total documented</span>
                  <span className="font-bold tabular-nums">{totalOutcomes}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Methodology disclaimer — exact wording from brief */}
          <p className="mt-6 text-[12px] text-text-muted leading-relaxed italic max-w-3xl">
            Initial documented evidence layer. Not all letters of intent
            represent active or completed agreements. Follow-up tracking
            is a capability under development; figures will be expanded
            edition by edition as final reports are consolidated.
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

        {/* ════ 6 · INTELLIGENCE LAYER ════ */}
        <Section
          eyebrow="Intelligence · From institutional memory to actionable intelligence"
          title="The Observatory turns ACE's institutional memory into actionable intelligence."
        >
          <p className="text-text-secondary leading-relaxed max-w-2xl">
            By connecting editions, delegates, institutions, reports and
            documented outcomes, the Observatory helps users move from
            historical records to strategic insight.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <CapabilityCard
              href="/map"
              icon={MapIcon}
              accent="#2563EB"
              eyebrow="Geography"
              title="ACE Atlas"
              body="Explore host cities, visited institutions and regional innovation clusters."
            />
            <CapabilityCard
              href="/network"
              icon={Share2}
              accent="#7C3AED"
              eyebrow="People"
              title="ACE Network"
              body="Discover delegates, organizations and cross-border connections across editions."
            />
            <CapabilityCard
              href="/reports"
              icon={FileText}
              accent="#0B7A4A"
              eyebrow="Reports"
              title="Reports Intelligence"
              body="Turn final reports into searchable indicators, partnerships, outcomes and documented evidence."
            />
            <CapabilityCard
              href="/impact"
              icon={Sparkles}
              accent="#F05A28"
              eyebrow="Impact"
              title="Impact & Outcomes"
              body="Track documented results, agreements, collaborations and follow-up actions generated through ACE."
            />
          </div>

          {/* Next intelligence layers — clearly framed as future
              capabilities, not as current claims. */}
          <div className="mt-8 bg-white border border-dashed border-surface-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                Next intelligence layers · in development
              </span>
              <span className="w-1 h-1 rounded-full bg-text-muted/40" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Not yet published
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] text-text-secondary">
              <NextLayerItem
                title="Smart Connections"
                body="Suggested alumni-to-alumni introductions based on shared sectors and complementary capabilities."
              />
              <NextLayerItem
                title="Partnership Pathways"
                body="Traceable thread from encounter → letter of intent → follow-up → documented outcome, per delegate."
              />
              <NextLayerItem
                title="Ecosystem Match"
                body="Side-by-side comparison of two regions to surface shared sectors, capability gaps and partnership pathways."
              />
              <NextLayerItem
                title="Catalytic Value"
                body="Separate documented / estimated / potential value tracks — only published when verified data exists."
              />
            </div>
          </div>
        </Section>

        {/* ════ 7 · NEXT OPPORTUNITY + FINAL CTAs ════ */}
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

          {/* Final CTA cluster — four doors back into the Observatory */}
          <div className="text-center pt-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted mb-3">
              Explore deeper
            </div>
            <h2 className="text-2xl md:text-[28px] font-bold text-ink tracking-tight leading-tight mb-7">
              Explore the network behind the numbers.
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ink hover:bg-ink/85 text-white text-[13.5px] font-bold tracking-tight shadow-lg transition-colors"
              >
                <MapIcon size={15} />
                Explore ACE Atlas
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/reports"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-surface-subtle border border-surface-border text-ink text-[13.5px] font-bold tracking-tight shadow-soft transition-colors"
              >
                <FileText size={15} />
                Open Reports Intelligence
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/network"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-surface-subtle border border-surface-border text-ink text-[13.5px] font-bold tracking-tight shadow-soft transition-colors"
              >
                <Share2 size={15} />
                View ACE Network
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/impact"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-surface-subtle border border-surface-border text-ink text-[13.5px] font-bold tracking-tight shadow-soft transition-colors"
              >
                <Sparkles size={15} />
                Track Outcomes
                <ArrowRight size={14} />
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

// Hero KPI — UDC-style: vertical separator on the left, big number,
// label below. No card chrome. Lives only on the dark navy hero.
function HeroKPI({ value, label }: { value: number; label: string }) {
  return (
    <div className="pl-4 border-l border-white/20">
      <div className="text-[40px] md:text-[48px] font-bold text-white tabular-nums tracking-tight leading-none">
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/55 leading-tight">
        {label}
      </div>
    </div>
  );
}

// Kept available for reuse but no longer used in the hero. Light-bg
// KPI tile with white card chrome.
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

// One pipeline stage. The four together communicate the "what
// continues after the encounter" story. `value: null` renders a
// placeholder dash for stages we don't yet have data for (currently
// Stage 3 · Follow-up action), keeping the page honest.
function PipelineStage({
  icon: Icon,
  tone,
  stage,
  status,
  label,
  value,
  caption,
}: {
  icon: typeof Handshake;
  tone: "blue" | "orange" | "green" | "muted";
  stage: string;
  status: string;
  label: string;
  value: number | null;
  caption: string;
}) {
  const accent =
    tone === "blue"
      ? "#2563EB"
      : tone === "orange"
        ? "#F97316"
        : tone === "green"
          ? "#0B7A4A"
          : "#94A3B8";
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
      <div className="flex items-baseline gap-3">
        <div className="text-[36px] md:text-[44px] font-bold text-ink tabular-nums leading-none">
          {value !== null ? value.toLocaleString() : "—"}
        </div>
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          {status}
        </span>
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

// Hero map — dark navy variant of ExecutiveMap. Renders directly on
// the navy hero background (no card frame). Inspired by the UDC
// reference: country fills in subtle translucent white, dots in
// pure white with a soft halo, very subtle chronological connector
// lines. Four key host cities pulse via CSS @keyframes so the page
// reads as a "living" platform without bouncing JS animation.
function HeroMap() {
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  useEffect(() => {
    fetch(asset("/countries.geo.json"))
      .then(r => r.json())
      .then(setGeo)
      .catch(() => setGeo(null));
  }, []);

  const W = 1100;
  const H = 700;
  const LON_MIN = -160;
  const LON_MAX = 50;
  const LAT_MIN = -55;
  const LAT_MAX = 72;
  const project = (lat: number, lng: number): [number, number] => {
    const x = ((lng - LON_MIN) / (LON_MAX - LON_MIN)) * W;
    const y = H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;
    return [x, y];
  };

  // Set of participant countries' ISO codes for the highlight fill.
  const participantIso = new Set(
    countries
      .filter(c =>
        participants.some(p => p.countryId === c.id && c.id !== "intl"),
      )
      .map(c => c.isoCode),
  );

  // Host city dots ordered chronologically (first edition that
  // touched the city). Used for both pulse markers and connector
  // lines.
  const cityToFirstEdition = new Map<string, number>();
  for (const e of editions) {
    for (const cid of e.cityIds) {
      const prev = cityToFirstEdition.get(cid);
      if (prev === undefined || e.number < prev) {
        cityToFirstEdition.set(cid, e.number);
      }
    }
  }
  const dots = Array.from(cityToFirstEdition.entries())
    .map(([cid, num]) => {
      const c = cityById(cid);
      if (!c) return null;
      const [x, y] = project(c.coordinates.lat, c.coordinates.lng);
      return { id: cid, name: c.name, x, y, num };
    })
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .sort((a, b) => a.num - b.num);

  // Every host city pulses softly — distributed across the entire
  // hemisphere instead of just four US-coastal anchors. Animation
  // delays are derived per-dot from the city id so the pulse is
  // staggered and reads as organic ambient motion, not a synced
  // strobe.
  const pulseDelayFor = (id: string): number => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return ((h % 100) / 100) * 4.5;
  };

  // Connector path — gentle quadratic curve between consecutive host
  // cities so the line reads as "network" rather than as straight
  // trade-route segments.
  const connectorPath = (() => {
    if (dots.length < 2) return "";
    let d = `M ${dots[0].x.toFixed(1)} ${dots[0].y.toFixed(1)}`;
    for (let i = 1; i < dots.length; i++) {
      const a = dots[i - 1];
      const b = dots[i];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.15;
      d += ` Q ${mx.toFixed(1)} ${my.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    return d;
  })();

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
    <>
      {/* Soft, slow pulse — every host city pulses, but with a per-dot
          delay so the motion reads as ambient breath, not a strobe.
          Opacity range and scale range both kept tight so it never
          dominates the hero. */}
      <style jsx>{`
        .hero-pulse {
          transform-origin: center;
          transform-box: fill-box;
          animation: hero-pulse-keyframes 5s ease-in-out infinite;
        }
        /* Pulse is purely additive on top of an always-on base halo,
           so even at the dimmest frame the dot never reads as "off". */
        @keyframes hero-pulse-keyframes {
          0%,
          100% {
            opacity: 0.20;
            transform: scale(1);
          }
          50% {
            opacity: 0.42;
            transform: scale(1.22);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-pulse {
            animation: none;
            opacity: 0.28;
          }
        }
      `}</style>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block"
        aria-label="ACE host cities across the Americas"
      >
        <defs>
          {/* Soft glow filter for host city dots — gives a luminous,
              "node lit from within" feel that blends with the navy bg. */}
          <filter id="hero-dot-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Linear gradient for connector arcs — fades along the path
              so it never reads as a hard line. */}
          <linearGradient id="hero-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0" />
            <stop offset="50%" stopColor="#F9B27D" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Country outlines + fills — kept very faint so the map reads
            as an atmospheric layer, not a bordered illustration. */}
        {geo &&
          geo.features.map((f, i) => {
            const isHost = participantIso.has(String(f.id ?? ""));
            return (
              <path
                key={f.id ?? i}
                d={geomToPath(f.geometry)}
                fill={isHost ? "rgba(180,210,245,0.08)" : "rgba(180,210,245,0.025)"}
                stroke="rgba(180,210,245,0.10)"
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

        {/* Connector curve — chronological, gradient stroke for soft fade */}
        {connectorPath && (
          <path
            d={connectorPath}
            fill="none"
            stroke="url(#hero-arc)"
            strokeWidth={1.2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Host city dots — three layers per dot:
            1. always-on outer base halo (no animation, guarantees the
               node never reads as "off"),
            2. pulsing halo on top that purely *adds* brightness,
            3. inner white core. Per-dot delay distributes the motion
               organically across the hemisphere. */}
        {dots.map(d => (
          <g key={d.id} filter="url(#hero-dot-glow)">
            {/* Always-on base halo */}
            <circle
              cx={d.x}
              cy={d.y}
              r={7}
              fill="#A9D2FF"
              opacity={0.22}
            />
            {/* Pulsing halo — additive breath */}
            <circle
              cx={d.x}
              cy={d.y}
              r={9}
              fill="#A9D2FF"
              className="hero-pulse"
              style={{ animationDelay: `${pulseDelayFor(d.id).toFixed(2)}s` }}
            />
            {/* Inner luminous core */}
            <circle
              cx={d.x}
              cy={d.y}
              r={3.2}
              fill="#FFFFFF"
              opacity={0.92}
            />
            <title>{`${d.name} · first hosted ACE ${d.num}`}</title>
          </g>
        ))}
      </svg>
    </>
  );
}

// Mini map with subtle country outlines + orange dots for every host
// city, plus thin connector lines between host cities sorted by
// edition number — gives the visual sense of an emerging
// hemispheric corridor without overclaiming "trade corridors".
function ExecutiveMap() {
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  useEffect(() => {
    fetch(asset("/countries.geo.json"))
      .then(r => r.json())
      .then(setGeo)
      .catch(() => setGeo(null));
  }, []);

  const W = 1000;
  const H = 600;
  const LON_MIN = -160;
  const LON_MAX = 50;
  const LAT_MIN = -55;
  const LAT_MAX = 72;
  const project = (lat: number, lng: number): [number, number] => {
    const x = ((lng - LON_MIN) / (LON_MAX - LON_MIN)) * W;
    const y = H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;
    return [x, y];
  };

  // One marker per unique host city; ordered by the lowest edition
  // number that touched it (rough chronology used for connector
  // lines below).
  const cityToFirstEdition = new Map<string, number>();
  for (const e of editions) {
    for (const cid of e.cityIds) {
      const prev = cityToFirstEdition.get(cid);
      if (prev === undefined || e.number < prev) {
        cityToFirstEdition.set(cid, e.number);
      }
    }
  }
  const dots = Array.from(cityToFirstEdition.entries())
    .map(([cid, num]) => {
      const c = cityById(cid);
      if (!c) return null;
      const [x, y] = project(c.coordinates.lat, c.coordinates.lng);
      return { name: c.name, x, y, num };
    })
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .sort((a, b) => a.num - b.num);

  // Connector lines — connect consecutive host cities in chronological
  // order. Very low opacity so they read as a network suggestion, not
  // as literal trade routes.
  const connectors: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 1; i < dots.length; i++) {
    connectors.push({
      x1: dots[i - 1].x,
      y1: dots[i - 1].y,
      x2: dots[i].x,
      y2: dots[i].y,
    });
  }

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

        {/* Country outlines */}
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

        {/* Subtle connector lines — chronological order. */}
        {connectors.map((c, i) => (
          <line
            key={i}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke="#F97316"
            strokeWidth={0.9}
            strokeOpacity={0.22}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Host city dots with soft glow */}
        {dots.map(d => (
          <g key={d.name}>
            <circle cx={d.x} cy={d.y} r={11} fill="#F97316" opacity="0.18" />
            <circle
              cx={d.x}
              cy={d.y}
              r={5.5}
              fill="#F97316"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <title>{`${d.name} · first hosted ACE ${d.num}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}
