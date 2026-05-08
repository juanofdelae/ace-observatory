#!/usr/bin/env python3
"""
Extract ACE 9 participant bios directly from ACE9-TripBook-ACE-9.pdf
(pages 120-170). The trip-book dedicates one page per person and carries
longer biographies than the HTML page we already ingest — so this pass:

  1. Enriches existing historical records with the PDF-derived bio if
     it's longer than what we already have.
  2. Adds new records for host-side participants (Germany / Israel
     organizers, Fraunhofer directors, etc.) that are only in the PDF.
  3. Extracts the first embedded image as a photo under
     public/participants/historical/.
"""
from __future__ import annotations
import json
import re
import shutil
import sys
import unicodedata
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "info-reports" / "ACE9-TripBook-ACE-9.pdf"
HIST_JSON = ROOT / "data" / "_historical-participants.json"
PHOTO_DIR = ROOT / "public" / "participants" / "historical"
EDITION_ID = "ace-9-germany-israel-2018"

PARTICIPANT_START_PAGE = 119    # 0-indexed: page 120
PARTICIPANT_END_PAGE   = 175    # slightly past the bios section


def normalize_name(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:60] or "x"


# Common title-prefixed words that signal the line is NOT a name — used to
# reject false positives when hunting for the name line.
NOT_A_NAME = frozenset([
    "americas", "www", "bio", "biography", "objectives", "the", "www.",
    "index", "participants", "organizers", "agenda", "welcome", "objectives",
    "page", "message", "host", "cities", "tel", "email", "phone", "address",
])


def looks_like_name(line: str) -> bool:
    line = line.strip()
    if not line or len(line) > 60:
        return False
    # Reject ALL-CAPS strings (section titles like "BIOS OF", "FROM OUTSIDE").
    if line == line.upper() and any(c.isalpha() for c in line):
        return False
    words = line.split()
    if not (2 <= len(words) <= 5):
        return False
    # Accent-aware capitalization check on each word.
    for w in words:
        if not re.match(r"^[A-ZÀ-Ý][a-zà-ÿA-Z\-']*\.?$", w):
            return False
    low = line.lower().strip().rstrip(".")
    for bad in NOT_A_NAME:
        if bad in low.split():
            return False
    # Reject "organization" style phrases — real names rarely contain these.
    ORG_TOKENS = ("authority", "institute", "institution", "university",
                  "college", "ministry", "department", "agency", "association",
                  "chamber", "foundation", "company", "corporation", "center",
                  "centre", "federation", "society", "council")
    if any(tok in low.split() for tok in ORG_TOKENS):
        return False
    return True


def extract_page(doc, idx: int) -> dict | None:
    page = doc[idx]
    text = page.get_text("text") or ""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if len(lines) < 4:
        return None

    # Skip intro/outro pages.
    low_text = text.lower()
    if "www.riacevents.org" not in low_text and "americas competitiveness" not in low_text:
        return None

    # Name line: usually the first/second line that isn't a page number or
    # the riacevents watermark.
    name = None
    name_idx = -1
    for i, l in enumerate(lines[:6]):
        if re.fullmatch(r"\d+", l): continue
        if "riacevents" in l.lower(): continue
        if "americas competitiveness" in l.lower(): continue
        if looks_like_name(l):
            name = l
            name_idx = i
            break
    if not name:
        return None

    # Build description from paragraphs that follow the name.
    bio_lines = []
    for l in lines[name_idx + 1:]:
        if len(l) < 20: continue
        if re.match(r"^(Role|Company|Facility|Organization|Ministry|Address|Tel|Email|Phone):", l):
            continue
        if "riacevents" in l.lower(): continue
        if l.lower().startswith(("americas competitiveness", "the flying")): continue
        bio_lines.append(l)
    bio = " ".join(bio_lines).strip()
    if len(bio) > 900:
        bio = bio[:897].rsplit(" ", 1)[0] + "…"

    # Role / organization often appear at the bottom of the page — capture the
    # last 3 short lines (they tend to be Role + Org + Country/location).
    tail = [l for l in lines[-6:] if 5 <= len(l) <= 80 and not l.lower().startswith("americas") and "riacevents" not in l.lower() and not re.fullmatch(r"\d+", l)]
    role = tail[-3] if len(tail) >= 3 else ""
    org  = tail[-2] if len(tail) >= 2 else ""

    # Extract the largest image (the portrait).
    images = page.get_images(full=True)
    best = None
    best_area = 0
    for img in images:
        w, h = img[2], img[3]
        if w * h < 80 * 80: continue
        if w * h > best_area:
            best_area = w * h
            best = img[0]

    return {
        "name": name,
        "bio": bio,
        "role": role,
        "organization": org,
        "photo_xref": best,
        "page": idx + 1,
    }


