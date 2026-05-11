"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Quote,
  MapPin,
  Calendar,
} from "lucide-react";
import { editions } from "@/data/editions";
import { participants, cumulativeParticipations } from "@/data/participants";
import { visitedSites } from "@/data/visited-sites";
import { outcomes } from "@/data/outcomes";
import { countries } from "@/data/countries";
import { cityById } from "@/data/cities";
import { asset } from "@/lib/asset-path";

// 60-second executive cover. Light institutional palette, six tight
// sections, single thesis: ACE is regional infrastructure, not a
// program. Every number is pulled from the live data layer so the
// home page, sidebar and this cover never disagree on numbers.
// Renders without sidebar via DashboardLayout's FULL_SCREEN_PATHS.
export default function ExecutiveCoverPage() {
  // ── 1. SCALE NUMBERS ──────────────────────────────────────────
  const totalEditions = editions.length;
  const totalDelegates = participants.length;
  const totalSites = visitedSites.length;
  const countriesRepresented = new Set(
    participants.map(p => p.countryId).filter(c => c && c !== "intl"),
  ).size;
  const totalParticipations = cumulativeParticipations;
  const hostCountries = new Set(editions.map(e => e.countryId)).size;

  // ── 2. ACTOR MIX ──────────────────────────────────────────────
  // Three primary buckets keep the executive view readable:
  // Government, Private Sector, Academia. Everything else (the two
  // smaller buckets) rolls into a fourth "Other ecosystems" so the
  // primary message stays clean: this is a balanced cross-sector
  // network, not a single-actor club.
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
    const order: Array<{
      label: string;
      count: number;
      color: string;
      tagline: string;
    }> = [
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
        tagline: "International orgs, entrepreneurship ecosystem builders",
      },
    ];
    return order.map(b => ({ ...b, pct: total > 0 ? (b.count / total) * 100 : 0 }));
  })();

  // ── 3. TOP COUNTRIES ─────────────────────────────────────────
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

  // ── 4. OUTCOMES SIGNAL ───────────────────────────────────────
  const partnershipCount = outcomes.filter(o => o.category === "Partnership").length;
  const policyCount = outcomes.filter(o => o.category === "Policy").length;
  const projectCount = outcomes.filter(o => o.category === "Derived Project").length;

  // ── 5. FEATURED TESTIMONIAL (real, sourced from exit surveys) ─
  // Joe McKinney's quote names concrete institutions (IEDC, Puget
  // Sound Regional Council, Starbucks Foundation, Pan American
  // Development Foundation) and a real outcome (coca-to-coffee
  // transition). That kind of specificity is exactly the "peer
  // validation" the user asked for — it shows what survives after
  // the trip home, with names attached.
  const featuredTestimonial = {
    text:
      "Potential project with Panama on sustainable agriculture practices. Potential project with IEDC, Puget Sound Regional Council, Starbucks Foundation, and the Pan American Development Foundation on resilient economy — transition to coffee from coca.",
    name: "Joe McKinney",
    country: "United States",
    edition: "ACE 16 · Seattle",
  };

  // ── 6. MEMPHIS PREVIEW ───────────────────────────────────────
  const memphis = editions.find(e => e.id === "ace-23-memphis-2026");
  const memphisCity = memphis?.cityIds[0] ? cityById(memphis.cityIds[0]) : undefined;

  return (
    <div className="min-h-screen bg-surface-canvas text-ink">
      {/* Soft ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(1200px 700px at 18% 0%, rgba(37, 99, 235, 0.06) 0%, transparent 60%), radial-gradient(900px 500px at 92% 100%, rgba(249, 115, 22, 0.05) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-20 space-y-24 md:space-y-32">
        {/* ════ 1 · HERO — single big idea ════ */}
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
              ACE Observatory
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

        {/* ════ 2 · THE BIG IDEA — visual band ════ */}
        <section className="relative overflow-hidden rounded-3xl bg-ink text-white px-8 md:px-14 py-14 md:py-20 shadow-panel">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-accent-orange-cta/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-16 w-96 h-96 rounded-full bg-accent-blue/15 blur-3xl"
          />
          <div className="relative max-w-4xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent-orange-cta mb-5">
              The thesis
            </div>
            <h2 className="text-3xl md:text-[44px] font-bold tracking-tight leading-[1.08]">
              ACE has become a regional infrastructure
              <br className="hidden md:block" /> for collaboration.
            </h2>
            <p className="mt-6 text-base md:text-lg text-white/75 leading-relaxed max-w-3xl">
              Across government, private sector, academia and innovation
              ecosystems, ACE connects people and institutions that
              would otherwise take years — and millions of dollars in
              missions — to reach each other.
            </p>
          </div>
        </section>

        {/* ════ 3 · THE NETWORK — actor mix + top countries ════ */}
        <Section
          eyebrow="The network"
          title={`From Canada to Argentina: a network of ${totalDelegates.toLocaleString()} decision-makers`}
        >
          <p className="text-text-secondary leading-relaxed max-w-2xl">
            A balanced, cross-sector roster — not a single-actor club.{" "}
            <span className="font-semibold text-ink">
              {totalParticipations.toLocaleString()} cumulative participations
            </span>{" "}
            mean dozens of alumni have returned to two, three or even
            five editions, multiplying the network effect.
          </p>

          {/* Three big actor-mix circles */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {actorMix.map(a => (
              <ActorRing key={a.label} {...a} />
            ))}
          </div>

          {/* Top 5 countries — secondary visual */}
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
        </Section>

        {/* ════ 4 · THE FOOTPRINT — geographic ════ */}
        <Section
          eyebrow="The footprint"
          title="A geographic footprint across the Americas and beyond"
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
            <FootprintStat value={3} label="Continents touched" />
            <FootprintStat value={totalSites} label="Institutions visited" />
            <FootprintStat
              value={countriesRepresented}
              label="Countries in the roster"
            />
          </div>
          <div className="mt-8 bg-white border border-surface-border rounded-2xl shadow-card overflow-hidden">
            <ExecutiveMap />
          </div>
        </Section>

        {/* ════ 5 · THE EVIDENCE — named testimonial ════ */}
        <Section
          eyebrow="The evidence"
          title="ACE impact is not measured only by attendance — it is measured by what continues after the exchange."
        >
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <EvidenceTile value={partnershipCount} label="Partnerships" />
            <EvidenceTile value={projectCount} label="Derived projects" />
            <EvidenceTile value={policyCount} label="Policy alignments" />
          </div>

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
                  <span className="text-text-muted">{featuredTestimonial.edition} delegate</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ════ 6 · THE NEXT OPPORTUNITY ════ */}
        <Section eyebrow="The next opportunity" title="ACE XXIII — Memphis 2026">
          <div className="mt-2 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-center bg-white border border-surface-border rounded-2xl shadow-card p-7 md:p-10">
            <div>
              <p className="text-text-secondary leading-relaxed">
                {memphis?.summary?.split(".")[0] ??
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
            {memphis?.heroImage && (
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
        </Section>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-ink hover:bg-ink/85 text-white text-base font-bold tracking-tight shadow-lg transition-colors"
          >
            Explore the Observatory
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
          <div className="mt-5 text-[11px] uppercase tracking-[0.2em] text-text-muted font-semibold">
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

function EvidenceTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white border border-surface-border shadow-card px-5 py-5">
      <div className="text-[40px] font-bold text-accent-orange-cta tabular-nums leading-none">
        {value}
      </div>
      <div className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-text-muted">
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

// One of the four big actor-mix circles. The percentage is drawn as
// a conic-gradient ring so the visual instantly communicates "this
// is a balanced network", not just a stat list. Total in the center,
// label + tagline below.
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
// city. Zoomed to fit Americas plus the three outliers (Tel Aviv,
// Berlin, Yerevan) on the right side of the frame.
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
