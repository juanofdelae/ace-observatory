"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { requestMagicLink } from "../_actions";

export function AuthCardForm({ redirectTo }: { redirectTo?: string }) {
  const [isPending, startTransition] = useTransition();

  async function action(formData: FormData) {
    startTransition(async () => {
      const result = await requestMagicLink(formData);
      if (result.ok) {
        toast.success("Revisa tu correo. Te enviamos un enlace de acceso.");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form action={action} className="space-y-4">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <div className="space-y-2">
        <label htmlFor="email" className="text-text-secondary text-sm font-medium">
          Correo institucional
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu.nombre@oas.org"
          disabled={isPending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando enlace…" : "Enviar enlace de acceso"}
      </Button>
      <p className="text-ink-muted pt-2 text-center text-xs">
        El enlace expira en 30 minutos. Solo personal autorizado de ACE / OAS.
      </p>
    </form>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Tu cuenta no tiene acceso a este sistema. Contacta al administrador.",
  Configuration: "Error de configuración. El equipo ya fue notificado.",
  Verification: "El enlace expiró o ya fue usado. Solicita uno nuevo.",
};

export function AuthCardError({ code }: { code: string }) {
  const message = ERROR_MESSAGES[code] ?? "Ocurrió un problema iniciando sesión.";
  return (
    <div className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>
  );
}
