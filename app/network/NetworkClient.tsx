"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ParticipantsNetwork } from "@/components/network/ParticipantsNetwork";
import { participants } from "@/data/participants";
import { editions } from "@/data/editions";

// Reads ?editionId / ?participantId from the URL on the client. Required
// because `output: "export"` disallows server-side searchParams reads —
// every page is fully prerendered at build time and any per-request
// state must come from the browser.
// Defense-in-depth: even though every consumer of these IDs in the app
// only does .find() over local arrays (no SQL, no DOM injection, React
// escapes at render), an attacker-controlled querystring should never
// flow further than this boundary unless it matches the strict
// kebab-case ID shape the project actually uses.
const ID_SHAPE = /^[a-z0-9-]{1,128}$/i;
const safeId = (raw: string | null | undefined): string | undefined =>
  raw && ID_SHAPE.test(raw) ? raw : undefined;

function NetworkInner() {
  const sp = useSearchParams();
  let editionId = safeId(sp?.get("editionId"));
  const participantId = safeId(sp?.get("participantId"));

  // When the page is opened from a participant card with only a
  // participantId, default the edition to that delegate's most recent
  // ACE that actually has a roster ingested, so the panel resolves them.
  if (!editionId && participantId) {
    const p = participants.find((x) => x.id === participantId);
    if (p) {
      const editionNum = (id: string) => Number(id.match(/^ace-(\d+)-/)?.[1] ?? 0);
      const sorted = [...p.editionIds].sort((a, b) => editionNum(b) - editionNum(a));
      editionId =
        sorted.find((id) => editions.find((e) => e.id === id)) ?? sorted[0];
    }
  }

  return (
    <ParticipantsNetwork
      initialEditionId={editionId}
      initialParticipantId={participantId}
    />
  );
}

export function NetworkClient() {
  return (
    <Suspense fallback={null}>
      <NetworkInner />
    </Suspense>
  );
}
