// Barrel export — keeps page imports clean and ready for a single
// swap to Supabase queries in Phase 2 (same entity names, async loaders).
export * from "./sectors";
export * from "./countries";
export * from "./states";
export * from "./cities";
export * from "./editions";
export * from "./participants";
export * from "./organizers";
export * from "./organizations";
export * from "./visited-sites";
export * from "./outcomes";
export * from "./media";
export * from "./documents";
export * from "./reports";

// Hero-level stats — real numbers from ACE program materials.
export const ACE_HERO_STATS = {
  editions: 23,
  countries: 42,
  leaders: 1000,
  partnerships: 650,
};
