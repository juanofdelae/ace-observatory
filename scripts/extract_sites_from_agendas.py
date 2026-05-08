#!/usr/bin/env python3
"""
Phase C — agenda extractor. Mines visited-site names out of the daily agenda
PDFs, which are the cleanest source of "we actually went there" information.

Agendas use a few recurring patterns:

  1. "Visit to X" / "Tour of X" / "Welcome to X"
  2. "X ----------------" (header line followed by trailing dashes)
  3. "📍  - X (address)"  (Louisiana / newer agendas use emoji markers)
  4. "Transfer to X", "Travel: ... to X"

For each match we capture the site name and a snippet of the surrounding
schedule item as the description. Output format mirrors
data/_visited-sites-auto.json so the build step can merge both sources.
"""
from __future__ import annotations
import json
import re
import sys
import unicodedata
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "info-reports"
TRIPBOOK_AUTO = ROOT / "data" / "_visited-sites-auto.json"
OUT_JSON = ROOT / "data" / "_visited-sites-auto.json"   # we OVERWRITE this with merged data

# Per-agenda metadata (filename, edition, host country, host city).
SOURCES = [
    ("ACE2 - AGENDA.pdf",                                      "ace-2-mexico-2014",              "mx", "city-mexico-city"),
    ("ace3-agenda.pdf",                                        "ace-3-midwest-2015",             "us", "city-chicago"),
    ("ACE4-itinerario.pdf",                                    "ace-4-cordoba-2015",             "ar", "city-cordoba"),
    ("ACE5-agenda-updated-46936--.pdf",                        "ace-5-arizona-california-2016", "us", "city-phoenix"),
    ("ace6-itinerary_sept-23-2016.pdf",                        "ace-6-ontario-2016",             "ca", "city-toronto"),
    ("ACE7-agenda-texas.pdf",                                  "ace-7-texas-2017",               "us", "city-austin"),
    # NOTE: ACE 8 / ACE 10 trip-books mix the agenda with many participant
    # bio pages, and the "at X" pattern can't tell those apart reliably.
    # Their sites are captured via the trip-book extractor instead.
    ("ACE13-Colorado-Agenda-August-1-6-2021.pdf",              "ace-13-colorado-2021",           "us", "city-denver"),
    ("ACE-14-Louisiana-Daily-Itinerary_Near-Locked-.pdf",      "ace-14-louisiana-2022",          "us", "city-new-orleans"),
    ("ACE15-Agenda-ACE-Ecuador.pdf",                           "ace-15-ecuador-2022",            "ec", "city-quito"),
    ("ACE16-Agenda-Seattle-Final.pdf",                         "ace-16-seattle-2023",            "us", "city-seattle"),
    ("ACE17-Agenda-ACE-Panama.pdf",                            "ace-17-panama-2024",             "pa", "city-panama-city"),
    ("ACE18-Michigan-Agenda.pdf",                              "ace-18-michigan-2024",           "us", "city-detroit"),
    ("ACE19-AGENDA-Armenia.pdf",                               "ace-19-armenia-2024",            "intl","city-mexico-city"),
    ("ACE20--AGENDA-Illinois.pdf",                             "ace-20-illinois-2025",           "us", "city-chicago"),
    ("ACE21-AGENDA-Belem.pdf",                                 "ace-21-belem-2025",              "br", "city-belem"),
    ("ACE22-AGENDA-ACE-Cordoba.pdf",                           "ace-22-cordoba-2025",            "ar", "city-cordoba"),
]

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
    "city-new-orleans":   (29.9511, -90.0715),
    "city-quito":         (-0.1807, -78.4678),
    "city-seattle":       (47.6062, -122.3321),
}

