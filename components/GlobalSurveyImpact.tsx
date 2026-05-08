"use client";
import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { allSurveys, type SurveyData } from "@/data/surveys";
import { editions, editionById } from "@/data/editions";
import { participants } from "@/data/participants";
import { editionRegion, canonicalCountry } from "@/lib/utils";
import { asset } from "@/lib/asset-path";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LabelList, Cell,
} from "recharts";
import {
  Sparkles, Users, ThumbsUp, Award, TrendingUp, Network, Scale,
  Quote as QuoteIcon, ArrowRight,
} from "lucide-react";

// ACE brand palette — same constants used by app/impact/page.tsx so
// every chart on the page tells a consistent visual story.
const ACE = {
  navy: "#0B1F3A",
  blueDeep: "#1E4E8C",
  blueBright: "#2563EB",
  turquoise: "#2FB7B2",
  green: "#0B7A4A",
  yellow: "#F5B700",
  orange: "#F05A28",
  purple: "#7C3AED",
  red: "#D62828",
} as const;
// Likert 1→5 mapping uses the warm-to-cool ACE colors (red worst, green best).
const COLOR_EQUITY = [ACE.red, ACE.orange, ACE.yellow, ACE.turquoise, ACE.green];
const ANIMATION = { isAnimationActive: true, animationDuration: 1100, animationEasing: "ease-out" } as const;

function NiceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string; payload?: Record<string, unknown> }>; label?: string | number }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-surface-border rounded-lg shadow-card-hover px-3 py-2 text-[13px] min-w-[150px]">
      {label !== undefined && (
        <div className="font-bold text-ink mb-1.5">{label}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: p.color }}
            />
            {p.name}
          </span>
          <span className="font-bold text-ink tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, hint, accent,
}: {
  icon: typeof Award;
  label: string;
  value: string | number;
  hint?: string;
  accent: string;
}) {
  return (
    <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <div className="text-[11.5px] uppercase tracking-[0.12em] text-text-muted font-bold">{label}</div>
          <div className="text-[1.7rem] font-bold leading-none mt-1 tabular-nums" style={{ color: accent }}>{value}</div>
          {hint && <div className="text-[12.5px] text-text-secondary mt-1.5">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

interface PerEditionRow {
  editionId: string;
  number: number;
  label: string;
  responses: number;
  meanRating: number;
  recommendPct: number;
  aboveExpPct: number;
  connections: number;
}

function aggregateOverall(surveys: SurveyData[]) {
  // Weighted aggregates across all editions.
  let totalResponses = 0;
  let yesCount = 0;
  let recommendTotal = 0;
  let weightedRating = 0;
  let weightedAspect = 0;
  let aspectWeight = 0;
  let totalConnections = 0;
  let aboveExpResponses = 0;

  for (const s of surveys) {
    totalResponses += s.totalResponses;
    if (s.recommend.total > 0) {
      const yes = s.recommend.options.find(o => o.label === "Yes")?.count ?? 0;
      yesCount += yes;
      recommendTotal += s.recommend.total;
    }
    if (s.overallRating.total > 0) {
      weightedRating += s.overallRating.mean * s.overallRating.total;
      const aboveExp =
        (s.overallRating.options.find(o => o.label === "Significantly Above Expectations")?.count ?? 0) +
        (s.overallRating.options.find(o => o.label === "Above Expectations")?.count ?? 0);
      aboveExpResponses += aboveExp;
    }
    if (s.aspectRatings.length > 0) {
      const meanAspect =
        s.aspectRatings.reduce((sum, a) => sum + a.mean, 0) / s.aspectRatings.length;
      weightedAspect += meanAspect * s.totalResponses;
      aspectWeight += s.totalResponses;
    }
    if (s.connectionsCount?.total) {
      totalConnections += s.connectionsCount.total;
    }
  }

  const overallRatingMean = recommendTotal ? weightedRating / recommendTotal : 0;
  const aspectMean = aspectWeight ? weightedAspect / aspectWeight : 0;
  const recommendPct = recommendTotal ? (yesCount / recommendTotal) * 100 : 0;
  const aboveExpPct = recommendTotal ? (aboveExpResponses / recommendTotal) * 100 : 0;

  return {
    totalResponses,
    overallRatingMean,
    aspectMean,
    recommendPct,
    aboveExpPct,
    totalConnections,
  };
}

// Match a quote attribution to a participant record (id + photo) so
// the quote card links into the delegate's profile page. Accent-
// insensitive normalized name match handles QuestionPro free-text
// vs the curated roster.
function findQuoteParticipant(name: string): { id: string; photoUrl?: string } | undefined {
  if (!name) return undefined;
  const norm = (s: string) =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
  const target = norm(name);
  const exact = participants.find(p => norm(p.name) === target);
  if (exact) return { id: exact.id, photoUrl: exact.photoUrl };
  const targetTokens = target.split(/\s+/).filter(Boolean);
  if (targetTokens.length < 2) return undefined;
  const fallback = participants.find(p => {
    const tokens = norm(p.name).split(/\s+/).filter(Boolean);
    return targetTokens[0] === tokens[0] && targetTokens[targetTokens.length - 1] === tokens[tokens.length - 1];
  });
  return fallback ? { id: fallback.id, photoUrl: fallback.photoUrl } : undefined;
}

function aggregateCountries(surveys: SurveyData[]) {
  const map = new Map<string, number>();
  for (const s of surveys) {
    for (const c of s.countryDistribution) {
      const canonical = canonicalCountry(c.country);
      if (!canonical) continue;
      map.set(canonical, (map.get(canonical) ?? 0) + c.count);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({ country, count }));
}

function topQuotePerEdition(surveys: SurveyData[]) {
  return surveys
    .map(s => {
      const ed = editionById(s.editionId);
      const quote = (s.qualitativeQuotes ?? [])
        .filter(q => q.text.length >= 80 && q.text.length <= 320)
        .sort((a, b) => b.text.length - a.text.length)[0];
      if (!quote || !ed) return null;
      return {
        editionId: s.editionId,
        editionNumber: ed.number,
        editionLabel: editionRegion(ed),
        quote,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export function GlobalSurveyImpact() {
  const surveys = useMemo(() => allSurveys(), []);

  const overall = useMemo(() => aggregateOverall(surveys), [surveys]);
  const countries = useMemo(() => aggregateCountries(surveys), [surveys]);
  const quotes = useMemo(() => topQuotePerEdition(surveys), [surveys]);

  const perEdition: PerEditionRow[] = useMemo(() => {
    return surveys
      .map(s => {
        const ed = editionById(s.editionId);
        if (!ed) return null;
        const yesPct = s.recommend.total
          ? ((s.recommend.options.find(o => o.label === "Yes")?.count ?? 0) /
              s.recommend.total) * 100
          : 0;
        const aboveExpPct = s.overallRating.total
          ? (((s.overallRating.options.find(o => o.label === "Significantly Above Expectations")?.count ?? 0) +
              (s.overallRating.options.find(o => o.label === "Above Expectations")?.count ?? 0)) /
              s.overallRating.total) * 100
          : 0;
        return {
          editionId: s.editionId,
          number: ed.number,
          label: `ACE ${ed.number}`,
          responses: s.totalResponses,
          meanRating: s.overallRating.mean,
          recommendPct: yesPct,
          aboveExpPct,
          connections: s.connectionsCount?.total ?? 0,
        };
      })
      .filter((x): x is PerEditionRow => x !== null)
      .sort((a, b) => a.number - b.number);
  }, [surveys]);

  if (surveys.length === 0) return null;

  const totalEditions = editions.length;
  const editionsWithSurvey = surveys.length;

  return (
    <section
      aria-label="Voice of the participants"
      className="space-y-6"
    >
      {/* Source-of-truth label — bigger context lives in the PillarHeader,
          this just says what was aggregated and from where. */}
      <div className="text-[15px] text-text-secondary leading-relaxed">
        Aggregated from <span className="font-bold text-ink">{editionsWithSurvey}</span> of {totalEditions} ACE editions
        ({perEdition.map(p => `ACE ${p.number}`).join(" · ")}). Each delegate
        completed an exit survey rating the program, knowledge gained
        and partnerships forged.
      </div>

      {/* Global headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Survey responses"
          value={overall.totalResponses.toLocaleString()}
          hint={`Across ${editionsWithSurvey} editions`}
          accent={ACE.blueDeep}
        />
        <StatCard
          icon={ThumbsUp}
          label="Would recommend"
          value={`${overall.recommendPct.toFixed(0)}%`}
          hint="of all delegates surveyed"
          accent={ACE.green}
        />
        <StatCard
          icon={Award}
          label="Avg. aspect rating"
          value={overall.aspectMean.toFixed(2)}
          hint="weighted out of 5.00"
          accent={ACE.orange}
        />
        <StatCard
          icon={TrendingUp}
          label="Above expectations"
          value={`${overall.aboveExpPct.toFixed(0)}%`}
          hint="combined positive overall"
          accent={ACE.turquoise}
        />
      </div>

      {/* Per-edition comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Recommendation rate per edition</CardTitle>
          <p className="text-[13px] text-text-muted mt-1">
            Share of delegates who said they would recommend the ACE program. Click a bar to open that edition.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={perEdition} margin={{ top: 28, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 13, fill: "#5E6B7A" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#5E6B7A" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  cursor={{ fill: `${ACE.blueDeep}10` }}
                  contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #E2E8F0", padding: "8px 12px" }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, "Recommend"]}
                  labelFormatter={(label, payload) => {
                    const row = payload?.[0]?.payload as PerEditionRow | undefined;
                    if (!row) return label;
                    const ed = editionById(row.editionId);
                    return `ACE ${row.number} — ${ed ? editionRegion(ed) : ""} (${row.responses} responses)`;
                  }}
                />
                <Bar
                  dataKey="recommendPct"
                  radius={[8, 8, 0, 0]}
                  {...ANIMATION}
                  onClick={(d: { editionId?: string }) => {
                    if (typeof window !== "undefined" && d.editionId) {
                      window.location.href = asset(`/editions/${d.editionId}`);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {perEdition.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? ACE.blueDeep : ACE.blueBright} />
                  ))}
                  <LabelList
                    dataKey="recommendPct"
                    position="top"
                    fontSize={12}
                    fontWeight={700}
                    fill={ACE.blueDeep}
                    formatter={(v: number) => `${v.toFixed(0)}%`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Countries surveyed — full-width now that the equity card is gone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Network size={18} style={{ color: ACE.blueBright }} /> Countries surveyed
          </CardTitle>
          <p className="text-[13px] text-text-muted mt-1">
            <span className="font-bold text-ink">{countries.length}</span> countries represented across all surveys. Top 20 by total responses.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-1.5">
            {countries.slice(0, 21).map((c, i) => {
              const max = countries[0]?.count ?? 1;
              const width = (c.count / max) * 100;
              return (
                <div key={c.country} className="flex items-center gap-2">
                  <span className="text-[13px] text-text-secondary w-36 truncate font-medium">{c.country}</span>
                  <div className="flex-1 bg-surface-subtle rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${width}%`,
                        backgroundColor: ACE.blueBright,
                        transitionDelay: `${i * 30}ms`,
                        transitionDuration: "800ms",
                      }}
                    />
                  </div>
                  <span className="text-[12.5px] font-bold text-ink w-8 text-right tabular-nums">{c.count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quotes */}
      {quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <QuoteIcon size={18} style={{ color: ACE.purple }} /> What participants said
            </CardTitle>
            <p className="text-[13px] text-text-muted mt-1">
              One verbatim comment per edition with survey data. Click a card to open that edition.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quotes.map((q, i) => {
                const p = findQuoteParticipant(q.quote.name);
                const country = canonicalCountry(q.quote.country ?? "");
                // Prefer linking to the delegate's profile when we can
                // match them; fall back to the edition page when we
                // can't (the user still gets useful context that way).
                const href = p ? `/participants/${p.id}` : `/editions/${q.editionId}`;
                return (
                  <Link
                    key={i}
                    href={href}
                    className="group bg-surface-subtle border border-surface-border rounded-lg p-4 hover:bg-white hover:border-accent-blue/40 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: ACE.purple }}>
                        ACE {q.editionNumber} · {q.editionLabel}
                      </div>
                      <ArrowRight size={14} className="text-text-muted group-hover:text-accent-blue group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      {p?.photoUrl ? (
                        <Image
                          src={p.photoUrl}
                          alt={q.quote.name}
                          width={44}
                          height={44}
                          className="w-11 h-11 rounded-full object-cover border border-surface-border shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-accent-purple/15 flex items-center justify-center shrink-0">
                          <QuoteIcon size={18} style={{ color: ACE.purple }} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[15px] font-bold text-ink truncate leading-tight">{q.quote.name}</div>
                        {country && (
                          <div className="text-[13px] text-text-muted truncate mt-0.5">{country}</div>
                        )}
                      </div>
                    </div>
                    <p className="text-[15px] text-ink leading-relaxed">“{q.quote.text}”</p>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
