"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Globe2,
  MapPin,
  Building2,
  Calendar,
  Users,
} from "lucide-react";
import type { AtlasSelection } from "@/types";
import { countries } from "@/data/countries";
import { cities } from "@/data/cities";
import { editions } from "@/data/editions";
import { editionRegion } from "@/lib/utils";
import { visitedSites } from "@/data/visited-sites";
import { participants } from "@/data/participants";

// Strip diacritics + lowercase so "cordoba" matches "Córdoba" etc.
function norm(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

type ResultGroup =
  | { kind: "country"; id: string; label: string; sub: string }
  | { kind: "edition"; id: string; label: string; sub: string; countryId: string }
  | { kind: "city"; id: string; label: string; sub: string; countryId: string; stateId?: string }
  | { kind: "site"; id: string; label: string; sub: string; cityId: string; countryId: string; stateId?: string }
  | { kind: "participant"; id: string; label: string; sub: string; editionIds: string[]; countryId: string };

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (s: AtlasSelection) => void;
}

const MAX_PER_GROUP = 6;

/**
 * Universal search modal for the Atlas. Hits Cmd/Ctrl+K to toggle.
 *
 * Searches across countries, editions, cities, sites and participants
 * with diacritic-insensitive matching, then jumps the map to the chosen
 * record via the same `onNavigate` channel the rest of the Atlas uses.
 */
export function AtlasSearch({ open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input whenever the modal opens; reset query on close.
  useEffect(() => {
    if (open) {
      // microtask delay so the input is in the DOM before we focus
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ---- Compute results ------------------------------------------------
  const results = useMemo(() => {
    const q = norm(query.trim());
    if (!q || q.length < 2) {
      return {
        countries: [] as ResultGroup[],
        editions: [] as ResultGroup[],
        cities: [] as ResultGroup[],
        sites: [] as ResultGroup[],
        participants: [] as ResultGroup[],
      };
    }
    const matches = (s: string) => norm(s).includes(q);

    const countryMatches: ResultGroup[] = countries
      .filter(c => matches(c.name) || matches(c.isoCode))
      .slice(0, MAX_PER_GROUP)
      .map(c => ({ kind: "country", id: c.id, label: c.name, sub: c.region ?? c.isoCode }));

    const editionMatches: ResultGroup[] = editions
      .filter(e => matches(e.name) || matches(`ace ${e.number}`) || matches(`ace${e.number}`))
      .slice(0, MAX_PER_GROUP)
      .map(e => ({
        kind: "edition",
        id: e.id,
        label: `ACE ${e.number} — ${editionRegion(e)}`,
        sub: new Date(e.startDate).getFullYear().toString(),
        countryId: e.countryId,
      }));

    const cityMatches: ResultGroup[] = cities
      .filter(c => matches(c.name))
      .slice(0, MAX_PER_GROUP)
      .map(c => ({
        kind: "city",
        id: c.id,
        label: c.name,
        sub: countries.find(co => co.id === c.countryId)?.name ?? c.countryId.toUpperCase(),
        countryId: c.countryId,
        stateId: c.stateId,
      }));

    const siteMatches: ResultGroup[] = visitedSites
      .filter(s => matches(s.name))
      .slice(0, MAX_PER_GROUP)
      .map(s => ({
        kind: "site",
        id: s.id,
        label: s.name,
        sub: `${s.type}`,
        cityId: s.cityId,
        countryId: s.countryId,
        stateId: s.stateId,
      }));

    const participantMatches: ResultGroup[] = participants
      .filter(p => matches(p.name) || matches(p.organization || "") || matches(p.role || ""))
      .slice(0, MAX_PER_GROUP)
      .map(p => ({
        kind: "participant",
        id: p.id,
        label: p.name,
        sub: p.organization || p.role || "",
        editionIds: p.editionIds,
        countryId: p.countryId,
      }));

    return {
      countries: countryMatches,
      editions: editionMatches,
      cities: cityMatches,
      sites: siteMatches,
      participants: participantMatches,
    };
  }, [query]);

  const totalResults =
    results.countries.length +
    results.editions.length +
    results.cities.length +
    results.sites.length +
    results.participants.length;

  // ---- Navigation helper ----------------------------------------------
  const handlePick = (r: ResultGroup) => {
    if (r.kind === "country") {
      onNavigate({ level: "country", countryId: r.id });
    } else if (r.kind === "edition") {
      onNavigate({ level: "edition", countryId: r.countryId, editionId: r.id });
    } else if (r.kind === "city") {
      onNavigate({ level: "city", countryId: r.countryId, stateId: r.stateId, cityId: r.id });
    } else if (r.kind === "site") {
      onNavigate({
        level: "site",
        countryId: r.countryId,
        stateId: r.stateId,
        cityId: r.cityId,
        siteId: r.id,
      });
    } else if (r.kind === "participant") {
      // Participants don't have a place on the Atlas surface — open the
      // Network view filtered to them in a new tab, since switching the
      // Atlas would lose the user's spatial context.
      window.open(`/network?participantId=${r.id}`, "_blank");
      return;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search the Atlas"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-panel border border-surface-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-2 px-4 border-b border-surface-border">
          <Search size={16} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries, editions, cities, sites or delegates…"
            className="flex-1 py-3 text-sm text-ink placeholder:text-text-muted bg-transparent focus:outline-none"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="text-text-muted hover:text-ink p-1"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto thin-scroll">
          {query.trim().length < 2 ? (
            <EmptyHint />
          ) : totalResults === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-text-muted">
              No matches for <strong className="text-ink">{query}</strong>.
            </div>
          ) : (
            <div className="py-2">
              <Group title="Countries" icon={Globe2} items={results.countries} onPick={handlePick} />
              <Group title="Editions" icon={Calendar} items={results.editions} onPick={handlePick} />
              <Group title="Cities" icon={MapPin} items={results.cities} onPick={handlePick} />
              <Group title="Sites" icon={Building2} items={results.sites} onPick={handlePick} />
              <Group title="Delegates" icon={Users} items={results.participants} onPick={handlePick} />
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-surface-border bg-surface-canvas text-[10px] text-text-muted">
          <span>
            <kbd className="px-1.5 py-0.5 rounded border border-surface-border bg-white font-mono">Esc</kbd> to close
          </span>
          <span>Diacritic-insensitive · case-insensitive</span>
        </div>
      </div>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="px-4 py-8 text-center text-xs text-text-muted space-y-2">
      <div>Start typing to search the Atlas.</div>
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
        <Hint>"Córdoba"</Hint>
        <Hint>"ACE 18"</Hint>
        <Hint>"BMW"</Hint>
        <Hint>"Chile"</Hint>
        <Hint>"Virginia"</Hint>
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-surface-border">
      {children}
    </span>
  );
}

function Group({
  title,
  icon: Icon,
  items,
  onPick,
}: {
  title: string;
  icon: typeof Search;
  items: ResultGroup[];
  onPick: (r: ResultGroup) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="py-1">
      <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted flex items-center gap-1.5">
        <Icon size={10} />
        {title}
        <span className="text-text-muted/60">· {items.length}</span>
      </div>
      <ul>
        {items.map((r) => (
          <li key={`${r.kind}-${r.id}`}>
            <button
              onClick={() => onPick(r)}
              className="w-full text-left px-4 py-2 hover:bg-surface-subtle flex items-center gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink truncate">{r.label}</div>
                {r.sub && (
                  <div className="text-[11px] text-text-muted truncate">{r.sub}</div>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
