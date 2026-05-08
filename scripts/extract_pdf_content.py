#!/usr/bin/env python3
"""
Phase C (part 1): Extract raw text from every ACE PDF in info-reports/ and
cache each result as a JSON file under data/_pdf-cache/.

This is a one-shot extraction — downstream scripts consume these caches
instead of re-parsing the PDFs every time.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "info-reports"
CACHE_DIR = ROOT / "data" / "_pdf-cache"


def edition_from_filename(name: str) -> int | None:
    """
    Filenames like 'ACE7-TRIPBOOK.pdf', '1Americas-Competitiveness-Exchange.pdf'
    → 7, 1. Falls back to None if no ACE number can be inferred.
    """
    m = re.search(r"ACE[\s\-_]?(\d+)", name, re.IGNORECASE)
    if m:
        return int(m.group(1))
    # Leading-digit patterns: '1Americas-...pdf' → ACE 1 (ambiguous but this is the original)
    m = re.match(r"^(\d+)[A-Za-z]", name)
    if m and int(m.group(1)) <= 23:
        return int(m.group(1))
    return None


def kind_from_filename(name: str) -> str:
    n = name.lower()
    if "tripbook" in n or "trip-book" in n or "trip_book" in n:
        return "tripbook"
    if "agenda" in n or "itinerario" in n or "itinerary" in n:
        return "agenda"
    if "participant" in n:
        return "participants"
    if "final-report" in n or "final_report" in n or "finalreport" in n or n.endswith("report.pdf") or "-report-" in n:
        return "final-report"
    if "the ace in" in n:
        return "overview"
    return "other"


def extract(pdf_path: Path) -> dict:
    doc = fitz.open(pdf_path)
    pages: list[str] = []
    for p in doc:
        text = p.get_text("text")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        pages.append(text.strip())
    return {
        "file": pdf_path.name,
        "pages": len(pages),
        "edition": edition_from_filename(pdf_path.name),
        "kind": kind_from_filename(pdf_path.name),
        "text": pages,
    }


def main() -> int:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    print(f"Found {len(pdfs)} PDFs")
    for pdf in pdfs:
        cache_file = CACHE_DIR / (pdf.stem + ".json")
        if cache_file.exists() and cache_file.stat().st_mtime >= pdf.stat().st_mtime:
            continue  # Up-to-date cache.
        try:
            data = extract(pdf)
            cache_file.write_text(json.dumps(data, ensure_ascii=False))
            print(f"  ✓ {pdf.name}  [ACE{data['edition']}/{data['kind']}, {data['pages']} pages]")
        except Exception as e:
            print(f"  ✗ {pdf.name}: {e}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
