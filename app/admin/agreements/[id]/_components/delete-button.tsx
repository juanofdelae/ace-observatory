"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { submitDelete } from "../../_actions/form-actions";

/**
 * Soft-delete control with two-step confirmation. First click flips the
 * button into a "¿Confirmar?" state; second click within ~5s triggers the
 * action. Avoids the need for a full modal for what is, in practice, an
 * already-reversible operation (deletedAt timestamp).
 */
export function DeleteButton({ agreementId }: { agreementId: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function arm() {
    setArmed(true);
    setTimeout(() => setArmed(false), 5000);
  }

  function confirm() {
    startTransition(async () => {
      const result = await submitDelete(agreementId);
      if (result.ok) {
        toast.success("Acuerdo archivado.");
        router.push("/admin/agreements");
        router.refresh();
      } else {
        toast.error(result.formError ?? "No se pudo archivar el acuerdo.");
        setArmed(false);
      }
    });
  }

  if (!armed) {
    return (
      <button
        type="button"
        onClick={arm}
        className="text-text-muted hover:text-state-blocked inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-xs transition-colors"
      >
        <Trash2 className="size-3.5" />
        Archivar
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={confirm}
      disabled={isPending}
      className="bg-state-blocked text-white hover:bg-state-blocked/90 inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors disabled:opacity-50"
    >
      <Trash2 className="size-3.5" />
      {isPending ? "Archivando…" : "¿Confirmar?"}
    </button>
  );
}
