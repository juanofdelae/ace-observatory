"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Breadcrumbs } from "@/components/admin-layout/breadcrumbs";
import { SidebarNav } from "@/components/admin-layout/sidebar-nav";
import { Button } from "@/components/admin-ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/admin-ui/sheet";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-surface border-border sticky top-0 z-10 flex h-16 items-center gap-4 border-b px-6 md:px-10">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir navegación"
            />
          }
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-border border-b">
            <SheetTitle className="text-left text-sm font-semibold">ACE Bridge</SheetTitle>
          </SheetHeader>
          <div className="p-3">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
    </header>
  );
}
