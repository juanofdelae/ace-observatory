import type { Participant, ActorType } from "@/types";
import memphisRaw from "./_memphis-participants.json";
import historicalRaw from "./_historical-participants.json";
import { countryByName } from "./countries";
import { organizations } from "./organizations";
import { slugify } from "@/lib/utils";

// Map ACE Memphis 2026 `sectors` labels → canonical ActorType enum.
function mapActorType(sectors: string[] | null | undefined): ActorType {
  if (!sectors || sectors.length === 0) return "Private Sector";
  const s = sectors.map((x) => x.toLowerCase());
  if (s.some((x) => x.includes("government"))) return "Government";
  if (s.some((x) => x.includes("academ") || x.includes("education"))) return "Academia";
  if (s.some((x) => x.includes("non-government") || x.includes("ngo"))) return "Entrepreneurial Ecosystem";
  if (s.some((x) => x.includes("international"))) return "International Organization";
  return "Private Sector";
}

// Map expertise labels → sector IDs (/data/sectors.ts).
function mapSectors(expertise: string[] | null | undefined): string[] {
  if (!expertise) return [];
  const out = new Set<string>();
  for (const e of expertise) {
    const t = e.toLowerCase();
    if (t.includes("innovation")) out.add("sec-innovation");
    if (t.includes("entrepreneur")) out.add("sec-entrepreneurship");
    if (t.includes("digital") || t.includes("ai") || t.includes("technology") || t.includes("tech ")) out.add("sec-digital");
    if (t.includes("manufacturing") || t.includes("industry")) out.add("sec-advanced-manufacturing");
    if (t.includes("trade") || t.includes("commerce") || t.includes("logistics") || t.includes("export")) out.add("sec-logistics");
    if (t.includes("agri") || t.includes("food") || t.includes("bio")) out.add("sec-agrifood");
    if (t.includes("energy") || t.includes("climate") || t.includes("sustain")) out.add("sec-clean-energy");
    if (t.includes("smart cit") || t.includes("urban") || t.includes("infrastructure")) out.add("sec-smart-cities");
    if (t.includes("talent") || t.includes("education") || t.includes("workforce")) out.add("sec-talent");
    if (t.includes("health") || t.includes("medical")) out.add("sec-health");
  }
  return Array.from(out);
}

interface MemphisParticipantRaw {
  id: number;
  name: string;
  title: string;
  organization: string;
  country: string;
  photo?: string | null;
  file?: string | null;
  expertise?: string[];
  website?: string | null;
  sectors?: string[];
  /** Verbatim biography pulled from the participant's detail page on
   *  riacevents.org by scripts/sync_memphis_from_riacevents.py.
   *  Falls back to a generated "{title} at {organization}." stub when
   *  absent. */
  bio?: string;
}

// Memphis-source `country` field sometimes carries an organization shortName
// ("IDB", "CAF", "OAS", …). Map those to countryId='intl' + organizationId.
//
// Short-names like "EC" / "EP" are only 2 chars — naïve substring matching
// false-matches them inside unrelated words like "Arlington Economic
// Development" → "ec". We therefore only accept:
//   1. Exact equality on short name or full name
//   2. Short name appearing as a WHOLE WORD (word-boundary match)
//   3. Short name wrapped in parentheses, e.g. "Inter-American Dev. Bank (IDB)"
function matchOrganizationByLabel(label: string): string | undefined {
  if (!label) return undefined;
  const t = label.toLowerCase().trim();
  for (const o of organizations) {
    const short = o.shortName.toLowerCase();
    const full = o.name.toLowerCase();
    if (t === short || t === full) return o.id;
    if (t.includes(`(${short})`)) return o.id;
    // Word-boundary check — short name must sit between non-letter characters.
    const wordRegex = new RegExp(`(^|[^a-z])${short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`);
    if (wordRegex.test(t)) return o.id;
    // Full name substring is safe (long enough to not false-match).
    if (full.length >= 10 && t.includes(full)) return o.id;
  }
  return undefined;
}

