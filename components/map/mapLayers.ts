import {
  MapPin,
  Building2,
  GraduationCap,
  Landmark,
  Lightbulb,
  FlaskConical,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { AtlasLayerId } from "./siteTypeConfig";
import { ATLAS_COLORS } from "./mapStyles";

export interface AtlasLayerDef {
  id: AtlasLayerId;
  label: string;
  icon: LucideIcon;
  color: string;
  /** Default visibility on first paint. */
  defaultOn: boolean;
}

// Only the layers that actually filter a marker on the map. Earlier
// versions also exposed Event venues / Outcomes / Media — they were
// placebo toggles (no InstitutionType maps to them, so clicking them
// did nothing visible). Keeping them around eroded user trust in the
// rest of the panel.
export const ATLAS_LAYERS: AtlasLayerDef[] = [
  { id: "host-cities", label: "Host cities", icon: MapPin, color: ATLAS_COLORS.hostOrange, defaultOn: true },
  { id: "companies", label: "Companies", icon: Building2, color: ATLAS_COLORS.siteTeal, defaultOn: true },
  { id: "universities", label: "Universities", icon: GraduationCap, color: ATLAS_COLORS.universityPurple, defaultOn: true },
  { id: "government", label: "Government institutions", icon: Landmark, color: ATLAS_COLORS.govNavy, defaultOn: true },
  { id: "innovation-hubs", label: "Innovation hubs", icon: Lightbulb, color: ATLAS_COLORS.primaryBlue, defaultOn: true },
  { id: "research-centers", label: "Research centers", icon: FlaskConical, color: ATLAS_COLORS.researchCyan, defaultOn: true },
  { id: "infrastructure", label: "Infrastructure", icon: Warehouse, color: ATLAS_COLORS.infraAmber, defaultOn: true },
];

export type LayerVisibility = Record<AtlasLayerId, boolean>;

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = ATLAS_LAYERS.reduce(
  (acc, l) => ({ ...acc, [l.id]: l.defaultOn }),
  {} as LayerVisibility,
);
