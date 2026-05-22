"use client";

import { ChevronDownIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

export type FilterDef = {
  key: "phase" | "alert" | "sector" | "edition";
  label: string;
  options: FilterOption[];
};

const KEY_LABELS: Record<FilterDef["key"], string> = {
  phase: "Fase",
  alert: "Alerta",
  sector: "Sector",
  edition: "Edición",
};

/**
 * Multi-select filter bar that serializes selections to the URL as
 * comma-separated values (?phase=SIGNED,CONTACTED&sector=INNOVATION).
 *
 * Each filter button opens a popover with checkboxes. Selections apply
 * immediately to the URL (server re-renders the table). A clear-all link
 * appears when any filter is active.
 *
 * The component reads its initial selection from useSearchParams so
 * deep-links + back/forward navigation work without manual state hydration.
 */
export function FilterBar({ filters }: { filters: FilterDef[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openKey, setOpenKey] = useState<FilterDef["key"] | null>(null);

  // Close popover on outside click + Escape.
  useEffect(() => {
    if (!openKey) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-filter-root]")) setOpenKey(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenKey(null);
    }
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [openKey]);

  function parseSelected(key: FilterDef["key"]): Set<string> {
    const raw = searchParams.get(key) ?? "";
    return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
  }

  function applySelection(key: FilterDef["key"], next: Set<string>) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.size === 0) {
      params.delete(key);
    } else {
      params.set(key, Array.from(next).join(","));
    }
    const qs = params.toString();
    router.push(qs ? `/admin/agreements?${qs}` : "/admin/agreements");
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    // Preserve `view` (tabs) but clear all filter keys.
    for (const key of Object.keys(KEY_LABELS) as Array<FilterDef["key"]>) {
      params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/agreements?${qs}` : "/admin/agreements");
  }

  const anyActive = filters.some((f) => parseSelected(f.key).size > 0);

  return (
    <div className="flex flex-wrap items-center gap-2" data-filter-root>
      {filters.map((filter) => {
        const selected = parseSelected(filter.key);
        const isOpen = openKey === filter.key;
        const count = selected.size;

        return (
          <div key={filter.key} className="relative">
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : filter.key)}
              className={cn(
                "border-border bg-surface text-text hover:bg-surface-canvas inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                count > 0 && "border-ink/30",
              )}
            >
              <span>{filter.label}</span>
              {count > 0 ? (
                <span className="bg-ink rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                  {count}
                </span>
              ) : null}
              <ChevronDownIcon className="size-3" aria-hidden />
            </button>

            {isOpen ? (
              <div
                role="dialog"
                aria-label={`Filtrar por ${filter.label}`}
                className="border-border bg-surface absolute left-0 top-full z-30 mt-1.5 w-56 rounded-xl border p-1.5 shadow-card"
              >
                <ul className="thin-scroll max-h-72 overflow-y-auto">
                  {filter.options.map((opt) => {
                    const isChecked = selected.has(opt.value);
                    return (
                      <li key={opt.value}>
                        <label className="hover:bg-surface-canvas flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs">
                          <input
                            type="checkbox"
                            className="accent-ink size-3.5"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = new Set(selected);
                              if (e.target.checked) next.add(opt.value);
                              else next.delete(opt.value);
                              applySelection(filter.key, next);
                            }}
                          />
                          <span className="text-text truncate">{opt.label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {count > 0 ? (
                  <button
                    type="button"
                    onClick={() => applySelection(filter.key, new Set())}
                    className="text-text-muted hover:text-text border-border mt-1 flex w-full items-center justify-center gap-1 border-t pt-1.5 pb-1 text-[11px]"
                  >
                    <XIcon className="size-3" />
                    Limpiar {filter.label.toLowerCase()}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      {anyActive ? (
        <button
          type="button"
          onClick={clearAll}
          className="text-text-muted hover:text-text ml-auto inline-flex h-9 items-center gap-1 text-xs underline-offset-2 hover:underline"
        >
          <XIcon className="size-3" />
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
