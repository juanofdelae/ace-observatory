"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Calendar,
  Map as MapIcon,
  Users,
  Building2,
  Sparkles,
  GalleryHorizontalEnd,
  Share2,
  FileText,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/asset-path";
import { useEffect } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// Grouped nav — Explore / Library / Network. The grouping is purely for
// scannability; routes themselves are unchanged.
const navGroups: NavGroup[] = [
  {
    id: "explore",
    label: "Explore",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/map", label: "ACE Atlas", icon: MapIcon },
    ],
  },
  {
    id: "library",
    label: "Library",
    items: [
      { href: "/editions", label: "Editions", icon: Calendar },
      { href: "/reports", label: "Reports", icon: FileText },
      { href: "/sites", label: "Sites", icon: Building2 },
      { href: "/media", label: "Media Gallery", icon: GalleryHorizontalEnd },
    ],
  },
  {
    id: "network",
    label: "Network",
    items: [
      { href: "/participants", label: "Delegates", icon: Users },
      { href: "/impact", label: "Impact & Outcomes", icon: Sparkles },
      { href: "/network", label: "ACE Network", icon: Share2 },
    ],
  },
];

interface SidebarProps {
  /** When true, the sidebar renders as a mobile drawer overlay (mobile only). */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Floating dark pill sidebar — premium tablet-style observatory.
 * Anchored left with vertical margin, deep navy background, white labels,
 * orange accent for the active item.
 */
export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (mobileOpen) onCloseMobile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="lg:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          // Desktop: floating pill anchored left, with generous breathing
          // room top, bottom, and from the canvas edge.
          "lg:fixed lg:left-6 lg:top-4 lg:bottom-4 lg:w-sidebar-w lg:translate-x-0 lg:z-30",
          // Mobile: full-height drawer that slides in from left.
          "fixed top-0 bottom-0 left-0 z-50 w-64 lg:rounded-3xl",
          "flex flex-col transition-transform duration-200",
          "bg-sidebar-bg text-white",
          "shadow-sidebar lg:border lg:border-sidebar-border",
          // Subtle top inner highlight gives the pill a tiny bit of depth.
          "lg:before:absolute lg:before:inset-x-0 lg:before:top-0 lg:before:h-px lg:before:rounded-t-3xl lg:before:bg-white/10",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand — bare logo (no container box), product name centered below */}
        <div className="relative px-5 pt-5 pb-4">
          <Link
            href="/"
            className="flex flex-col items-center gap-3"
            onClick={onCloseMobile}
          >
            <Image
              src={asset("/logos/ace-logo.png")}
              alt="ACE logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
            <div className="text-center leading-tight">
              <div className="text-[16px] font-bold text-white tracking-tight">ACE Observatory</div>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onCloseMobile}
            className="lg:hidden absolute top-5 right-5 text-sidebar-idle p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hairline divider under the brand */}
        <div className="mx-5 h-px bg-white/8" />

        <nav
          aria-label="Primary navigation"
          className="flex-1 px-3 pt-4 pb-3 space-y-5 overflow-y-auto thin-scroll-dark"
        >
          {navGroups.map((group, gi) => (
            <div key={group.id}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-idle/70">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active =
                    href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onCloseMobile}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors",
                        active
                          ? "bg-white text-ink shadow-soft"
                          : "text-sidebar-idle hover:text-white hover:bg-sidebar-hover",
                      )}
                    >
                      {/* Active accent — orange bar indicator on the left */}
                      {active && (
                        <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-accent" />
                      )}
                      <Icon
                        size={17}
                        strokeWidth={1.75}
                        className={cn(
                          active ? "text-ink" : "text-sidebar-idle group-hover:text-white",
                        )}
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
              {/* Hairline between groups (not after the last one) */}
              {gi < navGroups.length - 1 && (
                <div className="mt-4 mx-3 h-px bg-white/6" />
              )}
            </div>
          ))}
        </nav>

        {/* Footer block — last update timestamp.
            Bump this constant when a meaningful data ingest or content
            refresh ships. It surfaces the institutional freshness signal
            without depending on git/build metadata at runtime. */}
        <div className="px-5 py-4 border-t border-white/8">
          <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-sidebar-idle">
            Last updated
          </div>
          <div className="mt-1 text-[13px] font-bold text-white tracking-tight">
            May 8, 2026
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sidebar-accent" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-sidebar-idle">
              v0.1 · MVP
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
