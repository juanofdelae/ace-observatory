#!/usr/bin/env python3
"""
Phase C (deep): Mine visited sites + descriptions + images from the ACE
trip-book PDFs.

Per edition we walk the trip-book page by page. A page is classified as a
"site page" when it has at least one embedded image AND a reasonable amount
of prose AND the prose looks descriptive (rather than agenda / participant
list / cover matter). For each site page we extract:

  - Name              → the first meaningful line that's title-case or ALL-CAPS
  - Description       → the longest contiguous prose paragraph
  - Hero image        → the largest embedded image on that page, saved to
                        public/sites/<edition>/<slug>.jpg

Output: data/_visited-sites-rich.json — consumed by data/visited-sites.ts.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "info-reports"
PUBLIC_SITES_DIR = ROOT / "public" / "sites"
OUT_JSON = ROOT / "data" / "_visited-sites-rich.json"

# Tripbooks per edition (filename + editionId). We also list the canonical
# host country/city so extracted sites inherit a location.
SOURCES = [
    # ("filename.pdf", editionId, countryId, cityId)
    ("ACE2-Trip-Book-COMPLETO.pdf",    "ace-2-mexico-2014",              "mx", "city-mexico-city"),
    ("ACE3 - Trip-Book-ACE-2015.pdf",  "ace-3-midwest-2015",             "us", "city-chicago"),
    ("ace4-trip-book.pdf",             "ace-4-cordoba-2015",             "ar", "city-cordoba"),
    ("5ACE-TripBook-Final.pdf",        "ace-5-arizona-california-2016",  "us", "city-phoenix"),
    ("6ace-tripbook.pdf",              "ace-6-ontario-2016",             "ca", "city-toronto"),
    ("ACE7-TRIPBOOK.pdf",              "ace-7-texas-2017",               "us", "city-austin"),
    ("ACE8tripbook-ace8.pdf",          "ace-8-florida-2017",             "us", "city-miami"),
    ("ACE9-TripBook-ACE-9.pdf",        "ace-9-germany-israel-2018",      "intl","city-mexico-city"),
    ("ACE10-Tripbook-ACE-10.pdf",      "ace-10-northern-california-2018","us", "city-san-francisco"),
    ("ACE11-TRIPBOOK-ace11.pdf",       "ace-11-puerto-rico-2019",        "us", "city-san-juan"),
    ("ace12tripbook.pdf",              "ace-12-chile-2019",              "cl", "city-santiago"),
    ("ace13-TRIPBOOK-ACE-COLORADO.pdf","ace-13-colorado-2021",           "us", "city-denver"),
    ("ACE17-TRIPBOOK.pdf",             "ace-17-panama-2024",             "pa", "city-panama-city"),
    ("ACE 18TRIPBOOK-ACE-MICHIGAN.pdf","ace-18-michigan-2024",           "us", "city-detroit"),
    ("ACE19-TRIPBOOK-ACE-Armenia.pdf", "ace-19-armenia-2024",            "intl","city-mexico-city"),
    ("ACE20-TRIPBOOK-ACE-Illinois.pdf","ace-20-illinois-2025",           "us", "city-chicago"),
    ("ACE21-TRIPBOOK-ACE-Belem.pdf",   "ace-21-belem-2025",              "br", "city-belem"),
    ("ACE22-Tripbook-ACE-Cordoba.pdf", "ace-22-cordoba-2025",            "ar", "city-cordoba"),
]

# Pages whose text matches any of these shouldn't be classified as site pages.
NOISE_REGEX = re.compile(
    r"\b(?:agenda|participants?|itinerary|table of contents|index|"
    r"hotel lobby|dress code|attire|welcome reception|breakfast|lunch|"
    r"check\s?out|load luggage|bus depart|free time|transfer|cocktail|"
    r"message from|acknowledge?ments?|sponsors?|trip book|tripbook|"
    r"daily itinerary|who\s*we\s*are|"
    r"prepared by|funds under award|this tripbook|"
    r"scan\s+me|please\s+scan|"
    r"main menu|page\s+\d+|contact\s+us|"
    r"americas competitiveness exchange)\b",
    re.IGNORECASE,
)

STATE_OVERVIEW_REGEX = re.compile(
    r"\b(?:state of|overview of|about\s+the\s+state|economy of)\b",
    re.IGNORECASE,
)

# Text that shouts "this is a personal biography page, not a site description".
BIO_REGEX = re.compile(
    r"\b(?:is the (?:president|director|manager|secretary|minister|ceo|chief|"
    r"head|general manager|vice president|coordinator|founder|ambassador|"
    r"owner|partner|senior|junior|assistant|permanent|executive)|"
    r"currently serves as|graduated from|holds? a (?:degree|bachelor|master|"
    r"phd|doctorate)|his career|her career|his background|her background|"
    r"prior to joining|received (?:his|her) )\b",
    re.IGNORECASE,
)

# True when the NAME line looks like a human name rather than a site.
# A human name is typically 2–3 title-case words with letters only — no
# business / institutional suffix and no connector words.
INSTITUTIONAL_HINTS = frozenset([
    "university", "college", "institute", "laboratory", "lab", "labs",
    "center", "centre", "school", "academy", "hospital", "museum",
    "park", "campus", "cathedral", "mission", "plaza", "tower", "building",
    "ministry", "department", "agency", "office", "foundation",
    "association", "chamber", "council", "commission", "authority",
    "company", "corporation", "group", "ventures", "capital", "fund",
    "technologies", "tech", "innovation", "accelerator", "incubator",
    "hub", "airport", "port", "bank", "factory", "plant", "refinery",
    "terminal", "station", "conservatory", "garden", "bay", "district",
    "station", "library", "theater", "theatre", "studios", "studio",
    "cluster", "restaurant", "club", "resort", "hotel", "spa", "arena",
    "stadium", "facility", "facilities", "services", "solutions", "systems",
    "research", "startup", "startups", "launch", "enterprise", "partners",
    "development", "ecosystem", "station", "refinery", "pipeline",
])


def looks_like_person_name(s: str) -> bool:
    """Heuristic — is this string a human name (and therefore NOT a site)?"""
    words = s.split()
    if not (2 <= len(words) <= 4):
        return False
    low = s.lower()
    # If it mentions an institutional keyword, it's a site, not a person.
    if any(w in INSTITUTIONAL_HINTS for w in low.split()):
        return False
    # Every word must be alphabetic, title-cased (accent-aware).
    for w in words:
        if not re.match(r"^[A-ZÀ-Ý][a-zà-ÿ.'\-]*$", w) and not w.isupper():
            return False
    return True


def slugify(s: str) -> str:
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"\s+", "-", s).strip("-").lower()
    return s[:60] or "site"


def page_text_clean(page) -> str:
    text = page.get_text("text") or ""
    text = re.sub(r"\s+", " ", text).strip()
    return text


def best_name(lines: list[str]) -> str | None:
    """
    Pick the most likely site-name line from a page's raw lines.
    Preference: title-case or ALL-CAPS line ≤70 chars, 2+ words, no sentence
    punctuation. Skip lines that are just numbers / page numbers.
    """
    for raw in lines:
        l = raw.strip()
        if not l or len(l) > 80 or l.isdigit():
            continue
        if l.endswith((".", ":", "!")) and len(l) > 50:
            continue
        words = l.split()
        if len(words) < 2 or len(words) > 10:
            continue
        if l.lower() in ("trip book", "agenda", "overview"):
            continue
        # Accept if mostly letters
        letter_ratio = sum(c.isalpha() for c in l) / max(1, len(l))
        if letter_ratio < 0.55:
            continue
        # Must start with uppercase
        if not l[0].isupper():
            continue
        return l
    return None


def best_description(lines: list[str]) -> str:
    """Return the longest consecutive paragraph on the page."""
    blocks: list[str] = []
    current: list[str] = []
    for l in lines:
        l = l.strip()
        if not l or len(l) < 20:
            if current:
                blocks.append(" ".join(current))
                current = []
            continue
        current.append(l)
    if current:
        blocks.append(" ".join(current))

    blocks = [b for b in blocks if len(b) >= 80]
    if not blocks:
        return ""
    longest = max(blocks, key=len)
    if len(longest) > 900:
        longest = longest[:897].rsplit(" ", 1)[0] + "…"
    return longest


def extract_largest_image(doc, page, out_path: Path) -> bool:
    """Save the largest embedded image on this page to out_path. Returns True if any."""
    images = page.get_images(full=True)
    if not images:
        return False
    best_xref = None
    best_area = 0
    for img in images:
        xref = img[0]
        # img[2] = width, img[3] = height in the tuple layout
        w, h = img[2], img[3]
        area = w * h
        if area < 80 * 80:   # skip tiny icons
            continue
        if area > best_area:
            best_area = area
            best_xref = xref
    if best_xref is None:
        return False
    try:
        pix = fitz.Pixmap(doc, best_xref)
        if pix.n - pix.alpha >= 4:     # CMYK → convert
            pix = fitz.Pixmap(fitz.csRGB, pix)
        pix.save(str(out_path))
        pix = None
        return True
    except Exception:
        return False


def process_tripbook(path: Path, edition_id: str, country_id: str, city_id: str) -> list[dict]:
    doc = fitz.open(path)
    sites: list[dict] = []
    seen_names: set[str] = set()

    edition_slug = edition_id
    out_dir = PUBLIC_SITES_DIR / edition_slug
    out_dir.mkdir(parents=True, exist_ok=True)

    for page_idx, page in enumerate(doc):
        # Get raw text (line by line) so we can pick a title separately from the
        # flowing paragraph.
        raw = page.get_text("text") or ""
        lines = [l.rstrip() for l in raw.splitlines() if l.strip()]
        if not lines:
            continue

        flat = " ".join(lines)
        # Filter noisy pages.
        if NOISE_REGEX.search(flat) and len(flat) < 600:
            continue
        if STATE_OVERVIEW_REGEX.search(flat) and page_idx < 6:
            # Early-book state-of-XYZ overviews are rarely a "visited site".
            continue

        name = best_name(lines)
        description = best_description(lines)
        if not name or len(description) < 120:
            continue
        # Reject participant-profile pages.
        if looks_like_person_name(name):
            continue
        if BIO_REGEX.search(description[:400]):
            continue
        # Reject if description is dominated by contact info (emails / phones)
        if description.count("@") >= 2 or re.search(r"\+?\d[\d\s()-]{8,}", description):
            if len(description) < 300:
                continue
        # Reject names that end with a connector (truncated fragments).
        if re.search(r"[&:]\s*$|\b(and|for|of|the|a)\s*$", name, re.IGNORECASE):
            continue
        # Reject sentence-like "names" that contain sentence punctuation.
        if ":" in name or ";" in name:
            continue
        # Require an institutional hint OR ALL-CAPS OR a 3+ capitalized-word
        # title — filters out stray flowing-text fragments like "Strategic
        # Location" or "Leaders from" that otherwise look title-case enough.
        words_low = name.lower().split()
        has_institutional = any(w in INSTITUTIONAL_HINTS for w in words_low)
        is_all_caps = name.upper() == name and any(c.isalpha() for c in name)
        cap_word_count = sum(1 for w in name.split() if re.match(r"^[A-ZÀ-Ý]", w))
        if not (has_institutional or is_all_caps or cap_word_count >= 3):
            continue
        # Dedup within edition (some tripbooks repeat a title page).
        key = name.lower()
        if key in seen_names:
            continue
        seen_names.add(key)

        slug = slugify(name)
        img_path = out_dir / f"{slug}.jpg"
        has_image = extract_largest_image(doc, page, img_path)

        # Confidence score — used downstream to decide which candidates are
        # safe to surface in the UI vs. which need human curation.
        confidence = 0
        if has_institutional:
            confidence += 3
        if is_all_caps:
            confidence += 2
        if has_image:
            confidence += 1
        if len(description) >= 250:
            confidence += 1
        if cap_word_count >= 3 and not is_all_caps and not has_institutional:
            confidence += 1   # multi-word title-case, plausible

        sites.append({
            "editionId": edition_id,
            "name": name,
            "description": description,
            "countryId": country_id,
            "cityId": city_id,
            "page": page_idx + 1,
            "sourcePdf": path.name,
            "image": f"/sites/{edition_slug}/{slug}.jpg" if has_image else None,
            "confidence": confidence,
        })

    return sites


def main() -> int:
    PUBLIC_SITES_DIR.mkdir(parents=True, exist_ok=True)
    all_sites: list[dict] = []

    for filename, edition_id, country_id, city_id in SOURCES:
        path = PDF_DIR / filename
        if not path.exists():
            print(f"skip (missing): {filename}")
            continue
        try:
            sites = process_tripbook(path, edition_id, country_id, city_id)
        except Exception as e:
            print(f"  ✗ {filename}: {e}", file=sys.stderr)
            continue
        print(f"  {filename}: {len(sites)} site(s)")
        all_sites.extend(sites)

    OUT_JSON.write_text(json.dumps(all_sites, ensure_ascii=False, indent=2))
    print()
    print(f"Wrote {len(all_sites)} sites → {OUT_JSON.relative_to(ROOT)}")
    # Per-edition summary
    by_edition: dict[str, int] = {}
    for s in all_sites:
        by_edition[s["editionId"]] = by_edition.get(s["editionId"], 0) + 1
    for eid in sorted(by_edition):
        print(f"  {eid}: {by_edition[eid]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
