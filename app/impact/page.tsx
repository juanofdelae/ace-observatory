"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/FilterBar";
import { OutcomeCard } from "@/components/OutcomeCard";
import { ImpactPageNav } from "@/components/ImpactPageNav";
import { outcomes } from "@/data/outcomes";
import { editions } from "@/data/editions";
import { reports } from "@/data/reports";
import { sectors } from "@/data/sectors";
import { countries } from "@/data/countries";
import { allSurveys } from "@/data/surveys";
import { ChartCard } from "@/components/charts/ChartCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid, LabelList,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { GlobalSurveyImpact } from "@/components/GlobalSurveyImpact";
import {
  FileSignature, CheckCircle2, AlertCircle, ArrowRight, Sparkles,
  Users, ThumbsUp, Globe2, BarChart3, Handshake, Quote as QuoteIcon,
} from "lucide-react";
import type { FilterState } from "@/types";

// ── ACE brand palette — used for every chart on the page so colors
// match the logo (navy / blue / turquoise / yellow / orange / green).
const ACE = {
  navy: "#0B1F3A",
  blueDeep: "#1E4E8C",
  blueBright: "#2563EB",
  turquoise: "#2FB7B2",
  green: "#0B7A4A",
  yellow: "#F5B700",
  orange: "#F05A28",
  orangeBright: "#F97316",
  purple: "#7C3AED",
  red: "#D62828",
} as const;
const ACE_PALETTE = [
  ACE.blueDeep, ACE.turquoise, ACE.orange, ACE.yellow, ACE.green,
  ACE.purple, ACE.blueBright, ACE.red, ACE.navy, ACE.orangeBright,
];

const isSample = (o: { description?: string }) =>
  /sample/i.test(o.description ?? "");

