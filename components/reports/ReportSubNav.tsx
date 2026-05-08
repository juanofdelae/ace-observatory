"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  id: string;
  label: string;
}

interface Props {
  items: SubNavItem[];
}

// Sticky in-page navigation that highlights the section currently in the
// viewport. We rely on IntersectionObserver — no scroll listener — so the
// behaviour is smooth on slow devices.
export function ReportSubNav({ items }: Props) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const elements = items
      .map(i => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        // Pick the entry closest to the top of the viewport that's intersecting.
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Report sections"
      // Sticky pill rail — full-bleed on the canvas with backdrop blur,
      // tucks under the AppShell utility bar (top-0 inside the page).
      className="sticky top-16 z-30 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-surface-canvas/85 backdrop-blur-md"
    >
      <div className="flex gap-1.5 overflow-x-auto thin-scroll bg-white/95 backdrop-blur-md border border-surface-border rounded-full p-1 shadow-soft">
        {items.map(it => (
          <a
            key={it.id}
            href={`#${it.id}`}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors",
              active === it.id
                ? "bg-ink text-white shadow-soft"
                : "text-text-secondary hover:text-ink hover:bg-surface-canvas",
            )}
          >
            {it.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
