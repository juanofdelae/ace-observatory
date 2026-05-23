import { UserRole } from "@prisma/client";

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
  name?: string | null;
};

// Hardcoded user returned by the stubbed requireRole(). The ACE Bridge section
// runs without in-app authentication; createdBy / updatedBy / changedBy /
// assignedTo strings derived from this constant. To re-enable real sessions,
// restore the auth() call inside requireRole() below — see git history.
export const STUB_USER: AuthorizedUser = {
  id: "stub-testing-user",
  email: "testing@observatory.ace",
  name: "Testing",
  role: UserRole.ADMIN,
};

export async function requireRole(
  _allowed: ReadonlyArray<UserRole>,
): Promise<AuthorizedUser> {
  return STUB_USER;
}
