#!/usr/bin/env python3
"""
ACE 3 (US Midwest, 2015) ships its participant list as a single PDF, one
roster page after another with embedded portrait photos. The HTML / CSV
sources we usually rely on don't exist for ACE 3 alumni, so this script
mines the PDF directly:

  * Each page has ~3 participant blocks: name (line 1), role / org / email,
    country, then a multi-line bio.
  * Each page also has multiple embedded images. We use bbox positions to
    match each portrait to the name that sits closest below it.

Output:
  - Updates data/_historical-participants.json with new ACE-3 records
    (photo + bio + role + organization + country).
  - Saves the matched portraits under public/participants/historical/
    as ACE3pdf-<slug>.jpg.
"""
from __future__ import annotations
import json
import re
import sys
import unicodedata
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "info-reports" / "ACE-3-list-of-participants.pdf"
HIST_JSON = ROOT / "data" / "_historical-participants.json"
PHOTO_DIR = ROOT / "public" / "participants" / "historical"
EDITION_ID = "ace-3-midwest-2015"

KNOWN_COUNTRIES = {
    "Argentina": "ar", "Bolivia": "bo", "Brazil": "br", "Brasil": "br",
    "Canada": "ca", "Chile": "cl", "Colombia": "co",
    "Costa Rica": "cr", "Dominican Republic": "do",
    "Ecuador": "ec", "El Salvador": "sv", "Guatemala": "gt",
    "Honduras": "hn", "Jamaica": "jm", "Mexico": "mx", "México": "mx",
    "Panama": "pa", "Panamá": "pa", "Paraguay": "py", "Peru": "pe", "Perú": "pe",
    "Suriname": "sr", "Trinidad and Tobago": "tt", "Trinidad & Tobago": "tt",
    "Uruguay": "uy",
    "United States": "us", "United States of America": "us", "USA": "us",
    "Antigua & Barbuda": "ag", "Antigua and Barbuda": "ag",
    "Barbados": "bb", "Belize": "bz", "Bahamas": "bs", "The Bahamas": "bs",
    "Grenada": "gd", "St. Lucia": "lc", "Saint Lucia": "lc",
    "Dominica": "dm", "Guyana": "gy",
    "Germany": "de", "Israel": "il", "Spain": "es", "Korea": "kr",
}


def normalize_name(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip().lower()


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:60] or "x"


HONORIFIC_RE = re.compile(
    r"^(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Hon\.|Sir|Honorable|Honourable|Mr|Mrs|Ms|Dr)\s+",
    re.IGNORECASE,
)


def strip_honorific(line: str) -> str:
    """Return the line with a leading 'Hon.' / 'Mr.' / 'Dr.' stripped."""
    return HONORIFIC_RE.sub("", line).strip()


def looks_like_name(line: str) -> bool:
    # Strip a leading honorific so "Hon. Roselyn Paul" → "Roselyn Paul".
    line = strip_honorific(line.strip().rstrip(",;:."))
    if not line or len(line) > 60:
        return False
    if "@" in line: return False
    # A real person's name never contains a comma. Lines like "Head,
    # Hidalgo Business Network" or "Kannapolis, North Carolina" are titles
    # or addresses — drop them.
    if "," in line: return False
    if line == line.upper(): return False
    words = line.split()
    if not (2 <= len(words) <= 5):
        return False
    for w in words:
        clean = w.replace(".", "").replace("(", "").replace(")", "")
        if not clean: return False
        if not re.match(r"^[A-ZÀ-Ý]", clean):
            return False
    # Reject if it starts with a courtesy / role prefix.
    bad_starters = (
        "Mr.", "Ms.", "Mrs.", "Dr.", "Prof.", "Hon.", "Sir", "Mr", "Mrs", "Ms", "Dr",
        "Director", "President", "CEO", "Senior", "Chief", "Vice", "Executive",
        "Deputy", "Ministry", "Government", "Department", "Office", "Federal",
        "Acting", "Honorable", "Honourable", "Ambassador", "Secretary", "Minister",
        "Third", "ACE", "page", "The",
    )
    if any(line.startswith(s + " ") or line == s for s in bad_starters):
        return False
    # Reject if the line contains org-style words that never appear in person names.
    ORG_TOKENS = frozenset([
        "industry", "industries", "ministry", "department", "agency",
        "authority", "council", "commission", "chamber", "association",
        "foundation", "company", "corporation", "corp", "inc",
        "university", "college", "institute", "academy", "school",
        "bank", "trust", "embassy", "consulate", "office",
        "federal", "national", "regional", "state", "city",
        "technology", "technological", "research", "innovation",
        "amcham", "investpacific", "cenired", "corpoica",
    ])
    low_words = [re.sub(r"[^a-z]", "", w.lower()) for w in words]
    if any(t in ORG_TOKENS for t in low_words):
        return False
    # Reject if the line itself is a known country.
    if line in KNOWN_COUNTRIES:
        return False
    return True


