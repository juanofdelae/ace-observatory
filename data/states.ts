import type { State } from "@/types";

// US states (and PR as a territory) that hosted at least one ACE edition.
// Puerto Rico is modeled as a US state so the Atlas drill-down (US → PR → San Juan)
// works consistently with the other state-level hosts.
export const states: State[] = [
  { id: "us-ga", name: "Georgia", countryId: "us", abbreviation: "GA",
    coordinates: { lat: 32.97, lng: -83.64 },
    cityIds: ["city-atlanta"], editionIds: ["ace-1-southeast-2014"] },

  { id: "us-nc", name: "North Carolina", countryId: "us", abbreviation: "NC",
    coordinates: { lat: 35.75, lng: -79.01 },
    cityIds: ["city-charlotte"], editionIds: ["ace-1-southeast-2014"] },

  { id: "us-sc", name: "South Carolina", countryId: "us", abbreviation: "SC",
    coordinates: { lat: 33.84, lng: -81.16 },
    cityIds: ["city-charleston"], editionIds: ["ace-1-southeast-2014"] },

  { id: "us-mn", name: "Minnesota", countryId: "us", abbreviation: "MN",
    coordinates: { lat: 46.39, lng: -94.64 },
    cityIds: ["city-minneapolis"], editionIds: ["ace-3-midwest-2015"] },

  { id: "us-wi", name: "Wisconsin", countryId: "us", abbreviation: "WI",
    coordinates: { lat: 44.27, lng: -89.62 },
    cityIds: ["city-milwaukee"], editionIds: ["ace-3-midwest-2015"] },

  { id: "us-il", name: "Illinois", countryId: "us", abbreviation: "IL",
    coordinates: { lat: 40.35, lng: -89.00 },
    cityIds: ["city-chicago"], editionIds: ["ace-3-midwest-2015", "ace-20-illinois-2025"] },

  { id: "us-az", name: "Arizona", countryId: "us", abbreviation: "AZ",
    coordinates: { lat: 33.72, lng: -111.43 },
    cityIds: ["city-phoenix"], editionIds: ["ace-5-arizona-california-2016"] },

  { id: "us-ca", name: "California", countryId: "us", abbreviation: "CA",
    coordinates: { lat: 36.78, lng: -119.42 },
    cityIds: ["city-san-francisco", "city-los-angeles"],
    editionIds: ["ace-5-arizona-california-2016", "ace-10-northern-california-2018"] },

  { id: "us-tx", name: "Texas", countryId: "us", abbreviation: "TX",
    coordinates: { lat: 31.05, lng: -97.56 },
    cityIds: ["city-austin"], editionIds: ["ace-7-texas-2017"] },

  { id: "us-fl", name: "Florida", countryId: "us", abbreviation: "FL",
    coordinates: { lat: 27.66, lng: -81.52 },
    cityIds: ["city-miami"], editionIds: ["ace-8-florida-2017"] },

  { id: "us-pr", name: "Puerto Rico", countryId: "us", abbreviation: "PR",
    coordinates: { lat: 18.22, lng: -66.59 },
    cityIds: ["city-san-juan"], editionIds: ["ace-11-puerto-rico-2019"] },

  { id: "us-co", name: "Colorado", countryId: "us", abbreviation: "CO",
    coordinates: { lat: 39.55, lng: -105.78 },
    cityIds: ["city-denver"], editionIds: ["ace-13-colorado-2021"] },

  { id: "us-la", name: "Louisiana", countryId: "us", abbreviation: "LA",
    coordinates: { lat: 31.17, lng: -91.87 },
    cityIds: ["city-new-orleans"], editionIds: ["ace-14-louisiana-2022"] },

  { id: "us-wa", name: "Washington", countryId: "us", abbreviation: "WA",
    coordinates: { lat: 47.40, lng: -121.49 },
    cityIds: ["city-seattle"], editionIds: ["ace-16-seattle-2023"] },

  { id: "us-mi", name: "Michigan", countryId: "us", abbreviation: "MI",
    coordinates: { lat: 44.31, lng: -85.60 },
    cityIds: ["city-detroit"], editionIds: ["ace-18-michigan-2024"] },

  { id: "us-tn", name: "Tennessee", countryId: "us", abbreviation: "TN",
    coordinates: { lat: 35.86, lng: -86.66 },
    cityIds: ["city-memphis"], editionIds: ["ace-23-memphis-2026"] },

  { id: "us-dc", name: "Washington D.C.", countryId: "us", abbreviation: "DC",
    coordinates: { lat: 38.90, lng: -77.03 },
    cityIds: ["city-washington-dc"], editionIds: [] },
];

export const stateById = (id: string) => states.find(s => s.id === id);
export const statesByCountry = (countryId: string) => states.filter(s => s.countryId === countryId);
