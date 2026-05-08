#!/usr/bin/env python3
"""
Phase C (part 3): Build a per-edition document mapping from the PDF cache
metadata, then write it as data/_documents.json for the UI to consume.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "data" / "_pdf-cache"
PUBLIC_DOCS = ROOT / "public" / "documents"
OUT = ROOT / "data" / "_documents.json"

EDITION_IDS = {
    1: "ace-1-southeast-2014", 2: "ace-2-mexico-2014", 3: "ace-3-midwest-2015",
    4: "ace-4-cordoba-2015", 5: "ace-5-arizona-california-2016",
    6: "ace-6-ontario-2016", 7: "ace-7-texas-2017", 8: "ace-8-florida-2017",
    9: "ace-9-germany-israel-2018", 10: "ace-10-northern-california-2018",
    11: "ace-11-puerto-rico-2019", 12: "ace-12-chile-2019",
    13: "ace-13-colorado-2021", 14: "ace-14-louisiana-2022",
    15: "ace-15-ecuador-2022", 16: "ace-16-seattle-2023",
    17: "ace-17-panama-2024", 18: "ace-18-michigan-2024",
    19: "ace-19-armenia-2024", 20: "ace-20-illinois-2025",
    21: "ace-21-belem-2025", 22: "ace-22-cordoba-2025",
    23: "ace-23-memphis-2026",
}

KIND_LABELS = {
    "tripbook": "Trip Book",
    "agenda": "Agenda",
    "participants": "Participants",
    "final-report": "Final Report",
    "overview": "Country Overview",
    "other": "Document",
}


def main() -> int:
    docs_by_edition: dict[str, list[dict]] = {}

    for cache_file in sorted(CACHE_DIR.glob("*.json")):
        data = json.loads(cache_file.read_text())
        ed = data.get("edition")
        if ed not in EDITION_IDS:
            continue

        filename = data["file"]
        symlink = PUBLIC_DOCS / filename
        if not symlink.exists() and not symlink.is_symlink():
            continue  # Not served.

        edition_id = EDITION_IDS[ed]
        docs_by_edition.setdefault(edition_id, []).append({
            "kind": data["kind"],
            "label": KIND_LABELS.get(data["kind"], data["kind"].title()),
            "filename": filename,
            "url": f"/documents/{filename}",
            "pages": data["pages"],
        })

    # Sort each list: tripbook > agenda > final-report > participants > overview > other
    order = ["tripbook", "agenda", "final-report", "participants", "overview", "other"]
    for eid, docs in docs_by_edition.items():
        docs.sort(key=lambda d: order.index(d["kind"]) if d["kind"] in order else 99)

    OUT.write_text(json.dumps(docs_by_edition, ensure_ascii=False, indent=2))
    total = sum(len(v) for v in docs_by_edition.values())
    print(f"Wrote {total} documents across {len(docs_by_edition)} editions → {OUT.relative_to(ROOT)}")
    for eid in sorted(docs_by_edition):
        kinds = ", ".join(d["kind"] for d in docs_by_edition[eid])
        print(f"  {eid}: {kinds}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