def parse_page(doc, page_idx: int) -> list[dict]:
    """
    Walk a page top→bottom using PyMuPDF's "dict" extraction, which gives
    line-level bboxes. We sort lines by (column, y-coord) so names land
    above their own bios even when the PDF is multi-column.
    """
    page = doc[page_idx]
    page_w = page.rect.width
    column_split = page_w / 2

    raw_lines: list[tuple[int, float, float, str]] = []
    data = page.get_text("dict")
    for block in data.get("blocks", []):
        if block.get("type") != 0:    # only text blocks
            continue
        for line in block.get("lines", []):
            text = " ".join(span.get("text", "") for span in line.get("spans", [])).strip()
            if not text:
                continue
            x0, y0 = line["bbox"][0], line["bbox"][1]
            col = 0 if x0 < column_split else 1
            raw_lines.append((col, y0, x0, text))
    raw_lines.sort(key=lambda r: (r[0], round(r[1] / 4) * 4, r[2]))
    raw_lines = [(y, t) for (_, y, _, t) in raw_lines]

    participants = []
    current = None
    for y, line in raw_lines:
        if looks_like_name(line):
            if current and (current.get("bio_lines") or current.get("country")):
                participants.append(current)
            current = {
                "name": strip_honorific(line),
                "role": "",
                "organization": "",
                "email": "",
                "country": "",
                "bio_lines": [],
                "y": y,
            }
            continue
        if current is None:
            continue
        if "@" in line and not current["email"]:
            current["email"] = line
            continue
        if line in KNOWN_COUNTRIES and not current["country"]:
            current["country"] = line
            continue
        # Role / organization heuristic — first 2 short lines after the name.
        if not current["role"] and len(line) < 80 and len(current["bio_lines"]) == 0 and "@" not in line:
            current["role"] = line
            continue
        if not current["organization"] and len(line) < 100 and "@" not in line and len(current["bio_lines"]) == 0:
            current["organization"] = line
            continue
        # Otherwise it's bio prose.
        if len(line) > 30:
            current["bio_lines"].append(line)
        elif current["bio_lines"]:
            current["bio_lines"].append(line)

    if current and current.get("bio_lines"):
        participants.append(current)

    # Finalise + match photos using image bboxes.
    #
    # The PDF embeds three image classes per page:
    #   1. Page chrome (header banners, vertical strips) — huge ratio or tiny
    #   2. Country flags — rendered ~26x24px (size-based reject)
    #   3. Portrait photos — rendered ~55-65px wide × 75-90px tall
    # We keep only the portrait class. Size-based cutoff is more reliable
    # than ratio (some portraits land at ratio ~1.02 which a strict <0.95
    # filter would drop).
    raw_infos = page.get_image_info(xrefs=True)
    image_infos: list[dict] = []
    for i in raw_infos:
        if not i.get("xref"):
            continue
        bbox = i.get("bbox") or (0, 0, 0, 0)
        rw = bbox[2] - bbox[0]
        rh = bbox[3] - bbox[1]
        if rh <= 0 or rw <= 0:
            continue
        # Portraits sit in the 45-75 wide × 55-95 tall band; flags are
        # ~24-30 wide; banners are >100 wide and short.
        if not (45 <= rw <= 80 and 55 <= rh <= 100):
            continue
        image_infos.append(i)
    image_infos.sort(key=lambda i: i["bbox"][1])   # by top y-coord

    # 1-to-1 photo assignment: sort names AND photos top-to-bottom, then
    # zip them in order. Each photo is consumed at most once. If the page
    # has fewer photos than names (or vice-versa), the surplus get no photo
    # rather than re-using one. This eliminates the "everyone shares xref"
    # bug we had with the nearest-center matcher.
    sorted_names = sorted(participants, key=lambda p: p["y"])
    used = set()
    name_photo: dict[int, int] = {}     # name index in sorted_names → xref
    for i, p in enumerate(sorted_names):
        # Prefer the FIRST unused image whose top sits below the name's y.
        for img in image_infos:
            if img["xref"] in used:
                continue
            if img["bbox"][1] < p["y"] - 10:
                continue
            name_photo[i] = img["xref"]
            used.add(img["xref"])
            break

    out = []
    for i, p in enumerate(sorted_names):
        bio = " ".join(p["bio_lines"]).strip()
        if len(bio) > 700:
            bio = bio[:697].rsplit(" ", 1)[0] + "…"
        out.append({
            "name": p["name"],
            "role": p["role"],
            "organization": p["organization"],
            "email": p["email"],
            "country": p["country"],
            "bio": bio,
            "photo_xref": name_photo.get(i),
            "page": page_idx + 1,
        })
    return out


