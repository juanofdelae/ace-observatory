import { cn } from "@/lib/utils";

type PhaseId = "SIGNED" | "CONTACTED" | "ACTIVE" | "RESULT";
const ORDER: PhaseId[] = ["SIGNED", "CONTACTED", "ACTIVE", "RESULT"];

const SHORT_LABEL: Record<PhaseId, string> = {
  SIGNED: "F",
  CONTACTED: "C",
  ACTIVE: "A",
  RESULT: "R",
};

/**
 * Compact 4-step progress indicator for table rows. Mimics the per-row
 * milestone strip in the Shipment design reference but scaled down to fit
 * comfortably in a single table cell (~110px wide, 16px tall).
 *
 * Past + current phases render filled; future phases stay outlined.
 * The connector line darkens up to the current index.
 */
export function InlineProgress({ phase }: { phase: PhaseId }) {
  const currentIdx = ORDER.indexOf(phase);

  return (
    <div
      className="relative inline-flex items-center justify-between gap-1"
      style={{ width: "110px" }}
      title={`Fase actual: ${phase}`}
    >
      {/* full grey track */}
      <span className="bg-border absolute left-2 right-2 top-1/2 h-px -translate-y-1/2" aria-hidden />
      {/* filled black portion up to currentIdx */}
      <span
        className="bg-ink absolute left-2 top-1/2 h-px -translate-y-1/2"
        style={{
          width: `calc((100% - 16px) * ${currentIdx / (ORDER.length - 1)})`,
        }}
        aria-hidden
      />
      {ORDER.map((p, i) => {
        const isReached = i <= currentIdx;
        return (
          <span
            key={p}
            className={cn(
              "relative z-10 flex size-4 items-center justify-center rounded-full text-[8px] font-semibold",
              isReached
                ? "border-ink bg-ink border text-white"
                : "border-border bg-surface text-text-subtle border",
            )}
            aria-label={p}
          >
            {SHORT_LABEL[p]}
          </span>
        );
      })}
    </div>
  );
}
