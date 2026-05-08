"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import type { ReportCollaborationMetric } from "@/data/reports";
import { CHART_ANIMATION, REPORT_PALETTE } from "./reportPalette";
import { EmptyReportSection } from "./EmptyReportSection";
import { Network, MapPin, Users, type LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface Props {
  collaborations: ReportCollaborationMetric[];
}

const COLORS = [REPORT_PALETTE.navy, REPORT_PALETTE.turquoise, REPORT_PALETTE.blueBright, REPORT_PALETTE.purple];

const CARD_ACCENTS = [
  REPORT_PALETTE.blueBright,
  REPORT_PALETTE.navy,
  REPORT_PALETTE.turquoise,
  REPORT_PALETTE.purple,
  REPORT_PALETTE.green,
];

const CARD_ICONS: LucideIcon[] = [Network, MapPin, Users, Network];

/**
 * Label-agnostic collaborations renderer.
 *
 * Strategy:
 *  1. If the report ships a "total" item AND at least 2 non-total split
 *     items, render the rich donut + summary cards (Córdoba shape).
 *  2. Else render every collaboration item as a compare card row — works
 *     for reports that just ship "30+ collaboration opportunities" plus
 *     a couple of named subtotals (Chile, Ecuador, etc.).
 *  3. If the array is empty, show an editorial empty state.
 */
export function ReportCollaborationsChart({ collaborations }: Props) {
  if (!collaborations.length) {
    return (
      <EmptyReportSection
        title="New connections"
        icon={Network}
        message="This Final Report does not publish a structured connections breakdown. Named cross-country leads are described qualitatively in the report's Collaboration Opportunities chapter."
      />
    );
  }

  const totalItem = collaborations.find(c => /total/i.test(c.label));
  const splitItems = collaborations.filter(c => c !== totalItem);

  // Heuristic: render the rich donut layout only when we have a clear
  // "total" plus at least two distinct splits that sum into it.
  const splitsSum = splitItems.reduce((s, c) => s + c.count, 0);
  const isRichSplit =
    !!totalItem &&
    splitItems.length >= 2 &&
    splitsSum > 0 &&
    Math.abs(splitsSum - totalItem.count) <= 5; // tolerate rounding/labels

  if (isRichSplit && totalItem) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New connections — split</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              How {formatNumber(totalItem.count)} reported new connections were
              distributed across the documented categories.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={splitItems.map(s => ({ name: s.label, value: s.count }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={115}
                    paddingAngle={3}
                    {...CHART_ANIMATION}
                    label={(entry) => `${entry.value}`}
                  >
                    {splitItems.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                    formatter={(v: number) => [`${formatNumber(v)} connections`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] mt-1 justify-center">
              {splitItems.map((d, i) => (
                <span key={d.label} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-text-secondary">{d.label}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          <CompareCard
            icon={Network}
            accent={REPORT_PALETTE.blueBright}
            label={totalItem.label}
            value={totalItem.count}
          />
          {splitItems.slice(0, 2).map((c, i) => (
            <CompareCard
              key={c.label}
              icon={i === 0 ? MapPin : Users}
              accent={i === 0 ? REPORT_PALETTE.navy : REPORT_PALETTE.turquoise}
              label={c.label}
              value={c.count}
            />
          ))}
        </div>
      </div>
    );
  }

  // Flat layout: every collaboration item as its own card.
  return (
    <Card>
      <CardHeader>
        <CardTitle>New collaborations identified</CardTitle>
        <p className="text-xs text-text-muted mt-1">
          Connections and follow-up leads documented in the Final Report.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {collaborations.map((c, i) => (
            <CompareCard
              key={c.label}
              icon={CARD_ICONS[i % CARD_ICONS.length]}
              accent={CARD_ACCENTS[i % CARD_ACCENTS.length]}
              label={c.label}
              value={c.count}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CompareCard({
  icon: Icon,
  accent,
  label,
  value,
}: {
  icon: typeof Network;
  accent: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
            {label}
          </div>
          <div className="text-2xl font-bold text-ink leading-none mt-1 counter-up">
            {formatNumber(value)}
          </div>
        </div>
      </div>
    </div>
  );
}
