"""
One-shot patcher: for each ACE edition with a known YouTube playlist,
inserts `videos: "<url>"` into its `links: { ... }` object inside
data/editions.ts. Idempotent — re-running on an already-patched file
is a no-op (skips entries that already have a videos field).

Mapping comes from the riacnetorg YouTube channel playlists. ACE 1,
2, 3 do not appear to have playlists yet; ACE 23 (Memphis) hasn't
happened. Those four are left untouched.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EDITIONS_FILE = ROOT / "data" / "editions.ts"

YT_BASE = "https://www.youtube.com/playlist?list="

EDITION_TO_PLAYLIST = {
    "ace-4-cordoba-2015":              "PLCFmKggkdz0H2U975-C16nVNFhAxy9drF",
    "ace-5-arizona-california-2016":   "PLCFmKggkdz0HCetASAyEoyPdXQDGTkdXR",
    "ace-6-ontario-2016":              "PLCFmKggkdz0HbNeGlude2FWd2CziT78VL",
    "ace-7-texas-2017":                "PLCFmKggkdz0ETNhVyTmQVhNeIn-NaJqac",
    "ace-8-florida-2017":              "PLCFmKggkdz0EjF2Wm-1gOz4Do3KIeU-4L",
    "ace-9-germany-israel-2018":       "PLCFmKggkdz0GiGzbR8w9gU5lW4fbiHWQj",
    "ace-10-northern-california-2018": "PLCFmKggkdz0GjPrzyCIAzlyHXt5qDtSdY",
    "ace-11-puerto-rico-2019":         "PLCFmKggkdz0Fq8LTOhvd-OeEkRQsEETkb",
    "ace-12-chile-2019":               "PLCFmKggkdz0EpNRU3B6yiJq81LrHVQsJ_",
    "ace-13-colorado-2021":            "PLCFmKggkdz0EwYYIbgESGznGPtoAVDpcv",
    "ace-14-louisiana-2022":           "PLCFmKggkdz0EqUF1s6k_N3qF6qUV_uHWP",
    "ace-15-ecuador-2022":             "PLCFmKggkdz0EspPiVXF2GOub4s0VMzJAW",
    "ace-16-seattle-2023":             "PLCFmKggkdz0GU3w_3FSV3HS3tPRj8Y_Y4",
    "ace-17-panama-2024":              "PLCFmKggkdz0FOMgz4KYDuC41CP0D8mvqA",
    "ace-18-michigan-2024":            "PLCFmKggkdz0G7dSZf5UNlhkgZjlrR0xJG",
    "ace-19-armenia-2024":             "PLCFmKggkdz0HebH08V6nitEpeGim0DVgn",
    "ace-20-illinois-2025":            "PLCFmKggkdz0EUiEx3nM202wn258DgZ7Ce",
    "ace-21-belem-2025":               "PLCFmKggkdz0E0qFqRHo2ol3m0KKHer08a",
    "ace-22-cordoba-2025":             "PLCFmKggkdz0GOGsWoRRFDN0RT-C12cD-n",
}


def patch(text: str) -> tuple[str, list[str]]:
    out = text
    patched: list[str] = []
    for ed_id, playlist_id in EDITION_TO_PLAYLIST.items():
        url = f"{YT_BASE}{playlist_id}"
        pattern = re.compile(
            r'(id:\s*"' + re.escape(ed_id) + r'",.*?links:\s*{)([^}]*)(})',
            re.DOTALL,
        )

        def replace(match: re.Match[str]) -> str:
            head, body, tail = match.group(1), match.group(2), match.group(3)
            if "videos:" in body:
                # Already patched — leave it alone.
                return match.group(0)
            stripped = body.rstrip()
            if stripped and not stripped.endswith(","):
                stripped += ","
            new_body = f'{stripped} videos: "{url}" '
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
