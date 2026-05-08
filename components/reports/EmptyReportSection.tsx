import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Info, type LucideIcon } from "lucide-react";

/**
 * Institutional empty-state for report sections that don't apply to a
 * given edition (e.g. older reports without a pre/exit survey, or reports
 * that don't break partnerships into named categories).
 *
 * Tone is editorial, not "no data available" — the message acknowledges
 * the gap on behalf of the source document. Used across all four chart
 * components to keep the empty rhythm consistent.
 */

interface Props {
  title: string;
  message: string;
  icon?: LucideIcon;
}

export function EmptyReportSection({ title, message, icon: Icon = Info }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 rounded-2xl border border-dashed border-surface-border bg-surface-subtle/40 px-5 py-6">
          <div className="w-10 h-10 rounded-xl bg-white border border-surface-border flex items-center justify-center shrink-0">
            <Icon size={18} strokeWidth={1.75} className="text-text-muted" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted mb-1">
              Not reported
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
