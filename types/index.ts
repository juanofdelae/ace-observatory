// =====================================================================
// ACE Data Observatory — Domain Types
// Designed to map 1:1 onto Supabase tables when backend is wired in.
// All relationships are expressed by stable string IDs.
// =====================================================================

export type ActorType =
  | "Government"
  | "Private Sector"
  | "Academia"
  | "International Organization"
  | "Entrepreneurial Ecosystem";

export type InstitutionType =
  | "University"
  | "Company"
  | "Innovation Center"
  | "Public Entity"
  | "Technology Hub"
  | "Cluster"
  | "Chamber of Commerce"
  | "Research Lab"
  | "NGO";

export type MediaType = "photo" | "video" | "document" | "presentation" | "trip_book" | "report";

export type OutcomeCategory =
  | "Partnership"
  | "Derived Project"
  | "Success Story"
  | "Best Practice"
  | "Follow-up"
  | "Investment"
  | "Policy";

export interface Sector {
  id: string;
  name: string;
  color: string; // hex, used in charts/chips
}

export interface Coordinates {
  lat: number;
  lng: number;
}

// ---------- Geographic entities ----------

export interface Country {
  id: string;
  name: string;
  isoCode: string;
  region:
    | "North America"
    | "Central America"
    | "Caribbean"
    | "South America"
    | "Europe"
    | "Asia"
    | "Oceania"
    | "Africa";
  coordinates: Coordinates;
  // Derived/denormalized counts for quick map rendering
  aceEditionsCount: number;
  participantsCount: number;
  citiesCount: number;
  institutionsCount: number;
  hasHostedEdition: boolean;
}

export interface State {
  id: string;
  name: string;
  countryId: string; // e.g. "us"
  abbreviation: string;
  coordinates: Coordinates;
  cityIds: string[];
  editionIds: string[];
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  stateId?: string; // only for US
  coordinates: Coordinates;
  editionIds: string[];
  visitedSiteIds: string[];
  participantIds: string[];
  institutionIds: string[];
  outcomeIds: string[];
  mediaIds: string[];
}

export interface VisitedSite {
  id: string;
  name: string;
  type: InstitutionType;
  countryId: string;
  stateId?: string;
  cityId: string;
  coordinates: Coordinates;
  sectorIds: string[];
  description: string;
  relatedEditionIds: string[];
  mediaIds: string[];
  website?: string;
  /** Hero image path under /public — extracted from the source trip-book
   *  PDF by scripts/extract_sites_from_tripbooks.py, or hand-curated. */
  image?: string;
  /** Source-quality marker so the UI can mark unverified data clearly:
   *   - "verified"             → hand-curated by the team
   *   - "pending_verification" → auto-extracted from a PDF or web page,
   *                              accuracy not yet confirmed
   *   - "sample"               → placeholder content for demo only */
  verificationStatus?: "verified" | "pending_verification" | "sample";
  /** Site hosts who present, lead a tour, or speak during the visit.
   *  Distinct from `participants` (touring delegates) — these people are
   *  ON THE GROUND at the site. Surfaced from the official agenda. */
  featuredSpeakers?: Array<{ name: string; title: string }>;
}

// ---------- Core entities ----------

export interface Organizer {
  id: string;
  name: string;
  role: string;
  organization: string;
  countryId?: string;
  photoUrl?: string;
}

export interface Edition {
  id: string; // e.g. "ace-memphis-2026"
  number: number;
  name: string; // e.g. "ACE Memphis 2026"
  countryId: string;
  stateId?: string;
  cityIds: string[]; // usually one host city, sometimes a tour
  startDate: string; // ISO date
  endDate: string;
  organizerIds: string[];
  sectorIds: string[];
  participantIds: string[];
  representedCountryIds: string[]; // countries with at least one participant
  visitedSiteIds: string[];
  outcomeIds: string[];
  mediaIds: string[];
  summary: string; // executive summary
  heroImage?: string;
  links: {
    tripBook?: string;
    finalReport?: string;
    photos?: string;
    videos?: string;
    website?: string;
  };
  status: "completed" | "upcoming" | "in_progress";
  isSample?: boolean; // flag: true when data is mock/sample
}

export interface Participant {
  id: string;
  name: string;
  countryId: string;
  organization: string;
  role: string;
  sectorIds: string[];
  actorType: ActorType;
  editionIds: string[];
  areasOfInterest: string[];
  photoUrl?: string;
  shortBio?: string;
  social?: Partial<Record<"twitter" | "linkedin" | "facebook" | "instagram" | "youtube", string>>;
  /** Multilateral / supranational affiliation (IDB, OAS, UN-HABITAT, etc.).
   *  Set for participants whose primary identity is an institution rather
   *  than a single country. Points to data/organizations.ts by id. */
  organizationId?: string;
}

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  countryId: string;
  stateId?: string;
  cityId: string;
  sectorIds: string[];
  editionIds: string[];
  description: string;
  website?: string;
  coordinates: Coordinates;
  mediaIds: string[];
}

export interface Outcome {
  id: string;
  title: string;
  category: OutcomeCategory;
  editionIds: string[];
  countryIds: string[];
  sectorIds: string[];
  date: string;
  description: string;
  involvedParticipantIds?: string[];
  involvedInstitutionIds?: string[];
  impactMetric?: { label: string; value: string };
}

export interface MediaResource {
  id: string;
  title: string;
  type: MediaType;
  editionId: string;
  countryId?: string;
  cityId?: string;
  year: number;
  thumbnailUrl?: string;
  url?: string;
  description: string;
}

// ---------- View-model helpers ----------

export type DrillLevel = "global" | "country" | "edition" | "state" | "city" | "site";

export interface AtlasSelection {
  level: DrillLevel;
  countryId?: string;
  stateId?: string;
  /** When set, scopes the city/site view to only this ACE edition's records.
   *  Required at level === "edition"; optional at level === "city"/"site"
   *  to disambiguate cities that hosted multiple editions (Córdoba 2015 vs 2025). */
  editionId?: string;
  cityId?: string;
  siteId?: string;
}

export interface FilterState {
  year?: number;
  editionId?: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  sectorId?: string;
  institutionType?: InstitutionType;
  mediaType?: MediaType;
  outcomeCategory?: OutcomeCategory;
  actorType?: ActorType;
}
