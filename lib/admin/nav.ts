import {
  Building2,
  ClipboardList,
  FileText,
  LifeBuoy,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When true, the item shows an "MVP" tag — features that are not yet built. */
  upcoming?: boolean;
};

// Sidebar is scoped to the operational core for MVP. Reference-only pages
// (Dashboard / Participantes / Ediciones) still exist at their /admin/*
// URLs — they're just not advertised in nav because they don't drive
// day-to-day decisions on agreements. Re-add the imports + items here if
// you want to expose them again.
export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/admin/agreements", label: "Acuerdos", icon: FileText },
  { href: "/admin/institutions", label: "Instituciones", icon: Building2 },
  { href: "/admin/support", label: "Solicitudes de apoyo", icon: LifeBuoy },
  { href: "/admin/surveys", label: "Encuestas", icon: ClipboardList },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

/** Map URL segments to human-friendly labels for breadcrumbs. */
const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  agreements: "Acuerdos",
  institutions: "Instituciones",
  participants: "Participantes",
  surveys: "Encuestas",
  support: "Solicitudes de apoyo",
  editions: "Ediciones",
  settings: "Configuración",
  new: "Nuevo",
  edit: "Editar",
};

export function labelForSegment(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment;
}
