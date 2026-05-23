"use server";

// Sign-out is a no-op in the stubbed-auth build. The user-menu still imports
// this action; we keep the export so client code compiles, but clicking
// "Cerrar sesión" does nothing user-visible — there is no session to clear.
export async function signOutAction(): Promise<void> {
  // no-op
}
