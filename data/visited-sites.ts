import type { VisitedSite } from "@/types";
import autoSitesRaw from "./_visited-sites-auto.json";
import wave2SitesRaw from "./_visited-sites-wave2.json";

// --- Hand-curated visited sites ----------------------------------------
// The entries below are hand-authored (with accurate lat/lng, stateId,
// website, etc.). They take precedence over auto-extracted sites with the
// same name when the two are merged at the bottom of this file.
const curatedSites: VisitedSite[] = [
  // Memphis 2026
  { id: "site-edge-memphis", name: "EDGE Memphis HQ", type: "Public Entity", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.139, lng: -90.049 }, sectorIds: ["sec-logistics", "sec-innovation"], description: "Host economic development authority for ACE XXIII.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], website: "https://growth-engine.org" },
  { id: "site-uofmemphis", name: "FedEx Institute of Technology — U of Memphis", type: "University", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.119, lng: -89.937 }, sectorIds: ["sec-talent", "sec-digital"], description: "Research and technology-commercialization hub at the University of Memphis.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [] },
  { id: "site-stjude", name: "St. Jude Children's Research Hospital", type: "Research Lab", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.153, lng: -90.036 }, sectorIds: ["sec-health"], description: "Pediatric oncology research hospital — global healthcare anchor.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], featuredSpeakers: [
    { name: "Dr. James R. Downing", title: "President & Chief Executive Officer" },
    { name: "Sue Harpole", title: "Senior Fellow (Former Chief Development Officer), ALSAC" },
    { name: "Dr. Carlos Rodriguez-Galindo", title: "Executive Vice President, St. Jude Global" },
  ] },
  { id: "site-fedex-wh", name: "FedEx SuperHub — Memphis International", type: "Company", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.044, lng: -89.976 }, sectorIds: ["sec-logistics"], description: "FedEx Express' main global air hub at Memphis International Airport.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [] },
  { id: "site-peabody-memphis", name: "The Peabody Memphis Hotel", type: "Company", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.1407, lng: -90.0524 }, sectorIds: [], description: "Historic downtown hotel; ACE Memphis HQ for registration, opening ceremony, executive lunches and the closing ceremony.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], website: "https://www.peabodymemphis.com", featuredSpeakers: [
    { name: "H.E. Albert R. Ramdin", title: "Secretary General of the Organization of American States" },
    { name: "Gwyn Fisher", title: "Chief Economic Development Officer, EDGE" },
    { name: "Doug McGowen", title: "CEO, Memphis Light Gas & Water" },
    { name: "Thaddeus McBride", title: "International Trade & Compliance, Bass Berry Sims" },
  ] },
  { id: "site-fedex-hq", name: "FedEx Executive Headquarters", type: "Company", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.1199, lng: -89.8517 }, sectorIds: ["sec-logistics", "sec-digital"], description: "FedEx global executive headquarters: Building Strategic Partnerships in Global Logistics — supply-chain, e-commerce and logistics technology session.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], website: "https://www.fedex.com" },
  { id: "site-orion-rooftop", name: "Orion Financial Rooftop", type: "Company", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.146, lng: -90.045 }, sectorIds: ["sec-entrepreneurship"], description: "Downtown rooftop reception co-hosted by the Mid-South Latino Chamber of Commerce and Orion Financial.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], featuredSpeakers: [
    { name: "Ashley McDurmon", title: "CEO, Orion Financial" },
    { name: "Alex Matlock", title: "President, Mid-South Latino Chamber of Commerce" },
  ] },
  { id: "site-ncrm", name: "National Civil Rights Museum", type: "Public Entity", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.134, lng: -90.057 }, sectorIds: ["sec-talent"], description: "Civil rights history museum at the Lorraine Motel. Lunch and panel discussion on social justice and economic mobility.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], website: "https://civilrightsmuseum.org", featuredSpeakers: [
    { name: "Russell Wigginton", title: "President, National Civil Rights Museum" },
  ] },
  { id: "site-epicenter-memphis", name: "Epicenter", type: "Innovation Center", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.1303, lng: -90.0524 }, sectorIds: ["sec-entrepreneurship", "sec-innovation", "sec-digital"], description: "Memphis startup and innovation ecosystem builder — accelerators, pitch events and ecosystem-building initiatives across logistics, medical devices and emerging tech.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], website: "https://epicentermemphis.org", featuredSpeakers: [
    { name: "Anthony Young", title: "CEO, Epicenter" },
    { name: "Nate Smith", title: "Director of Programs, Epicenter" },
  ] },
  { id: "site-fedex-forum", name: "FedEx Forum — Pinnacle Room", type: "Company", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.138, lng: -90.050 }, sectorIds: ["sec-innovation"], description: "Innovation Showcase venue: ecosystem leaders and Memphis founders presenting cross-border collaboration opportunities across the Western Hemisphere.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], featuredSpeakers: [
    { name: "Erika Dillard", title: "PopCheck Technologies, Inc., Memphis" },
    { name: "Jillian Friot", title: "Venture Builders Fund, Memphis" },
    { name: "Jee Vahn Knight", title: "Tourism, USA" },
    { name: "Patrick Van Pelt", title: "Altravia Venture Studio, USA" },
    { name: "Mary Angelica Pérez", title: "Yucatán State Development Agency, Mexico" },
  ] },
  { id: "site-dmc", name: "Downtown Memphis Commission", type: "Public Entity", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.144, lng: -90.052 }, sectorIds: ["sec-smart-cities"], description: "Downtown Action Plan: public safety, beautification, commercial redevelopment and Main Street pedestrian corridor revitalization.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], website: "https://downtownmemphis.com", featuredSpeakers: [
    { name: "Chandell Ryan", title: "CEO, Downtown Memphis Commission" },
    { name: "Brett Roler", title: "COO, Downtown Memphis Commission" },
  ] },
  { id: "site-tva", name: "Tennessee Valley Authority", type: "Public Entity", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.1219, lng: -89.9722 }, sectorIds: ["sec-clean-energy", "sec-smart-cities"], description: "Federal utility serving the Tennessee Valley — strategic initiatives across energy, environmental sustainability and regional economic development.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], website: "https://www.tva.com", featuredSpeakers: [
    { name: "Latrivia Welch", title: "Manager, Government & Community Relations, Tennessee Valley Authority" },
    { name: "Jennifer Call", title: "Senior Program Manager, Environmental Compliance, Tennessee Valley Authority" },
    { name: "Eugene Johnson", title: "Regional Economic Development Consultant, Tennessee Valley Authority" },
  ] },
  { id: "site-rose-creek-farms", name: "Rose Creek Farms", type: "Company", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.165, lng: -88.594 }, sectorIds: ["sec-agrifood"], description: "Human-powered, no-till farm in Selmer, TN: nutrient-dense produce grown 52 weeks a year. AgInnovation field trials and discussion of the Delta rural economy.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [] },
  { id: "site-crosstown-concourse", name: "Crosstown Concourse", type: "Innovation Center", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.155, lng: -90.005 }, sectorIds: ["sec-smart-cities", "sec-talent"], description: "Adaptive reuse of the former Sears distribution center reopened in 2017: a vertical urban village combining health services, education, arts, small business, housing and collaborative workspaces.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], website: "https://crosstownconcourse.com", featuredSpeakers: [
    { name: "Todd Richardson", title: "President & CEO, Crosstown Concourse" },
    { name: "Erin Shelton", title: "Director of Marketing and Business Development, Crosstown Concourse" },
  ] },
  { id: "site-mim-bbq-fest", name: "Memphis in May International BBQ Festival", type: "Public Entity", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.144, lng: -90.061 }, sectorIds: [], description: "Iconic Memphis cultural festival at Tom Lee Park: curated BBQ Alley tasting and exchange with festival organizers and the honored country, Ireland.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [] },
  { id: "site-the-works", name: "The Works, Inc.", type: "Public Entity", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.1257, lng: -90.0470 }, sectorIds: ["sec-smart-cities", "sec-talent"], description: "Community development nonprofit driving housing security, food stability, health equity and financial empowerment, with a Code Crew partnership for STEM workforce pathways.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], website: "https://theworkscdc.org", featuredSpeakers: [
    { name: "Roshun Austin", title: "President & CEO, The Works" },
    { name: "Meka Egwuekwe", title: "CEO, Code Crew" },
  ] },
  { id: "site-orgill", name: "Orgill Innovation Center", type: "Company", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.193, lng: -89.851 }, sectorIds: ["sec-logistics", "sec-advanced-manufacturing"], description: "World's largest independently owned hardlines distributor — collaborative product testing, merchandising and retail innovation for independent retailers.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [], website: "https://orgill.com", featuredSpeakers: [
    { name: "Boyden Moore", title: "CEO, Orgill Innovation Center" },
    { name: "Greg Stine", title: "EVP of Marketing & Communications, Orgill Innovation Center" },
  ] },
  { id: "site-bass-pro-pyramid", name: "Bass Pro Pyramid", type: "Company", countryId: "us", stateId: "us-tn", cityId: "city-memphis", coordinates: { lat: 35.155, lng: -90.062 }, sectorIds: [], description: "535,000 sq ft Bass Pro Shop inside the Memphis Pyramid: immersive retail landmark with cypress trees, native Mississippi River fish exhibits and downtown river views.", relatedEditionIds: ["ace-23-memphis-2026"], mediaIds: [] },

  // Atlanta 2014
  { id: "site-georgia-tech", name: "Georgia Tech — Technology Square", type: "University", countryId: "us", stateId: "us-ga", cityId: "city-atlanta", coordinates: { lat: 33.777, lng: -84.389 }, sectorIds: ["sec-innovation"], description: "Research and innovation district anchoring midtown Atlanta.", relatedEditionIds: ["ace-1-southeast-2014"], mediaIds: [] },
  { id: "site-atlanta-tech-village", name: "Atlanta Tech Village", type: "Innovation Center", countryId: "us", stateId: "us-ga", cityId: "city-atlanta", coordinates: { lat: 33.843, lng: -84.370 }, sectorIds: ["sec-entrepreneurship"], description: "Startup hub in Buckhead, Atlanta.", relatedEditionIds: ["ace-1-southeast-2014"], mediaIds: [] },

  // Mexico 2014
  { id: "site-tec-cdmx", name: "Tecnológico de Monterrey — CDMX", type: "University", countryId: "mx", cityId: "city-mexico-city", coordinates: { lat: 19.435, lng: -99.130 }, sectorIds: ["sec-innovation", "sec-talent"], description: "Mexico City campus and entrepreneurship programs.", relatedEditionIds: ["ace-2-mexico-2014"], mediaIds: [] },

  // Córdoba
  { id: "site-cordoba-tech-cluster", name: "Córdoba Tech Cluster", type: "Cluster", countryId: "ar", cityId: "city-cordoba", coordinates: { lat: -31.417, lng: -64.183 }, sectorIds: ["sec-digital", "sec-talent"], description: "Tech industry cluster in Córdoba.", relatedEditionIds: ["ace-4-cordoba-2015", "ace-22-cordoba-2025"], mediaIds: [] },
  { id: "site-inviap", name: "INVIAP — Innovation Park", type: "Innovation Center", countryId: "ar", cityId: "city-cordoba", coordinates: { lat: -31.430, lng: -64.220 }, sectorIds: ["sec-innovation"], description: "Córdoba's public-private innovation park.", relatedEditionIds: ["ace-22-cordoba-2025"], mediaIds: [] },

  // Northern California
  { id: "site-plug-and-play", name: "Plug and Play Tech Center", type: "Innovation Center", countryId: "us", stateId: "us-ca", cityId: "city-san-francisco", coordinates: { lat: 37.389, lng: -122.081 }, sectorIds: ["sec-entrepreneurship", "sec-digital"], description: "Global innovation platform — Sunnyvale HQ.", relatedEditionIds: ["ace-10-northern-california-2018"], mediaIds: [] },
  { id: "site-stanford", name: "Stanford University — StartX", type: "University", countryId: "us", stateId: "us-ca", cityId: "city-san-francisco", coordinates: { lat: 37.428, lng: -122.170 }, sectorIds: ["sec-innovation"], description: "Stanford's research and entrepreneurship ecosystem.", relatedEditionIds: ["ace-10-northern-california-2018"], mediaIds: [] },

  // Austin
  { id: "site-capital-factory", name: "Capital Factory", type: "Innovation Center", countryId: "us", stateId: "us-tx", cityId: "city-austin", coordinates: { lat: 30.266, lng: -97.743 }, sectorIds: ["sec-entrepreneurship"], description: "Austin accelerator and startup hub.", relatedEditionIds: ["ace-7-texas-2017"], mediaIds: [] },

  // Puerto Rico
  { id: "site-parallel18", name: "Parallel18", type: "Innovation Center", countryId: "us", stateId: "us-pr", cityId: "city-san-juan", coordinates: { lat: 18.466, lng: -66.117 }, sectorIds: ["sec-entrepreneurship"], description: "Puerto Rico international accelerator.", relatedEditionIds: ["ace-11-puerto-rico-2019"], mediaIds: [] },

  // Colorado
  { id: "site-nrel", name: "NREL — National Renewable Energy Laboratory", type: "Research Lab", countryId: "us", stateId: "us-co", cityId: "city-denver", coordinates: { lat: 39.740, lng: -105.171 }, sectorIds: ["sec-clean-energy"], description: "Leading US clean-energy national lab.", relatedEditionIds: ["ace-13-colorado-2021"], mediaIds: [] },

  // Seattle
  { id: "site-uw-seattle", name: "University of Washington — CoMotion", type: "University", countryId: "us", stateId: "us-wa", cityId: "city-seattle", coordinates: { lat: 47.657, lng: -122.313 }, sectorIds: ["sec-innovation"], description: "UW's innovation and commercialization hub.", relatedEditionIds: ["ace-16-seattle-2023"], mediaIds: [] },
  { id: "site-amazon-hq", name: "Amazon HQ — Spheres", type: "Company", countryId: "us", stateId: "us-wa", cityId: "city-seattle", coordinates: { lat: 47.615, lng: -122.338 }, sectorIds: ["sec-digital"], description: "Amazon's iconic Seattle headquarters.", relatedEditionIds: ["ace-16-seattle-2023"], mediaIds: [] },

  // Panama
  { id: "site-ciudad-saber", name: "Ciudad del Saber", type: "Innovation Center", countryId: "pa", cityId: "city-panama-city", coordinates: { lat: 9.007, lng: -79.586 }, sectorIds: ["sec-innovation", "sec-smart-cities"], description: "International knowledge-city in former Clayton area.", relatedEditionIds: ["ace-17-panama-2024"], mediaIds: [] },

  // Michigan
  { id: "site-michigan-central", name: "Michigan Central Station", type: "Innovation Center", countryId: "us", stateId: "us-mi", cityId: "city-detroit", coordinates: { lat: 42.329, lng: -83.077 }, sectorIds: ["sec-advanced-manufacturing", "sec-digital"], description: "Ford's restored mobility-innovation district.", relatedEditionIds: ["ace-18-michigan-2024"], mediaIds: [] },

  // Illinois
  { id: "site-mhub-chicago", name: "mHUB Chicago", type: "Innovation Center", countryId: "us", stateId: "us-il", cityId: "city-chicago", coordinates: { lat: 41.898, lng: -87.657 }, sectorIds: ["sec-advanced-manufacturing"], description: "Physical-product innovation and hardtech incubator.", relatedEditionIds: ["ace-20-illinois-2025"], mediaIds: [] },
  { id: "site-argonne", name: "Argonne National Laboratory", type: "Research Lab", countryId: "us", stateId: "us-il", cityId: "city-chicago", coordinates: { lat: 41.710, lng: -87.983 }, sectorIds: ["sec-innovation", "sec-clean-energy"], description: "US Department of Energy multi-disciplinary lab.", relatedEditionIds: ["ace-20-illinois-2025"], mediaIds: [] },

  // Belém
  { id: "site-ufpa", name: "UFPA — Federal University of Pará", type: "University", countryId: "br", cityId: "city-belem", coordinates: { lat: -1.475, lng: -48.458 }, sectorIds: ["sec-agrifood", "sec-innovation"], description: "Anchor university for the Amazon bio-economy.", relatedEditionIds: ["ace-21-belem-2025"], mediaIds: [] },

  // Toronto
  { id: "site-mars-toronto", name: "MaRS Discovery District", type: "Innovation Center", countryId: "ca", cityId: "city-toronto", coordinates: { lat: 43.659, lng: -79.388 }, sectorIds: ["sec-innovation", "sec-health"], description: "Global innovation hub in downtown Toronto.", relatedEditionIds: ["ace-6-ontario-2016"], mediaIds: [] },

  // Chile
  { id: "site-start-up-chile", name: "Start-Up Chile HQ", type: "Innovation Center", countryId: "cl", cityId: "city-santiago", coordinates: { lat: -33.442, lng: -70.653 }, sectorIds: ["sec-entrepreneurship"], description: "Accelerator HQ in Santiago Centro.", relatedEditionIds: ["ace-12-chile-2019"], mediaIds: [] },
  { id: "site-corfo", name: "CORFO Headquarters", type: "Public Entity", countryId: "cl", cityId: "city-santiago", coordinates: { lat: -33.443, lng: -70.653 }, sectorIds: ["sec-innovation"], description: "Chile's economic development agency.", relatedEditionIds: ["ace-12-chile-2019"], mediaIds: [] },

  // Ecuador
  { id: "site-yachay", name: "Yachay Knowledge City", type: "University", countryId: "ec", cityId: "city-quito", coordinates: { lat: 0.376, lng: -78.156 }, sectorIds: ["sec-innovation", "sec-talent"], description: "Ecuador's ambitious knowledge-city initiative.", relatedEditionIds: ["ace-15-ecuador-2022"], mediaIds: [] },
];