// --- Real Memphis 2026 participants (from memphis-profiles/.../participants.json) ---
const memphisParticipants: Participant[] = (memphisRaw as MemphisParticipantRaw[]).map((p) => {
  const byCountry = countryByName(p.country);
  // If `country` is actually an org label (e.g. "IDB"), route it to intl+org.
  const orgFromCountry = byCountry ? undefined : matchOrganizationByLabel(p.country);
  // Also try to attribute the org based on the organization field even when
  // the country is a real country — useful for e.g. a Mexican officer whose
  // actual affiliation is the IDB.
  const orgFromOrg = matchOrganizationByLabel(p.organization || "");
  const organizationId = orgFromCountry ?? orgFromOrg;
  const countryId = byCountry?.id ?? (orgFromCountry ? "intl" : "us");
  return {
    id: `p-memphis-${p.id}-${slugify(p.name)}`,
    name: p.name,
    countryId,
    organization: p.organization || "",
    role: p.title || "",
    sectorIds: mapSectors(p.expertise),
    actorType: mapActorType(p.sectors),
    editionIds: ["ace-23-memphis-2026"],
    areasOfInterest: p.expertise || [],
    photoUrl: p.photo ? `/participants/${p.photo.replace(/^assets\//, "")}` : undefined,
    shortBio: p.bio || (p.title ? `${p.title} at ${p.organization}.` : undefined),
    organizationId,
  };
});

// --- Real historical alumni (ingested from tablepress-export-* CSVs) ---
// Produced by scripts/ingest_participants_csv.py — 746 records across ACE 1–22.
interface HistoricalParticipantRaw {
  id: string;
  name: string;
  countryId: string;
  organization: string;
  role: string;
  sectorIds: string[];
  actorType: ActorType;
  editionIds: string[];
  areasOfInterest: string[];
  website?: string | null;
  source?: string;
  // Enrichment fields from scripts/enrich_participants_html.py (Phase B)
  shortBio?: string;
  photoUrl?: string;
  social?: Partial<Record<"twitter" | "linkedin" | "facebook" | "instagram" | "youtube", string>>;
  organizationId?: string;
}

const historicalAlumni: Participant[] = (historicalRaw as HistoricalParticipantRaw[]).map((p) => ({
  id: p.id,
  name: p.name,
  countryId: p.countryId,
  organization: p.organization,
  role: p.role,
  sectorIds: p.sectorIds,
  actorType: p.actorType,
  editionIds: p.editionIds,
  areasOfInterest: p.areasOfInterest,
  photoUrl: p.photoUrl,
  shortBio: p.shortBio || (p.role && p.organization ? `${p.role} at ${p.organization}.` : (p.role || undefined)),
  social: p.social,
  // Backfill the organizationId by matching the free-text `organization`
  // against the known multilateral registry — catches rows where the
  // original CSV filename didn't announce the org but the free-text field
  // does (e.g. a Colombian officer working at the IDB).
  organizationId: p.organizationId ?? matchOrganizationByLabel(p.organization || ""),
}));

// Manual same-person overrides for cases the prefix/suffix/subset rules
// can't catch automatically — typically nicknames ("Venki" ↔ "Venkatesh"),
// middle-initial vs middle-name expansions ("Timothy E." ↔ "Timothy
// Edward"), or other shorthand variants. Each pair is force-merged in a
// dedicated post-pass after the algorithmic dedup runs.
const MANUAL_ALIASES: Array<[string, string]> = [
  ["Venki Mandapati", "Venkatesh Varma Mandapati"],
  ["Timothy Edward Kelley", "Timothy E. Kelley"],
  ["Sharon Louise Poitier", "Sharon L. Poitier"],
];

// Merge Memphis + historical rosters. Accents and punctuation vary across
// sources ("Virginia Avila" vs "Virginia Ávila"), so we normalize the name
// for dedup detection. When a duplicate is found we keep the MOST RECENT
// edition's profile as the canonical identity (role, organization, bio,
// photo, actor type — all reflect the person's latest ACE appearance) and
// fall back to the older record only for fields the newer one is missing.
function normalizeName(s: string): string {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-zA-Z\s]/g, " ")                      // punctuation out
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Highest edition number referenced in the record (0 if none parseable). */
function maxEditionNumber(p: Participant): number {
  let max = 0;
  for (const id of p.editionIds) {
    const m = /^ace-(\d+)-/.exec(id);
    if (m) {
      const n = Number(m[1]);
      if (n > max) max = n;
    }
  }
  return max;
}

function richnessScore(p: Participant): number {
  let s = 0;
  if (p.shortBio && p.shortBio.length > 30) s += 3;
  if (p.photoUrl) s += 2;
  if (p.social && Object.keys(p.social).length > 0) s += 1;
  return s;
}