# Words/phrases we never want to capture as a site name.
STOP_WORDS = frozenset([
    "breakfast", "lunch", "dinner", "wellness break", "wellness",
    "welcome reception", "welcome breakfast", "welcome dinner",
    "free time", "free evening", "free morning", "free afternoon",
    "registration", "check-in", "check in", "checkout",
    "load buses", "unload buses", "depart", "arrival", "departure",
    "transfer", "travel", "bus tour", "bus", "buses",
    "hotel lobby", "main lobby", "lobby", "the lobby",
    "wifi", "ppe", "headphones", "telegram",
    "press conference", "panel discussion", "round table",
    "icebreaker", "networking", "cocktail",
    "official welcome", "opening remarks", "closing remarks",
    "keynote", "workshop", "session", "meeting", "discussion",
    "the group", "the delegation", "the participants",
    "group photo", "photo opportunity", "tour",
    "ace welcome", "welcome",
    "introduction", "overview", "remarks",
    "morning", "afternoon", "evening",
    "day one", "day two", "day three", "day four", "day five", "day six",
    "ace memphis", "ace ecuador", "ace seattle", "ace panama",
    "ace illinois", "ace michigan", "ace armenia", "ace belem", "ace louisiana",
    "ace colorado", "ace cordoba", "ace chile", "ace costa rica",
    "agenda", "table of contents", "trip book",
    "dress code", "business casual", "smart casual",
    "yes", "no",
])


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:60] or "site"


def is_stop(name: str) -> bool:
    low = name.lower().strip().rstrip(".,!:")
    if low in STOP_WORDS:
        return True
    # Anchor-word starts that are always meta (not real sites).
    for kw in ("notes:", "dress code", "departs", "arrives", "ends at",
               "ace ", "the lobby", "this ", "remarks by"):
        if low.startswith(kw):
            return True
    return False


def looks_like_site(name: str) -> bool:
    """Heuristic — does this string look like a venue / place name?"""
    n = name.strip().rstrip(".,!:")
    if not n or len(n) < 4 or len(n) > 80:
        return False
    if is_stop(n):
        return False
    words = n.split()
    # Require at least 2 words — single-word "Fred", "Kitsap", "Bremerton"
    # slipped through too often and were mostly noise.
    if not (2 <= len(words) <= 9):
        return False
    # Must have at least one capitalised word that isn't a common verb.
    caps = sum(1 for w in words if re.match(r"^[A-ZÀ-Ý]", w))
    if caps == 0:
        return False
    if caps / len(words) < 0.5 and not n.isupper():
        return False
    # Reject when the name ends in a connector (clearly truncated).
    if re.search(r"\b(and|or|with|for|the|a|an|of|to|from|at|in|on|by)\s*$",
                 n, re.IGNORECASE):
        return False
    # Reject common prose-style prefixes that creep in via the "at X" pattern.
    lower = n.lower()
    for bad_prefix in (
        "destination is", "departs ", "arrives ", "ends at",
        "meet at", "meet in", "meet the", "load buses", "unload buses",
        "free time", "free morning", "free evening",
        "transfer to", "return to", "depart for", "travel to",
        "welcome to", "arrival at", "dinner at", "breakfast at",
        "lunch at", "remarks by", "keynote by", "please ",
        "kick.?off", "box snack", "dress code", "notes:",
    ):
        if re.match(rf"^{bad_prefix}\b", lower):
            return False
    # Reject when it's mostly hotel/logistics phrasing.
    if re.search(r"\b(hotel lobby|main lobby|lobby|wellness break)\b", lower):
        return False
    return True


def dedup_prefer_specific(records: list[dict]) -> list[dict]:
    """If a short name is a prefix of a longer name we already kept (within
    the same edition), drop the short one. Handles 'Holiday Inn' vs 'Holiday
    Inn Hotel', 'Marriott' vs 'Marriott Hotel Lobby', etc."""
    by_ed: dict[str, list[dict]] = {}
    for r in records:
        eid = r.get("relatedEditionIds", [""])[0]
        by_ed.setdefault(eid, []).append(r)

    kept: list[dict] = []
    for eid, lst in by_ed.items():
        # Sort longest-name first so prefix detection can fold in shorter ones.
        lst.sort(key=lambda r: -len(r["name"]))
        kept_names: list[str] = []
        for r in lst:
            n = r["name"].lower()
            if any(k.startswith(n) and k != n for k in kept_names):
                continue
            # Reject names that end with generic noun like "Lobby" when
            # a matching non-lobby version is already kept.
            if re.search(r"\b(lobby|hotel|marriott|hilton)\s*$", n, re.I):
                # Let it through if it's the ONLY mention of that hotel in
                # this edition — otherwise drop in favour of the cleaner one.
                stripped = re.sub(r"\s*(lobby|hotel)\s*$", "", n).strip()
                if any(stripped in k for k in kept_names if k != n):
                    continue
            kept_names.append(n)
            kept.append(r)
    return kept


