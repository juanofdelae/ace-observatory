import type { AlertStatus } from "@prisma/client";

import { ALERT_STATUS_LABELS } from "@/lib/admin/schemas/agreement";
import { cn } from "@/lib/utils";

const DOT: Record<AlertStatus, string> = {
  ACTIVE: "bg-state-active",
  NEEDS_ATTENTION: "bg-state-warning",
  CLOSED: "bg-state-closed",
};

export function AlertPill({ status }: { status: AlertStatus }) {
  return (
    <span className="border-border text-text inline-flex items-center gap-1.5 rounded-full border bg-transparent px-2.5 py-1 text-xs font-medium">
      <span className={cn("size-1.5 rounded-full", DOT[status])} aria-hidden />
      {ALERT_STATUS_LABELS[status]}
    </span>
  );
}
