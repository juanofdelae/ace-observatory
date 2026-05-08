"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { participants, participantsByEdition } from "@/data/participants";
import { editions } from "@/data/editions";
import { countryById } from "@/data/countries";
import { sectors } from "@/data/sectors";
import { editionRegion } from "@/lib/utils";
import { Users, ExternalLink, Globe2, X, Search, Tag } from "lucide-react";
import type { Participant } from "@/types";

const sectorById = (id: string) => sectors.find(s => s.id === id);

// Color per actor type — drives the dot next to each name in the list and
// the actor-type pill in the detail card.
const ACTOR_COLOR: Record<string, string> = {
  "Government": "#0B1F3A",
  "Private Sector": "#14B8A6",
  "Academia": "#7C3AED",
  "International Organization": "#2563EB",
  "Civil Society": "#F97316",
  "Entrepreneurial Ecosystem": "#F59E0B",
  "Multilateral Organization": "#0891B2",
};
const FALLBACK_COLOR = "#94A3B8";

// Sentinel value for the edition selector. When chosen, the roster pool
// becomes the entire participants directory (cross-edition mode) and the
// detail panel shows shared ACEs as an extra signal in the connections
// list so the user can see who they crossed paths with across multiple
// programs — not just inside one ACE.
const ALL_EDITIONS = "__all__";

type ConnectionMode = "sector" | "country";

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

interface Props {
  initialEditionId?: string;
  /** Optional: pre-select this delegate (used when arriving from a deep
   *  link such as /network?participantId=p-hist-ar-virginia-avila). When
   *  this delegate exists in the chosen edition's roster, the detail
   *  panel opens to them on first render. */
  initialParticipantId?: string;
}

