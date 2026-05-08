import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { ReportHostSite, ReportSector } from "@/data/reports";
import { Building2, GraduationCap, Lightbulb, FlaskConical, Factory } from "lucide-react";
import { SECTOR_COLORS, REPORT_PALETTE } from "./reportPalette";

// Lightweight category mapper. We don't try to import the institutional
// type system here because the report data carries free-form site names —
// the icon rule is intentionally heuristic and visual only.
function siteIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("universidad") || n.includes("university")) return GraduationCap;
  if (n.includes("club") || n.includes("study")) return Lightbulb;
  if (n.includes("bio") || n.includes("promedon")) return FlaskConical;
  if (
    n.includes("stellantis") ||
    n.includes("akron") ||
    n.includes("arcor") ||
    n.includes("agd") ||
    n.includes("prodeman") ||
    n.includes("helacor") ||
    n.includes("tonadita")
  )
    return Factory;
  return Building2;
}

interface Props {
  sectors: ReportSector[];
  hostSites: ReportHostSite[];
}

export function ReportHostSitesGrid({ sectors, hostSites }: Props) {
  const grouped = sectors.map(s => ({
    sector: s,
    sites: hostSites.filter(h => h.sectorId === s.id),
  }));

  return (
    <div className="space-y-4">
      {grouped.map(({ sector, sites }) => {
        const color = SECTOR_COLORS[sector.id] ?? REPORT_PALETTE.navy;
        return (
          <Card key={sector.id} className="overflow-hidden">
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ backgroundColor: `${color}10`, borderBottom: `1px solid ${color}33` }}
            >
              <div className="text-sm font-bold" style={{ color }}>
                {sector.name}
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {sites.length} hosts
              </span>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                {sites.map((s, i) => {
                  const Icon = siteIcon(s.name);
                  return (
                    <div
                      key={`${s.name}-${i}`}
                      className="flex items-start gap-2.5 p-3 rounded-lg border border-surface-border hover:border-ink/20 hover:bg-surface-subtle transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <Icon size={15} style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-ink leading-tight">{s.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {sites.length === 0 && (
                <div className="text-xs text-text-muted py-3">No host sites recorded.</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Keep the placeholder Card import balanced (not strictly required, but
// Cards already include header/title — exported here in case a host-site
// section needs a header with a title elsewhere).
export { CardHeader, CardTitle };
