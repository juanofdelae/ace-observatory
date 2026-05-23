"use client";

import { Archive, Eye, GitBranch, MoreHorizontal, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin-ui/dropdown-menu";

// Per-row "..." menu. View → detail page (works today). Editar / Cambiar
// fase / Archivar are disabled placeholders — those flows ship in a later
// commit once the edit form + transition action UIs land.
export function RowActions({ agreementId }: { agreementId: string }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="text-text-muted hover:bg-surface-canvas hover:text-text inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        aria-label="Acciones del acuerdo"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => router.push(`/admin/agreements/${agreementId}`)}>
          <Eye className="size-3.5" aria-hidden />
          Ver detalle
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Pencil className="size-3.5" aria-hidden />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <GitBranch className="size-3.5" aria-hidden />
          Cambiar fase
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled>
          <Archive className="size-3.5" aria-hidden />
          Archivar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
