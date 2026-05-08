import type { MediaResource } from "@/types";
import { asset } from "@/lib/asset-path";

// Media resources linked to each edition.
// `url` typically points to the local /public asset copied from /Branding_ACE.
// Thumbnails use the same asset unless a lighter variant is needed.
const mediaRaw: MediaResource[] = [
  // Hero edition photos (real imagery from /Branding_ACE/imagenes/ + /editions/)
  { id: "media-ace1-photos", title: "ACE I — Southeast US — Photo album", type: "photo", editionId: "ace-1-southeast-2014", year: 2014, thumbnailUrl: "/editions/ACE1.jpg", url: "/editions/ACE1.jpg", description: "Highlights from ACE I across Georgia, North Carolina and South Carolina." },
  { id: "media-ace1-report", title: "ACE I — Final Report", type: "report", editionId: "ace-1-southeast-2014", year: 2014, thumbnailUrl: "/editions/ACE1.jpg", url: "#", description: "Final report — placeholder." },
  { id: "media-ace2-photos", title: "ACE II — Mexico", type: "photo", editionId: "ace-2-mexico-2014", year: 2014, thumbnailUrl: "/editions/ACE2.jpg", url: "/editions/ACE2.jpg", description: "Mexico City & Guadalajara visit." },
  { id: "media-ace3-photos", title: "ACE III — US Midwest", type: "photo", editionId: "ace-3-midwest-2015", year: 2015, thumbnailUrl: "/editions/ACE3.jpg", url: "/editions/ACE3.jpg", description: "Minnesota, Wisconsin and Illinois tour." },
  { id: "media-ace4-photos", title: "ACE IV — Córdoba", type: "photo", editionId: "ace-4-cordoba-2015", year: 2015, thumbnailUrl: "/editions/Logo-ACE-Cordoba.png", url: "/editions/Logo-ACE-Cordoba.png", description: "ACE IV in Córdoba." },
  { id: "media-ace5-photos", title: "ACE V — Arizona & California", type: "photo", editionId: "ace-5-arizona-california-2016", year: 2016, thumbnailUrl: "/editions/ACE5.jpg", url: "/editions/ACE5.jpg", description: "Desert-tech and Silicon Valley." },
  { id: "media-ace6-photos", title: "ACE VI — Ontario", type: "photo", editionId: "ace-6-ontario-2016", year: 2016, thumbnailUrl: "/editions/ACE6.jpg", url: "/editions/ACE6.jpg", description: "Toronto innovation corridor." },
  { id: "media-ace7-photos", title: "ACE VII — Texas", type: "photo", editionId: "ace-7-texas-2017", year: 2017, thumbnailUrl: "/editions/ACE7.jpg", url: "/editions/ACE7.jpg", description: "Austin startup scene." },
  { id: "media-ace8-photos", title: "ACE VIII — Florida", type: "photo", editionId: "ace-8-florida-2017", year: 2017, thumbnailUrl: "/editions/ACE8.jpg", url: "/editions/ACE8.jpg", description: "Miami: gateway to the Americas." },
  { id: "media-ace9-photos", title: "ACE IX — Germany & Israel", type: "photo", editionId: "ace-9-germany-israel-2018", year: 2018, thumbnailUrl: "/editions/ACE9.jpg", url: "/editions/ACE9.jpg", description: "International benchmarking edition." },
  { id: "media-ace10-photos", title: "ACE X — Northern California", type: "photo", editionId: "ace-10-northern-california-2018", year: 2018, thumbnailUrl: "/editions/ACE10.jpg", url: "/editions/ACE10.jpg", description: "Silicon Valley deep-dive." },
  { id: "media-ace11-photos", title: "ACE XI — Puerto Rico", type: "photo", editionId: "ace-11-puerto-rico-2019", year: 2019, thumbnailUrl: "/editions/ACE11.jpg", url: "/editions/ACE11.jpg", description: "San Juan — Parallel18 and resilience tech." },
  { id: "media-ace12-photos", title: "ACE XII — Chile", type: "photo", editionId: "ace-12-chile-2019", year: 2019, thumbnailUrl: "/editions/ACE12.jpg", url: "/editions/ACE12.jpg", description: "Santiago & Valparaíso." },
  { id: "media-ace13-photos", title: "ACE XIII — Colorado", type: "photo", editionId: "ace-13-colorado-2021", year: 2021, thumbnailUrl: "/editions/Colorado.jpg", url: "/editions/Colorado.jpg", description: "Post-pandemic Colorado edition." },
  { id: "media-ace14-photos", title: "ACE XIV — Louisiana", type: "photo", editionId: "ace-14-louisiana-2022", year: 2022, thumbnailUrl: "/editions/LOGO-ACE-LOUISIANA.png", url: "/editions/LOGO-ACE-LOUISIANA.png", description: "New Orleans bio-economy and logistics." },
  { id: "media-ace15-photos", title: "ACE XV — Ecuador", type: "photo", editionId: "ace-15-ecuador-2022", year: 2022, thumbnailUrl: "/editions/ACElogo_ecuador.png", url: "/editions/ACElogo_ecuador.png", description: "Quito & Guayaquil." },
  { id: "media-ace16-photos", title: "ACE XVI — Seattle", type: "photo", editionId: "ace-16-seattle-2023", year: 2023, thumbnailUrl: "/editions/ACE-Seattle.png", url: "/editions/ACE-Seattle.png", description: "Pacific Northwest innovation tour." },
  { id: "media-ace17-photos", title: "ACE XVII — Panama", type: "photo", editionId: "ace-17-panama-2024", year: 2024, thumbnailUrl: "/editions/LOGO-ACE-PANAMA.png", url: "/editions/LOGO-ACE-PANAMA.png", description: "Ciudad del Saber and the Panama Canal." },
  { id: "media-ace18-photos", title: "ACE XVIII — Michigan", type: "photo", editionId: "ace-18-michigan-2024", year: 2024, thumbnailUrl: "/editions/LOGO-ACE-MICHIGAN-LOGO.png", url: "/editions/LOGO-ACE-MICHIGAN-LOGO.png", description: "Michigan Central and the new mobility corridor." },
  { id: "media-ace19-photos", title: "ACE XIX — Yerevan, Armenia", type: "photo", editionId: "ace-19-armenia-2024", year: 2024, thumbnailUrl: "/editions/Logo-ACE-Armenia.png", url: "/editions/Logo-ACE-Armenia.png", description: "Special edition in Yerevan." },
  { id: "media-ace20-photos", title: "ACE XX — Illinois", type: "photo", editionId: "ace-20-illinois-2025", year: 2025, thumbnailUrl: "/editions/Logo-ACE-Illinois.jpg", url: "/editions/Logo-ACE-Illinois.jpg", description: "Chicago advanced manufacturing corridor." },
  { id: "media-ace21-photos", title: "ACE XXI — Belém, Brazil", type: "photo", editionId: "ace-21-belem-2025", year: 2025, thumbnailUrl: "/editions/Logo-ACE-Belem-Brazil.png", url: "/editions/Logo-ACE-Belem-Brazil.png", description: "Amazon bioeconomy edition." },
  { id: "media-ace22-photos", title: "ACE XXII — Córdoba 2025", type: "photo", editionId: "ace-22-cordoba-2025", year: 2025, thumbnailUrl: "/editions/Logo-ACE-Cordoba.png", url: "/editions/Logo-ACE-Cordoba.png", description: "Second Córdoba edition, a decade after ACE IV." },

  // Memphis 2026 (upcoming — real assets)
  { id: "media-ace23-banner", title: "ACE XXIII — Memphis banner", type: "photo", editionId: "ace-23-memphis-2026", year: 2026, thumbnailUrl: "/photos/memphis-banner.jpg", url: "/photos/memphis-banner.jpg", description: "Hero banner for ACE XXIII." },
  { id: "media-ace23-photos", title: "ACE XXIII — Memphis preview", type: "photo", editionId: "ace-23-memphis-2026", year: 2026, thumbnailUrl: "/editions/logo-ACE-Memphis.png", url: "/editions/logo-ACE-Memphis.png", description: "Memphis 2026 edition preview." },
  { id: "media-ace23-tripbook", title: "ACE XXIII — Trip Book", type: "trip_book", editionId: "ace-23-memphis-2026", year: 2026, thumbnailUrl: "/editions/logo-ACE-Memphis.png", url: "#", description: "Official trip book (coming soon)." },

  // Event photography (real imagery, assorted)
  { id: "media-event-1", title: "Delegation meeting", type: "photo", editionId: "ace-10-northern-california-2018", year: 2018, thumbnailUrl: "/photos/DSC03481 (1).jpg", url: "/photos/DSC03481 (1).jpg", description: "Event photography." },
  { id: "media-event-2", title: "Site visit", type: "photo", editionId: "ace-12-chile-2019", year: 2019, thumbnailUrl: "/photos/002 (1).jpg", url: "/photos/002 (1).jpg", description: "Event photography." },
  { id: "media-event-3", title: "Panel discussion", type: "photo", editionId: "ace-16-seattle-2023", year: 2023, thumbnailUrl: "/photos/008 (1).jpg", url: "/photos/008 (1).jpg", description: "Event photography." },
  { id: "media-event-4", title: "Group photo", type: "photo", editionId: "ace-18-michigan-2024", year: 2024, thumbnailUrl: "/photos/53480799916_dcd4ac1198_c.jpg", url: "/photos/53480799916_dcd4ac1198_c.jpg", description: "Delegation group photo." },
  { id: "media-event-5", title: "Keynote", type: "photo", editionId: "ace-20-illinois-2025", year: 2025, thumbnailUrl: "/photos/54569310567_67bd39dce9_b.jpg", url: "/photos/54569310567_67bd39dce9_b.jpg", description: "Keynote session." },
];

export const media: MediaResource[] = mediaRaw.map(m => ({
  ...m,
  thumbnailUrl: m.thumbnailUrl ? asset(m.thumbnailUrl) : m.thumbnailUrl,
  url: m.url ? asset(m.url) : m.url,
}));

export const mediaById = (id: string) => media.find(m => m.id === id);
export const mediaByEdition = (editionId: string) => media.filter(m => m.editionId === editionId);
export const mediaByType = (type: MediaResource["type"]) => media.filter(m => m.type === type);
