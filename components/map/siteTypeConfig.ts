import type { InstitutionType } from "@/types";
import {
  Building2,
  GraduationCap,
  Landmark,
  FlaskConical,
  Lightbulb,
  Network,
  Warehouse,
  CalendarDays,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { ATLAS_COLORS } from "./mapStyles";

// One row per InstitutionType (the canonical type system from /types/index.ts)
// PLUS a special "Host City" pseudo-type used only for the host-city marker.
export type SiteCategoryKey = InstitutionType | "HostCity";

export interface SiteCategory {
  key: SiteCategoryKey;
  label: string;
  /** Used as the layer-control toggle key — one toggle can group several
   *  InstitutionTypes (e.g. "Innovation hubs" covers Technology Hub + Cluster). */
  layerId: AtlasLayerId;
  icon: LucideIcon;
  color: string;
}

export type AtlasLayerId =
  | "host-cities"
  | "companies"
  | "universities"
  | "government"
  | "innovation-hubs"
  | "research-centers"
  | "infrastructure"
  | "cultural"
  | "event-venues"
  | "outcomes"
  | "media";

export const SITE_CATEGORIES: Record<SiteCategoryKey, SiteCategory> = {
  HostCity: {
    key: "HostCity",
    label: "Host city",
    layerId: "host-cities",
    icon: MapPin,
    color: ATLAS_COLORS.hostOrange,
  },
  Company: {
    key: "Company",
    label: "Company",
    layerId: "companies",
    icon: Building2,
    color: ATLAS_COLORS.siteTeal,
  },
  University: {
    key: "University",
    label: "University",
    layerId: "universities",
    icon: GraduationCap,
    color: ATLAS_COLORS.universityPurple,
  },
  "Public Entity": {
    key: "Public Entity",
    label: "Government / Public Entity",
    layerId: "government",
    icon: Landmark,
    color: ATLAS_COLORS.govNavy,
  },
  "Innovation Center": {
    key: "Innovation Center",
    label: "Innovation hub",
    layerId: "innovation-hubs",
    icon: Lightbulb,
    color: ATLAS_COLORS.primaryBlue,
  },
  "Technology Hub": {
    key: "Technology Hub",
    label: "Technology hub",
    layerId: "innovation-hubs",
    icon: Network,
    color: ATLAS_COLORS.primaryBlue,
  },
  Cluster: {
    key: "Cluster",
    label: "Cluster",
    layerId: "innovation-hubs",
    icon: Network,
    color: ATLAS_COLORS.primaryBlue,
  },
  "Research Lab": {
    key: "Research Lab",
    label: "Research center",
    layerId: "research-centers",
    icon: FlaskConical,
    color: ATLAS_COLORS.researchCyan,
  },
  "Chamber of Commerce": {
    key: "Chamber of Commerce",
    label: "Chamber of Commerce",
    layerId: "infrastructure",
    icon: Warehouse,
    color: ATLAS_COLORS.infraAmber,
  },
  NGO: {
    key: "NGO",
    label: "NGO / Cultural",
    layerId: "cultural",
    icon: Landmark,
    color: ATLAS_COLORS.universityPurple,
  },
};

export function categoryFor(type: InstitutionType): SiteCategory {
  return SITE_CATEGORIES[type] ?? SITE_CATEGORIES["Innovation Center"];
}

// Re-exported icon used by the Event venue layer toggle (not currently
// attached to any InstitutionType — kept here so the toggle list stays whole).
export const EventVenueIcon = CalendarDays;
