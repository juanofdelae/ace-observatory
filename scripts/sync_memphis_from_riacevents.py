#!/usr/bin/env python3
"""
Sync ACE Memphis (ACE 23) participants from the live RIAC events portal:
  https://riacevents.org/ACE/memphis-infocenter/

The portal serves three things we want:
  1. /participants.json          — array of 46 delegate records
  2. /<delegate-slug>.html       — per-delegate page with a Biography accordion
  3. /special-guests.html        — 4 special guests (with their own detail pages)

Outputs:
  data/_memphis-participants.json    — replaces the existing file with the
                                       latest delegate roster + bios
  data/_memphis-special-guests.json  — new file for the 4 special guests

We do NOT touch participants.ts wiring — that file already reads
_memphis-participants.json. Special guests are written to a sibling JSON
the rest of the codebase can opt into when needed.
"""
from __future__ import annotations
import json
import re
import urllib.request
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
BASE = "https://riacevents.org/ACE/memphis-infocenter"

UA = {"User-Agent": "Mozilla/5.0 (compatible; ace-observatory-sync/1.0)"}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", errors="replace")


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def extract_bio(html: str) -> str | None:
    """Pull the text inside the first .accordion-content > <p> on the
    page. Returns None if no biography section exists."""
    # Find the Biography accordion specifically.
    m = re.search(
        r"<button[^>]*class=\"accordion-title\"[^>]*>\s*Biography.*?<div class=\"accordion-content\">\s*<p>(.*?)</p>",
        html,
        re.DOTALL | re.IGNORECASE,
    )
    if not m:
        return None
    raw = unescape(m.group(1))
    # Strip residual tags inside the bio paragraph (rare <br>, <a>, etc.).
    cleaned = re.sub(r"<[^>]+>", "", raw)
    return re.sub(r"\s+", " ", cleaned).strip() or None


def slug_from_filename(filename: str) -> str:
    return filename.removesuffix(".html")


def sync_participants() -> tuple[list[dict], int]:
    """Fetch the remote participants.json, fold in bios from each
    delegate's detail page, and write the result. Returns the merged
    list and the number of bios added."""
    raw = fetch(f"{BASE}/participants.json")
    remote = json.loads(raw)
    print(f"Remote participants: {len(remote)}")

    bios_added = 0
    for p in remote:
        page_path = p.get("file")
        if not page_path:
            continue
        try:
            page_html = fetch(f"{BASE}/{page_path}")
        except Exception as exc:
            print(f"  ! {p['name']}: failed to fetch {page_path} ({exc})")
            continue
        bio = extract_bio(page_html)
        if bio:
            p["bio"] = bio
            bios_added += 1

    out_path = DATA / "_memphis-participants.json"
    out_path.write_text(json.dumps(remote, indent=2, ensure_ascii=False) + "\n")
    return remote, bios_added


def parse_special_guests_card(html: str) -> list[dict]:
    """Extract every special guest from special-guests.html.

    Cards are either `<a href="...html" class="org-card">...</a>` (when
    the guest has a detail page) or `<div class="org-card">...</div>`
    (when they don't). The straightforward `</tag>` regex pattern fails
    for the bare-`<div>` form because of nested `<div>` children, so we
    instead split the grid on every card opener and treat each slice as
    a single card body.
    """
    grid = re.search(r'<div class="org-grid">(.*?)</main>', html, re.DOTALL)
    if not grid:
        return []
    body = grid.group(1)

    opener_re = re.compile(
        r'<(a|div)\b([^>]*?\bclass="org-card"[^>]*?)>',
        re.DOTALL,
    )
    openers = list(opener_re.finditer(body))
    guests: list[dict] = []
    for i, m in enumerate(openers):
        slice_start = m.end()
        slice_end = openers[i + 1].start() if i + 1 < len(openers) else len(body)
        chunk = body[slice_start:slice_end]
        attrs = m.group(2)

        href_match = re.search(r'href="([^"]+\.html)"', attrs)
        photo_match = re.search(r'<img[^>]*src="([^"]*photo-[^"]+)"', chunk)
        name_match = re.search(r'<div class="org-name">([^<]+)</div>', chunk)
        title_match = re.search(r'<div class="org-title">([^<]+)</div>', chunk)
        org_match = re.search(r'<div class="org-org">([^<]+)</div>', chunk)
        country_match = re.search(
            r'<div class="org-country">.*?>([A-Za-z .]+)</div>',
            chunk,
            re.DOTALL,
        )
        if not name_match:
            continue
        guests.append({
            "name": unescape(name_match.group(1).strip()),
            "title": unescape(title_match.group(1).strip()) if title_match else "",
            "organization": unescape(org_match.group(1).strip()) if org_match else "",
            "country": unescape(country_match.group(1).strip()) if country_match else "",
            "photo": photo_match.group(1) if photo_match else None,
            "file": href_match.group(1) if href_match else None,
        })
    return guests


def sync_special_guests() -> tuple[list[dict], int]:
    html = fetch(f"{BASE}/special-guests.html")
    guests = parse_special_guests_card(html)
    print(f"Remote special guests: {len(guests)}")

    bios_added = 0
    for g in guests:
        if not g.get("file"):
            continue
        try:
            page_html = fetch(f"{BASE}/{g['file']}")
        except Exception as exc:
            print(f"  ! {g['name']}: failed to fetch {g['file']} ({exc})")
            continue
        bio = extract_bio(page_html)
        if bio:
            g["bio"] = bio
            bios_added += 1

    out_path = DATA / "_memphis-special-guests.json"
    out_path.write_text(json.dumps(guests, indent=2, ensure_ascii=False) + "\n")
    return guests, bios_added


def main() -> None:
    print("=== Memphis participants ===")
    parts, bios_p = sync_participants()
    print(f"  → wrote {len(parts)} records, {bios_p} with bios")

    print("=== Memphis special guests ===")
    guests, bios_g = sync_special_guests()
    print(f"  → wrote {len(guests)} records, {bios_g} with bios")


if __name__ == "__main__":
    main()
