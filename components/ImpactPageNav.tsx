"use client";
import { useEffect, useState } from "react";
import { Sparkles, Quote, FileSignature, type LucideIcon } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  accent: string;
}

const ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", hint: "Headline KPIs", icon: Sparkles, accent: "#1E4E8C" },
  { id: "voice", label: "Voice of the participants", hint: "Exit-survey insights", icon: Quote, accent: "#7C3AED" },
  { id: "outcomes", label: "Outcomes archive", hint: "Verified records & charts", icon: Sparkles, accent: "#F5B700" },
  { id: "partnerships", label: "Letters of Intent", hint: "Per-edition LOI tracker", icon: FileSignature, accent: "#0B7A4A" },
];

export function ImpactPageNav() {
  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sections = ITEMS
      .map(i => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the most-visible section that's currently in the viewport
        // (prefer the one closest to the top once 30% visible).
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.3, 0.6, 1] },
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  function jump(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(id);
    }
  }

  return (
    <nav
      aria-label="Impact page contents"
      className="sticky top-6 self-start"
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted mb-3 pl-3">
        On this page
      </div>
      <ul className="space-y-1">
        {ITEMS.map(it => {
          const isActive = active === it.id;
          const Icon = it.icon;
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => jump(it.id)}
                className={`group w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-all ${
                  isActive
                    ? "bg-white border border-surface-border shadow-card"
                    : "hover:bg-white/60"
                }`}
                style={isActive ? { borderLeftWidth: 3, borderLeftColor: it.accent } : undefined}
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                  style={{ backgroundColor: isActive ? `${it.accent}20` : "transparent" }}
                >
                  <Icon
                    size={16}
                    style={{ color: isActive ? it.accent : "#94A3B8" }}
                    className={isActive ? "" : "group-hover:text-ink"}
                  />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-[13.5px] font-semibold leading-tight ${
                      isActive ? "text-ink" : "text-text-secondary group-hover:text-ink"
                    }`}
                  >
                    {it.label}
                  </div>
                  {it.hint && (
                    <div className="text-[11.5px] text-text-muted mt-0.5">
                      {it.hint}
                    </div>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
