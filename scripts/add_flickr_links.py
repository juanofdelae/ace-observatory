"""
One-shot patcher: for each ACE edition with a known Flickr album,
inserts `photos: "<url>"` into its `links: { ... }` object inside
data/editions.ts. Idempotent — re-running on an already-patched file
is a no-op (skips entries that already have a photos field).

Mapping comes from a manual scrape of:
  https://www.flickr.com/photos/89835551@N02/sets/

Editions ACE 1–5, 21, 22, 23 have no Flickr album yet; the file is
left untouched for those.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EDITIONS_FILE = ROOT / "data" / "editions.ts"

FLICKR_BASE = "https://www.flickr.com/photos/89835551@N02/albums"

EDITION_TO_ALBUM = {
    "ace-1-southeast-2014":          "72157644625497016",
    "ace-2-mexico-2014":             "72157647271994268",
    "ace-3-midwest-2015":            "72157649740810553",
    "ace-4-cordoba-2015":            "72157660395238875",
    "ace-5-arizona-california-2016": "72157665940084415",
    "ace-6-ontario-2016":            "72157673498898042",
    "ace-7-texas-2017":              "72157680172730321",
    "ace-8-florida-2017":            "72157688104121882",
    "ace-9-germany-israel-2018":     "72157692542164730",
    "ace-10-northern-california-2018": "72157675292626308",
    "ace-11-puerto-rico-2019":       "72157708803743957",
    "ace-12-chile-2019":             "72157711396776966",
    "ace-13-colorado-2021":          "72157719657382258",
    "ace-14-louisiana-2022":         "72177720298375502",
    "ace-15-ecuador-2022":           "72177720308394373",
    "ace-16-seattle-2023":           "72177720308009581",
    "ace-17-panama-2024":            "72177720315281096",
    "ace-18-michigan-2024":          "72177720316939918",
    "ace-19-armenia-2024":           "72177720321260712",
    "ace-20-illinois-2025":          "72177720326676969",
}


def patch(text: str) -> tuple[str, list[str]]:
    out = text
    patched: list[str] = []
    for ed_id, album_id in EDITION_TO_ALBUM.items():
        url = f"{FLICKR_BASE}/{album_id}"
        # Anchor on the edition id, then capture everything up to the
        # first `links: { ... }` block that follows it. We patch only
        # the FIRST occurrence per edition to avoid touching later
        # references (filters, helper helpers).
        pattern = re.compile(
            r'(id:\s*"' + re.escape(ed_id) + r'",.*?links:\s*{)([^}]*)(})',
            re.DOTALL,
        )

        def replace(match: re.Match[str]) -> str:
            head, body, tail = match.group(1), match.group(2), match.group(3)
            if "photos:" in body:
                # Already patched — leave it alone.
                return match.group(0)
            # Insert photos at the end of the existing body. Preserve
            # the trailing whitespace / commas already in body.
            stripped = body.rstrip()
            if stripped and not stripped.endswith(","):
                stripped += ","
            new_body = f'{stripped} photos: "{url}" '
            return f"{head}{new_body}{tail}"

        new_out, n = pattern.subn(replace, out, count=1)
        if n == 1 and new_out != out:
            out = new_out
            patched.append(ed_id)

    return out, patched


def main() -> int:
    src = EDITIONS_FILE.read_text(encoding="utf-8")
    out, patched = patch(src)
    if out == src:
        print("editions.ts: nothing to change (already patched).")
        return 0
    EDITIONS_FILE.write_text(out, encoding="utf-8")
    print(f"editions.ts: patched {len(patched)} editions")
    for e in patched:
        print(f"  + {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