// ── Pillar header — every major section uses this for visual rhythm ──
function PillarHeader({
  step, eyebrow, title, subtitle, accent, icon: Icon, count, countLabel,
}: {
  step: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
  icon: typeof Sparkles;
  count?: number | string;
  countLabel?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-3 border-b border-surface-border">
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 mt-1"
          style={{ backgroundColor: `${accent}15` }}
        >
          <Icon size={26} style={{ color: accent }} />
        </div>
        <div>
          <div
            className="inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.18em] mb-1.5"
            style={{ color: accent }}
          >
            <span className="tabular-nums">0{step}</span>
            <span>·</span>
            <span>{eyebrow}</span>
          </div>
          <h2 className="text-3xl md:text-[2.05rem] font-bold text-ink tracking-tight leading-[1.15]">
            {title}
          </h2>
          <p className="mt-2 text-[15px] text-text-secondary leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </div>
      </div>
      {count !== undefined && (
        <div className="text-right shrink-0">
          <div
            className="text-5xl md:text-6xl font-bold tabular-nums leading-none"
            style={{ color: accent }}
          >
            {count}
          </div>
          {countLabel && (
            <div className="text-[12px] uppercase tracking-wider text-text-muted font-semibold mt-1.5">
              {countLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Hero KPI tile — large readable number with icon + subtle accent ──
function HeroKpi({
  icon: Icon, value, label, hint, accent,
}: {
  icon: typeof Sparkles;
  value: string | number;
  label: string;
  hint?: string;
  accent: string;
}) {
  return (
    <div
      className="bg-white border border-surface-border rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
      </div>
      <div className="text-[11.5px] uppercase tracking-[0.14em] text-text-muted font-bold">
        {label}
      </div>
      <div
        className="text-[2.25rem] md:text-[2.6rem] font-bold leading-none tabular-nums mt-1.5"
        style={{ color: accent }}
      >
        {value}
      </div>
      {hint && (
        <div className="text-[13px] text-text-secondary mt-2 leading-snug">
          {hint}
        </div>
      )}
    </div>
  );
}

// Custom tooltip for chart hovers — bigger, clearer than recharts default.
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

export default function ImpactPage() {
  const [filters, setFilters] = useState<FilterState>({});

  // ── LOI tracker — real data only -------------------------------------
  const loiPerReport = useMemo(() => {
    return reports
      .filter(r => r.loiSummary?.total)
      .map(r => {
        const ed = editions.find(e => e.id === r.editionId);
        return {
          editionId: r.editionId,
          reportId: r.id,
          editionNumber: ed?.number ?? 0,
          year: ed ? new Date(ed.startDate).getFullYear() : 0,
          editionName: ed?.name ?? r.title,
          total: r.loiSummary!.total,
          betweenDelegates: r.loiSummary!.betweenDelegates,
          withHostAcademic: r.loiSummary!.withHostAcademic,
          withHostAcademicLabel: r.loiSummary!.withHostAcademicLabel ?? "With host academia",
        };
      })
      .sort((a, b) => a.editionNumber - b.editionNumber);
  }, []);

  const loiTotal = loiPerReport.reduce((sum, r) => sum + r.total, 0);

  // ── Survey-derived headline numbers ----------------------------------
  const surveyData = useMemo(() => {
    const surveys = allSurveys();
    const totalResponses = surveys.reduce((s, x) => s + x.totalResponses, 0);
    const recommendTotal = surveys.reduce((s, x) => s + x.recommend.total, 0);
    const yesCount = surveys.reduce(
      (s, x) => s + (x.recommend.options.find(o => o.label === "Yes")?.count ?? 0),
      0,
    );
    const aboveExp = surveys.reduce((s, x) => {
      const above =
        (x.overallRating.options.find(o => o.label === "Significantly Above Expectations")?.count ?? 0) +
        (x.overallRating.options.find(o => o.label === "Above Expectations")?.count ?? 0);
      return s + above;
    }, 0);
    const ratingTotal = surveys.reduce((s, x) => s + x.overallRating.total, 0);
    const surveyCountries = new Set<string>();
    for (const x of surveys) for (const c of x.countryDistribution) surveyCountries.add(c.country);
    const totalConnections = surveys.reduce(
      (s, x) => s + (x.connectionsCount?.total ?? 0),
      0,
    );
    return {
      surveysCount: surveys.length,
      totalResponses,
      recommendPct: recommendTotal ? (yesCount / recommendTotal) * 100 : 0,
      aboveExpPct: ratingTotal ? (aboveExp / ratingTotal) * 100 : 0,
      countries: surveyCountries.size,
      connections: totalConnections,
    };
  }, []);

  // ── Outcome partition: verified vs illustrative ----------------------
  const verifiedOutcomes = useMemo(() => outcomes.filter(o => !isSample(o)), []);
  const sampleOutcomes = useMemo(() => outcomes.filter(o => isSample(o)), []);

  const filtered = useMemo(() => {
    return outcomes.filter(o => {
      if (filters.countryId && !o.countryIds.includes(filters.countryId)) return false;
      if (filters.sectorId && !o.sectorIds.includes(filters.sectorId)) return false;
      if (filters.editionId && !o.editionIds.includes(filters.editionId)) return false;
      if (filters.outcomeCategory && o.category !== filters.outcomeCategory) return false;
      return true;
    });
  }, [filters]);

  const filteredVerified = filtered.filter(o => !isSample(o));
  const filteredSample = filtered.filter(o => isSample(o));

  const byYear = useMemo(() => {
    const map: Record<number, number> = {};
    for (const o of outcomes) {
      const y = new Date(o.date).getFullYear();
      map[y] = (map[y] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, count]) => ({ year, count }));
  }, []);

  const bySector = useMemo(() => {
    const map: Record<string, { name: string; count: number; color: string }> = {};
    for (const o of outcomes) {
      for (const sid of o.sectorIds) {
        const s = sectors.find(x => x.id === sid);
        if (!s) continue;
        if (!map[sid]) map[sid] = { name: s.name, count: 0, color: s.color };
        map[sid].count++;
      }
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, []);

  const byCountry = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of outcomes) for (const c of o.countryIds) map[c] = (map[c] ?? 0) + 1;
    return Object.entries(map)
      .map(([id, n]) => ({
        id,
        name: countries.find(c => c.id === id)?.name ?? id,
        n,
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 8);
  }, []);

  const loiByYear = useMemo(() => {
    return loiPerReport
      .map(r => ({ year: r.year, total: r.total, label: `ACE ${r.editionNumber}`, reportId: r.reportId }))
      .sort((a, b) => a.year - b.year);
  }, [loiPerReport]);

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* ── Sticky left-side TOC ─────────────────────────────────── */}
        <aside className="hidden lg:block">
          <ImpactPageNav />
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="space-y-12 min-w-0">
          {/* HERO / OVERVIEW */}
          <header id="overview" className="scroll-mt-6 space-y-6">
            <PageHeader
              eyebrow="Results & documented impact"
              title="Impact & Outcomes"
              description="What ACE has produced across a decade of editions: what delegates report about the program, verified outcomes traceable to specific ACE moments, and documented partnerships from Final Reports."
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <HeroKpi
                icon={Users}
                value={surveyData.totalResponses.toLocaleString()}
                label="Delegates surveyed"
                hint={`Across ${surveyData.surveysCount} editions of exit-survey data`}
                accent={ACE.purple}
              />
              <HeroKpi
                icon={Handshake}
                value={surveyData.connections.toLocaleString()}
                label="New partnerships"
                hint="Self-reported by participants"
                accent={ACE.orange}
              />
              <HeroKpi
                icon={ThumbsUp}
                value={`${surveyData.aboveExpPct.toFixed(0)}%`}
                label="Above expectations"
                hint="Combined positive overall"
                accent={ACE.blueDeep}
              />
              <HeroKpi
                icon={Globe2}
                value={surveyData.countries}
                label="Countries surveyed"
                hint="Unique nationalities represented"
                accent={ACE.turquoise}
              />
              <HeroKpi
                icon={FileSignature}
                value={loiTotal.toLocaleString()}
                label="Letters of intent"
                hint={`Verified in ${loiPerReport.length} of ${editions.length} editions so far`}
                accent={ACE.green}
              />
            </div>
          </header>

          {/* PILLAR · Voice (surveys) — moved to FIRST since it's the most global */}
          <section id="voice" className="scroll-mt-6 space-y-6">
            <PillarHeader
              step={1}
              eyebrow="Voice of the participants"
              title="What delegates report"
              subtitle="Aggregated exit-survey data across 9 editions: program ratings, knowledge gained, equity sentiment and the voices behind the numbers."
              icon={QuoteIcon}
              accent={ACE.purple}
              count={surveyData.totalResponses.toLocaleString()}
              countLabel="Survey responses"
            />
            <GlobalSurveyImpact />
          </section>

          {/* PILLAR · Outcomes archive */}
          <section id="outcomes" className="scroll-mt-6 space-y-6">
            <PillarHeader
              step={2}
              eyebrow="Outcomes archive"
              title="Verified outcomes & sectoral signals"
              subtitle="Specific projects, policies and investments documented after ACE editions, plus aggregate views of how outcomes distribute across years, countries and sectors."
              icon={Sparkles}
              accent={ACE.yellow}
              count={`${verifiedOutcomes.length}+${sampleOutcomes.length}`}
              countLabel="Verified · pending"
            />

            {/* Three small charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Outcomes by year</CardTitle>
                  <p className="text-xs text-text-muted mt-0.5">
                    When verified outcomes were registered.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer>
                      <BarChart data={byYear} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                        <XAxis
                          dataKey="year"
                          tick={{ fontSize: 12, fill: "#5E6B7A" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 12, fill: "#5E6B7A" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<NiceTooltip />} cursor={{ fill: `${ACE.yellow}10` }} />
                        <Bar
                          dataKey="count"
                          fill={ACE.yellow}
                          radius={[6, 6, 0, 0]}
                          isAnimationActive
                          animationDuration={900}
                        >
                          <LabelList
                            dataKey="count"
                            position="top"
                            fontSize={11}
                            fill={ACE.yellow}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top countries</CardTitle>
                  <p className="text-xs text-text-muted mt-0.5">
                    Where verified outcomes happened.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {byCountry.map(c => (
                      <div key={c.id} className="flex items-center justify-between text-[13px] group">
                        <span className="text-ink truncate w-32 font-medium">{c.name}</span>
                        <div className="flex items-center gap-2 flex-1 ml-2">
                          <div className="flex-1 h-2.5 bg-surface-subtle rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 group-hover:opacity-80"
                              style={{
                                width: `${(c.n / byCountry[0].n) * 100}%`,
                                backgroundColor: ACE.blueDeep,
                              }}
                            />
                          </div>
                          <span className="text-[12px] font-bold text-ink w-7 text-right tabular-nums">
                            {c.n}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Most active sectors</CardTitle>
                  <p className="text-xs text-text-muted mt-0.5">
                    Sectors with the most outcomes.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer>
                      <BarChart
                        data={bySector}
                        layout="vertical"
                        margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                      >
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11, fill: "#5E6B7A" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#0B1F3A" }}
                          axisLine={false}
                          tickLine={false}
                          width={140}
                          tickFormatter={(v) => v.length > 18 ? v.slice(0, 17) + "…" : v}
                        />
                        <Tooltip content={<NiceTooltip />} cursor={{ fill: `${ACE.turquoise}10` }} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={900}>
                          {bySector.map((_, i) => (
                            <Cell key={i} fill={ACE_PALETTE[i % ACE_PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <FilterBar
              value={filters}
              onChange={setFilters}
              fields={["countryId", "sectorId", "editionId", "outcomeCategory"]}
            />

            {/* Verified outcomes — only render the header + grid when at
                least one matches. Avoids the dangling "Verified · 0" tile
                when no outcomes are present. */}
            {filteredVerified.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                    <CheckCircle2 size={14} />
                    Verified · {filteredVerified.length}
                    {filters && filteredVerified.length !== verifiedOutcomes.length && (
                      <span className="text-text-muted font-normal normal-case tracking-normal">
                        of {verifiedOutcomes.length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredVerified.map(o => (
                    <OutcomeCard key={o.id} o={o} />
                  ))}
                </div>
              </div>
            )}

            {filteredSample.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-amber-600">
                    <AlertCircle size={14} />
                    Illustrative · {filteredSample.length}
                    <span className="text-text-muted font-normal normal-case tracking-normal">
                      pending verification
                    </span>
                  </div>
                </div>
                <p className="text-[13px] text-text-secondary mb-3 max-w-3xl">
                  The data shape the observatory will track once the full
                  outcome archive is ingested. Not citable as documented impact.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-75">
                  {filteredSample.map(o => (
                    <OutcomeCard key={o.id} o={o} />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* PILLAR · Partnerships (LOIs) — moved near the end since it's
              based on a SUBSET of editions, not a global aggregate. */}
          <section id="partnerships" className="scroll-mt-6 space-y-6">
            <PillarHeader
              step={3}
              eyebrow="Documented partnerships"
              title="Letters of Intent"
              subtitle={`Aggregated from every Final Report that publishes a structured LOI count — currently ${loiPerReport.length} of ${editions.length} editions. The remaining reports either don't break out LOIs or are in the ingestion queue.`}
              icon={FileSignature}
              accent={ACE.green}
              count={loiTotal.toLocaleString()}
              countLabel={`LOIs · ${loiPerReport.length} editions`}
            />

            {loiPerReport.length === 0 ? (
              <div className="bg-white border border-dashed border-surface-border rounded-2xl p-8 text-center text-sm text-text-muted">
                No LOI data ingested yet.
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 size={18} className="text-emerald-600" />
                      LOIs per edition
                    </CardTitle>
                    <p className="text-[13px] text-text-muted mt-1">
                      Click a bar to open the corresponding Final Report.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[260px]">
                      <ResponsiveContainer>
                        <BarChart
                          data={loiByYear}
                          margin={{ top: 28, right: 16, left: 0, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 13, fill: "#5E6B7A" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: "#5E6B7A" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<NiceTooltip />} cursor={{ fill: `${ACE.green}10` }} />
                          <Bar
                            dataKey="total"
                            fill={ACE.green}
                            radius={[8, 8, 0, 0]}
                            isAnimationActive
                            animationDuration={900}
                            onClick={(d: { reportId?: string }) => {
                              if (typeof window !== "undefined" && d.reportId) {
                                window.location.href = `/reports/${d.reportId}`;
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <LabelList
                              dataKey="total"
                              position="top"
                              fontSize={13}
                              fontWeight={700}
                              fill={ACE.green}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {loiPerReport.map(r => (
                    <Link
                      key={r.editionId}
                      href={`/reports/${r.reportId}`}
                      className="group rounded-xl bg-white border border-surface-border hover:border-emerald-500/40 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
                          ACE {r.editionNumber} · {r.year}
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-text-muted group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                      <div className="text-4xl font-bold text-ink leading-none tabular-nums">
                        {r.total}
                      </div>
                      <div className="mt-1 text-[12.5px] text-text-secondary">
                        Letters of intent
                      </div>
                      {(r.betweenDelegates > 0 || r.withHostAcademic > 0) && (
                        <div className="mt-3 pt-3 border-t border-surface-border space-y-1 text-[12px] text-text-secondary">
                          {r.betweenDelegates > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="truncate pr-1">Between delegates</span>
                              <span className="font-bold text-ink tabular-nums">{r.betweenDelegates}</span>
                            </div>
                          )}
                          {r.withHostAcademic > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="truncate pr-1">{r.withHostAcademicLabel}</span>
                              <span className="font-bold text-ink tabular-nums">{r.withHostAcademic}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
