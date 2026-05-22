"use server";

import { z } from "zod";

import { signIn } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Correo no válido"),
  redirectTo: z.string().startsWith("/").optional(),
});

export async function requestMagicLink(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    redirectTo: formData.get("redirectTo") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await signIn("resend", {
      email: parsed.data.email,
      redirectTo: parsed.data.redirectTo ?? "/admin",
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    console.error("Magic link request failed", error);
    return {
      ok: false,
      message: "No pudimos enviar el enlace. Intenta de nuevo en unos minutos.",
    };
  }
}