/** Merge two records — the "winner" (most recent edition, richer profile)
 *  keeps its identity fields; missing values get backfilled from the loser. */
function mergeRecords(a: Participant, b: Participant): Participant {
  const aLatest = maxEditionNumber(a);
  const bLatest = maxEditionNumber(b);
  let winner: Participant;
  let loser: Participant;
  if (aLatest !== bLatest) {
    winner = aLatest > bLatest ? a : b;
    loser = winner === a ? b : a;
  } else {
    winner = richnessScore(a) > richnessScore(b) ? a : b;
    loser = winner === a ? b : a;
  }
  return {
    ...winner,
    // Keep the WINNER's name. Earlier we preferred the longer name
    // ("Maria Virginia Ávila" over "Virginia Ávila"), but that surfaced
    // people under unfamiliar variants — most colleagues knew them by the
    // shorter / more recent form. Recency-and-richness wins everywhere
    // else, so let it win on the name too.
    name: winner.name,
    editionIds: Array.from(new Set([...winner.editionIds, ...loser.editionIds])).sort(),
    role: winner.role || loser.role,
    organization: winner.organization || loser.organization,
    shortBio: winner.shortBio || loser.shortBio,
    photoUrl: winner.photoUrl || loser.photoUrl,
    social: winner.social ?? loser.social,
    areasOfInterest: winner.areasOfInterest.length ? winner.areasOfInterest : loser.areasOfInterest,
    organizationId: winner.organizationId ?? loser.organizationId,
  };
}

function dedupeByName(list: Participant[]): Participant[] {
  // --- Pass 1: exact normalized-name match.
  const byKey = new Map<string, Participant>();
  for (const p of list) {
    const key = normalizeName(p.name);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, p);
      continue;
    }
    byKey.set(key, mergeRecords(existing, p));
  }

  // --- Pass 2: prefix / subset-name match.
  //
  // Catches "Luis Guillermo Pou Munt" (4 tokens) vs "Luis Guillermo Pou Munt
  // Serrano" (5 tokens) — same person with an extra surname — or "Maria
  // Virginia Avila" vs "Virginia Avila". Rule: name A's tokens must be a
  // prefix OR suffix of name B's tokens (with at least 2 shared tokens), and
  // one extra qualifying signal must match — same country, same
  // organizationId, OR at least one shared edition.
  const entries = Array.from(byKey.values());
  const tokensOf = (name: string) => normalizeName(name).split(" ").filter(Boolean);

  // Index by first token to keep the pass sub-quadratic for large lists.
  const byFirstToken = new Map<string, Participant[]>();
  for (const p of entries) {
    const tks = tokensOf(p.name);
    if (tks.length < 2) continue;
    (byFirstToken.get(tks[0]) ?? byFirstToken.set(tks[0], []).get(tks[0])!).push(p);
  }

  const mergedOut = new Map<string, Participant>();
  const absorbed = new Set<string>();
  for (const p of entries) {
    if (absorbed.has(p.id)) continue;
    const pt = tokensOf(p.name);
    if (pt.length < 2) {
      mergedOut.set(p.id, p);
      continue;
    }
    let current = p;
    // We iterate over ALL entries (not just those sharing a first token)
    // because the shorter name ("Alonso Huerta") may start with a different
    // token than the longer one ("José Alonso Huerta Cruz"). To keep cost
    // manageable we bucket by every token (not just the first one).
    const buckets = new Set<string>();
    for (const t of pt) (buckets.add(t));
    const candidates: Participant[] = [];
    for (const t of buckets) {
      for (const cand of byFirstToken.get(t) ?? []) {
        if (cand.id !== current.id && !candidates.includes(cand)) candidates.push(cand);
      }
    }
    for (const other of candidates) {
      if (other.id === current.id) continue;
      if (absorbed.has(other.id)) continue;
      const ot = tokensOf(other.name);
      const sharedLen = Math.min(pt.length, ot.length);
      if (sharedLen < 2) continue;

      // Rule (a) — pt is a contiguous prefix of ot (or vice-versa).
      const aPref = pt.slice(0, sharedLen);
      const bPref = ot.slice(0, sharedLen);
      const isPrefixMatch = aPref.every((t, i) => t === bPref[i]);
      // Rule (b) — same as above but anchored at the end (common surnames).
      const aSuf = pt.slice(-sharedLen);
      const bSuf = ot.slice(-sharedLen);
      const isSuffixMatch = aSuf.every((t, i) => t === bSuf[i]);
      // Rule (c) — the shorter name's tokens appear CONTIGUOUSLY inside the
      // longer name (a contiguous-substring of the token list). Earlier we
      // accepted any token-subset, but that over-merged common-token names
      // ("Juan Pérez" into "Juan María Pérez Gómez") and absorbed real
      // records like Virginia Ávila. Contiguous matching only catches
      // genuine sub-strings of the same name — e.g.
      //   shorter = ["alonso", "huerta"]
      //   longer  = ["jose", "alonso", "huerta", "cruz"]
      // → still a match (alonso huerta is contiguous inside the longer).
      const shorter = pt.length <= ot.length ? pt : ot;
      const longer  = shorter === pt ? ot : pt;
      const sameWindow = (offset: number) =>
        shorter.every((t, i) => longer[offset + i] === t);
      let isSubsetMatch = false;
      if (shorter.length >= 2) {
        for (let offset = 0; offset + shorter.length <= longer.length; offset++) {
          if (sameWindow(offset)) { isSubsetMatch = true; break; }
        }
      }

      if (!(isPrefixMatch || isSuffixMatch || isSubsetMatch)) continue;
      // Require at least one qualifying signal so we don't over-merge.
      const sameCountry = current.countryId === other.countryId;
      const sameOrg = Boolean(current.organizationId && current.organizationId === other.organizationId);
      const sharedEdition = current.editionIds.some(e => other.editionIds.includes(e));
      if (!sameCountry && !sameOrg && !sharedEdition) continue;
      current = mergeRecords(current, other);
      absorbed.add(other.id);
    }
    mergedOut.set(current.id, current);
  }
  const afterAlgo = Array.from(mergedOut.values()).filter(p => !absorbed.has(p.id));

  // --- Pass 3: hand-declared aliases (MANUAL_ALIASES). Catches nicknames
  // and middle-initial expansions the algorithmic passes can't infer.
  const byNormName = new Map<string, Participant>();
  for (const p of afterAlgo) byNormName.set(normalizeName(p.name), p);
  for (const [a, b] of MANUAL_ALIASES) {
    const an = normalizeName(a);
    const bn = normalizeName(b);
    const pa = byNormName.get(an);
    const pb = byNormName.get(bn);
    if (!pa || !pb || pa.id === pb.id) continue;
    const merged = mergeRecords(pa, pb);
    byNormName.delete(an);
    byNormName.delete(bn);
    byNormName.set(normalizeName(merged.name), merged);
  }
  return Array.from(byNormName.values());
}

