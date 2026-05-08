import type { Country } from "@/types";

// Countries across the Americas (and select international hosts) relevant to ACE.
// Counts are derived from the other datasets in /data and kept in sync.
export const countries: Country[] = [
  // North America
  { id: "us", name: "United States", isoCode: "USA", region: "North America", coordinates: { lat: 39.5, lng: -98.35 }, aceEditionsCount: 13, participantsCount: 173, citiesCount: 16, institutionsCount: 14, hasHostedEdition: true },
  { id: "ca", name: "Canada", isoCode: "CAN", region: "North America", coordinates: { lat: 56.13, lng: -106.35 }, aceEditionsCount: 1, participantsCount: 33, citiesCount: 1, institutionsCount: 2, hasHostedEdition: true },
  { id: "mx", name: "Mexico", isoCode: "MEX", region: "North America", coordinates: { lat: 23.63, lng: -102.55 }, aceEditionsCount: 1, participantsCount: 88, citiesCount: 2, institutionsCount: 3, hasHostedEdition: true },

  // Central America
  { id: "gt", name: "Guatemala", isoCode: "GTM", region: "Central America", coordinates: { lat: 15.78, lng: -90.23 }, aceEditionsCount: 0, participantsCount: 25, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "bz", name: "Belize", isoCode: "BLZ", region: "Central America", coordinates: { lat: 17.19, lng: -88.50 }, aceEditionsCount: 0, participantsCount: 10, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "hn", name: "Honduras", isoCode: "HND", region: "Central America", coordinates: { lat: 15.20, lng: -86.24 }, aceEditionsCount: 0, participantsCount: 8, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "sv", name: "El Salvador", isoCode: "SLV", region: "Central America", coordinates: { lat: 13.79, lng: -88.90 }, aceEditionsCount: 0, participantsCount: 13, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "cr", name: "Costa Rica", isoCode: "CRI", region: "Central America", coordinates: { lat: 9.75, lng: -83.75 }, aceEditionsCount: 0, participantsCount: 18, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "pa", name: "Panama", isoCode: "PAN", region: "Central America", coordinates: { lat: 8.54, lng: -80.78 }, aceEditionsCount: 1, participantsCount: 22, citiesCount: 1, institutionsCount: 2, hasHostedEdition: true },

  // Caribbean
  { id: "do", name: "Dominican Republic", isoCode: "DOM", region: "Caribbean", coordinates: { lat: 18.74, lng: -70.16 }, aceEditionsCount: 0, participantsCount: 12, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "ht", name: "Haiti", isoCode: "HTI", region: "Caribbean", coordinates: { lat: 18.97, lng: -72.28 }, aceEditionsCount: 0, participantsCount: 6, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "jm", name: "Jamaica", isoCode: "JAM", region: "Caribbean", coordinates: { lat: 18.11, lng: -77.28 }, aceEditionsCount: 0, participantsCount: 20, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "tt", name: "Trinidad & Tobago", isoCode: "TTO", region: "Caribbean", coordinates: { lat: 10.69, lng: -61.22 }, aceEditionsCount: 0, participantsCount: 13, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "bs", name: "The Bahamas", isoCode: "BHS", region: "Caribbean", coordinates: { lat: 25.03, lng: -77.40 }, aceEditionsCount: 0, participantsCount: 15, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "bb", name: "Barbados", isoCode: "BRB", region: "Caribbean", coordinates: { lat: 13.19, lng: -59.54 }, aceEditionsCount: 0, participantsCount: 17, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "lc", name: "St. Lucia", isoCode: "LCA", region: "Caribbean", coordinates: { lat: 13.91, lng: -60.98 }, aceEditionsCount: 0, participantsCount: 12, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "gd", name: "Grenada", isoCode: "GRD", region: "Caribbean", coordinates: { lat: 12.11, lng: -61.68 }, aceEditionsCount: 0, participantsCount: 1, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "kn", name: "St. Kitts & Nevis", isoCode: "KNA", region: "Caribbean", coordinates: { lat: 17.35, lng: -62.78 }, aceEditionsCount: 0, participantsCount: 1, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "ag", name: "Antigua & Barbuda", isoCode: "ATG", region: "Caribbean", coordinates: { lat: 17.06, lng: -61.80 }, aceEditionsCount: 0, participantsCount: 1, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "dm", name: "Dominica", isoCode: "DMA", region: "Caribbean", coordinates: { lat: 15.41, lng: -61.37 }, aceEditionsCount: 0, participantsCount: 6, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },

  // South America
  { id: "co", name: "Colombia", isoCode: "COL", region: "South America", coordinates: { lat: 4.57, lng: -74.30 }, aceEditionsCount: 0, participantsCount: 55, citiesCount: 0, institutionsCount: 1, hasHostedEdition: false },
  { id: "pe", name: "Peru", isoCode: "PER", region: "South America", coordinates: { lat: -9.19, lng: -75.02 }, aceEditionsCount: 0, participantsCount: 13, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "cl", name: "Chile", isoCode: "CHL", region: "South America", coordinates: { lat: -35.68, lng: -71.54 }, aceEditionsCount: 1, participantsCount: 11, citiesCount: 2, institutionsCount: 3, hasHostedEdition: true },
  { id: "ar", name: "Argentina", isoCode: "ARG", region: "South America", coordinates: { lat: -38.42, lng: -63.62 }, aceEditionsCount: 2, participantsCount: 23, citiesCount: 1, institutionsCount: 3, hasHostedEdition: true },
  { id: "br", name: "Brazil", isoCode: "BRA", region: "South America", coordinates: { lat: -14.24, lng: -51.93 }, aceEditionsCount: 1, participantsCount: 36, citiesCount: 1, institutionsCount: 2, hasHostedEdition: true },
  { id: "ec", name: "Ecuador", isoCode: "ECU", region: "South America", coordinates: { lat: -1.83, lng: -78.18 }, aceEditionsCount: 1, participantsCount: 49, citiesCount: 2, institutionsCount: 2, hasHostedEdition: true },
  { id: "uy", name: "Uruguay", isoCode: "URY", region: "South America", coordinates: { lat: -32.52, lng: -55.77 }, aceEditionsCount: 0, participantsCount: 17, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "py", name: "Paraguay", isoCode: "PRY", region: "South America", coordinates: { lat: -23.44, lng: -58.44 }, aceEditionsCount: 0, participantsCount: 19, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "bo", name: "Bolivia", isoCode: "BOL", region: "South America", coordinates: { lat: -16.29, lng: -63.59 }, aceEditionsCount: 0, participantsCount: 2, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "gy", name: "Guyana", isoCode: "GUY", region: "South America", coordinates: { lat: 4.86, lng: -58.93 }, aceEditionsCount: 0, participantsCount: 3, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "sr", name: "Suriname", isoCode: "SUR", region: "South America", coordinates: { lat: 3.92, lng: -56.03 }, aceEditionsCount: 0, participantsCount: 3, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },

  // Europe
  { id: "es", name: "Spain", isoCode: "ESP", region: "Europe", coordinates: { lat: 40.46, lng: -3.75 }, aceEditionsCount: 0, participantsCount: 3, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "de", name: "Germany", isoCode: "DEU", region: "Europe", coordinates: { lat: 51.17, lng: 10.45 }, aceEditionsCount: 1, participantsCount: 11, citiesCount: 0, institutionsCount: 0, hasHostedEdition: true },
  { id: "gb", name: "United Kingdom", isoCode: "GBR", region: "Europe", coordinates: { lat: 55.38, lng: -3.44 }, aceEditionsCount: 0, participantsCount: 3, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "no", name: "Norway", isoCode: "NOR", region: "Europe", coordinates: { lat: 60.47, lng: 8.47 }, aceEditionsCount: 0, participantsCount: 1, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "ee", name: "Estonia", isoCode: "EST", region: "Europe", coordinates: { lat: 58.60, lng: 25.01 }, aceEditionsCount: 0, participantsCount: 1, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "cy", name: "Cyprus", isoCode: "CYP", region: "Europe", coordinates: { lat: 35.13, lng: 33.43 }, aceEditionsCount: 0, participantsCount: 2, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },

  // Asia / Middle East / Caucasus
  { id: "il", name: "Israel", isoCode: "ISR", region: "Asia", coordinates: { lat: 31.05, lng: 34.85 }, aceEditionsCount: 1, participantsCount: 5, citiesCount: 0, institutionsCount: 0, hasHostedEdition: true },
  { id: "am", name: "Armenia", isoCode: "ARM", region: "Asia", coordinates: { lat: 40.07, lng: 45.04 }, aceEditionsCount: 1, participantsCount: 5, citiesCount: 0, institutionsCount: 0, hasHostedEdition: true },
  { id: "kr", name: "South Korea", isoCode: "KOR", region: "Asia", coordinates: { lat: 35.91, lng: 127.77 }, aceEditionsCount: 0, participantsCount: 5, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "sa", name: "Saudi Arabia", isoCode: "SAU", region: "Asia", coordinates: { lat: 23.89, lng: 45.08 }, aceEditionsCount: 0, participantsCount: 3, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
  { id: "ge", name: "Georgia", isoCode: "GEO", region: "Asia", coordinates: { lat: 42.32, lng: 43.36 }, aceEditionsCount: 0, participantsCount: 1, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },

  // International organizations + multinational entities that aren't a single country.
  // Kept as a catch-all for alumni from OAS, IDB, CAF, Walmart, etc.
  { id: "intl", name: "International organizations", isoCode: "INT", region: "North America", coordinates: { lat: 48.85, lng: 10.0 }, aceEditionsCount: 0, participantsCount: 44, citiesCount: 0, institutionsCount: 0, hasHostedEdition: false },
];

export const countryById = (id: string) => countries.find(c => c.id === id);
export const countryByName = (name: string) => countries.find(c => c.name.toLowerCase() === name.toLowerCase());
