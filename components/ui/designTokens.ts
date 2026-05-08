/**
 * ACE Data Observatory — Design Tokens
 * ------------------------------------
 * Central source of truth for the premium institutional tablet-style
 * dashboard look. These tokens are mirrored in `tailwind.config.ts`
 * (theme.extend.{colors,boxShadow,borderRadius}) and `app/globals.css`.
 *
 * Use the CSS-friendly export `cssTokens` if you ever need to inject
 * tokens into a `<style>` block. Tailwind utility classes are still
 * the preferred consumption path inside components.
 */

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  pill: 9999,
} as const;

export const shadow = {
  card:
    "0 1px 2px 0 rgba(11, 31, 58, 0.06), 0 6px 20px -8px rgba(11, 31, 58, 0.08)",
  cardHover:
    "0 2px 4px 0 rgba(11, 31, 58, 0.08), 0 12px 28px -10px rgba(11, 31, 58, 0.14)",
  panel:
    "0 1px 2px 0 rgba(11, 31, 58, 0.05), 0 16px 40px -16px rgba(11, 31, 58, 0.18)",
  sidebar:
    "0 1px 2px 0 rgba(11, 31, 58, 0.10), 0 24px 48px -16px rgba(11, 31, 58, 0.30)",
} as const;

export const surface = {
  canvas: "#F4F5F7",
  panel: "#FFFFFF",
  panelMuted: "#F8FAFC",
  sidebarBg: "#0B1F3A",
  sidebarHoverBg: "#162E4A",
  sidebarBorder: "#1B3358",
} as const;

export const sidebar = {
  bg: surface.sidebarBg,
  hoverBg: surface.sidebarHoverBg,
  idle: "#9DB0CB",
  active: "#FFFFFF",
  accent: "#F97316",
} as const;

export const ink = {
  primary: "#0B1F3A",
  secondary: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
} as const;

export const accent = {
  blue: "#2563EB",
  orange: "#F97316",
  teal: "#14B8A6",
  purple: "#7C3AED",
  amber: "#F59E0B",
} as const;

/**
 * CSS-variable representation. Used by `app/globals.css` to project
 * a few of these values into `:root` so non-Tailwind contexts
 * (e.g. third-party Leaflet styles) can reference them.
 */
export const cssTokens = {
  "--canvas": surface.canvas,
  "--panel": surface.panel,
  "--sidebar-bg": surface.sidebarBg,
  "--sidebar-hover-bg": surface.sidebarHoverBg,
  "--sidebar-idle": sidebar.idle,
  "--sidebar-active": sidebar.active,
  "--sidebar-accent": sidebar.accent,
  "--ink": ink.primary,
  "--ink-secondary": ink.secondary,
  "--ink-muted": ink.muted,
  "--ink-border": ink.border,
  "--accent-blue": accent.blue,
  "--accent-orange": accent.orange,
  "--accent-teal": accent.teal,
  "--accent-purple": accent.purple,
  "--accent-amber": accent.amber,
  "--shadow-card": shadow.card,
  "--shadow-card-hover": shadow.cardHover,
  "--shadow-panel": shadow.panel,
  "--shadow-sidebar": shadow.sidebar,
} as const;

export const tokens = { radius, shadow, surface, sidebar, ink, accent } as const;
export type DesignTokens = typeof tokens;
