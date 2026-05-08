"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LabelList, Legend,
} from "recharts";
import type { ReportKnowledgeGain } from "@/data/reports";
import { CHART_ANIMATION, REPORT_PALETTE } from "./reportPalette";
import { EmptyReportSection } from "./EmptyReportSection";
import { TrendingUp } from "lucide-react";

interface Props {
  knowledgeGain: ReportKnowledgeGain[];
}

export function ReportKnowledgeChart({ knowledgeGain }: Props) {
  if (!knowledgeGain.length) {
    return (
      <EmptyReportSection
        title="Knowledge uplift — Pre vs Exit survey"
        icon={TrendingUp}
        message="This Final Report does not include a pre / exit knowledge-gain breakdown by topic. Knowledge uplift is captured qualitatively in the Testimonials section."
      />
    );
  }

  const data = knowledgeGain.map(k => ({
    topic: k.topic,
    prePct: k.prePct,
    exitPct: k.exitPct,
    delta: k.exitPct - k.prePct,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge uplift — Pre vs Exit survey</CardTitle>
        <p className="text-xs text-text-muted mt-1">
          Share of participants reporting Medium-or-High familiarity with each topic{" "}
          <span className="font-semibold text-ink">before</span> and{" "}
          <span className="font-semibold text-ink">after</span> the program.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[340px]">
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{ top: 24, right: 24, left: 8, bottom: 24 }}
              barCategoryGap="22%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
              <XAxis
                dataKey="topic"
                tick={{ fontSize: 11, fill: REPORT_PALETTE.muted }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={64}
              />
              <YAxis
                tick={{ fontSize: 11, fill: REPORT_PALETTE.muted }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                formatter={(v: number) => `${v}%`}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar
                dataKey="prePct"
                name="Pre-Survey"
                fill={REPORT_PALETTE.slate}
                radius={[6, 6, 0, 0]}
                {...CHART_ANIMATION}
              >
                <LabelList
                  dataKey="prePct"
                  position="top"
                  fontSize={10}
                  fill={REPORT_PALETTE.muted}
                  formatter={(v: number) => `${v}%`}
                />
              </Bar>
              <Bar
                dataKey="exitPct"
                name="Exit Survey"
                fill={REPORT_PALETTE.green}
                radius={[6, 6, 0, 0]}
                {...CHART_ANIMATION}
                animationBegin={400}
              >
                <LabelList
                  dataKey="exitPct"
                  position="top"
                  fontSize={10}
                  fill={REPORT_PALETTE.green}
                  formatter={(v: number) => `${v}%`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
          {data.map(d => (
            <div
              key={d.topic}
              className="bg-surface-subtle border border-surface-border rounded-lg p-2.5"
            >
              <div className="text-[10px] uppercase tracking-wider text-text-muted leading-tight">
                {d.topic}
              </div>
              <div className="text-lg font-bold text-ink mt-0.5">
                +{d.delta}
                <span className="text-xs">pp</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
