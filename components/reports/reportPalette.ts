// Shared chart palette for the ACE Reports Intelligence section.
// Mirrors tokens used elsewhere (mapStyles + SurveyDashboard) so charts feel
// like part of the same system instead of one-off visualisations.
export const REPORT_PALETTE = {
  navy: "#1E4E8C",
  navyDeep: "#0B1F3A",
  blueBright: "#2563EB",
  turquoise: "#2FB7B2",
  teal: "#14B8A6",
  green: "#0B7A4A",
  orange: "#F05A28",
  amber: "#F59E0B",
  purple: "#7C3AED",
  cyan: "#0891B2",
  slate: "#94A3B8",
  border: "#E2E8F0",
  ink: "#0F172A",
  muted: "#5E6B7A",
} as const;

export const SECTOR_COLORS: Record<string, string> = {
  "agribusiness-agtech": REPORT_PALETTE.green,
  "automotive": REPORT_PALETTE.orange,
  "connectivity-digital": REPORT_PALETTE.blueBright,
  "startup-innovation": REPORT_PALETTE.purple,
  "life-sciences": REPORT_PALETTE.teal,
};

export const CHART_ANIMATION = {
  isAnimationActive: true,
  animationDuration: 1100,
  animationEasing: "ease-out",
} as const;
