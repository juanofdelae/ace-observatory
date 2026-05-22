import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  AuthorizedUser,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  WRITE_ROLES,
  requireRole,
} from "@/lib/admin/authz";

export type ActionSuccess<T> = { ok: true; data: T };
export type ActionFailure = {
  ok: false;
  fieldErrors?: Record<string, string>;
  formError?: string;
};
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export type ActionContext = AuthorizedUser;

type ActionHandler<I, O> = (input: I, ctx: ActionContext) => Promise<O>;

type DefineActionConfig<S extends z.ZodTypeAny, O> = {
  schema: S;
  handler: ActionHandler<z.infer<S>, O>;
  /**
   * Roles allowed to invoke this action. Defaults to ADMIN + EDITOR. Use
   * `ALL_ROLES` from authz for read-only actions (rare — most reads are
   * direct queries, not actions).
   */
  allowedRoles?: ReadonlyArray<UserRole>;
  /**
   * Paths to call `revalidatePath()` on after a successful run. Use absolute
   * paths (e.g. ["/institutions"]). Skipped on failure.
   */
  revalidate?: ReadonlyArray<string>;
  /**
   * Map field-level conflicts (`@unique` violations) to user-friendly errors
   * on a specific form field. Keyed by the Prisma constraint target column.
   */
  uniqueFields?: Record<string, { field: string; message: string }>;
};

/**
 * Build a Server Action that validates input, checks authorization, runs the
 * handler, and revalidates the affected routes. Known failure modes
 * (Zod issues, unique conflicts, FK violations, unauthorized, forbidden)
 * become structured `ActionFailure`; everything else re-throws so the route
 * `error.tsx` can show the global fallback.
 */
export function defineAction<S extends z.ZodTypeAny, O>(
  config: DefineActionConfig<S, O>,
): (input: unknown) => Promise<ActionResult<O>> {
  const allowed = config.allowedRoles ?? WRITE_ROLES;

  return async (raw: unknown): Promise<ActionResult<O>> => {
    let ctx: ActionContext;
    try {
      ctx = await requireRole(allowed);
    } catch (err) {
      if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
        return { ok: false, formError: err.message };
      }
      throw err;
    }

    const parsed = config.schema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, fieldErrors: flattenZodErrors(parsed.error) };
    }

    try {
      const data = await config.handler(parsed.data, ctx);
      if (config.revalidate) {
        for (const path of config.revalidate) revalidatePath(path);
      }
      return { ok: true, data };
    } catch (err) {
      return mapKnownError(err, config.uniqueFields);
    }
  };
}

function flattenZodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}

function mapKnownError(
  err: unknown,
  uniqueFields?: DefineActionConfig<z.ZodTypeAny, unknown>["uniqueFields"],
): ActionFailure {
  if (err instanceof ConflictError) {
    return err.field
      ? { ok: false, fieldErrors: { [err.field]: err.message } }
      : { ok: false, formError: err.message };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = extractTarget(err.meta?.target);
      const mapped = target && uniqueFields?.[target];
      if (mapped) {
        return { ok: false, fieldErrors: { [mapped.field]: mapped.message } };
      }
      return {
        ok: false,
        formError: target
          ? `Ya existe un registro con ese ${target}.`
          : "Ya existe un registro con esos datos.",
      };
    }
    if (err.code === "P2003") {
      return {
        ok: false,
        formError: "Referencia inválida: el registro vinculado no existe.",
      };
    }
    if (err.code === "P2025") {
      return { ok: false, formError: "El registro no existe o ya fue eliminado." };
    }
  }

  // Unknown errors propagate so the global error boundary catches them and
  // we get a real stack trace in dev / Sentry in prod.
  throw err;
}

function extractTarget(meta: unknown): string | undefined {
  if (Array.isArray(meta) && typeof meta[0] === "string") return meta[0];
  if (typeof meta === "string") return meta;
  return undefined;
}
