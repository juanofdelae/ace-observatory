"use client";
import { SearchInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Bell, HelpCircle, Menu } from "lucide-react";

/**
 * Top utility bar — sits above the canvas, NOT spanning the sidebar.
 * Premium, tablet-style: rounded search field, profile pill, MVP ribbon.
 */
export function Header({ onOpenMobileNav }: { onOpenMobileNav?: () => void }) {
  return (
    <header className="sticky top-0 z-20 bg-surface-canvas/85 backdrop-blur-md border-b border-surface-border/60">
      <div className="flex items-center gap-3 h-16 px-4 md:px-8">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-2 text-ink rounded-lg hover:bg-white/60"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex-1 max-w-xl">
          <SearchInput
            placeholder="Search editions, participants, sites, outcomes…"
            className="hidden sm:block"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex sample-ribbon text-[10px] font-bold tracking-[0.14em] uppercase px-2.5 py-1.5 rounded-full">
            MVP · Preview
          </span>
          <Button variant="ghost" size="sm" aria-label="Help">
            <HelpCircle size={16} />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Notifications">
            <Bell size={16} />
          </Button>
          <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white border border-surface-border shadow-soft">
            <div className="w-7 h-7 rounded-full bg-ink text-white text-[11px] font-bold flex items-center justify-center">
              JF
            </div>
            <div className="hidden md:block leading-tight">
              <div className="text-[11px] font-semibold text-ink">Juan Fonseca</div>
              <div className="text-[9px] text-text-muted uppercase tracking-wider">Researcher</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
