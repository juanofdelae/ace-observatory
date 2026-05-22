"use client";

import dynamic from "next/dynamic";

// Leaflet is browser-only — must be loaded with ssr: false, which Next 15+
// requires to live in a Client Component (not the surrounding Server Component).
export const MapMini = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
});
