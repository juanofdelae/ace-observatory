#!/usr/bin/env python3
"""
Phase C (part 2): Mine visited-sites candidates from the cached tripbook text.

For each tripbook PDF cache, walk page-by-page and extract the most plausible
site heading — typically an ALL-CAPS line near the top of the page, followed
by a descriptive paragraph.

Output: data/_visited-sites-extracted.json (per-edition arrays of candidate sites).
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "data" / "_pdf-cache"
OUT_JSON = ROOT / "data" / "_visited-sites-extracted.json"

# Noise headers to filter out — boilerplate, logistics, agenda items, etc.
NOISE_PATTERNS = [
    r"^AMERICAS COMPETITIVENESS EXCHANGE",
    r"^ACE\s",
    r"^THE\s+\d+",
    r"^TABLE OF CONTENTS",
    r"^INDEX",
    r"^AGENDA",
    r"^MESSAGE FROM",
    r"^ATTIRE",
    r"^WITH TIE",
    r"^COAT",
    r"^HOTEL\s",
    r"^OUT OF HOTEL",
    r"^LOAD|^DEPART|^BREAK|^LUNCH|^DINNER|^BREAKFAST",
    r"^MEET IN",
    r"^LOCATION -",
    r"^NOTES -",
    r"^TIME\s*$",
    r"^ACTIVITY\s*$",
    r"^TOUR OF ",
    r"^PLEASE CHECK",
    r"^TRIP BOOK",
    r"^LIBRO DE VIAJE",
    r"^LOBBY",
    r"^BIOGRAPHY",
    r"^WELCOME",
    r"^ROUTE",
    r"^BUS(ES)?\s*$",
]

# Minimum signal — a site name usually contains one of these institution words
INSTITUTION_HINTS = [
    "UNIVERSITY", "COLLEGE", "INSTITUTE", "LABORATORY", "LAB",
    "CENTER", "CENTRE", "CAMPUS", "SCHOOL", "ACADEMY",
    "MUSEUM", "FOUNDATION", "HOSPITAL",
    "COMPANY", "CORPORATION", "CORP", "INC", "LLC",
    "TECHNOLOGIES", "TECHNOLOGY", "TECH",
    "INNOVATION", "INCUBATOR", "ACCELERATOR",
    "HUB", "PARK", "LABS", "GROUP",
    "ASSOCIATION", "CHAMBER", "COUNCIL", "COMMISSION",
    "MINISTRY", "DEPARTMENT", "AGENCY", "AUTHORITY",
    "CENTER FOR", "INSTITUTE OF", "CENTRE FOR", "SCHOOL OF",
    "CITY OF", "STATE OF",
    "ECONOMIC DEVELOPMENT", "TRADE ADMINISTRATION",
    "RESEARCH", "STARTUP", "STARTUPS",
    "CATHEDRAL", "MISSION", "PLAZA",
]

def is_noise(line: str) -> bool:
    return any(re.search(p, line) for p in NOISE_PATTERNS)


def is_site_like(line: str) -> bool:
    """True if the line reads like a proper-noun site name."""
    if len(line) < 4 or len(line) > 80:
        return False
    if is_noise(line):
        return False
    if any(h in line for h in INSTITUTION_HINTS):
        return True
    # Also accept ALL-CAPS blocks of ≥3 words that aren't noise (many sites are
    # branded names like 'KILN', 'GOOGLE X' which lack institution hints).
    words = line.split()
    if len(words) >= 2 and re.fullmatch(r"[A-Z][A-Z0-9 &\-\'\"\.,/()]+[A-Z0-9)]", line):
        return True
    return False


def clean_paragraph(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > 500:
        text = text[:497].rsplit(" ", 1)[0] + "…"
    return text


def extract_from_page(page_text: str) -> tuple[str, str] | None:
    """
    Find the first plausible site heading on this page and the first
    descriptive paragraph after it.
    """
    lines = [l.rstrip() for l in page_text.split("\n")]
    heading = None
    desc_lines: list[str] = []
    for i, line in enumerate(lines):
        l = line.strip()
        if not l:
            if heading and desc_lines:
                break
            continue
        if heading is None:
            if is_site_like(l):
                heading = l
            continue
        # Gather the first non-empty paragraph (stop at next ALL-CAPS/heading)
        if re.fullmatch(r"[A-Z][A-Z0-9 &\-\'\"\.,/()]+[A-Z0-9)]", l) and len(l.split()) >= 2:
            break
        # Skip tiny lines (page numbers, URLs)
        if len(l) < 12 and re.match(r"^[\d\s\-./]+$", l):
            continue
        if re.match(r"^www\.|^https?://", l):
            continue
        desc_lines.append(l)
        if sum(len(x) for x in desc_lines) > 400:
            break

    if not heading:
        return None
    desc = clean_paragraph(" ".join(desc_lines))
    return (heading.title().strip(), desc)


EDITION_IDS = {
    2: "ace-2-mexico-2014", 3: "ace-3-midwest-2015", 4: "ace-4-cordoba-2015",
    5: "ace-5-arizona-california-2016", 6: "ace-6-ontario-2016",
    7: "ace-7-texas-2017", 8: "ace-8-florida-2017",
    9: "ace-9-germany-israel-2018", 10: "ace-10-northern-california-2018",
    11: "ace-11-puerto-rico-2019", 12: "ace-12-chile-2019",
    13: "ace-13-colorado-2021",
}


def main() -> int:
    by_edition: dict[str, list[dict]] = {}
    seen: dict[tuple[str, str], bool] = {}

    for cache_file in sorted(CACHE_DIR.glob("*.json")):
        data = json.loads(cache_file.read_text())
        if data.get("kind") != "tripbook":
            continue
        ed_num = data.get("edition")
        if ed_num not in EDITION_IDS:
            continue
        edition_id = EDITION_IDS[ed_num]

        candidates = []
        for page_idx, page in enumerate(data["text"]):
            hit = extract_from_page(page)
            if not hit:
                continue
            name, desc = hit
            # Skip if name / description combo is too short to be a real site
            if len(name) < 4 or len(desc) < 40:
                continue
            key = (edition_id, name.lower())
            if key in seen:
                continue
            seen[key] = True
            candidates.append({
                "name": name,
                "description": desc,
                "editionId": edition_id,
                "sourcePdf": data["file"],
                "page": page_idx + 1,
            })

        if candidates:
            by_edition.setdefault(edition_id, []).extend(candidates)

    OUT_JSON.write_text(json.dumps(by_edition, ensure_ascii=False, indent=2))
    total = sum(len(v) for v in by_edition.values())
    print(f"Wrote {total} site candidates across {len(by_edition)} editions → {OUT_JSON.relative_to(ROOT)}")
    for eid in sorted(by_edition):
        print(f"  {eid}: {len(by_edition[eid])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
