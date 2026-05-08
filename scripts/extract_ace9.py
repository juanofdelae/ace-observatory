#!/usr/bin/env python3
"""
ACE 9 (Germany & Israel, 2018) has a dedicated layout in its trip-book that
the generic extractor handles poorly — every site page carries the markers
'Name of Company:' or 'Company / Facility:'. This script walks the PDF
looking for those markers and pulls per-site data cleanly.

Output is appended to data/_visited-sites-auto.json (replacing any existing
ACE 9 entries). Images are saved to public/sites/ace-9-germany-israel-2018/.
"""
from __future__ import annotations
import json
import re
import shutil
import unicodedata
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "info-reports" / "ACE9-TripBook-ACE-9.pdf"
AUTO_JSON = ROOT / "data" / "_visited-sites-auto.json"
EDITION_ID = "ace-9-germany-israel-2018"
OUT_DIR = ROOT / "public" / "sites" / EDITION_ID

# Detected city → (cityId in data/cities.ts, countryId, lat, lng).
# Cities we don't have entries for fall back to Berlin or Tel Aviv depending
# on the region, so the site at least lands in the right country.
CITY_INFO = {
    "Tel Aviv":   ("city-tel-aviv",    "il", 32.0853, 34.7818),
    "Jerusalem":  ("city-jerusalem",   "il", 31.7683, 35.2137),
    "Haifa":      ("city-haifa",       "il", 32.7940, 34.9896),
    "Yavne":      ("city-yavne",       "il", 31.8777, 34.7400),
    # Cities without a proper data/cities.ts entry → pin to the closest city
    # we do have (Tel Aviv for Israel, Berlin for Germany).
    "Beer Sheva": ("city-tel-aviv",    "il", 31.2518, 34.7915),
    "Nazareth":   ("city-tel-aviv",    "il", 32.7021, 35.2978),
    "Herzliya":   ("city-tel-aviv",    "il", 32.1624, 34.8447),
    "Berlin":     ("city-berlin",      "de", 52.5200, 13.4050),
    "Dresden":    ("city-dresden",     "de", 51.0504, 13.7373),
    "Munich":     ("city-munich",      "de", 48.1351, 11.5820),
    "Frankfurt":  ("city-berlin",      "de", 50.1109, 8.6821),
    "Hamburg":    ("city-berlin",      "de", 53.5511, 9.9937),
    "Leipzig":    ("city-berlin",      "de", 51.3397, 12.3731),
    "Cologne":    ("city-berlin",      "de", 50.9375, 6.9603),
    "Stuttgart":  ("city-berlin",      "de", 48.7758, 9.1829),
}

# Default when we can't detect a city from the page text.
DEFAULT_CITY = ("city-berlin", "de", 52.5200, 13.4050)


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:60] or "site"


def guess_type(name: str, body: str) -> str:
    t = (name + " " + body).lower()
    if "university" in t or "college" in t: return "University"
    if "institute" in t or "instituto" in t: return "Research Lab"
    if any(k in t for k in ["lab", "research"]):  return "Research Lab"
    if any(k in t for k in ["startup", "start-up", "accelerator", "incubator"]): return "Technology Hub"
    if any(k in t for k in ["chamber", "cluster", "association"]):  return "Chamber of Commerce"
    if any(k in t for k in ["ministry", "federal", "government", "embassy", "agency"]):
        return "Public Entity"
    return "Company"


def extract_largest_image(doc, page, out_path: Path) -> bool:
    images = page.get_images(full=True)
    if not images:
        return False
    best = None
    best_area = 0
    for img in images:
        w, h = img[2], img[3]
        if w * h < 100 * 100: continue
        if w * h > best_area:
            best_area = w * h
            best = img[0]
    if best is None: return False
    try:
        pix = fitz.Pixmap(doc, best)
        if pix.n - pix.alpha >= 4:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        pix.save(str(out_path))
        return True
    except Exception:
        return False


def detect_city(text: str) -> str:
    """
    Return the detected city name ("Tel Aviv", "Berlin", …) or "" when the
    page doesn't mention any of our known cities near a date.
    """
    for c in CITY_INFO:
        pattern = re.compile(rf"\b{re.escape(c)}\b[^\n]*(?:June|July)\s+\d+", re.IGNORECASE)
        if pattern.search(text):
            return c
    # Fallback: just the city name anywhere on the page.
    for c in CITY_INFO:
        if re.search(rf"\b{re.escape(c)}\b", text, re.IGNORECASE):
            return c
    return ""


