"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { asset } from "@/lib/asset-path";

/**
 * AppShell — premium iPad-style intelligence workspace.
 *
 * Layout intent:
 * - The whole app sits on a soft canvas (`surface-canvas`).
 * - A floating dark sidebar pill (220px wide on desktop) is anchored
 *   left with generous outer breathing room (`lg:left-6`, `lg:my-4`).
 * - The main column offsets by 260px on desktop (220 sidebar + 40 gap).
 * - On mobile the sidebar collapses to a slide-in drawer; a small
 *   floating menu button replaces the old top-bar trigger.
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-surface-canvas">
      {/* Soft ambient gradient — gives the canvas a hint of depth without
          competing with the panels above it. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(1100px 600px at 18% 10%, rgba(37, 99, 235, 0.05) 0%, transparent 60%), radial-gradient(900px 500px at 92% 90%, rgba(20, 184, 166, 0.04) 0%, transparent 60%)",
        }}
      />

      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Mobile-only top bar with the ACE brand and the menu trigger.
          Desktop has the sidebar always visible so this stays hidden
          on `lg:` and up. */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-3 py-2 bg-white/90 backdrop-blur border-b border-surface-border">
        <Link
          href="/"
          aria-label="ACE Observatory home"
          className="flex items-center gap-2 min-w-0"
        >
          <Image
            src={asset("/logos/ace-logo.png")}
            alt="ACE"
            width={28}
            height={28}
            className="object-contain shrink-0"
            priority
          />
          <span className="text-[14px] font-bold text-ink tracking-tight truncate">
            ACE Observatory
          </span>
        </Link>
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
          className="w-10 h-10 rounded-xl border border-surface-border bg-white flex items-center justify-center text-ink shrink-0"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Main column — offset to make room for the floating sidebar
          (220px pill + 24px left + ~16px gap = 260px). */}
      <div className="relative z-10 flex flex-col min-h-screen lg:pl-sidebar-offset">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
