"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { labelForSegment } from "@/lib/admin/nav";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {segments.map((segment, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const isLast = idx === segments.length - 1;
        const label = labelForSegment(segment);
        return (
          <Fragment key={href}>
            {idx > 0 ? <ChevronRight className="text-text-subtle h-3.5 w-3.5" aria-hidden /> : null}
            {isLast ? (
              <span className="text-text font-medium" aria-current="page">
                {label}
              </span>
            ) : (
              <Link href={href} className="text-text-muted hover:text-text transition-colors">
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
