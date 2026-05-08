"use client";
import type { AtlasSelection } from "@/types";

/**
 * Floating overlays on top of the map.
 *
 * The previous version had ~5 cards (Program-at-a-glance, country title
 * banner, country summary, country editions list, participant leaders)
 * that all duplicated information already shown in the right rail. They
 * cluttered the map without adding signal. The lean version keeps only
 * the colour legend — the one thing the right rail does NOT show — and
 * trusts the rail for everything else.
 */

interface Props {
  selection: AtlasSelection;
}

export function AtlasStatsOverlay({ selection }: Props) {
  // Legend is most valuable at the global / country zoom levels where
  // the user is still calibrating colour codes. Once they're inside a
  // city or site the rail's category icons are enough.
  if (selection.level !== "global" && selection.level !== "country") return null;
  return <Legend />;
}

function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-[450] pointer-events-none">
      <div className="bg-white/95 backdrop-blur-md border border-white/70 shadow-card rounded-2xl p-3 text-[11px] space-y-2 min-w-[210px]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Legend
        </div>
        <div className="space-y-1.5">
          <div className="text-[9.5px] font-semibold uppercase tracking-wider text-text-muted/70 pt-0.5">
            Countries
          </div>
          <LegendRow color="#8A97A8" label="Host country" />
          <LegendRow color="#D4DAE2" label="Delegate origin country" />
          <LegendRow color="#1E4E8C" label="Hover / selected" />
          <LegendRow color="#ECEFF4" label="No ACE presence" border />
        </div>
        <div className="space-y-1.5 pt-1.5 border-t border-surface-border">
          <div className="text-[9.5px] font-semibold uppercase tracking-wider text-text-muted/70 pt-0.5">
            Pins
          </div>
          <LegendRow color="#F97316" label="Host city / ACE edition" />
          <LegendRow color="#14B8A6" label="Visited site" />
          <LegendRow color="#0B1F3A" label="Selected site" />
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-text-secondary">
      <span
        className="w-3 h-3 rounded-sm"
        style={{
          backgroundColor: color,
          border: border ? "1px solid #C6D2E0" : "none",
          opacity: border ? 0.8 : 0.6,
        }}
      />
      {label}
    </div>
  );
}
