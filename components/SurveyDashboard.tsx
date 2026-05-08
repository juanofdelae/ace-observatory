"use client";
import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { surveyByEdition, type SurveyData } from "@/data/surveys";
import { participants } from "@/data/participants";
import { dedupeCountryDist } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, CartesianGrid, LabelList,
} from "recharts";
import { Award, Users, ThumbsUp, TrendingUp, Quote as QuoteIcon, Network, User } from "lucide-react";

// Match a quote attribution to a participant record (id + photo) so
// we can both render the avatar and link the card to that delegate's
// profile page. Accent-insensitive normalized name match handles
// QuestionPro free-text variants vs the curated roster.
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

const COLOR_RATING = ["#0B7A4A", "#2FB7B2", "#94A3B8", "#F5B700", "#F05A28"];
const COLOR_LEVEL = { None: "#E2E8F0", Low: "#94A3B8", Medium: "#2FB7B2", High: "#0B7A4A" } as const;
const ANIMATION = { isAnimationActive: true, animationDuration: 1100, animationEasing: "ease-out" } as const;

function shorten(label: string, max = 40): string {
  if (label.length <= max) return label;
  return label.slice(0, max - 1) + "…";
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
    <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}15` }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{label}</div>
          <div className="text-2xl font-bold text-ink leading-none mt-1 counter-up">{value}</div>
          {hint && <div className="text-[11px] text-text-muted mt-1">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

export function SurveyDashboard({ editionId }: { editionId: string }) {
  const survey = surveyByEdition(editionId);
  // All hooks must be called unconditionally — the early return moved to
  // the very end after all the useMemos have run with safe defaults.
  const safe: SurveyData = survey ?? {
    editionId,
    totalResponses: 0,
    overallRating: { options: [], total: 0, mean: 0 },
    aspectRatings: [],
    recommend: { options: [], total: 0, mean: 0 },
    knowledgeScope: [],
    programImpact: [],
    sessionsAttended: [],
    knowledgeGrowth: [],
    countryDistribution: [],
  };

  const aspectData = useMemo(
    () => [...safe.aspectRatings].sort((a, b) => b.mean - a.mean),
    [safe],
  );

  // Knowledge growth — flatten so each topic produces a stack of pre + exit.
  const knowledgeGrowth = useMemo(() => {
    return (safe.knowledgeGrowth ?? []).map(k => {
      const preTotal = k.pre.None + k.pre.Low + k.pre.Medium + k.pre.High;
      const exitTotal = k.exit.None + k.exit.Low + k.exit.Medium + k.exit.High;
      const preHigh = preTotal ? ((k.pre.Medium + k.pre.High) / preTotal) * 100 : 0;
      const exitHigh = exitTotal ? ((k.exit.Medium + k.exit.High) / exitTotal) * 100 : 0;
      return {
        topic: shorten(k.topic.replace(/\s*&\s*/g, " & "), 30),
        prePct: Math.round(preHigh),
        exitPct: Math.round(exitHigh),
        delta: Math.round(exitHigh - preHigh),
      };
    });
  }, [safe]);

  const stackedGrowth = useMemo(() => {
    return (safe.knowledgeGrowth ?? []).flatMap(k => {
      const preTotal = k.pre.None + k.pre.Low + k.pre.Medium + k.pre.High || 1;
      const exitTotal = k.exit.None + k.exit.Low + k.exit.Medium + k.exit.High || 1;
      return [
        { phase: shorten(k.topic, 22), when: "Pre-Survey",
          None: Math.round((k.pre.None / preTotal) * 100),
          Low: Math.round((k.pre.Low / preTotal) * 100),
          Medium: Math.round((k.pre.Medium / preTotal) * 100),
          High: Math.round((k.pre.High / preTotal) * 100) },
        { phase: shorten(k.topic, 22), when: "Exit Survey",
          None: Math.round((k.exit.None / exitTotal) * 100),
          Low: Math.round((k.exit.Low / exitTotal) * 100),
          Medium: Math.round((k.exit.Medium / exitTotal) * 100),
          High: Math.round((k.exit.High / exitTotal) * 100) },
      ];
    });
  }, [safe]);

  // For editions without a pre-survey we still show exit-survey-only
  // "share with Medium+High familiarity" — useful as a single-column chart.
  const knowledgeExit = useMemo(() => {
    return safe.knowledgeScope.map(k => {
      const total = (k.exit.None ?? 0) + (k.exit.Low ?? 0) + (k.exit.Medium ?? 0) + (k.exit.High ?? 0);
      const high = total ? ((k.exit.Medium + k.exit.High) / total) * 100 : 0;
      return { topic: shorten(k.topic, 26), pct: Math.round(high) };
    });
  }, [safe]);

  const programImpact = useMemo(
    () =>
      safe.programImpact
        .map(i => ({ label: shorten(i.label, 56), count: i.count }))
        .sort((a, b) => b.count - a.count),
    [safe],
  );

  const radarData = useMemo(
    () =>
      safe.aspectRatings.map(a => ({
        aspect: shorten(a.label, 18),
        rating: a.mean,
        full: 5,
      })),
    [safe],
  );

  const recommendYesPct = useMemo(() => {
    const yes = safe.recommend.options.find(o => o.label === "Yes")?.pct ?? 0;
    return yes;
  }, [safe]);

  const recommendCount = useMemo(() => {
    const yes = safe.recommend.options.find(o => o.label === "Yes")?.count ?? 0;
    return { yes, total: safe.recommend.total };
  }, [safe]);

  // Country list deduplicated to canonical names (USA + United States →
  // United States, Brasil → Brazil, MEXICO → Mexico, etc.) using the
  // shared utility so every country chart in the app dedupes the same way.
  const dedupedCountries = useMemo(
    () => dedupeCountryDist(safe.countryDistribution),
    [safe],
  );

  // Defer the empty render until after every hook has been called so the
  // hook-order rule is preserved across renders.
  if (!survey || survey.totalResponses === 0) {
    return null;
  }

  const hasGrowth = (safe.knowledgeGrowth?.length ?? 0) > 0;
  const hasSessions = (safe.sessionsAttended?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Survey responses"
          value={safe.totalResponses}
          accent="#1E4E8C"
        />
        <StatCard
          icon={ThumbsUp}
          label="Would recommend"
          value={`${recommendYesPct.toFixed(0)}%`}
          hint={`${recommendCount.yes} of ${recommendCount.total} say yes`}
          accent="#0B7A4A"
        />
        <StatCard
          icon={Award}
          label="Avg. aspect rating"
          value={(
            safe.aspectRatings.reduce((s, a) => s + a.mean, 0) /
            (safe.aspectRatings.length || 1)
          ).toFixed(2)}
          hint="out of 5.00"
          accent="#F05A28"
        />
        <StatCard
          icon={TrendingUp}
          label="Above expectations"
          value={`${(
            (safe.overallRating.options.find(o => o.label === "Significantly Above Expectations")?.pct ?? 0) +
            (safe.overallRating.options.find(o => o.label === "Above Expectations")?.pct ?? 0)
          ).toFixed(0)}%`}
          hint="combined positive"
          accent="#2FB7B2"
        />
      </div>

      {/* Two-column: overall rating donut + aspect-rating radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Overall program rating</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              How participants rated the program overall.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={safe.overallRating.options.filter(o => o.count > 0)}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    {...ANIMATION}
                    label={(entry) => `${entry.pct}%`}
                  >
                    {safe.overallRating.options.map((_, i) => (
                      <Cell key={i} fill={COLOR_RATING[i % COLOR_RATING.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                    formatter={(v: number, _name, p: { payload?: { pct?: number } }) =>
                      [`${v} responses (${p?.payload?.pct ?? 0}%)`, ""]
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] mt-1">
              {safe.overallRating.options
                .filter(o => o.count > 0)
                .map((o, i) => (
                  <span key={o.label} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: COLOR_RATING[i % COLOR_RATING.length] }}
                    />
                    <span className="text-text-secondary">{o.label}</span>
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How participants rated each aspect</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              Mean rating per dimension (1 = Very Poor, 5 = Very Good).
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="78%">
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="aspect" tick={{ fontSize: 10, fill: "#5E6B7A" }} />
                  <PolarRadiusAxis angle={30} domain={[3, 5]} tick={{ fontSize: 9, fill: "#9AA5B4" }} />
                  <Radar name="Rating" dataKey="rating" stroke="#1E4E8C" fill="#1E4E8C" fillOpacity={0.3} {...ANIMATION} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                    formatter={(v: number) => [v.toFixed(2), "Mean"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] mt-1">
              {aspectData.map(a => (
                <span key={a.label} className="flex items-center justify-between">
                  <span className="text-text-secondary truncate pr-2">{shorten(a.label, 28)}</span>
                  <span className="font-bold text-ink tabular-nums">{a.mean.toFixed(2)}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge — pre vs exit (if pre-survey exists) OR exit-only bar */}
      {hasGrowth ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Knowledge uplift — Pre-survey vs Exit-survey</CardTitle>
              <p className="text-xs text-text-muted mt-1">
                Share of participants reporting Medium or High familiarity with each topic
                <span className="font-semibold text-ink"> before</span> and
                <span className="font-semibold text-ink"> after</span> the program.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[340px]">
                <ResponsiveContainer>
                  <BarChart data={knowledgeGrowth} margin={{ top: 24, right: 24, left: 8, bottom: 24 }} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                    <XAxis dataKey="topic" tick={{ fontSize: 11, fill: "#5E6B7A" }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11, fill: "#5E6B7A" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} formatter={(v: number) => `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="prePct" name="Pre-Survey (Medium+High)" fill="#94A3B8" radius={[6, 6, 0, 0]} {...ANIMATION}>
                      <LabelList dataKey="prePct" position="top" fontSize={10} fill="#5E6B7A" formatter={(v: number) => `${v}%`} />
                    </Bar>
                    <Bar dataKey="exitPct" name="Exit Survey (Medium+High)" fill="#0B7A4A" radius={[6, 6, 0, 0]} {...ANIMATION} animationBegin={400}>
                      <LabelList dataKey="exitPct" position="top" fontSize={10} fill="#0B7A4A" formatter={(v: number) => `${v}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                {knowledgeGrowth.map(g => (
                  <div key={g.topic} className="bg-surface-subtle border border-surface-border rounded-lg p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-text-muted">{g.topic}</div>
                    <div className="text-lg font-bold text-ink mt-0.5">+{g.delta}<span className="text-xs">pp</span></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribution of knowledge levels</CardTitle>
              <p className="text-xs text-text-muted mt-1">
                Each topic's None / Low / Medium / High split before and after.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[360px]">
                <ResponsiveContainer>
                  <BarChart data={stackedGrowth} layout="vertical" margin={{ top: 8, right: 24, left: 80, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#5E6B7A" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="phase" type="category" tick={{ fontSize: 10, fill: "#5E6B7A" }} axisLine={false} tickLine={false} width={150} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} formatter={(v: number) => `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="None" stackId="a" fill={COLOR_LEVEL.None} {...ANIMATION} />
                    <Bar dataKey="Low" stackId="a" fill={COLOR_LEVEL.Low} {...ANIMATION} animationBegin={150} />
                    <Bar dataKey="Medium" stackId="a" fill={COLOR_LEVEL.Medium} {...ANIMATION} animationBegin={300} />
                    <Bar dataKey="High" stackId="a" fill={COLOR_LEVEL.High} {...ANIMATION} animationBegin={450} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      ) : knowledgeExit.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Knowledge gained — Exit-survey snapshot</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              Share of participants reporting Medium or High familiarity with each
              topic at the end of the program.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <BarChart data={knowledgeExit} margin={{ top: 24, right: 24, left: 8, bottom: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                  <XAxis dataKey="topic" tick={{ fontSize: 11, fill: "#5E6B7A" }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "#5E6B7A" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="pct" fill="#0B7A4A" radius={[6, 6, 0, 0]} {...ANIMATION}>
                    <LabelList dataKey="pct" position="top" fontSize={10} fill="#0B7A4A" formatter={(v: number) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two-column: program impact + countries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>How the program impacted participants</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              Number of participants citing each impact (multi-select).
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer>
                <BarChart data={programImpact} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#5E6B7A" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 10, fill: "#5E6B7A" }} axisLine={false} tickLine={false} width={250} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Bar dataKey="count" fill="#1E4E8C" radius={[0, 6, 6, 0]} {...ANIMATION}>
                    <LabelList dataKey="count" position="right" fontSize={10} fill="#1E4E8C" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Countries represented</CardTitle>
            <p className="text-[13px] text-text-muted mt-1">
              <span className="font-bold text-ink">{dedupedCountries.length}</span> countries among the surveyed group.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {dedupedCountries.map((c, i) => {
                const max = dedupedCountries[0]?.count ?? 1;
                const width = (c.count / max) * 100;
                return (
                  <div key={c.country} className="flex items-center gap-2">
                    <span className="text-[12.5px] text-text-secondary w-32 truncate font-medium">{c.country}</span>
                    <div className="flex-1 bg-surface-subtle rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full bg-brand-blue-bright transition-all"
                        style={{
                          width: `${width}%`,
                          transitionDelay: `${i * 60}ms`,
                          transitionDuration: "800ms",
                        }}
                      />
                    </div>
                    <span className="text-[12px] font-bold text-ink w-7 text-right tabular-nums">{c.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connections (when present) */}
      {safe.connectionsCount && safe.connectionsCount.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Network size={16} className="text-accent-blue" /> New connections per participant</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              How many high-level decision-makers each delegate connected with — median {safe.connectionsCount.median}, total {safe.connectionsCount.total} relationships.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer>
                <BarChart data={safe.connectionsCount.buckets} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#5E6B7A" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5E6B7A" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} {...ANIMATION}>
                    <LabelList dataKey="count" position="top" fontSize={11} fill="#2563EB" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions attended (Cordoba only — kept for backward-compat) */}
      {hasSessions && (
        <Card>
          <CardHeader>
            <CardTitle>Sessions attended per participant</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              How many sessions each delegate joined during the week.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer>
                <BarChart data={safe.sessionsAttended} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#5E6B7A" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5E6B7A" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Bar dataKey="count" fill="#F05A28" radius={[6, 6, 0, 0]} {...ANIMATION}>
                    <LabelList dataKey="count" position="top" fontSize={11} fill="#F05A28" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Qualitative quotes */}
      {(safe.qualitativeQuotes?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg"><QuoteIcon size={18} className="text-accent-purple" /> What participants said</CardTitle>
            <p className="text-[13px] text-text-muted mt-1">
              Selected verbatim comments from the open-text questions.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {safe.qualitativeQuotes!.map((q, i) => {
                const p = findQuoteParticipant(q.name);
                const inner = (
                  <>
                    <div className="flex items-center gap-3 mb-2.5">
                      {p?.photoUrl ? (
                        <Image
                          src={p.photoUrl}
                          alt={q.name}
                          width={44}
                          height={44}
                          className="w-11 h-11 rounded-full object-cover border border-surface-border shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-accent-purple/15 flex items-center justify-center shrink-0">
                          <User size={20} className="text-accent-purple" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[15px] font-bold text-ink truncate leading-tight">{q.name}</div>
                        {q.country && (
                          <div className="text-[13px] text-text-muted truncate mt-0.5">{q.country}</div>
                        )}
                      </div>
                    </div>
                    <p className="text-[15px] text-ink leading-relaxed">“{q.text}”</p>
                  </>
                );
                return p ? (
                  <Link
                    key={i}
                    href={`/participants/${p.id}`}
                    className="block bg-surface-subtle border border-surface-border rounded-lg p-4 hover:bg-white hover:border-accent-blue/40 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={i} className="bg-surface-subtle border border-surface-border rounded-lg p-4">
                    {inner}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
