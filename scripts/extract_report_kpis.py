#!/usr/bin/env python3
"""
extract_report_kpis.py

Reusable scaffold for ingesting an ACE Final Report PDF into a draft JSON
that can be hand-finished and pasted into `data/reports.ts`.

What it does (mechanically):
  1. Reads every page of the PDF with PyMuPDF.
  2. Detects the "At a Glance" / "By the Numbers" page by keyword.
  3. Pulls KPIs via two passes:
       - line-by-line "<NUMBER> <noun phrase>" patterns
       - whole-page regex for percentages near keywords
  4. Tries to extract the table-of-contents to identify section starts.
  5. Pulls testimonials by scanning for quoted strings followed by
     a name/role/organization triplet.
  6. Pulls media URLs (press articles + social media handles).

What it does NOT do (left to humans):
  - Sector tagging (which site belongs to which cluster — needs judgment)
  - Host site → city mapping (depends on agenda prose)
  - Categorical partnership breakdown (often missing entirely)
  - Pre / exit survey table (rare in older reports)

Usage:
    python3 scripts/extract_report_kpis.py info-reports/ACE-11-Final-Report.pdf

Writes:
    data/_report-draft-<edition>.json   — draft JSON to review/finish
    stdout                               — analyst summary

The output JSON is a strict subset of the ACEReport schema in data/reports.ts.
After review, copy the polished version into the `reports[]` array.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Optional, List, Dict, Tuple, Pattern

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF not installed. Run: pip3 install pymupdf", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent

# ───────────────────────── KPI patterns ─────────────────────────
# Each tuple: (regex, label, value-cleaner). The first match wins per label.
KPI_PATTERNS: List[Tuple[Pattern, str]] = [
    (re.compile(r"(\d+)\s+leaders?\b", re.I), "Leaders"),
    (re.compile(r"(\d+)\s+(?:participants?|delegates?)\b", re.I), "Delegates"),
    (re.compile(r"(\d+)\s+countries?\s+(?:represented|participating)?", re.I), "Countries represented"),
    (re.compile(r"(\d+)\s+sites?\s+(?:visited|featured)?", re.I), "Sites visited"),
    (re.compile(r"(\d+)\s+projects?\s+(?:featured|showcased)?", re.I), "Projects featured"),
    (re.compile(r"(\d+)\s*%\s+(?:women|female)", re.I), "Women participation"),
    (re.compile(r"(\d+)\s*%[^\n]*?(?:gender\s+and\s+youth|inclusion)", re.I), "Committed to gender & youth inclusion"),
    (re.compile(r"(\d+)\s*%[^\n]*?(?:would\s+recommend|recommend\s+the\s+program)", re.I), "Would recommend the program"),
    (re.compile(r"(\d+)\s*%[^\n]*?(?:exceeded|above)\s+expectations", re.I), "Exceeded expectations"),
    (re.compile(r"(\d+)\s+(?:letters?\s+of\s+intent|LOIs?)", re.I), "Letters of intent signed"),
    (re.compile(r"(\d+)\s+(?:new\s+)?connections?\b", re.I), "New connections"),
    (re.compile(r"(\d+)\+?\s+collaboration\s+opportunities?", re.I), "Collaboration opportunities"),
    (re.compile(r"(\d+)\s+(?:press\s+)?articles?\b", re.I), "Press articles"),
    (re.compile(r"(\d+)\s+media\s+outlets?\b", re.I), "Media outlets"),
]

# A glance page usually contains some of these markers within ~80 chars.
GLANCE_KEYWORDS = ("at a glance", "by the numbers", "general statistics", "in numbers")

# Section markers in tables of contents (heuristic).
TOC_MARKERS = (
    "table of content", "index", "tabla de contenido",
)


def find_glance_page(doc: fitz.Document) -> int | None:
    """Return the 0-indexed page that looks like 'At a Glance'."""
    for i in range(min(8, doc.page_count)):
        text = doc[i].get_text().lower()
        if any(k in text for k in GLANCE_KEYWORDS):
            return i
    return None


def extract_kpis(text: str) -> list[dict]:
    """Run the KPI patterns over a chunk of text. Returns kpi dicts."""
    out: list[dict] = []
    seen_labels: set[str] = set()
    for pattern, label in KPI_PATTERNS:
        if label in seen_labels:
            continue
        m = pattern.search(text)
        if m:
            value = m.group(1)
            # If the source uses %, store as string with %
            if "%" in pattern.pattern:
                value = f"{value}%"
            else:
                value = int(value)
            out.append({"label": label, "value": value})
            seen_labels.add(label)
    return out


def extract_testimonials(doc: fitz.Document) -> list[dict]:
    """Heuristic: find lines like '"...quote..."' followed by NAME (caps),
    role (Title Case line), organization. We scan the latter half of the
    doc since testimonials are usually in the back."""
    out: list[dict] = []
    quote_pattern = re.compile(r'[“"]([^”"]{40,500})[”"]', re.S)
    for i in range(doc.page_count // 2, doc.page_count):
        text = doc[i].get_text()
        for m in quote_pattern.finditer(text):
            quote = m.group(1).replace("\n", " ").strip()
            # Look for the next ~6 lines after the quote for name + role
            tail = text[m.end():m.end() + 400]
            tail_lines = [
                l.strip() for l in tail.splitlines()
                if l.strip() and not l.strip().isdigit()
            ][:6]
            if not tail_lines:
                continue
            name_candidates = [
                l for l in tail_lines
                if l.isupper() and len(l.split()) <= 5 and len(l) < 40
            ]
            name = name_candidates[0].title() if name_candidates else "—"
            role = next(
                (l for l in tail_lines if not l.isupper() and not l.startswith("http")),
                "",
            )
            out.append({
                "quote": quote,
                "name": name,
                "role": role,
                "_source_page": i + 1,
            })
            if len(out) >= 8:
                return out
    return out


def extract_media(doc: fitz.Document) -> dict:
    """Count press articles vs social media URLs."""
    press_pattern = re.compile(r"https?://[^\s)]+", re.I)
    twitter_pattern = re.compile(r"twitter\.com/[^/]+/status/\d+", re.I)
    social_pattern = re.compile(r"(twitter\.com|facebook\.com|linkedin\.com|instagram\.com|youtube\.com)", re.I)
    all_urls: list[str] = []
    for page in doc:
        all_urls.extend(press_pattern.findall(page.get_text()))
    twitter_urls = [u for u in all_urls if twitter_pattern.search(u)]
    social_urls = [u for u in all_urls if social_pattern.search(u)]
    press_urls = [u for u in all_urls if not social_pattern.search(u)]
    return {
        "press_article_count": len(set(press_urls)),
        "social_media_post_count": len(set(social_urls)),
        "twitter_post_count": len(set(twitter_urls)),
        "sample_press_urls": list(dict.fromkeys(press_urls))[:10],
    }


def find_toc_pages(doc: fitz.Document) -> dict[str, int]:
    """Try to extract a TOC mapping section name → starting page."""
    toc: dict[str, int] = {}
    # PyMuPDF may have a real TOC outline embedded
    outline = doc.get_toc()
    if outline:
        for level, title, page in outline:
            if level <= 2:
                toc[title.strip()] = page
    return toc


def main(pdf_path: str) -> None:
    p = Path(pdf_path)
    if not p.exists():
        print(f"Not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    doc = fitz.open(pdf_path)

    glance_idx = find_glance_page(doc)
    glance_text = doc[glance_idx].get_text() if glance_idx is not None else ""
    fallback_text = "\n".join(
        doc[i].get_text() for i in range(min(6, doc.page_count))
    )

    kpis = extract_kpis(glance_text) if glance_text.strip() else []
    if not kpis:
        kpis = extract_kpis(fallback_text)

    testimonials = extract_testimonials(doc)
    media = extract_media(doc)
    toc = find_toc_pages(doc)

    draft = {
        "_source": p.name,
        "_pages": doc.page_count,
        "_glance_page": (glance_idx + 1) if glance_idx is not None else None,
        "kpis": kpis,
        "testimonials_extracted": testimonials,
        "media": media,
        "toc": toc,
        # Sections below need human-driven enrichment:
        "_TODO_sectors": "Identify thematic clusters from the agenda prose.",
        "_TODO_hostSites": "List host sites with sector + cityId.",
        "_TODO_collaborations": "Look for 'X collaboration opportunities' and named leads.",
        "_TODO_partnerships": "Extract categorical breakdown if published.",
        "_TODO_knowledgeGain": "Pre/exit survey by topic (often absent).",
        "_TODO_feedback": "Expectation scale or simple recommend %.",
    }

    # Write to data/_report-draft-<basename>.json
    safe_name = re.sub(r"[^a-z0-9]+", "-", p.stem.lower()).strip("-")
    out_path = ROOT / "data" / f"_report-draft-{safe_name}.json"
    out_path.write_text(json.dumps(draft, indent=2, ensure_ascii=False))

    print(f"\n{'='*70}")
    print(f"DRAFT EXTRACTED: {p.name}  ({doc.page_count} pages)")
    print(f"{'='*70}")
    print(f"At-a-glance page detected: {draft['_glance_page']}")
    print(f"\nKPIs auto-extracted ({len(kpis)}):")
    for k in kpis:
        print(f"  · {k['label']}: {k['value']}")
    print(f"\nTestimonials auto-extracted: {len(testimonials)}")
    for t in testimonials[:3]:
        q = t["quote"][:80] + ("…" if len(t["quote"]) > 80 else "")
        print(f"  · [p.{t['_source_page']}] {t['name']}: \"{q}\"")
    print(f"\nMedia signals: {media['press_article_count']} press URLs · "
          f"{media['social_media_post_count']} social posts "
          f"({media['twitter_post_count']} tweets)")
    if toc:
        print(f"\nTOC entries detected: {len(toc)}")
    print(f"\nDraft JSON written to: {out_path.relative_to(ROOT)}")
    print(f"Next step: review the JSON, fill in sectors/hostSites/cities, "
          f"then port into data/reports.ts")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/extract_report_kpis.py <pdf-path>",
              file=sys.stderr)
        sys.exit(2)
    main(sys.argv[1])
