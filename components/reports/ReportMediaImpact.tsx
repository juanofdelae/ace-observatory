import type { ReportMediaMetric } from "@/data/reports";
import { Newspaper, Radio, Linkedin, Instagram, Sparkles, type LucideIcon } from "lucide-react";
import { REPORT_PALETTE } from "./reportPalette";
import { formatNumber } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  newspaper: Newspaper,
  radio: Radio,
  linkedin: Linkedin,
  instagram: Instagram,
};

const ACCENT_BY_LABEL: { match: string; color: string }[] = [
  { match: "linkedin", color: "#0A66C2" },
  { match: "instagram", color: "#C13584" },
  { match: "article", color: REPORT_PALETTE.navy },
  { match: "outlet", color: REPORT_PALETTE.orange },
];

function accentFor(label: string): string {
  const l = label.toLowerCase();
  for (const a of ACCENT_BY_LABEL) {
    if (l.includes(a.match)) return a.color;
  }
  return REPORT_PALETTE.blueBright;
}

function formatMetric(value: string | number): string {
  return typeof value === "number" ? formatNumber(value) : value;
}

export function ReportMediaImpact({ metrics }: { metrics: ReportMediaMetric[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {metrics.map(m => {
        const Icon: LucideIcon = (m.icon && ICON_MAP[m.icon]) || Sparkles;
        const accent = accentFor(m.label);
        return (
          <div
            key={m.label}
            className="bg-white rounded-xl border border-surface-border p-5 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-text-muted font-semibold leading-snug">
                {m.label}
              </div>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${accent}18` }}
              >
                <Icon size={16} style={{ color: accent }} />
              </div>
            </div>
            <div className="mt-3 text-[28px] font-bold text-ink leading-none counter-up tracking-tight">
              {formatMetric(m.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
