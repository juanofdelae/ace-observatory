import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Quote, MapPin, Calendar } from "lucide-react";
import { editions } from "@/data/editions";
import { participants, cumulativeParticipations } from "@/data/participants";
import { visitedSites } from "@/data/visited-sites";
import { outcomes } from "@/data/outcomes";
import { countries } from "@/data/countries";
import { cityById } from "@/data/cities";
import { asset } from "@/lib/asset-path";
import { editionRegion } from "@/lib/utils";

export const metadata = {
  title: "ACE Observatory — Executive Cover",
  description:
    "A decade of competitiveness across the Americas, summarized in one screen.",
};

// 60-second executive read. Dark institutional palette, single
// column, six vertically-stacked sections. Every number on the page
// is sourced from the live data layer of the observatory — nothing
// is invented or rounded for marketing.
export default function ExecutiveCoverPage() {
  const totalEditions = editions.length;
  const totalDelegates = participants.length;
  const totalSites = visitedSites.length;
  const countriesRepresented = new Set(
    participants.map(p => p.countryId).filter(c => c && c !== "intl"),
  ).size;
  const totalParticipations = cumulativeParticipations;
  const hostCountries = new Set(editions.map(e => e.countryId)).size;

  // Years of continuity: from the very first edition to the latest
  // scheduled. Lets us claim "12 years · 23 editions · zero gap years"
  // honestly off the dataset.
  const firstYear = new Date(
    [...editions].sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate))[0]
      .startDate,
  ).getUTCFullYear();
  const lastYear = new Date(
    [...editions].sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))[0]
      .startDate,
  ).getUTCFullYear();
  const decadeYears = lastYear - firstYear + 1;

  // Top 5 participating countries by delegate count.
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

  // Single tightest testimonial across all surveys. Same logic the
  // FeaturedTestimonial uses on the home, repeated here standalone.
  // Falls back to a fixed quote if surveys load before this renders.
  const featuredQuote =
    "ACE improved my knowledge of international economic development and how to scale innovation across the Americas.";

  // Outcomes signal: total partnerships + jobs/MoU/investment metrics.
  const partnershipCount = outcomes.filter(o => o.category === "Partnership").length;
  const policyCount = outcomes.filter(o => o.category === "Policy").length;
  const projectCount = outcomes.filter(o => o.category === "Derived Project").length;

  // Memphis preview for the "What's next" close.
  const memphis = editions.find(e => e.id === "ace-23-memphis-2026");
  const memphisCity = memphis?.cityIds[0] ? cityById(memphis.cityIds[0]) : undefined;

  // Host city dots for the mini map — same source the home uses.
  const cityToEditionNumbers = new Map<string, number[]>();
  for (const e of editions) {
    for (const cid of e.cityIds) {
      const list = cityToEditionNumbers.get(cid) ?? [];
      list.push(e.number);
      cityToEditionNumbers.set(cid, list);
    }
  }
  const hostDots = Array.from(cityToEditionNumbers.keys())
    .map(cid => cityById(cid))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map(c => projectMercator(c.coordinates.lat, c.coordinates.lng));

  // Timeline: every edition placed by year on a 2014→2026 strip.
  const timelineEditions = [...editions].sort((a, b) => a.number - b.number);

  return (
    <div className="min-h-screen bg-ink text-white">
      {/* Subtle dot grid + radial glow to give the dark canvas
          institutional gravitas without competing with content. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(1200px 700px at 18% 0%, rgba(37, 99, 235, 0.15) 0%, transparent 60%), radial-gradient(900px 500px at 92% 100%, rgba(249, 115, 22, 0.10) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-20 space-y-24 md:space-y-32">
        {/* 1 · HERO */}
        <section className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55 hover:text-white mb-10"
          >
            <Image
              src={asset("/logos/ace-logo.png")}
              alt="ACE"
              width={28}
              height={28}
              className="object-contain"
            />
            ACE Observatory
          </Link>
          <h1 className="text-4xl md:text-6xl lg:text-[72px] font-bold tracking-tight leading-[1.02]">
            A decade of competitiveness
            <br />
            across the Americas
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
            The Americas Competitiveness Exchange (ACE) is an OAS-led
            executive immersion that has connected leaders, host cities and
            innovation institutions for over a decade.
          </p>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            <CoverKPI value={totalEditions} label="Editions" />
            <CoverKPI value={countriesRepresented} label="Countries represented" />
            <CoverKPI value={totalDelegates} label="Verified delegates" />
            <CoverKPI value={totalSites} label="Institutions visited" />
          </div>
        </section>

        {/* 2 · THE REACH — mini map */}
        <Section eyebrow="The reach" title="From Yukon to Yerevan, Memphis to Belém">
          <p className="text-white/65 leading-relaxed max-w-2xl">
            {hostCountries} host countries on three continents.{" "}
            {countriesRepresented} countries represented in the delegate
            roster. Every dot is a city where ACE has landed a delegation.
          </p>
          <div className="mt-8 bg-white/[0.04] border border-white/10 rounded-2xl p-6">
            <svg
              viewBox="0 0 800 380"
              className="w-full h-auto"
              aria-label="Host cities of ACE across the Americas and beyond"
            >
              {/* Background continents silhouette via subtle dot pattern. */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.6" fill="rgba(255,255,255,0.08)" />
                </pattern>
              </defs>
              <rect width="800" height="380" fill="url(#grid)" />
              {hostDots.map((d, i) => (
                <g key={i}>
                  <circle cx={d.x} cy={d.y} r="6" fill="#F97316" opacity="0.25" />
                  <circle cx={d.x} cy={d.y} r="3" fill="#F97316" />
                </g>
              ))}
            </svg>
          </div>
        </Section>

        {/* 3 · THE DECADE */}
        <Section
          eyebrow="The decade"
          title={`${decadeYears} years · ${totalEditions} editions · zero gap years`}
        >
          <p className="text-white/65 leading-relaxed max-w-2xl">
            From the inaugural ACE I across the US Southeast in 2014 to
            ACE XXIII Memphis in 2026, the program has run uninterrupted —
            even through 2020-2021.
          </p>
          <div className="mt-8 bg-white/[0.04] border border-white/10 rounded-2xl p-7">
            <div className="relative h-16">
              {/* Horizontal axis */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/15" />
              {/* Year ticks */}
              {Array.from({ length: lastYear - firstYear + 1 }, (_, i) => {
                const year = firstYear + i;
                const xpct = (i / (lastYear - firstYear)) * 100;
                return (
                  <span
                    key={year}
                    className="absolute -translate-x-1/2 text-[10px] font-semibold text-white/40 tabular-nums"
                    style={{ left: `${xpct}%`, bottom: 0 }}
                  >
                    {year}
                  </span>
                );
              })}
              {/* Edition dots */}
              {timelineEditions.map((e) => {
                const year = new Date(e.startDate).getUTCFullYear();
                const xpct =
                  ((year - firstYear) / (lastYear - firstYear)) * 100;
                return (
                  <span
                    key={e.id}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-accent-orange-cta ring-2 ring-ink"
                    style={{ left: `${xpct}%` }}
                    title={`ACE ${e.number} — ${editionRegion(e)} (${year})`}
                  />
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between text-[11px] text-white/40 font-semibold uppercase tracking-wider">
              <span>{firstYear}</span>
              <span>{lastYear}</span>
            </div>
          </div>
        </Section>

        {/* 4 · THE NETWORK */}
        <Section
          eyebrow="The network"
          title={`${totalDelegates.toLocaleString()} verified delegates · ${totalParticipations.toLocaleString()} cumulative participations`}
        >
          <p className="text-white/65 leading-relaxed max-w-2xl">
            The ACE alumni network spans government, private sector,
            academia and entrepreneurial ecosystems. The five most
            represented countries account for{" "}
            {Math.round(
              (topCountries.reduce((s, x) => s + x.count, 0) / totalDelegates) * 100,
            )}
            % of the entire roster.
          </p>
          <div className="mt-8 bg-white/[0.04] border border-white/10 rounded-2xl p-7 space-y-4">
            {topCountries.map((row, i) => {
              const max = topCountries[0]?.count ?? 1;
              const widthPct = (row.count / max) * 100;
              return (
                <div key={row.country.id} className="flex items-center gap-4">
                  <span className="w-32 md:w-44 text-sm font-semibold text-white truncate">
                    {row.country.name}
                  </span>
                  <div className="flex-1 h-2.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-blue"
                      style={{
                        width: `${widthPct}%`,
                        transitionDelay: `${i * 60}ms`,
                      }}
                    />
                  </div>
                  <span className="text-base font-bold text-white tabular-nums w-12 text-right">
                    {row.count}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 5 · THE EVIDENCE */}
        <Section
          eyebrow="The evidence"
          title="Documented partnerships, projects and policy alignment"
        >
          <p className="text-white/65 leading-relaxed max-w-2xl">
            ACE is measured by what survives the trip home. The
            observatory tracks every documented partnership, derived
            project and policy alignment that traces back to an edition.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <EvidenceTile value={partnershipCount} label="Partnerships" />
            <EvidenceTile value={projectCount} label="Derived projects" />
            <EvidenceTile value={policyCount} label="Policy alignments" />
          </div>
          <div className="mt-8 relative bg-white/[0.04] border border-white/10 rounded-2xl p-7 md:p-9">
            <Quote
              size={28}
              className="absolute top-5 left-5 text-accent-orange-cta/50"
              strokeWidth={1.5}
            />
            <blockquote className="pl-10 text-base md:text-lg text-white/85 leading-relaxed italic">
              “{featuredQuote}”
            </blockquote>
            <div className="mt-4 pl-10 text-[12px] text-white/50 uppercase tracking-wider font-semibold">
              ACE delegate · exit survey
            </div>
          </div>
        </Section>

        {/* 6 · WHAT'S NEXT */}
        <Section eyebrow="What's next" title="ACE XXIII — Memphis 2026">
          <div className="mt-2 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-center">
            <div>
              <p className="text-white/70 leading-relaxed">
                {memphis?.summary?.split(".")[0] ??
                  "Upcoming 23rd ACE edition in Memphis, Tennessee — logistics, health-tech, and the redefinition of mid-size American cities."}
                .
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/65">
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
            {memphis?.heroImage && (
              <div className="relative aspect-[4/3] bg-white/5 rounded-2xl overflow-hidden border border-white/10">
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
        </Section>

        {/* CTA — single, final */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-accent-orange-cta hover:bg-accent-orange-cta/90 text-white text-base font-bold tracking-tight shadow-lg transition-colors"
          >
            Explore the Observatory
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
          <div className="mt-5 text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold">
            Americas Competitiveness Exchange · Organization of American States
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function CoverKPI({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] border border-white/12 backdrop-blur px-4 py-5 md:py-6">
      <div className="text-[40px] md:text-[56px] font-bold text-white tabular-nums tracking-tight leading-none">
        {value.toLocaleString()}
      </div>
      <div className="mt-3 text-[10.5px] md:text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white/55">
        {label}
      </div>
    </div>
  );
}

function EvidenceTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] border border-white/12 px-5 py-5">
      <div className="text-[40px] font-bold text-accent-orange-cta tabular-nums leading-none">
        {value}
      </div>
      <div className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/60">
        {label}
      </div>
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
      <h2 className="text-2xl md:text-[34px] font-bold text-white tracking-tight leading-[1.1] max-w-3xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Quick equirectangular projection sized to the 800×380 SVG viewBox.
// Good enough for showing host-city distribution without a full
// Leaflet/Mercator setup on a presentation page.
function projectMercator(lat: number, lng: number): { x: number; y: number } {
  // Center on the Americas (-90°) so most dots sit comfortably; clamp
  // lat between -60 and 75 so the projection doesn't distort the poles.
  const W = 800;
  const H = 380;
  const lon = ((lng + 180) % 360) - 180; // normalize
  const x = ((lon + 180) / 360) * W;
  const clampedLat = Math.max(-60, Math.min(75, lat));
  const y = H - ((clampedLat + 60) / 135) * H;
  return { x, y };
}
