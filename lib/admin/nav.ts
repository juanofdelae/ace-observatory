import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When true, the item shows an "MVP" tag — features that are not yet built. */
  upcoming?: boolean;
};

// All admin routes live under /admin/* in the merged Observatory app so the
// proxy.ts gate can match them with a single prefix. Items marked `upcoming`
// have no implementation yet — Phase 2 of M-Admin will deliver them.
export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agreements", label: "Acuerdos", icon: FileText },
  { href: "/admin/institutions", label: "Instituciones", icon: Building2, upcoming: true },
  { href: "/admin/participants", label: "Participantes", icon: Users, upcoming: true },
  { href: "/admin/surveys", label: "Encuestas", icon: ClipboardList, upcoming: true },
  { href: "/admin/support", label: "Solicitudes de apoyo", icon: LifeBuoy, upcoming: true },
  { href: "/admin/editions", label: "Ediciones", icon: Calendar, upcoming: true },
  { href: "/admin/settings", label: "Configuración", icon: Settings, upcoming: true },
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