# Pattern matchers — return (name, context) lists from a single page's text.
PATTERN_VISIT  = re.compile(r"\b(?:Visit (?:to|of)|Tour (?:to|of|at)|Welcome to|Arrival at|Visit and Tour of|Tour and Visit (?:to|of))\s+([A-Z][^.\n]{2,80}?)(?:[.,;()]|$)", re.MULTILINE)
PATTERN_HEADER = re.compile(r"^\s*([A-Z][A-Za-zÀ-ÿ0-9 &/'\-\.]{3,80}?)\s*-{4,}\s*$", re.MULTILINE)
PATTERN_PIN    = re.compile(r"📍\s*-\s*([^\(\n]{4,80})(?:\s*\(([^)]+)\))?")
PATTERN_AT     = re.compile(r"\bat\s+(?:the\s+)?([A-Z][A-Za-zÀ-ÿ0-9 &/'\-\.]{4,60}?)(?:[.,;()]|\s+(?:in|on|at|with|by|for)\s|$)", re.MULTILINE)


def extract_from_agenda(path: Path, edition_id: str, country_id: str, city_id: str) -> list[dict]:
    doc = fitz.open(path)
    seen: dict[str, dict] = {}
    for page_idx, page in enumerate(doc):
        text = page.get_text("text") or ""
        # Visit / tour patterns
        for m in PATTERN_VISIT.finditer(text):
            name = m.group(1).strip().rstrip(".,;:")
            if not looks_like_site(name):
                continue
            seen.setdefault(name, {"name": name, "context": "", "page": page_idx + 1})
        # Bold-header lines ("Site Name -------------")
        for m in PATTERN_HEADER.finditer(text):
            name = m.group(1).strip()
            if not looks_like_site(name):
                continue
            seen.setdefault(name, {"name": name, "context": "", "page": page_idx + 1})
        # Pin markers (Louisiana-style 📍 lines)
        for m in PATTERN_PIN.finditer(text):
            name = m.group(1).strip().rstrip(".,;:")
            addr = m.group(2)
            if not looks_like_site(name):
                continue
            ctx = addr or ""
            seen.setdefault(name, {"name": name, "context": ctx, "page": page_idx + 1})
        # "at <Place>" sweep — only accept candidates that already look
        # institutional (keyword hit OR 3+ capitalised words). Keeps Seattle's
        # Space Needle / Columbia Center Tower captures while rejecting bio
        # fragments like "at Harvard".
        for m in PATTERN_AT.finditer(text):
            name = m.group(1).strip().rstrip(".,;:")
            if not looks_like_site(name):
                continue
            low = name.lower()
            inst_hit = any(w in low.split() for w in (
                "museum", "cathedral", "mission", "park", "needle",
                "tower", "center", "centre", "university", "college",
                "campus", "institute", "laboratory", "lab", "factory",
                "plant", "refinery", "port", "terminal", "stadium",
                "arena", "plaza", "palace", "market", "hall", "building",
                "company", "corporation", "hub", "incubator", "accelerator",
                "hotel", "settlement", "school", "academy",
            ))
            cap_words = sum(1 for w in name.split() if re.match(r"^[A-ZÀ-Ý]", w))
            if not inst_hit and cap_words < 3:
                continue
            if name not in seen:
                seen[name] = {"name": name, "context": "", "page": page_idx + 1}

    # Build output records.
    lat0, lng0 = CITY_COORDS.get(city_id, (0, 0))
    out: list[dict] = []
    for i, (_, info) in enumerate(seen.items()):
        slug = slugify(info["name"])
        # Tiny deterministic jitter so pins don't stack on the same lat/lng.
        seed = sum(ord(c) for c in slug)
        dlat = ((seed + i) % 37 - 18) * 0.0025
        dlng = ((seed + i * 3) % 41 - 20) * 0.0025
        out.append({
            "id": f"site-agenda-{edition_id}-{slug}",
            "name": info["name"],
            "type": guess_type(info["name"]),
            "countryId": country_id,
            "cityId": city_id,
            "coordinates": {"lat": round(lat0 + dlat, 4), "lng": round(lng0 + dlng, 4)},
            "sectorIds": ["sec-innovation"],
            "description": (
                info["context"] or
                f"Visited during ACE {edition_id.split('-')[1]} on the {edition_id.split('-')[1]} edition agenda."
            ),
            "relatedEditionIds": [edition_id],
            "mediaIds": [],
            "image": None,
            "_source": "agenda",
            "_page": info["page"],
        })
    return out


