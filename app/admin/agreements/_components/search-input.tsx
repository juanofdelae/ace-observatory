"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  type AgreementFilters,
  serializeFilters,
} from "@/lib/admin/agreements/url-state";
import { cn } from "@/lib/utils";

// Debounced search input. Local state mirrors the input; after 250ms idle,
// the URL gets pushed and the server page re-queries. Resyncs when the
// filters.search prop changes externally (e.g. a tab/filter click).
export function SearchInput({
  filters,
  className,
}: {
  filters: AgreementFilters;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(filters.search);

  useEffect(() => {
    setValue(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (value === filters.search) return;
    const t = setTimeout(() => {
      const qs = serializeFilters({ ...filters, search: value });
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 250);
    return () => clearTimeout(t);
  }, [value, filters, pathname, router]);

  return (
    <label
      className={cn(
        "border-border bg-surface focus-within:border-primary flex h-9 items-center gap-2 rounded-md border px-2.5 transition-colors",
        className,
      )}
    >
      <Search className="text-text-subtle size-3.5" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar código, parte, sector, edición…"
        className="text-text placeholder:text-text-subtle min-w-[18rem] flex-1 bg-transparent text-[13px] outline-none"
      />
    </label>
  );
}
