import { UserRole } from "@prisma/client";

import { auth } from "@/lib/auth";

export const WRITE_ROLES = [UserRole.ADMIN, UserRole.EDITOR] as const;
export const ADMIN_ONLY = [UserRole.ADMIN] as const;
export const ALL_ROLES = [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER] as const;

export function canWrite(role: UserRole): boolean {
  return WRITE_ROLES.includes(role as (typeof WRITE_ROLES)[number]);
}

export function canAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export class UnauthorizedError extends Error {
  override readonly name = "UnauthorizedError";
  constructor(message = "Sesión expirada. Inicia sesión de nuevo.") {
    super(message);
  }
}

export class ForbiddenError extends Error {
  override readonly name = "ForbiddenError";
  constructor(message = "No tienes permiso para esta acción.") {
    super(message);
  }
}

export class ConflictError extends Error {
  override readonly name = "ConflictError";
  readonly field: string | undefined;
  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

export type AuthorizedUser = {
  id: string;
  role: UserRole;
  email: string;
};

/**
 * Resolve the current session and verify the user holds one of the allowed
 * roles. Throws `UnauthorizedError` / `ForbiddenError` so callers can map
 * them to structured action responses.
 */
export async function requireRole(
  allowed: ReadonlyArray<UserRole>,
): Promise<AuthorizedUser> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new UnauthorizedError();
  }
  if (!allowed.includes(session.user.role)) {
    throw new ForbiddenError();
  }
  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
  };
}
