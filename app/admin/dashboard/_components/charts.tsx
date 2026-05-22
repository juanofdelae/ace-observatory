"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PHASE_COLORS: Record<string, string> = {
  SIGNED: "#0b1f3a",
  CONTACTED: "#2563eb",
  ACTIVE: "#16a34a",
  RESULT: "#f97316",
};

const PHASE_LABELS: Record<string, string> = {
  SIGNED: "Firmado",
  CONTACTED: "Contactado",
  ACTIVE: "Activo",
  RESULT: "Resultado",
};

const TOOLTIP_STYLE = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "8px 12px",
  fontSize: "12px",
  boxShadow: "0 6px 20px -8px rgba(11, 31, 58, 0.12)",
};

export function PhaseDonut({
  data,
}: {
  data: Array<{ phase: string; count: number }>;
}) {
  const formatted = data.map((d) => ({
    name: PHASE_LABELS[d.phase] ?? d.phase,
    value: d.count,
    color: PHASE_COLORS[d.phase] ?? "#94a3b8",
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={formatted}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          stroke="#ffffff"
          strokeWidth={2}
        >
          {formatted.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={false} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function EditionsBar({
  data,
}: {
  data: Array<{ editionLabel: string; year: number; count: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid stroke="#eef1f5" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="editionLabel"
          tick={{ fontSize: 10, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          angle={-25}
          textAnchor="end"
          height={70}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f4f5f7" }} />
        <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SectorBar({
  data,
}: {
  data: Array<{ sector: string; count: number }>;
}) {
  // Top 8 by count, label tidied for the X axis.
  const trimmed = data.slice(0, 8).map((d) => ({
    name: d.sector.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    value: d.count,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={trimmed}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 24, bottom: 8 }}
      >
        <CartesianGrid stroke="#eef1f5" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#334155" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          width={120}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f4f5f7" }} />
        <Bar dataKey="value" fill="#16a34a" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SignedPerMonthLine({
  data,
}: {
  data: Array<{ month: string; count: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid stroke="#eef1f5" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          allowDecimals={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#e2e8f0" }} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#0b1f3a"
          strokeWidth={2}
          dot={{ r: 3, fill: "#0b1f3a" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PhaseLegend({
  data,
}: {
  data: Array<{ phase: string; count: number }>;
}) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs">
      {data.map((p) => (
        <li key={p.phase} className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: PHASE_COLORS[p.phase] ?? "#94a3b8" }}
          />
          <span className="text-text-muted truncate">{PHASE_LABELS[p.phase] ?? p.phase}</span>
          <span className="text-text ml-auto font-medium tabular-nums">{p.count}</span>
        </li>
      ))}
    </ul>
  );
}