// --- Auto-extracted sites ----------------------------------------------
// Generated by scripts/extract_sites_from_tripbooks.py — descriptions and
// hero images come straight from the trip-book PDFs. Only entries with
// confidence >= 5 AND an extracted image make it into the JSON consumed here.
const autoSites = autoSitesRaw as VisitedSite[];

// --- Wave 2 sites ------------------------------------------------------
// Generated by /tmp/generate_wave2_sites.py from the analyst's edition
// structures (ACE 8 / 9 / 10 / 11 / 12 / 14 Louisiana / 15 Ecuador / 16
// Seattle). Coordinates = city centroid + deterministic jitter so points
// don't stack — actual coords will be refined site-by-site in Wave 3.
const wave2Sites = wave2SitesRaw as VisitedSite[];

// Normalise a site name for cross-source dedup (curated wins on conflicts,
// then wave 2, then auto-extracted).
const nameKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const curatedKeys = new Set(curatedSites.map(s => nameKey(s.name)));
const wave2Keys = new Set(wave2Sites.map(s => nameKey(s.name)));

export const visitedSites: VisitedSite[] = [
  ...curatedSites,
  ...wave2Sites.filter(s => !curatedKeys.has(nameKey(s.name))),
  ...autoSites.filter(s => !curatedKeys.has(nameKey(s.name)) && !wave2Keys.has(nameKey(s.name))),
];

export const siteById = (id: string) => visitedSites.find(s => s.id === id);
export const sitesByCity = (cityId: string) => visitedSites.filter(s => s.cityId === cityId);
export const sitesByCountry = (countryId: string) => visitedSites.filter(s => s.countryId === countryId);
export const sitesByEdition = (editionId: string) => visitedSites.filter(s => s.relatedEditionIds.includes(editionId));
