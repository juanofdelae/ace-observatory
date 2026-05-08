import type { City } from "@/types";

// Host cities across all 23 ACE editions.
// IDs are stable slugs. stateId only present for US hosts.
// cityIds lists are intentionally shallow here; richer relations are expressed
// in editions.ts, visited-sites.ts and institutions.ts.
export const cities: City[] = [
  // --- United States ---
  { id: "city-atlanta", name: "Atlanta", countryId: "us", stateId: "us-ga", coordinates: { lat: 33.749, lng: -84.388 }, editionIds: ["ace-1-southeast-2014"], visitedSiteIds: ["site-georgia-tech", "site-atlanta-tech-village"], participantIds: [], institutionIds: ["inst-georgia-tech", "inst-atlanta-tech-village"], outcomeIds: ["outcome-1"], mediaIds: ["media-ace1-photos"] },
  { id: "city-charlotte", name: "Charlotte", countryId: "us", stateId: "us-nc", coordinates: { lat: 35.227, lng: -80.843 }, editionIds: ["ace-1-southeast-2014"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-charleston", name: "Charleston", countryId: "us", stateId: "us-sc", coordinates: { lat: 32.776, lng: -79.931 }, editionIds: ["ace-1-southeast-2014"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-minneapolis", name: "Minneapolis", countryId: "us", stateId: "us-mn", coordinates: { lat: 44.978, lng: -93.263 }, editionIds: ["ace-3-midwest-2015"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-milwaukee", name: "Milwaukee", countryId: "us", stateId: "us-wi", coordinates: { lat: 43.039, lng: -87.906 }, editionIds: ["ace-3-midwest-2015"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-chicago", name: "Chicago", countryId: "us", stateId: "us-il", coordinates: { lat: 41.878, lng: -87.630 }, editionIds: ["ace-3-midwest-2015", "ace-20-illinois-2025"], visitedSiteIds: ["site-mhub-chicago", "site-argonne"], participantIds: [], institutionIds: ["inst-mhub", "inst-argonne"], outcomeIds: ["outcome-20"], mediaIds: ["media-ace20-photos"] },
  { id: "city-champaign", name: "Champaign", countryId: "us", stateId: "us-il", coordinates: { lat: 40.116, lng: -88.243 }, editionIds: ["ace-20-illinois-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-urbana", name: "Urbana", countryId: "us", stateId: "us-il", coordinates: { lat: 40.110, lng: -88.207 }, editionIds: ["ace-20-illinois-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-joliet", name: "Joliet", countryId: "us", stateId: "us-il", coordinates: { lat: 41.525, lng: -88.082 }, editionIds: ["ace-20-illinois-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-naperville", name: "Naperville", countryId: "us", stateId: "us-il", coordinates: { lat: 41.785, lng: -88.147 }, editionIds: ["ace-20-illinois-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-peoria", name: "Peoria", countryId: "us", stateId: "us-il", coordinates: { lat: 40.694, lng: -89.589 }, editionIds: ["ace-20-illinois-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-phoenix", name: "Phoenix", countryId: "us", stateId: "us-az", coordinates: { lat: 33.449, lng: -112.074 }, editionIds: ["ace-5-arizona-california-2016"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-san-francisco", name: "San Francisco", countryId: "us", stateId: "us-ca", coordinates: { lat: 37.7749, lng: -122.4194 }, editionIds: ["ace-5-arizona-california-2016", "ace-10-northern-california-2018"], visitedSiteIds: ["site-plug-and-play", "site-stanford"], participantIds: [], institutionIds: ["inst-plug-and-play", "inst-stanford"], outcomeIds: ["outcome-10"], mediaIds: ["media-ace10-photos"] },
  { id: "city-los-angeles", name: "Los Angeles", countryId: "us", stateId: "us-ca", coordinates: { lat: 34.052, lng: -118.244 }, editionIds: ["ace-5-arizona-california-2016"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-austin", name: "Austin", countryId: "us", stateId: "us-tx", coordinates: { lat: 30.267, lng: -97.743 }, editionIds: ["ace-7-texas-2017"], visitedSiteIds: ["site-capital-factory"], participantIds: [], institutionIds: ["inst-capital-factory"], outcomeIds: [], mediaIds: ["media-ace7-photos"] },
  { id: "city-miami", name: "Miami", countryId: "us", stateId: "us-fl", coordinates: { lat: 25.761, lng: -80.191 }, editionIds: ["ace-8-florida-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-san-juan", name: "San Juan", countryId: "us", stateId: "us-pr", coordinates: { lat: 18.466, lng: -66.105 }, editionIds: ["ace-11-puerto-rico-2019"], visitedSiteIds: ["site-parallel18"], participantIds: [], institutionIds: ["inst-parallel18"], outcomeIds: ["outcome-11"], mediaIds: ["media-ace11-photos"] },
  { id: "city-denver", name: "Denver", countryId: "us", stateId: "us-co", coordinates: { lat: 39.739, lng: -104.990 }, editionIds: ["ace-13-colorado-2021"], visitedSiteIds: ["site-nrel"], participantIds: [], institutionIds: ["inst-nrel"], outcomeIds: ["outcome-13"], mediaIds: ["media-ace13-photos"] },
  { id: "city-colorado-springs", name: "Colorado Springs", countryId: "us", stateId: "us-co", coordinates: { lat: 38.834, lng: -104.821 }, editionIds: ["ace-13-colorado-2021"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-jefferson-county", name: "Jefferson County", countryId: "us", stateId: "us-co", coordinates: { lat: 39.580, lng: -105.196 }, editionIds: ["ace-13-colorado-2021"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-new-orleans", name: "New Orleans", countryId: "us", stateId: "us-la", coordinates: { lat: 29.951, lng: -90.071 }, editionIds: ["ace-14-louisiana-2022"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-seattle", name: "Seattle", countryId: "us", stateId: "us-wa", coordinates: { lat: 47.606, lng: -122.332 }, editionIds: ["ace-16-seattle-2023"], visitedSiteIds: ["site-uw-seattle", "site-amazon-hq"], participantIds: [], institutionIds: ["inst-uw-seattle", "inst-amazon"], outcomeIds: ["outcome-16"], mediaIds: ["media-ace16-photos"] },
  { id: "city-detroit", name: "Detroit", countryId: "us", stateId: "us-mi", coordinates: { lat: 42.331, lng: -83.046 }, editionIds: ["ace-18-michigan-2024"], visitedSiteIds: ["site-michigan-central"], participantIds: [], institutionIds: ["inst-michigan-central"], outcomeIds: ["outcome-18"], mediaIds: ["media-ace18-photos"] },
  { id: "city-memphis", name: "Memphis", countryId: "us", stateId: "us-tn", coordinates: { lat: 35.149, lng: -90.048 }, editionIds: ["ace-23-memphis-2026"], visitedSiteIds: ["site-edge-memphis", "site-uofmemphis", "site-stjude", "site-fedex-wh"], participantIds: [], institutionIds: ["inst-edge-memphis", "inst-uofmemphis", "inst-stjude", "inst-fedex"], outcomeIds: [], mediaIds: ["media-ace23-photos", "media-ace23-banner"] },
  { id: "city-washington-dc", name: "Washington D.C.", countryId: "us", stateId: "us-dc", coordinates: { lat: 38.907, lng: -77.036 }, editionIds: [], visitedSiteIds: [], participantIds: [], institutionIds: ["inst-oas", "inst-idb"], outcomeIds: [], mediaIds: [] },

  // --- Canada ---
  { id: "city-toronto", name: "Toronto", countryId: "ca", coordinates: { lat: 43.651, lng: -79.347 }, editionIds: ["ace-6-ontario-2016"], visitedSiteIds: ["site-mars-toronto"], participantIds: [], institutionIds: ["inst-mars"], outcomeIds: ["outcome-6"], mediaIds: ["media-ace6-photos"] },

  // --- Mexico ---
  { id: "city-mexico-city", name: "Mexico City", countryId: "mx", coordinates: { lat: 19.432, lng: -99.133 }, editionIds: ["ace-2-mexico-2014"], visitedSiteIds: ["site-tec-cdmx"], participantIds: [], institutionIds: ["inst-tec-monterrey"], outcomeIds: ["outcome-2"], mediaIds: ["media-ace2-photos"] },
  { id: "city-guadalajara", name: "Guadalajara", countryId: "mx", coordinates: { lat: 20.659, lng: -103.349 }, editionIds: ["ace-2-mexico-2014"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // --- Panama ---
  { id: "city-panama-city", name: "Panama City", countryId: "pa", coordinates: { lat: 8.984, lng: -79.518 }, editionIds: ["ace-17-panama-2024"], visitedSiteIds: ["site-ciudad-saber"], participantIds: [], institutionIds: ["inst-ciudad-saber", "inst-canal-panama"], outcomeIds: ["outcome-17"], mediaIds: ["media-ace17-photos"] },

  // --- Chile ---
  { id: "city-santiago", name: "Santiago", countryId: "cl", coordinates: { lat: -33.449, lng: -70.669 }, editionIds: ["ace-12-chile-2019"], visitedSiteIds: ["site-start-up-chile", "site-corfo"], participantIds: [], institutionIds: ["inst-start-up-chile", "inst-corfo"], outcomeIds: ["outcome-12"], mediaIds: ["media-ace12-photos"] },
  { id: "city-valparaiso", name: "Valparaíso", countryId: "cl", coordinates: { lat: -33.047, lng: -71.619 }, editionIds: ["ace-12-chile-2019"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // --- Argentina ---
  { id: "city-cordoba", name: "Córdoba", countryId: "ar", coordinates: { lat: -31.420, lng: -64.188 }, editionIds: ["ace-4-cordoba-2015", "ace-22-cordoba-2025"], visitedSiteIds: ["site-cordoba-tech-cluster", "site-inviap"], participantIds: [], institutionIds: ["inst-cordoba-tech-cluster"], outcomeIds: ["outcome-4", "outcome-22"], mediaIds: ["media-ace4-photos", "media-ace22-photos"] },
  // ACE 22 Córdoba 2025 — additional towns visited by the delegation.
  { id: "city-san-francisco-ar", name: "San Francisco (Córdoba)", countryId: "ar", coordinates: { lat: -31.428, lng: -62.083 }, editionIds: ["ace-22-cordoba-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-arroyito", name: "Arroyito", countryId: "ar", coordinates: { lat: -31.418, lng: -63.054 }, editionIds: ["ace-22-cordoba-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-general-cabrera", name: "General Cabrera", countryId: "ar", coordinates: { lat: -32.819, lng: -63.879 }, editionIds: ["ace-22-cordoba-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-rio-cuarto", name: "Río Cuarto", countryId: "ar", coordinates: { lat: -33.130, lng: -64.349 }, editionIds: ["ace-22-cordoba-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-villa-maria", name: "Villa María", countryId: "ar", coordinates: { lat: -32.408, lng: -63.240 }, editionIds: ["ace-22-cordoba-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-general-deheza", name: "General Deheza", countryId: "ar", coordinates: { lat: -32.755, lng: -63.789 }, editionIds: ["ace-22-cordoba-2025"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // --- Brazil ---
  { id: "city-belem", name: "Belém", countryId: "br", coordinates: { lat: -1.456, lng: -48.504 }, editionIds: ["ace-21-belem-2025"], visitedSiteIds: ["site-ufpa"], participantIds: [], institutionIds: ["inst-ufpa"], outcomeIds: ["outcome-21"], mediaIds: ["media-ace21-photos"] },

  // --- Ecuador ---
  { id: "city-quito", name: "Quito", countryId: "ec", coordinates: { lat: -0.180, lng: -78.467 }, editionIds: ["ace-15-ecuador-2022"], visitedSiteIds: ["site-yachay"], participantIds: [], institutionIds: ["inst-yachay"], outcomeIds: ["outcome-15"], mediaIds: ["media-ace15-photos"] },
  { id: "city-guayaquil", name: "Guayaquil", countryId: "ec", coordinates: { lat: -2.170, lng: -79.922 }, editionIds: ["ace-15-ecuador-2022"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // --- Germany (ACE 9 special edition) ---
  { id: "city-berlin", name: "Berlin", countryId: "de", coordinates: { lat: 52.5200, lng: 13.4050 }, editionIds: ["ace-9-germany-israel-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-dresden", name: "Dresden", countryId: "de", coordinates: { lat: 51.0504, lng: 13.7373 }, editionIds: ["ace-9-germany-israel-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-munich", name: "Munich", countryId: "de", coordinates: { lat: 48.1351, lng: 11.5820 }, editionIds: ["ace-9-germany-israel-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // --- Israel (ACE 9 special edition) ---
  { id: "city-tel-aviv", name: "Tel Aviv", countryId: "il", coordinates: { lat: 32.0853, lng: 34.7818 }, editionIds: ["ace-9-germany-israel-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-jerusalem", name: "Jerusalem", countryId: "il", coordinates: { lat: 31.7683, lng: 35.2137 }, editionIds: ["ace-9-germany-israel-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-haifa", name: "Haifa", countryId: "il", coordinates: { lat: 32.7940, lng: 34.9896 }, editionIds: ["ace-9-germany-israel-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-yavne", name: "Yavne", countryId: "il", coordinates: { lat: 31.8777, lng: 34.7400 }, editionIds: ["ace-9-germany-israel-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // --- Armenia (ACE 19 special edition) ---
  { id: "city-yerevan", name: "Yerevan", countryId: "am", coordinates: { lat: 40.1792, lng: 44.4991 }, editionIds: ["ace-19-armenia-2024"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-gyumri", name: "Gyumri", countryId: "am", coordinates: { lat: 40.7833, lng: 43.8419 }, editionIds: ["ace-19-armenia-2024"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // ──────────────────────────────────────────────────────────────────
  //  Cities + regions ingested from the analyst structures (Wave 1)
  //  ACE 3 · 7 · 8 · 9 · 10 · 14 (Louisiana)
  //  Lat/lng = approximate city centroid. Regions get their geographic
  //  center (Acadiana → SW Louisiana, Silicon Valley → Mountain View).
  // ──────────────────────────────────────────────────────────────────

  // ACE 3 — US Midwest (Minnesota, Wisconsin, Illinois)
  { id: "city-rochester", name: "Rochester", countryId: "us", stateId: "us-mn", coordinates: { lat: 44.0121, lng: -92.4802 }, editionIds: ["ace-3-midwest-2015"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-la-crosse", name: "La Crosse", countryId: "us", stateId: "us-wi", coordinates: { lat: 43.8014, lng: -91.2396 }, editionIds: ["ace-3-midwest-2015"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-viroqua", name: "Viroqua", countryId: "us", stateId: "us-wi", coordinates: { lat: 43.5572, lng: -90.8893 }, editionIds: ["ace-3-midwest-2015"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-westby", name: "Westby", countryId: "us", stateId: "us-wi", coordinates: { lat: 43.6592, lng: -90.8557 }, editionIds: ["ace-3-midwest-2015"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-gays-mills", name: "Gays Mills", countryId: "us", stateId: "us-wi", coordinates: { lat: 43.3163, lng: -90.8526 }, editionIds: ["ace-3-midwest-2015"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-madison", name: "Madison", countryId: "us", stateId: "us-wi", coordinates: { lat: 43.0731, lng: -89.4012 }, editionIds: ["ace-3-midwest-2015"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // ACE 7 — Central Texas
  { id: "city-san-antonio", name: "San Antonio", countryId: "us", stateId: "us-tx", coordinates: { lat: 29.4241, lng: -98.4936 }, editionIds: ["ace-7-texas-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-new-braunfels", name: "New Braunfels", countryId: "us", stateId: "us-tx", coordinates: { lat: 29.7030, lng: -98.1245 }, editionIds: ["ace-7-texas-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-fredericksburg", name: "Fredericksburg", countryId: "us", stateId: "us-tx", coordinates: { lat: 30.2752, lng: -98.8720 }, editionIds: ["ace-7-texas-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-san-marcos", name: "San Marcos", countryId: "us", stateId: "us-tx", coordinates: { lat: 29.8833, lng: -97.9414 }, editionIds: ["ace-7-texas-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-college-station", name: "College Station", countryId: "us", stateId: "us-tx", coordinates: { lat: 30.6280, lng: -96.3344 }, editionIds: ["ace-7-texas-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // ACE 8 — North-Central Florida
  { id: "city-orlando", name: "Orlando", countryId: "us", stateId: "us-fl", coordinates: { lat: 28.5383, lng: -81.3792 }, editionIds: ["ace-8-florida-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-melbourne-fl", name: "Melbourne", countryId: "us", stateId: "us-fl", coordinates: { lat: 28.0836, lng: -80.6081 }, editionIds: ["ace-8-florida-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-cape-canaveral", name: "Cape Canaveral", countryId: "us", stateId: "us-fl", coordinates: { lat: 28.4055, lng: -80.6045 }, editionIds: ["ace-8-florida-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-palm-coast", name: "Palm Coast", countryId: "us", stateId: "us-fl", coordinates: { lat: 29.5847, lng: -81.2078 }, editionIds: ["ace-8-florida-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-st-augustine", name: "St. Augustine", countryId: "us", stateId: "us-fl", coordinates: { lat: 29.9012, lng: -81.3124 }, editionIds: ["ace-8-florida-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-gainesville", name: "Gainesville", countryId: "us", stateId: "us-fl", coordinates: { lat: 29.6516, lng: -82.3248 }, editionIds: ["ace-8-florida-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-tallahassee", name: "Tallahassee", countryId: "us", stateId: "us-fl", coordinates: { lat: 30.4383, lng: -84.2807 }, editionIds: ["ace-8-florida-2017"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // ACE 9 — Israel additional towns
  { id: "city-caesarea", name: "Caesarea", countryId: "il", coordinates: { lat: 32.5051, lng: 34.9035 }, editionIds: ["ace-9-germany-israel-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-hadera", name: "Hadera", countryId: "il", coordinates: { lat: 32.4376, lng: 34.9196 }, editionIds: ["ace-9-germany-israel-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // ACE 10 — Northern California (regions + cities)
  { id: "city-silicon-valley", name: "Silicon Valley", countryId: "us", stateId: "us-ca", coordinates: { lat: 37.3875, lng: -122.0575 }, editionIds: ["ace-10-northern-california-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-monterey-bay", name: "Monterey Bay Area", countryId: "us", stateId: "us-ca", coordinates: { lat: 36.6177, lng: -121.9166 }, editionIds: ["ace-10-northern-california-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-los-banos", name: "Los Banos", countryId: "us", stateId: "us-ca", coordinates: { lat: 37.0583, lng: -120.8499 }, editionIds: ["ace-10-northern-california-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-fresno", name: "Fresno / Central Valley", countryId: "us", stateId: "us-ca", coordinates: { lat: 36.7378, lng: -119.7871 }, editionIds: ["ace-10-northern-california-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-sacramento", name: "Sacramento", countryId: "us", stateId: "us-ca", coordinates: { lat: 38.5816, lng: -121.4944 }, editionIds: ["ace-10-northern-california-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-davis", name: "Davis", countryId: "us", stateId: "us-ca", coordinates: { lat: 38.5449, lng: -121.7405 }, editionIds: ["ace-10-northern-california-2018"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },

  // ACE 14 — Louisiana
  { id: "city-baton-rouge", name: "Baton Rouge", countryId: "us", stateId: "us-la", coordinates: { lat: 30.4515, lng: -91.1871 }, editionIds: ["ace-14-louisiana-2022"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-lafayette", name: "Lafayette", countryId: "us", stateId: "us-la", coordinates: { lat: 30.2241, lng: -92.0198 }, editionIds: ["ace-14-louisiana-2022"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
  { id: "city-acadiana", name: "Acadiana", countryId: "us", stateId: "us-la", coordinates: { lat: 30.0070, lng: -92.0200 }, editionIds: ["ace-14-louisiana-2022"], visitedSiteIds: [], participantIds: [], institutionIds: [], outcomeIds: [], mediaIds: [] },
];

export const cityById = (id: string) => cities.find(c => c.id === id);
export const citiesByCountry = (countryId: string) => cities.filter(c => c.countryId === countryId);
export const citiesByState = (stateId: string) => cities.filter(c => c.stateId === stateId);
