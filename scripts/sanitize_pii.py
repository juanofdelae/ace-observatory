"""
One-off PII sanitizer for auto-extracted JSON datasets.

Strips emails, phone numbers and common label fragments
("Phone:", "Cell Phone:", "Work phone:", "E-mail:", "Email:",
"Tel.:", "Tel:") from descriptive free-text fields before publishing
the site to the public web — the originals were extracted from
tripbook PDFs and contain personal contact details of public
officials that should not be republished as a structured, searchable
dataset (GDPR/LGPD risk).

Targets:
  - data/_visited-sites-auto.json  -> field "description"
  - data/_historical-participants.json -> field "shortBio"

Idempotent: re-running on already-sanitized content is a no-op.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")

# Phone patterns: US (123) 456-7890, 123-456-7890, 123.456.7890,
# international +XX XX XXX XX XX, and bare 7-15 digit runs adjacent to
# phone-y context. Conservative — avoids stripping years like "1980".
PHONE_RES = [
    re.compile(r"\(\s*\+?\d{1,4}\s*\)\s*\d{2,4}[\s.\-]?\d{2,4}[\s.\-]?\d{2,5}"),
    re.compile(r"\+\d{1,3}[\s.\-]?\d{1,4}[\s.\-]?\d{1,4}[\s.\-]?\d{1,5}[\s.\-]?\d{0,5}"),
    re.compile(r"\b\d{3}[\s.\-]\d{3}[\s.\-]\d{4}\b"),
]

# Strip the common labels too, including any trailing colon and whitespace,
# so we don't leave dangling "Email:" / "Phone:" tokens behind.
LABEL_RE = re.compile(
    r"\b(Cell\s*Phone|Work\s*phone|Mobile|Tel\.?|Telephone|Phone|E-?mail|Fax)\s*:\s*",
    re.IGNORECASE,
)

# Collapse 2+ whitespace into one and strip stray punctuation that gets
# orphaned by the deletions ("  .", " ,", " :"  -> "").
ORPHAN_PUNCT_RE = re.compile(r"\s+([,.;:])")
WS_RE = re.compile(r"\s{2,}")


def scrub(text: str) -> str:
    if not text:
        return text
    out = EMAIL_RE.sub("", text)
    for pat in PHONE_RES:
        out = pat.sub("", out)
    out = LABEL_RE.sub("", out)
    out = ORPHAN_PUNCT_RE.sub(r"\1", out)
    out = WS_RE.sub(" ", out).strip()
    return out


def sanitize_file(path: Path, field: str) -> tuple[int, int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = 0
    for entry in data:
        original = entry.get(field)
        if not isinstance(original, str):
            continue
        cleaned = scrub(original)
        if cleaned != original:
            entry[field] = cleaned
            changed += 1
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return changed, len(data)


def main() -> int:
    targets = [
        (ROOT / "data" / "_visited-sites-auto.json", "description"),
        (ROOT / "data" / "_historical-participants.json", "shortBio"),
    ]
    for path, field in targets:
        if not path.exists():
            print(f"skip (missing): {path}")
            continue
        changed, total = sanitize_file(path, field)
        print(f"{path.name}: scrubbed {changed}/{total} entries (field={field})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
