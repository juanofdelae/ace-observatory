import type { Outcome } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { sectors } from "@/data/sectors";
import { TrendingUp } from "lucide-react";
import { countryById } from "@/data/countries";

const categoryColor: Record<Outcome["category"], string> = {
  Partnership: "#2FB7B2",
  "Derived Project": "#2F80ED",
  "Success Story": "#F05A28",
  "Best Practice": "#6A4C93",
  "Follow-up": "#1E4E8C",
  Investment: "#F5B700",
  Policy: "#0B1F3A",
};

export function OutcomeCard({ o }: { o: Outcome }) {
  return (
    <div className="bg-white border border-surface-border rounded-xl p-4 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="sector" color={categoryColor[o.category]} className="text-[10px]">
          {o.category}
        </Badge>
        {o.impactMetric && (
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-text-muted">{o.impactMetric.label}</div>
            <div className="text-sm font-bold text-ink flex items-center gap-1 justify-end">
              <TrendingUp size={12} className="text-brand-turquoise" /> {o.impactMetric.value}
            </div>
          </div>
        )}
      </div>

      <h3 className="mt-3 font-semibold text-ink text-sm leading-snug">{o.title}</h3>
      <p className="mt-2 text-sm text-text-secondary line-clamp-3 leading-relaxed">
        {o.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {o.sectorIds.slice(0, 3).map((id) => {
          const s = sectors.find(x => x.id === id);
          return s ? (
            <Badge key={id} variant="outline" className="text-[10px]">
              {s.name}
            </Badge>
          ) : null;
        })}
      </div>

      {o.countryIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-surface-border text-[11px] text-text-muted">
          {o.countryIds.map(id => countryById(id)?.isoCode).filter(Boolean).join(" · ")}
        </div>
      )}
    </div>
  );
}
