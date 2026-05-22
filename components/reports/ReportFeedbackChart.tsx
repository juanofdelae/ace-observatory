"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import type { ReportFeedbackMetric } from "@/data/reports";
import { CHART_ANIMATION, REPORT_PALETTE } from "./reportPalette";
import { EmptyReportSection } from "./EmptyReportSection";
import { ThumbsUp } from "lucide-react";

const COLOR_SCALE = [
  REPORT_PALETTE.green,    // Significantly Above
  REPORT_PALETTE.turquoise, // Above
  REPORT_PALETTE.slate,    // In Line
  REPORT_PALETTE.amber,    // Below
  REPORT_PALETTE.orange,   // Significantly Below
];

const ACCENT_FOR_INDEX = [
  REPORT_PALETTE.green,
  REPORT_PALETTE.turquoise,
  REPORT_PALETTE.blueBright,
  REPORT_PALETTE.purple,
  REPORT_PALETTE.amber,
];

interface Props {
  feedback: ReportFeedbackMetric[];
}

export function ReportFeedbackChart({ feedback }: Props) {
  const visible = feedback.filter(f => f.pct > 0);

  if (!visible.length) {
    return (
      <EmptyReportSection
        title="Delegate feedback"
        icon={ThumbsUp}
        message="This Final Report does not publish quantitative delegate feedback. Sentiment is reflected qualitatively in the Testimonials section."
      />
    );
  }

  // Detect the 5-tier expectations scale ("significantly above / above /
  // in line / below / significantly below"). If absent, render the items
  // as a flat row of percentage cards instead of a donut.
  const isExpectationScale = visible.some(f =>
    /expectations|in line/i.test(f.label),
  );

  if (!isExpectationScale) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delegate feedback — headline ratings</CardTitle>
          <p className="text-xs text-text-muted mt-1">
            Top sentiment indicators reported by delegates on the exit survey.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((f, i) => {
              const accent = ACCENT_FOR_INDEX[i % ACCENT_FOR_INDEX.length];
              return (
                <div
                  key={f.label}
                  className="bg-white rounded-xl border border-surface-border p-5 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${accent}18` }}
                    >
                      <ThumbsUp size={20} style={{ color: accent }} />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-3xl font-bold leading-none tracking-tight tabular-nums"
                        style={{ color: accent }}
                      >
                        {f.pct}%
                      </div>
                      <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted leading-tight">
                        {f.label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  const aboveCombined =
    feedback
      .filter(f =>
        f.label.toLowerCase().includes("significantly above") ||
        (f.label.toLowerCase().includes("above") && !f.label.toLowerCase().includes("significantly below")),
      )
      .reduce((sum, f) => sum + f.pct, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Delegate feedback — overall expectation match</CardTitle>
          <p className="text-xs text-text-muted mt-1">
            How delegates rated the program against their expectations on the exit survey.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={visible}
                  dataKey="pct"
                  nameKey="label"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  {...CHART_ANIMATION}
                  label={(entry) => `${entry.pct}%`}
                >
                  {visible.map((_, i) => (
                    <Cell key={i} fill={COLOR_SCALE[i % COLOR_SCALE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                  formatter={(v: number) => [`${v}%`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] mt-1 justify-center">
            {visible.map((o, i) => (
              <span key={o.label} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: COLOR_SCALE[i % COLOR_SCALE.length] }}
                />
                <span className="text-text-secondary">{o.label}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card flex flex-col items-center justify-center text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{ backgroundColor: `${REPORT_PALETTE.green}18` }}
        >
          <ThumbsUp size={26} style={{ color: REPORT_PALETTE.green }} />
        </div>
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
          Above expectations
        </div>
        <div className="text-5xl font-bold text-ink mt-1 leading-none counter-up">
          {aboveCombined}%
        </div>
        <div className="text-xs text-text-secondary mt-2 max-w-sidebar-w leading-relaxed">
          combined share of delegates who rated the program above or significantly above their expectations.
        </div>
      </div>
    </div>
  );
}
