"use client";
import { useState } from "react";
import { Layers, ChevronDown, ChevronUp } from "lucide-react";
import { ATLAS_LAYERS, type LayerVisibility } from "./mapLayers";
import type { AtlasLayerId } from "./siteTypeConfig";

interface Props {
  visibility: LayerVisibility;
  onChange: (next: LayerVisibility) => void;
}

export function MapLayerControl({ visibility, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (id: AtlasLayerId) => {
    onChange({ ...visibility, [id]: !visibility[id] });
  };

  const onCount = ATLAS_LAYERS.filter(l => visibility[l.id]).length;

  return (
    <div className="bg-white/95 backdrop-blur-md border border-white/70 shadow-card rounded-2xl pointer-events-auto overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-ink hover:bg-surface-subtle"
        aria-expanded={open}
      >
        <Layers size={14} />
        <span>Layers</span>
        <span className="ml-1 text-[10px] font-normal text-text-muted">
          {onCount}/{ATLAS_LAYERS.length}
        </span>
        {open ? (
          <ChevronUp size={14} className="ml-auto text-text-muted" />
        ) : (
          <ChevronDown size={14} className="ml-auto text-text-muted" />
        )}
      </button>

      {open && (
        <div className="border-t border-surface-border max-h-[60vh] overflow-y-auto thin-scroll">
          {ATLAS_LAYERS.map(l => {
            const Icon = l.icon;
            const on = visibility[l.id];
            return (
              <label
                key={l.id}
                className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-surface-subtle cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(l.id)}
                  className="w-3.5 h-3.5 accent-ink"
                />
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: on ? `${l.color}20` : "transparent" }}
                >
                  <Icon size={12} color={on ? l.color : "#94A3B8"} />
                </span>
                <span className={on ? "text-ink" : "text-text-muted"}>{l.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