def save_photo(doc, xref: int, slug: str) -> str | None:
    if xref is None: return None
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha >= 4:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        PHOTO_DIR.mkdir(parents=True, exist_ok=True)
        dest = PHOTO_DIR / f"ACE9pdf-{slug}.jpg"
        pix.save(str(dest))
        return f"/participants/historical/ACE9pdf-{slug}.jpg"
    except Exception:
        return None


def main() -> int:
    if not PDF_PATH.exists():
        print("missing ACE 9 trip-book", file=sys.stderr); return 1

    doc = fitz.open(PDF_PATH)
    records = json.loads(HIST_JSON.read_text())
    by_norm: dict[str, int] = {}
    for i, r in enumerate(records):
        by_norm.setdefault(normalize_name(r["name"]), i)

    stats = {"enriched": 0, "new": 0, "skipped": 0}
    new_samples: list[str] = []

    for idx in range(PARTICIPANT_START_PAGE, min(PARTICIPANT_END_PAGE, len(doc))):
        rec = extract_page(doc, idx)
        if not rec:
            stats["skipped"] += 1
            continue
        norm = normalize_name(rec["name"])
        if not norm or len(norm) < 4:
            continue

        existing_idx = by_norm.get(norm)
        if existing_idx is not None:
            existing = records[existing_idx]
            # Enrich the shorter bio.
            if rec["bio"] and (not existing.get("shortBio") or len(rec["bio"]) > len(existing.get("shortBio", ""))):
                existing["shortBio"] = rec["bio"]
            # Fill missing role/org when blank.
            if not existing.get("role") and rec["role"]:
                existing["role"] = rec["role"]
            if not existing.get("organization") and rec["organization"]:
                existing["organization"] = rec["organization"]
            # Add ACE 9 edition if missing.
            if EDITION_ID not in existing["editionIds"]:
                existing["editionIds"] = sorted(set(existing["editionIds"] + [EDITION_ID]))
            # Photo.
            if rec["photo_xref"] and not existing.get("photoUrl"):
                url = save_photo(doc, rec["photo_xref"], slugify(rec["name"]))
                if url:
                    existing["photoUrl"] = url
            stats["enriched"] += 1
        else:
            # New host-side record.
            url = save_photo(doc, rec["photo_xref"], slugify(rec["name"]))
            cid = "intl"   # defaults — Germany/Israel host folks.
            new_rec = {
                "id": f"p-hist-{cid}-{slugify(rec['name'])}-ace9pdf",
                "name": rec["name"],
                "countryId": cid,
                "organization": rec["organization"] or "",
                "role": rec["role"] or "",
                "sectorIds": [],
                "actorType": "International Organization",
                "editionIds": [EDITION_ID],
                "areasOfInterest": [],
                "website": None,
                "source": "ace9-tripbook",
                "shortBio": rec["bio"] or None,
                "photoUrl": url,
            }
            records.append(new_rec)
            by_norm[norm] = len(records) - 1
            stats["new"] += 1
            if len(new_samples) < 12:
                new_samples.append(rec["name"])

    HIST_JSON.write_text(json.dumps(records, ensure_ascii=False, indent=2))
    print(f"Stats: {stats}")
    if new_samples:
        print("New (PDF-only) participants:")
        for s in new_samples:
            print(f"  - {s}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
