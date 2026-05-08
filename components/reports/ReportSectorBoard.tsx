"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LabelList, Cell,
} from "recharts";
import type { ReportSector } from "@/data/reports";
import { CHART_ANIMATION, SECTOR_COLORS, REPORT_PALETTE } from "./reportPalette";

interface Props {
  sectors: ReportSector[];
}

export function ReportSectorBoard({ sectors }: Props) {
  const data = sectors.map(s => ({
    name: s.name,
    sites: s.siteIds.length,
    color: SECTOR_COLORS[s.id] ?? REPORT_PALETTE.navy,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sector cards */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sectors.map(s => {
          const color = SECTOR_COLORS[s.id] ?? REPORT_PALETTE.navy;
          return (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-surface-border p-4 shadow-card hover:shadow-card-hover transition-shadow"
              style={{ borderTop: `3px solid ${color}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-bold text-ink leading-tight">{s.name}</div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {s.siteIds.length} sites
                </span>
              </div>
              <div className="mt-2 text-[11px] text-text-muted leading-relaxed">
                {s.siteIds.slice(0, 3).join(" · ")}
                {s.siteIds.length > 3 && ` +${s.siteIds.length - 3} more`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sites-per-sector bar */}
      <Card>
        <CardHeader>
          <CardTitle>Sites per sector</CardTitle>
          <p className="text-xs text-text-muted mt-1">Coverage across the program agenda.</p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
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
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10, fill: REPORT_PALETTE.muted }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                  formatter={(v: number) => [`${v} sites`, ""]}
                />
                <Bar dataKey="sites" radius={[0, 6, 6, 0]} {...CHART_ANIMATION}>
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                  <LabelList dataKey="sites" position="right" fontSize={11} fill={REPORT_PALETTE.ink} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
