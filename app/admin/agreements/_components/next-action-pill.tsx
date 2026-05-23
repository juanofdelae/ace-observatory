import type { NextActionTone } from "@/lib/admin/derive/next-action";
import { cn } from "@/lib/utils";

const TONE_CLS: Record<NextActionTone, string> = {
  urgent: "bg-state-warning/15 text-state-warning",
  warning: "bg-state-warning/10 text-state-warning",
  neutral: "bg-surface-canvas text-text-muted",
  success: "bg-state-active/15 text-state-active",
  muted: "bg-surface-canvas text-text-subtle",
};

export function NextActionPill({
  tone,
  label,
}: {
  tone: NextActionTone;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONE_CLS[tone],
      )}
    >
      {label}
    </span>
  );
}