def save_photo(doc, xref: int, slug: str) -> str | None:
    if not xref:
        return None
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha >= 4:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        PHOTO_DIR.mkdir(parents=True, exist_ok=True)
        dest = PHOTO_DIR / f"ACE3pdf-{slug}.jpg"
        pix.save(str(dest))
        return f"/participants/historical/ACE3pdf-{slug}.jpg"
    except Exception:
        return None


def main() -> int:
    if not PDF_PATH.exists():
        print("missing ACE-3 PDF", file=sys.stderr)
        return 1
    doc = fitz.open(PDF_PATH)
    records = json.loads(HIST_JSON.read_text())
    by_norm: dict[str, int] = {}
    for i, r in enumerate(records):
        by_norm.setdefault(normalize_name(r["name"]), i)

    stats = {"parsed": 0, "enriched": 0, "new": 0, "skipped": 0}
    new_samples: list[str] = []

    for idx in range(len(doc)):
        for p in parse_page(doc, idx):
            stats["parsed"] += 1
            norm = normalize_name(p["name"])
            if not norm or len(norm) < 4:
                stats["skipped"] += 1; continue

            country_id = KNOWN_COUNTRIES.get(p["country"], "intl") if p["country"] else "intl"
            url = save_photo(doc, p["photo_xref"], slugify(p["name"]))

            existing_idx = by_norm.get(norm)
            if existing_idx is not None:
                rec = records[existing_idx]
                if EDITION_ID not in rec["editionIds"]:
                    rec["editionIds"] = sorted(set(rec["editionIds"] + [EDITION_ID]))
                if p["bio"] and (not rec.get("shortBio") or len(p["bio"]) > len(rec.get("shortBio", ""))):
                    rec["shortBio"] = p["bio"]
                if p["role"] and not rec.get("role"):
                    rec["role"] = p["role"]
                if p["organization"] and not rec.get("organization"):
                    rec["organization"] = p["organization"]
                if url and not rec.get("photoUrl"):
                    rec["photoUrl"] = url
                stats["enriched"] += 1
            else:
                new_rec = {
                    "id": f"p-hist-{country_id}-{slugify(p['name'])}-ace3pdf",
                    "name": p["name"],
                    "countryId": country_id,
                    "organization": p["organization"] or "",
                    "role": p["role"] or "",
                    "sectorIds": [],
                    "actorType": "Government",
                    "editionIds": [EDITION_ID],
                    "areasOfInterest": [],
                    "website": None,
                    "source": "ace3-pdf",
                    "shortBio": p["bio"] or None,
                    "photoUrl": url,
                }
                records.append(new_rec)
                by_norm[norm] = len(records) - 1
                stats["new"] += 1
                if len(new_samples) < 12:
                    new_samples.append(p["name"])

    HIST_JSON.write_text(json.dumps(records, ensure_ascii=False, indent=2))
    print(f"Stats: {stats}")
    if new_samples:
        print("Sample NEW ACE 3 records:")
        for s in new_samples:
            print(f"  - {s}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
