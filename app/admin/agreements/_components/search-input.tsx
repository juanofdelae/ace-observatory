"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Debounced search box that writes the `q` query param. Searches across
 * code, subject, delegate, and party names (server-side, see
 * listAgreements). Empty input clears the param entirely.
 */
export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initial);

  // Keep local state in sync if the user navigates back/forward.
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Debounce URL writes by 250ms so each keystroke doesn't trigger a
  // server round-trip.
  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) {
        if (params.get("q") === trimmed) return;
        params.set("q", trimmed);
      } else {
        if (!params.has("q")) return;
        params.delete("q");
      }
      const qs = params.toString();
      router.push(qs ? `/admin/agreements?${qs}` : "/admin/agreements");
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative flex-1 max-w-sm">
      <Search
        className="text-text-subtle absolute left-3 top-1/2 size-3.5 -translate-y-1/2"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por código, parte, asunto…"
        className="border-border bg-surface text-text placeholder:text-text-subtle focus:border-ink/40 focus:ring-ink/15 h-9 w-full rounded-full border pl-8 pr-8 text-xs outline-none focus:ring-2"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          className="text-text-subtle hover:text-text absolute right-2 top-1/2 -translate-y-1/2"
          aria-label="Limpiar búsqueda"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
