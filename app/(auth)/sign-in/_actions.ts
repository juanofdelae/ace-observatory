"use server";

import { z } from "zod";

import { signIn } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Correo no válido"),
  redirectTo: z.string().startsWith("/").optional(),
});

export async function requestMagicLink(
  formData: FormData,
): Promise<{ ok: true; email: string; from?: string } | { ok: false; message: string }> {
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
      redirectTo: parsed.data.redirectTo ?? "/admin/dashboard",
      redirect: false,
    });
    return { ok: true, email: parsed.data.email, from: parsed.data.redirectTo };
  } catch (error) {
    console.error("OTP request failed", error);
    return {
      ok: false,
      message: "No pudimos enviar el código. Intenta de nuevo en unos minutos.",
    };
  }
}