export function ParticipantsNetwork({ initialEditionId, initialParticipantId }: Props) {
  // Editions sorted newest first. Skip ones with empty rosters.
  const editionOptions = useMemo(() => {
    return [...editions]
      .sort((a, b) => b.number - a.number)
      .filter(e => participantsByEdition(e.id).length > 0);
  }, []);

  const [editionId, setEditionId] = useState<string>(
    initialEditionId ?? editionOptions[0]?.id ?? "",
  );
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("sector");
  const [selectedId, setSelectedId] = useState<string | null>(initialParticipantId ?? null);
  const [query, setQuery] = useState("");
  const [actorFilter, setActorFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  // Reset selection / search whenever the scope changes.
  const handleEditionChange = (id: string) => {
    setEditionId(id);
    setSelectedId(null);
    setQuery("");
    setActorFilter(null);
    setCountryFilter(null);
  };

  const isAllEditions = editionId === ALL_EDITIONS;
  const roster = useMemo(
    () => (isAllEditions ? participants : editionId ? participantsByEdition(editionId) : []),
    [editionId, isAllEditions],
  );

  const currentEdition = editionId && !isAllEditions
    ? editions.find(e => e.id === editionId)
    : undefined;

  // --- Connection helper -------------------------------------------------
  // Two delegates are linked when they share ≥1 sector (default) or come
  // from the same country. In cross-edition mode we ALSO surface the list
  // of editions both attended together, so the user can see who they
  // crossed paths with across multiple ACEs.
  const connectionsFor = (
    p: Participant,
  ): { peer: Participant; shared: string[]; sharedEditions: string[] }[] => {
    const sharedEds = (o: Participant) =>
      isAllEditions ? o.editionIds.filter(e => p.editionIds.includes(e)) : [];

    if (connectionMode === "sector") {
      return roster
        .filter(o => o.id !== p.id && o.sectorIds.some(s => p.sectorIds.includes(s)))
        .map(o => ({
          peer: o,
          shared: o.sectorIds.filter(s => p.sectorIds.includes(s)),
          sharedEditions: sharedEds(o),
        }))
        .sort((a, b) => {
          // In cross-edition mode bubble up people who attended the same
          // ACEs first — that's the strongest "you crossed paths" signal.
          if (isAllEditions && a.sharedEditions.length !== b.sharedEditions.length) {
            return b.sharedEditions.length - a.sharedEditions.length;
          }
          return b.shared.length - a.shared.length;
        });
    }
    return roster
      .filter(o => o.id !== p.id && o.countryId === p.countryId)
      .map(o => ({ peer: o, shared: [o.countryId], sharedEditions: sharedEds(o) }))
      .sort((a, b) =>
        isAllEditions ? b.sharedEditions.length - a.sharedEditions.length : 0,
      );
  };

  // Index degree once for the whole roster — drives the sortable badge.
  const degreeMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of roster) m.set(p.id, connectionsFor(p).length);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, connectionMode]);

  // Distinct actor types in the current roster — drives the filter chips.
  const actorTypes = useMemo(() => {
    const set = new Set<string>();
    for (const p of roster) set.add(p.actorType);
    return [...set].sort();
  }, [roster]);

  // Distinct countries in the current roster — drives the country select.
  // Sorted alphabetically by display name (falling back to the raw id).
  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of roster) set.add(p.countryId);
    return [...set]
      .map(id => ({ id, name: countryById(id)?.name ?? id.toUpperCase() }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roster]);

  // Apply text + actor + country filters to the visible list.
  const visible = useMemo(() => {
    const q = query.trim() ? normalize(query) : "";
    return roster
      .filter(p => !actorFilter || p.actorType === actorFilter)
      .filter(p => !countryFilter || p.countryId === countryFilter)
      .filter(p => {
        if (!q) return true;
        return normalize(`${p.name} ${p.organization} ${p.role}`).includes(q);
      })
      .sort((a, b) => {
        // Sort by degree desc (most connected first), then alphabetical.
        const da = degreeMap.get(a.id) ?? 0;
        const db = degreeMap.get(b.id) ?? 0;
        if (db !== da) return db - da;
        return a.name.localeCompare(b.name);
      });
  }, [roster, query, actorFilter, countryFilter, degreeMap]);

  const selected = selectedId ? roster.find(p => p.id === selectedId) : null;
  const selectedConnections = selected ? connectionsFor(selected) : [];

  return (
    <div className="space-y-4">
      {/* Top controls bar */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card p-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <span className="text-text-muted font-semibold uppercase tracking-wider">Edition</span>
          <select
            value={editionId}
            onChange={(e) => handleEditionChange(e.target.value)}
            className="bg-white border border-surface-border rounded-md px-2.5 py-1.5 text-sm font-semibold text-ink hover:border-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
          >
            <option value={ALL_EDITIONS}>
              All editions — cross-ACE network ({participants.length})
            </option>
            {editionOptions.map((e) => (
              <option key={e.id} value={e.id}>
                ACE {e.number} — {editionRegion(e)} ({participantsByEdition(e.id).length})
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-text-muted font-semibold uppercase tracking-wider mr-1">
            Connect by
          </span>
          {(["sector", "country"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setConnectionMode(m)}
              className={
                "px-2.5 py-1 rounded-full font-semibold capitalize transition-colors " +
                (connectionMode === m
                  ? "bg-ink text-white"
                  : "bg-white text-text-secondary border border-surface-border hover:border-ink/30")
              }
            >
              {m === "sector" ? "Shared sector" : "Same country"}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-text-muted flex items-center gap-1.5">
          <Users size={12} />
          <span>
            <strong className="text-ink">{roster.length}</strong> delegates
          </span>
        </div>
      </div>

      {/* Two-column layout: list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-4">
        {/* ---------- Participants list ---------- */}
        <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden flex flex-col h-[640px]">
          {/* Search + filter chips */}
          <div className="px-4 py-3 border-b border-surface-border space-y-2.5">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, role or organization…"
                className="w-full bg-surface-canvas border border-surface-border rounded-md pl-8 pr-3 py-1.5 text-sm text-ink placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/40"
              />
            </div>
            {/* Country filter — uses a select rather than chips because an
                edition often spans 15-30 countries which would overflow
                horizontally as chips. */}
            {countryOptions.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <Globe2 size={12} className="text-text-muted shrink-0" />
                <select
                  value={countryFilter ?? ""}
                  onChange={(e) => setCountryFilter(e.target.value || null)}
                  className="flex-1 bg-surface-canvas border border-surface-border rounded-md px-2 py-1 text-xs text-ink hover:border-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
                >
                  <option value="">All countries ({countryOptions.length})</option>
                  {countryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {countryFilter && (
                  <button
                    onClick={() => setCountryFilter(null)}
                    aria-label="Clear country filter"
                    className="text-text-muted hover:text-ink p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            {actorTypes.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <button
                  onClick={() => setActorFilter(null)}
                  className={
                    "px-2 py-0.5 rounded-full font-semibold transition-colors " +
                    (actorFilter === null
                      ? "bg-ink text-white"
                      : "bg-surface-muted text-text-secondary hover:bg-ink/10")
                  }
                >
                  All
                </button>
                {actorTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActorFilter(actorFilter === t ? null : t)}
                    className={
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold transition-colors " +
                      (actorFilter === t
                        ? "text-white"
                        : "bg-surface-muted text-text-secondary hover:bg-ink/10")
                    }
                    style={
                      actorFilter === t
                        ? { background: ACTOR_COLOR[t] ?? FALLBACK_COLOR }
                        : undefined
                    }
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: ACTOR_COLOR[t] ?? FALLBACK_COLOR }}
                    />
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto thin-scroll divide-y divide-surface-border">
            {visible.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted text-xs">
                No delegates match these filters.
              </div>
            ) : (
              visible.map((p) => {
                const isSelected = p.id === selectedId;
                const deg = degreeMap.get(p.id) ?? 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={
                      "w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors " +
                      (isSelected
                        ? "bg-ink/5 border-l-2 border-l-accent-blue pl-[14px]"
                        : "hover:bg-surface-subtle")
                    }
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface-muted shrink-0 border border-surface-border">
                      {p.photoUrl ? (
                        <Image
                          src={p.photoUrl}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          <Users size={14} />
                        </div>
                      )}
                      <span
                        aria-hidden
                        className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-white"
                        style={{ background: ACTOR_COLOR[p.actorType] ?? FALLBACK_COLOR }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-ink truncate">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">
                        {p.role || p.organization}
                      </div>
                    </div>
                    <div
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md bg-surface-muted text-text-secondary"
                      title={`${deg} ${connectionMode === "sector" ? "shared-sector" : "same-country"} connection${deg === 1 ? "" : "s"}`}
                    >
                      {deg}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 border-t border-surface-border text-[10px] text-text-muted">
            <strong className="text-ink">{visible.length}</strong> of {roster.length} delegates · sorted by # connections
          </div>
        </div>

        {/* ---------- Detail panel ---------- */}
        <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden flex flex-col h-[640px]">
          {!selected ? (
            <EmptyDetail
              edition={isAllEditions ? "every ACE" : currentEdition ? `ACE ${currentEdition.number} — ${editionRegion(currentEdition)}` : undefined}
              mode={connectionMode}
              isAllEditions={isAllEditions}
            />
          ) : (
            <SelectedDetail
              p={selected}
              connections={selectedConnections}
              mode={connectionMode}
              editionId={editionId}
              isAllEditions={isAllEditions}
              onSelect={setSelectedId}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-components ---------------------------------------------

function EmptyDetail({
  edition,
  mode,
  isAllEditions,
}: {
  edition?: string;
  mode: ConnectionMode;
  isAllEditions: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center">
        <Users size={20} className="text-text-muted" />
      </div>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-ink">
          Select a delegate
        </div>
        <div className="text-xs text-text-muted max-w-sm leading-relaxed">
          {isAllEditions ? (
            <>
              Cross-ACE mode: pick a name from the list to see every delegate
              they connect with across the entire program — by{" "}
              {mode === "sector" ? "shared sector of work" : "same country"}.
              Connections that also share an ACE edition appear first.
            </>
          ) : (
            <>
              Pick a name from the list to see their profile and the {edition ? `${edition} ` : ""}delegates they connect with — by{" "}
              {mode === "sector" ? "shared sector of work" : "same country"}.
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectedDetail({
  p,
  connections,
  mode,
  editionId,
  isAllEditions,
  onSelect,
  onClose,
}: {
  p: Participant;
  connections: { peer: Participant; shared: string[]; sharedEditions: string[] }[];
  mode: ConnectionMode;
  editionId: string;
  isAllEditions: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const country = countryById(p.countryId);
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-border">
        <div className="flex items-start gap-3">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-surface-muted shrink-0 border border-surface-border">
            {p.photoUrl ? (
              <Image src={p.photoUrl} alt={p.name} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <Users size={22} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-ink leading-tight">{p.name}</div>
            <div className="text-xs text-text-muted mt-0.5">{p.role}</div>
            <div className="text-xs text-text-secondary mt-0.5 truncate">{p.organization}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-ink p-1"
          >
            <X size={14} />
          </button>
        </div>

        {/* Meta chips */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary">
            <Globe2 size={10} /> {country?.name ?? p.countryId.toUpperCase()}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white font-semibold"
            style={{ background: ACTOR_COLOR[p.actorType] ?? FALLBACK_COLOR }}
          >
            {p.actorType}
          </span>
          {p.sectorIds.slice(0, 4).map((s) => {
            const sec = sectorById(s);
            return sec ? (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary"
              >
                <Tag size={9} /> {sec.name}
              </span>
            ) : null;
          })}
        </div>

        {p.shortBio && (
          <p className="mt-3 text-xs text-text-secondary leading-relaxed line-clamp-3">
            {p.shortBio}
          </p>
        )}
      </div>

      {/* Connections list */}
      <div className="flex-1 overflow-y-auto thin-scroll min-h-0">
        <div className="px-5 py-3 sticky top-0 z-10 bg-white border-b border-surface-border flex items-center justify-between shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
            {isAllEditions ? "Connections across the program" : "Connections in this edition"}
          </div>
          <span className="text-[11px] font-bold text-ink tabular-nums">{connections.length}</span>
        </div>
        {connections.length === 0 ? (
          <div className="px-5 py-6 text-xs text-text-muted">
            No shared {mode === "sector" ? "sector" : "country"} with anyone else {isAllEditions ? "in the program" : "in this edition"}.
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {connections.map(({ peer, shared, sharedEditions }) => {
              const c = countryById(peer.countryId);
              return (
                <li key={peer.id}>
                  <button
                    onClick={() => onSelect(peer.id)}
                    className="w-full text-left px-5 py-2.5 flex items-center gap-3 hover:bg-surface-subtle"
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface-muted shrink-0 border border-surface-border">
                      {peer.photoUrl ? (
                        <Image
                          src={peer.photoUrl}
                          alt={peer.name}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          <Users size={14} />
                        </div>
                      )}
                      <span
                        aria-hidden
                        className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-white"
                        style={{ background: ACTOR_COLOR[peer.actorType] ?? FALLBACK_COLOR }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-ink truncate">
                        {peer.name}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">
                        {c?.name ?? peer.countryId.toUpperCase()} · {peer.organization}
                      </div>
                      {/* Cross-edition signal: which ACEs they both attended.
                          Only meaningful in All-editions mode — strongest
                          "we crossed paths" cue, so it appears under the row
                          metadata. */}
                      {isAllEditions && sharedEditions.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {sharedEditions.slice(0, 5).map((eid) => {
                            const e = editions.find((x) => x.id === eid);
                            if (!e) return null;
                            return (
                              <span
                                key={eid}
                                className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-brand-orange/10 text-brand-orange"
                                title={`ACE ${e.number} — ${editionRegion(e)}`}
                              >
                                ACE {e.number}
                              </span>
                            );
                          })}
                          {sharedEditions.length > 5 && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-muted text-text-muted">
                              +{sharedEditions.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {mode === "sector" && (
                      <div className="shrink-0 flex flex-wrap gap-1 max-w-[180px] justify-end">
                        {shared.slice(0, 2).map((sid) => {
                          const sec = sectorById(sid);
                          return sec ? (
                            <span
                              key={sid}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-accent-blue/10 text-accent-blue"
                            >
                              {sec.name}
                            </span>
                          ) : null;
                        })}
                        {shared.length > 2 && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-muted text-text-muted">
                            +{shared.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between">
        {p.editionIds.length > 1 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
              Also attended
            </span>
            {p.editionIds
              .filter((id) => id !== editionId)
              .slice(0, 4)
              .map((id) => {
                const e = editions.find((x) => x.id === id);
                if (!e) return null;
                return (
                  <span
                    key={id}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-muted text-text-secondary"
                  >
                    ACE {e.number}
                  </span>
                );
              })}
            {p.editionIds.length - 1 > 4 && (
              <span className="text-[10px] text-text-muted">
                +{p.editionIds.length - 1 - 4}
              </span>
            )}
          </div>
        ) : (
          <span />
        )}
        <Link
          href={isAllEditions ? "/participants" : `/participants?editionId=${editionId}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent-blue hover:text-ink"
        >
          Open directory <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  );
}
