"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  ALERT_STATUS_LABELS,
  PHASE_LABELS,
} from "@/lib/admin/schemas/agreement";
import { cn } from "@/lib/utils";

import { submitTransition } from "../../_actions/form-actions";

type Phase = keyof typeof PHASE_LABELS;
type Alert = keyof typeof ALERT_STATUS_LABELS;

const selectClass =
  "border-surface-border bg-white text-ink h-10 w-full rounded-xl border px-3 text-sm";

/**
 * Single-button transition control. Opens a small inline panel where the
 * user picks a new phase OR a new alert status (or both), adds an optional
 * note, and applies. Result is appended to the agreement's StatusChange
 * audit log server-side.
 *
 * Backward phase transitions are allowed by the action only for ADMIN role
 * (enforced in lib/admin/actions/transitions.ts) — the UI offers all 4
 * phases and surfaces the server's error message if the user lacks rights.
 */
export function TransitionButton({
  agreementId,
  currentPhase,
  currentAlert,
}: {
  agreementId: string;
  currentPhase: Phase;
  currentAlert: Alert;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toPhase, setToPhase] = useState<string>("");
  const [toAlert, setToAlert] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-transition-root]")) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function apply() {
    if (!toPhase && !toAlert) {
      toast.error("Elegí una nueva fase o un nuevo estado.");
      return;
    }
    startTransition(async () => {
      const result = await submitTransition({
        agreementId,
        toPhase: toPhase || undefined,
        toAlertStatus: toAlert || undefined,
        note: note.trim() || undefined,
      });
      if (result.ok) {
        toast.success("Transición aplicada.");
        setOpen(false);
        setToPhase("");
        setToAlert("");
        setNote("");
        router.refresh();
      } else {
        toast.error(result.formError ?? "No se pudo aplicar la transición.");
      }
    });
  }

  return (
    <div className="relative" data-transition-root>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "border-border bg-surface text-text hover:bg-surface-canvas inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
        )}
      >
        Cambiar estado
        <ChevronDown className="size-3.5" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Cambiar estado del acuerdo"
          className="border-border bg-surface absolute right-0 top-full z-30 mt-1.5 w-80 rounded-xl border p-4 shadow-card"
        >
          <p className="text-text-subtle mb-3 text-[11px] font-medium tracking-widest uppercase">
            Aplicar transición
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-text mb-1.5 block text-xs font-medium">Nueva fase</label>
              <select
                value={toPhase}
                onChange={(e) => setToPhase(e.target.value)}
                className={selectClass}
              >
                <option value="">Mantener — {PHASE_LABELS[currentPhase]}</option>
                {(Object.entries(PHASE_LABELS) as Array<[Phase, string]>).map(([k, v]) => (
                  <option key={k} value={k} disabled={k === currentPhase}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-text mb-1.5 block text-xs font-medium">
                Nuevo estado de alerta
              </label>
              <select
                value={toAlert}
                onChange={(e) => setToAlert(e.target.value)}
                className={selectClass}
              >
                <option value="">Mantener — {ALERT_STATUS_LABELS[currentAlert]}</option>
                {(Object.entries(ALERT_STATUS_LABELS) as Array<[Alert, string]>).map(([k, v]) => (
                  <option key={k} value={k} disabled={k === currentAlert}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-text mb-1.5 block text-xs font-medium">
                Nota (opcional)
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contexto del cambio…"
                className="border-surface-border bg-white text-ink w-full rounded-xl border px-3 py-2 text-sm leading-relaxed"
              />
            </div>
          </div>

          <div className="border-border mt-4 flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-text-muted hover:text-text rounded-full px-3 py-1.5 text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={isPending}
              className="bg-ink hover:bg-ink-700 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
            >
              {isPending ? "Aplicando…" : "Aplicar"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
