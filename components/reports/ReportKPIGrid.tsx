import { cn, formatNumber } from "@/lib/utils";
import type { ReportKPI } from "@/data/reports";
import {
  Users,
  Globe2,
  Landmark,
  Eye,
  MapPin,
  Network,
  Handshake,
  FileSignature,
  Newspaper,
  Radio,
  Linkedin,
  Instagram,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Map a KPI label to a contextual icon. Falls back to Sparkles so the grid
// stays visually consistent even when a new KPI ships before the icon table
// is updated.
function iconFor(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("delegate")) return Users;
  if (l.includes("countries")) return Globe2;
  if (l.includes("oas")) return Landmark;
  if (l.includes("observer")) return Eye;
  if (l.includes("site")) return MapPin;
  if (l.includes("connection")) return Network;
  if (l.includes("córdoba") || l.includes("cordoba")) return MapPin;
  if (l.includes("delegation")) return Handshake;
  if (l.includes("letter") || l.includes("intent")) return FileSignature;
  if (l.includes("article")) return Newspaper;
  if (l.includes("outlet")) return Radio;
  if (l.includes("linkedin")) return Linkedin;
  if (l.includes("instagram")) return Instagram;
  return Sparkles;
}

// Accent palette aligned with the Overview KPICard tokens. Each row gives
// the icon chip background + foreground + the hairline accent stripe shown
// at the top-left corner of the card.
const ACCENTS: { bg: string; fg: string; stripe: string }[] = [
  { bg: "bg-accent-blue/10",        fg: "text-accent-blue",        stripe: "bg-accent-blue"        },
  { bg: "bg-accent-teal-soft/10",   fg: "text-accent-teal-soft",   stripe: "bg-accent-teal-soft"   },
  { bg: "bg-accent-orange-cta/10",  fg: "text-accent-orange-cta",  stripe: "bg-accent-orange-cta"  },
  { bg: "bg-accent-purple-soft/10", fg: "text-accent-purple-soft", stripe: "bg-accent-purple-soft" },
  { bg: "bg-ink/8",                 fg: "text-ink",                stripe: "bg-ink"                },
];

export function ReportKPIGrid({ kpis, className }: { kpis: ReportKPI[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4",
        className,
      )}
    >
      {kpis.map((k, i) => {
        const Icon = iconFor(k.label);
        const a = ACCENTS[i % ACCENTS.length];
        return (
          <div
            key={`${k.label}-${i}`}
            className="relative bg-white rounded-2xl border border-surface-border p-5 md:p-6 shadow-card hover:shadow-card-hover hover:translate-y-[-2px] transition-all overflow-hidden"
          >
            {/* Accent stripe — top-left corner */}
            <span
              aria-hidden
              className={cn("absolute left-0 top-0 h-1 w-12 rounded-br-xl", a.stripe)}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted leading-snug">
                {k.label}
              </div>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", a.bg)}>
                <Icon size={16} className={a.fg} />
              </div>
            </div>
            <div
              className="mt-5 text-kpi font-bold text-ink tracking-tight counter-up leading-none tabular-nums"
              style={{ fontFeatureSettings: '"tnum", "ss01"' }}
            >
              {typeof k.value === "number" ? formatNumber(k.value) : k.value}
            </div>
            {k.hint && <div className="mt-2 text-[11.5px] text-text-secondary leading-relaxed">{k.hint}</div>}
          </div>
        );
      })}
    </div>
  );
}
