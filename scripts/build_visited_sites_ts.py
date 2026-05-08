#!/usr/bin/env python3
"""
Generates data/visited-sites.ts from data/_visited-sites-rich.json.

Applies a confidence floor (>= 5 AND has image) so only the trustworthy
extraction candidates make it into the TypeScript data file. Everything
extracted — including lower-confidence candidates — still lives in the JSON
so a future curation pass can re-promote them.
"""
from __future__ import annotations
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IN_JSON = ROOT / "data" / "_visited-sites-rich.json"
AUTO_OUT_JSON = ROOT / "data" / "_visited-sites-auto.json"

CONFIDENCE_MIN = 5

# City coords as a fallback for sites — the tripbook rarely tells us the
# precise lat/lng so we pin the site to its edition's host city with a
# deterministic tiny jitter so pins don't stack.
CITY_COORDS = {
    "city-mexico-city":   (19.4326, -99.1332),
    "city-chicago":       (41.8781, -87.6298),
    "city-cordoba":       (-31.4201, -64.1888),
    "city-phoenix":       (33.4484, -112.0740),
    "city-toronto":       (43.6532, -79.3832),
    "city-austin":        (30.2672, -97.7431),
    "city-miami":         (25.7617, -80.1918),
    "city-san-francisco": (37.7749, -122.4194),
    "city-san-juan":      (18.4655, -66.1057),
    "city-santiago":      (-33.4489, -70.6693),
    "city-denver":        (39.7392, -104.9903),
    "city-panama-city":   (8.9824, -79.5199),
    "city-detroit":       (42.3314, -83.0458),
    "city-belem":         (-1.4558, -48.5039),
}

SECTOR_HINTS = [
    (["university", "college", "school", "academy", "research", "laboratory", "lab", "campus"],
     ["sec-talent", "sec-innovation"]),
    (["innovation", "hub", "incubator", "accelerator", "startup"],
     ["sec-innovation", "sec-entrepreneurship"]),
    (["manufactur", "factory", "plant"],
     ["sec-advanced-manufacturing"]),
    (["bio", "agri", "food", "wine"],
     ["sec-agrifood"]),
    (["energy", "power", "bioenergy"],
     ["sec-clean-energy"]),
    (["logistic", "port", "intermodal", "pipeline"],
     ["sec-logistics"]),
    (["health", "hospital", "medical"],
     ["sec-health"]),
    (["cathedral", "museum", "settlement", "historical", "heritage", "cultural"],
     []),
    (["technology", "tech", "digital", "cyber", "maritime"],
     ["sec-digital"]),
]


def slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:60] or "site"


def guess_type(name: str, description: str) -> str:
    t = (name + " " + description).lower()
    if any(k in t for k in ["university", "college", "school of", "academy"]): return "University"
    if any(k in t for k in ["research center", "research lab", "laboratory"]): return "Research Lab"
    if any(k in t for k in ["innovation center", "innovation hub", "tech hub"]): return "Innovation Center"
    if any(k in t for k in ["incubator", "accelerator", "startup"]):            return "Technology Hub"
    if any(k in t for k in ["chamber", "cluster", "association"]):              return "Chamber of Commerce"
    if any(k in t for k in ["ministry", "city of", "state of", "department of",
                            "government", "office of"]):                      return "Public Entity"
    if any(k in t for k in ["company", "corporation", "factory", "plant",
                            "llc", "inc.", "factory"]):                        return "Company"
    return "Innovation Center"


def guess_sectors(name: str, description: str) -> list[str]:
    t = (name + " " + description).lower()
    out: list[str] = []
    for keys, secs in SECTOR_HINTS:
        if any(k in t for k in keys):
            out.extend(secs)
    if not out:
        out = ["sec-innovation"]
    # Dedup preserving order
    seen: set[str] = set()
    unique = []
    for s in out:
        if s not in seen:
            seen.add(s)
            unique.append(s)
    return unique


def main() -> int:
    if not IN_JSON.exists():
        print("Run scripts/extract_sites_from_tripbooks.py first.", file=sys.stderr)
        return 1

    rows = [
        r for r in json.loads(IN_JSON.read_text())
        if r["confidence"] >= CONFIDENCE_MIN and r.get("image")
    ]

    # Dedup across editions by slug — some sites appear in multiple trip-books.
    by_slug: dict[str, dict] = {}
    for r in rows:
        s = slug(r["name"])
        if s not in by_slug:
            by_slug[s] = {**r, "slug": s, "relatedEditions": [r["editionId"]]}
        else:
            if r["editionId"] not in by_slug[s]["relatedEditions"]:
                by_slug[s]["relatedEditions"].append(r["editionId"])

    entries = list(by_slug.values())
    entries.sort(key=lambda r: (r["editionId"], r["name"].lower()))

    # Generate tiny deterministic jitter so same-city pins don't stack.
    def jitter(slug_s: str, idx: int) -> tuple[float, float]:
        seed = sum(ord(c) for c in slug_s)
        dx = ((seed + idx) % 37 - 18) * 0.0025
        dy = ((seed + idx * 3) % 41 - 20) * 0.0025
        return dx, dy

    out: list[dict] = []
    for i, r in enumerate(entries):
        lat0, lng0 = CITY_COORDS.get(r["cityId"], (0, 0))
        dlat, dlng = jitter(r["slug"], i)
        lat = round(lat0 + dlat, 4)
        lng = round(lng0 + dlng, 4)
        description = r["description"].replace("\n", " ")
        if len(description) > 460:
            description = description[:457].rsplit(" ", 1)[0] + "…"
        out.append({
            "id": f"site-auto-{r['slug']}",
            "name": r["name"],
            "type": guess_type(r["name"], r["description"]),
            "countryId": r["countryId"],
            "cityId": r["cityId"],
            "coordinates": {"lat": lat, "lng": lng},
            "sectorIds": guess_sectors(r["name"], r["description"]),
            "description": description,
            "relatedEditionIds": r["relatedEditions"],
            "mediaIds": [],
            "image": r["image"],
        })

    AUTO_OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"Wrote {len(out)} auto-extracted sites → {AUTO_OUT_JSON.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
