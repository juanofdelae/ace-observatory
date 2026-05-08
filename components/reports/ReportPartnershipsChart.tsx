"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LabelList, Cell,
} from "recharts";
import type { ReportPartnershipMetric } from "@/data/reports";
import { CHART_ANIMATION, REPORT_PALETTE } from "./reportPalette";
import { EmptyReportSection } from "./EmptyReportSection";
import { FileSignature, Handshake, GraduationCap } from "lucide-react";

interface Props {
  partnerships: ReportPartnershipMetric[];
  /** Optional Córdoba-style headline summary. When provided, the three
   *  summary cards (Total LOIs / Between delegates / With host academia)
   *  render above the bar chart. Pass these only for reports that publish
   *  the structured LOI breakdown — older Final Reports leave them blank
   *  and only the bar chart (or the empty state) renders. */
  loiSummary?: {
    total: number;
    betweenDelegates: number;
    withHostAcademic: number;
    /** Optional override for the academic-side card label. */
    withHostAcademicLabel?: string;
  };
}

const BAR_COLORS = [
  REPORT_PALETTE.navy,
  REPORT_PALETTE.blueBright,
  REPORT_PALETTE.turquoise,
  REPORT_PALETTE.green,
  REPORT_PALETTE.orange,
  REPORT_PALETTE.purple,
  REPORT_PALETTE.cyan,
];

export function ReportPartnershipsChart({ partnerships, loiSummary }: Props) {
  if (!partnerships.length && !loiSummary) {
    return (
      <EmptyReportSection
        title="New partnerships — by category"
        icon={Handshake}
        message="This Final Report does not break partnerships into named thematic categories. Named cross-country partnership leads are documented in the Collaboration Opportunities chapter."
      />
    );
  }

  const data = [...partnerships].sort((a, b) => b.count - a.count);
  const derivedTotal = data.reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-4">
      {loiSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SummaryCard
            icon={FileSignature}
            accent={REPORT_PALETTE.navy}
            label="Letters of intent"
            value={loiSummary.total}
            hint="Total signed during the program"
          />
          <SummaryCard
            icon={Handshake}
            accent={REPORT_PALETTE.turquoise}
            label="Between delegates"
            value={loiSummary.betweenDelegates}
          />
          <SummaryCard
            icon={GraduationCap}
            accent={REPORT_PALETTE.purple}
            label={loiSummary.withHostAcademicLabel ?? "With host academia"}
            value={loiSummary.withHostAcademic}
          />
        </div>
      )}

      {partnerships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Partnerships by category</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              Distribution of {loiSummary?.total ?? derivedTotal} documented
              partnerships by thematic focus.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]">
              <ResponsiveContainer>
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 8, right: 32, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: REPORT_PALETTE.muted }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tick={{ fontSize: 10, fill: REPORT_PALETTE.muted }}
                    axisLine={false}
                    tickLine={false}
                    width={240}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                    formatter={(v: number) => [`${v} partnerships`, ""]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} {...CHART_ANIMATION}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                    <LabelList dataKey="count" position="right" fontSize={11} fill={REPORT_PALETTE.ink} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  accent,
  label,
  value,
  hint,
}: {
  icon: typeof FileSignature;
  accent: string;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}18` }}
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