def guess_type(name: str) -> str:
    t = name.lower()
    if any(k in t for k in ["university", "college", "school of", "academy", "instituto", "instituto de"]):
        return "University"
    if any(k in t for k in ["research center", "research lab", "research laboratory", "lab", "laboratory"]):
        return "Research Lab"
    if any(k in t for k in ["innovation center", "innovation hub", "innovation lab"]):
        return "Innovation Center"
    if any(k in t for k in ["incubator", "accelerator", "startup", "tech park", "tech hub"]):
        return "Technology Hub"
    if any(k in t for k in ["chamber", "cluster", "asociación", "association"]):
        return "Chamber of Commerce"
    if any(k in t for k in ["ministry", "city of", "state of", "department of", "government", "office of",
                            "embassy", "consulate", "municipal"]):
        return "Public Entity"
    if any(k in t for k in ["museum", "cathedral", "mission", "memorial", "heritage", "historic",
                             "park", "settlement", "battlefield"]):
        return "Public Entity"
    return "Innovation Center"


def main() -> int:
    # Start from the existing tripbook-derived sites.
    if TRIPBOOK_AUTO.exists():
        merged = json.loads(TRIPBOOK_AUTO.read_text())
    else:
        merged = []

    # Index existing entries by (edition, normalized name) so we don't add
    # duplicates when the agenda mentions a site already captured from the
    # tripbook.
    def key(name: str, eds: list[str]) -> str:
        n = re.sub(r"[^a-z0-9]+", "", name.lower())
        return f"{eds[0] if eds else ''}|{n}"

    seen_keys = {key(s["name"], s.get("relatedEditionIds", [])) for s in merged}

    new_total = 0
    for filename, edition_id, country_id, city_id in SOURCES:
        path = PDF_DIR / filename
        if not path.exists():
            print(f"skip (missing): {filename}")
            continue
        added = 0
        try:
            sites = extract_from_agenda(path, edition_id, country_id, city_id)
        except Exception as e:
            print(f"  ✗ {filename}: {e}", file=sys.stderr)
            continue
        for s in sites:
            k = key(s["name"], s["relatedEditionIds"])
            if k in seen_keys:
                continue
            seen_keys.add(k)
            merged.append(s)
            added += 1
        print(f"  {filename}: +{added} (parsed {len(sites)})")
        new_total += added

    # Collapse prefix / lobby-suffix duplicates within each edition.
    merged = dedup_prefer_specific(merged)
    # Sort for a deterministic file shape.
    merged.sort(key=lambda s: (s.get("relatedEditionIds", [""])[0], s["name"].lower()))
    OUT_JSON.write_text(json.dumps(merged, ensure_ascii=False, indent=2))

    from collections import Counter
    by_ed = Counter(s["relatedEditionIds"][0] for s in merged if s.get("relatedEditionIds"))
    print()
    print(f"Wrote {len(merged)} total sites ({new_total} new from agendas) → {OUT_JSON.relative_to(ROOT)}")
    for eid in sorted(by_ed):
        print(f"  {eid}: {by_ed[eid]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
