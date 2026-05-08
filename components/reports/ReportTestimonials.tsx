import type { ReportTestimonial } from "@/data/reports";
import { Quote } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface Props {
  testimonials: ReportTestimonial[];
}

export function ReportTestimonials({ testimonials }: Props) {
  if (!testimonials || testimonials.length === 0) {
    return (
      <div className="bg-white border border-dashed border-surface-border rounded-xl p-10 text-center">
        <Quote size={20} className="mx-auto text-text-muted mb-2" />
        <p className="text-sm text-text-muted">No testimonials extracted from the report yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {testimonials.map((t, i) => (
        <article
          key={`${t.name}-${i}`}
          className="relative bg-white rounded-2xl border border-surface-border p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all flex flex-col overflow-hidden"
        >
          {/* Editorial quote mark — large, soft */}
          <Quote
            size={48}
            strokeWidth={1.25}
            className="text-accent-blue/15 absolute -top-2 -right-2 pointer-events-none"
            aria-hidden
          />
          <span
            aria-hidden
            className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full bg-gradient-to-b from-accent-blue/60 to-accent-blue/0"
          />

          <p className="relative text-[14px] text-text-secondary leading-relaxed pl-2">
            &ldquo;{t.quote}&rdquo;
          </p>

          <div className="relative mt-5 pt-4 border-t border-surface-border pl-2">
            <div className="text-[14px] font-bold text-ink leading-tight">{t.name}</div>
            <div className="text-[11px] text-text-muted mt-0.5">{t.role}</div>
            {t.organization && (
              <div className="text-[11px] text-text-secondary mt-0.5">{t.organization}</div>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.country && (
                <Badge variant="outline" className="text-[10px]">
                  {t.country}
                </Badge>
              )}
              {t.theme && (
                <Badge variant="outline" className="text-[10px]">
                  {t.theme}
                </Badge>
              )}
              {t._sample && (
                <Badge variant="sample" className="text-[10px]">
                  Sample
                </Badge>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