def parse_site_page(doc, page_idx: int) -> dict | None:
    page = doc[page_idx]
    text = page.get_text("text") or ""
    # Only pages with the explicit markers are site pages.
    name_m = re.search(r"Name of Company:\s*([^\n]+)", text)
    fac_m  = re.search(r"Company\s*/\s*Facility:\s*([^\n]+)", text)
    if not name_m and not fac_m:
        return None
    name = (name_m or fac_m).group(1).strip()
    # Some pages have "Name of Company: Name\nSector: X" — drop noise.
    if not name or len(name) < 3:
        return None

    # Description: pick the longest prose paragraph that isn't an email/phone.
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    paragraphs: list[list[str]] = [[]]
    for l in lines:
        if re.match(r"^(Name of Company|Sector|Contact|Title|Tel|Mobile|Email|Homepage|Address|phone|Role):", l):
            if paragraphs[-1]:
                paragraphs.append([])
            continue
        if re.match(r"^(©\s|www\.|https?://)", l):
            continue
        if len(l) < 20:
            continue
        paragraphs[-1].append(l)
    paragraphs = [" ".join(p) for p in paragraphs if p]
    description = max(paragraphs, key=len) if paragraphs else ""
    if len(description) > 600:
        description = description[:597].rsplit(" ", 1)[0] + "…"

    # City (Tel Aviv / Berlin / Dresden ...).
    city = detect_city(text)

    # Image.
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    slug = slugify(name)
    img_path = OUT_DIR / f"{slug}.jpg"
    has_image = extract_largest_image(doc, page, img_path)

    return {
        "name": name,
        "description": description,
        "city": city,
        "page": page_idx + 1,
        "slug": slug,
        "image": f"/sites/{EDITION_ID}/{slug}.jpg" if has_image else None,
    }


def main() -> int:
    doc = fitz.open(PDF_PATH)
    # Scan pages 12 (Israel section starts) through 118 (before participants).
    sites = []
    for i in range(11, min(118, len(doc))):
        rec = parse_site_page(doc, i)
        if rec:
            sites.append(rec)

    # Dedup by name.
    seen = {}
    for s in sites:
        k = s["name"].lower()
        if k not in seen:
            seen[k] = s
    sites = list(seen.values())
    print(f"Extracted {len(sites)} ACE 9 sites from the trip-book")

    # Build VisitedSite-shaped records.
    records = []
    for i, s in enumerate(sites):
        info = CITY_INFO.get(s["city"]) or DEFAULT_CITY
        city_id, country_id, lat, lng = info
        seed = sum(ord(c) for c in s["slug"])
        dlat = ((seed + i) % 37 - 18) * 0.0025
        dlng = ((seed + i * 3) % 41 - 20) * 0.0025
        records.append({
            "id": f"site-ace9-{s['slug']}",
            "name": s["name"],
            "type": guess_type(s["name"], s["description"]),
            "countryId": country_id,
            "cityId": city_id,
            "coordinates": {"lat": round(lat + dlat, 4), "lng": round(lng + dlng, 4)},
            "sectorIds": ["sec-innovation"],
            "description": s["description"] or f"Visited during ACE 9 in {s['city'] or 'Germany / Israel'}.",
            "relatedEditionIds": [EDITION_ID],
            "mediaIds": [],
            "image": s["image"],
            "_source": "ace9-tripbook",
            "_page": s["page"],
            "_city": s["city"],
        })

    # Merge with existing _visited-sites-auto.json, replacing any prior ACE 9
    # entries (they came from the generic extractor and are lower quality).
    existing = json.loads(AUTO_JSON.read_text()) if AUTO_JSON.exists() else []
    existing = [e for e in existing if EDITION_ID not in e.get("relatedEditionIds", [])]
    merged = existing + records
    merged.sort(key=lambda s: (s.get("relatedEditionIds", [""])[0], s["name"].lower()))
    AUTO_JSON.write_text(json.dumps(merged, ensure_ascii=False, indent=2))
    print(f"Wrote merged file with {len(merged)} total sites")

    # Per-edition summary.
    from collections import Counter
    by_ed = Counter(s["relatedEditionIds"][0] for s in merged)
    for eid in sorted(by_ed):
        print(f"  {eid}: {by_ed[eid]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
