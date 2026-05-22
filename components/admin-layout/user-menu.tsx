"use client";

import { LogOut, UserCircle } from "lucide-react";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin-ui/dropdown-menu";
import { signOutAction } from "@/lib/admin/auth-actions";

type UserMenuProps = {
  email: string;
  name?: string | null;
  role: string;
};

export function UserMenu({ email, name, role }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();
  const display = name?.trim() || email;
  const initials = display
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  function handleSignOut() {
    startTransition(() => {
      void signOutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
        <span className="bg-primary text-primary-foreground inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {initials || <UserCircle className="h-4 w-4" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-text block truncate text-sm font-medium">{display}</span>
          <span className="text-text-muted block truncate text-xs">{role.toLowerCase()}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-text-muted text-xs font-normal">Sesión iniciada como</span>
          <span className="text-text truncate text-sm font-medium">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={isPending} onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