// Recency-then-count ordering — applied ONLY to institutional listings
// (people whose identity is an organization, not a country). Country-based
// rosters keep their original insertion order.
function sortByRecencyThenCount(list: Participant[]): Participant[] {
  return [...list].sort((a, b) => {
    const aLatest = maxEditionNumber(a);
    const bLatest = maxEditionNumber(b);
    if (aLatest !== bLatest) return bLatest - aLatest;
    if (a.editionIds.length !== b.editionIds.length) {
      return b.editionIds.length - a.editionIds.length;
    }
    return a.name.localeCompare(b.name);
  });
}

export const participants: Participant[] = dedupeByName([...memphisParticipants, ...historicalAlumni]);

export const participantById = (id: string) => participants.find(p => p.id === id);
export const participantsByCountry = (countryId: string) => participants.filter(p => p.countryId === countryId);
export const participantsByEdition = (editionId: string) => participants.filter(p => p.editionIds.includes(editionId));

/** Institutional participants (IDB, CAF, OAS, UN-HABITAT, PADF…), ordered
 *  by latest ACE edition (desc) then by total edition count (desc). */
export const participantsByOrganization = (organizationId: string) =>
  sortByRecencyThenCount(participants.filter(p => p.organizationId === organizationId));

/** All participants whose primary identity is an organization, not a country
 *  — useful for the "institutional alumni" section of a listing page. */
export const institutionalParticipants: Participant[] = sortByRecencyThenCount(
  participants.filter(p => p.organizationId),
);

// Flag so UI can show the "Memphis 2026 roster is real data" context.
export const MEMPHIS_PARTICIPANTS_ARE_REAL = true;
