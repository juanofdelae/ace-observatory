// Multilateral, supranational and multinational entities whose alumni appear
// in the ACE roster. These are NOT countries — they're organizational
// affiliations that transcend a single nation. A participant can belong to
// one of these AND a country (e.g. an IDB officer based in Washington D.C.),
// but for ACE-listing purposes the organization is the primary identity.
export type OrganizationType =
  | "Multilateral Bank"
  | "Multilateral Organization"
  | "Regional Integration Body"
  | "Foundation"
  | "Multinational Corporation"
  | "Professional Association"
  | "Development Facility";

export interface Organization {
  id: string;
  name: string;
  shortName: string;
  type: OrganizationType;
  /** Scope description shown in tooltips / participant cards. */
  scope: string;
  /** Accent colour used in UI chips. */
  color: string;
  website?: string;
}

export const organizations: Organization[] = [
  {
    id: "org-idb",
    name: "Inter-American Development Bank",
    shortName: "IDB",
    type: "Multilateral Bank",
    scope: "Latin America & the Caribbean",
    color: "#1E4E8C",
    website: "https://www.iadb.org",
  },
  {
    id: "org-caf",
    name: "Development Bank of Latin America",
    shortName: "CAF",
    type: "Multilateral Bank",
    scope: "Latin America",
    color: "#007A5E",
    website: "https://www.caf.com",
  },
  {
    id: "org-cdb",
    name: "Caribbean Development Bank",
    shortName: "CDB",
    type: "Multilateral Bank",
    scope: "Caribbean",
    color: "#1B7FB0",
    website: "https://www.caribank.org",
  },
  {
    id: "org-oas",
    name: "Organization of American States",
    shortName: "OAS",
    type: "Multilateral Organization",
    scope: "Americas",
    color: "#0B2F5C",
    website: "https://www.oas.org",
  },
  {
    id: "org-un-habitat",
    name: "United Nations Human Settlements Programme",
    shortName: "UN-HABITAT",
    type: "Multilateral Organization",
    scope: "Global",
    color: "#009EDB",
    website: "https://unhabitat.org",
  },
  {
    id: "org-european-commission",
    name: "European Commission",
    shortName: "EC",
    type: "Regional Integration Body",
    scope: "European Union",
    color: "#003399",
    website: "https://commission.europa.eu",
  },
  {
    id: "org-european-parliament",
    name: "European Parliament",
    shortName: "EP",
    type: "Regional Integration Body",
    scope: "European Union",
    color: "#003399",
    website: "https://www.europarl.europa.eu",
  },
  {
    id: "org-sica",
    name: "Central American Integration System",
    shortName: "SICA",
    type: "Regional Integration Body",
    scope: "Central America",
    color: "#2D572C",
    website: "https://www.sica.int",
  },
  {
    id: "org-oecs",
    name: "Organisation of Eastern Caribbean States",
    shortName: "OECS",
    type: "Regional Integration Body",
    scope: "Eastern Caribbean",
    color: "#005A9C",
    website: "https://www.oecs.int",
  },
  {
    id: "org-padf",
    name: "Pan American Development Foundation",
    shortName: "PADF",
    type: "Foundation",
    scope: "Americas",
    color: "#C8102E",
    website: "https://www.padf.org",
  },
  {
    id: "org-usmf",
    name: "U.S.-Mexico Foundation",
    shortName: "USMF",
    type: "Foundation",
    scope: "U.S. & Mexico",
    color: "#6D2C3E",
    website: "https://usmexicofound.org",
  },
  {
    id: "org-fumec",
    name: "United States-Mexico Foundation for Science",
    shortName: "FUMEC",
    type: "Foundation",
    scope: "U.S. & Mexico",
    color: "#006847",
  },
  {
    id: "org-iedc",
    name: "International Economic Development Council",
    shortName: "IEDC",
    type: "Professional Association",
    scope: "Global",
    color: "#003f5c",
    website: "https://www.iedconline.org",
  },
  {
    id: "org-compete-caribbean",
    name: "Compete Caribbean Partnership Facility",
    shortName: "Compete Caribbean",
    type: "Development Facility",
    scope: "Caribbean",
    color: "#F5B700",
  },
  {
    id: "org-walmart",
    name: "Walmart",
    shortName: "Walmart",
    type: "Multinational Corporation",
    scope: "Global retailer",
    color: "#0071CE",
    website: "https://www.walmart.com",
  },
];

export const organizationById = (id: string) =>
  organizations.find(o => o.id === id);

/** Case-insensitive lookup on short name or full name, used during ingestion. */
export function organizationByLabel(label: string): Organization | undefined {
  if (!label) return undefined;
  const t = label.toLowerCase().trim();
  return organizations.find(o =>
    o.shortName.toLowerCase() === t ||
    o.name.toLowerCase() === t ||
    t.includes(o.shortName.toLowerCase()),
  );
}
