#!/usr/bin/env python3
"""
Pull ACE 7 (Texas, 2017) participant portraits from the live site CSS.
The participants page lazy-loads each portrait via a `background-image:
url(../images/<name>.jpg?crc=...)` rule in `css/nomq_participants.css`.
We harvest those URLs, download each portrait, and match it to a
historical-participant record by name slug.
"""
from __future__ import annotations
import json
import re
import sys
import urllib.parse
import urllib.request
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# The Texas page links TWO participant stylesheets — one is the desktop view,
# the other the mobile (nomq) view. Different participants are listed in
# different stylesheets, so we harvest URLs from BOTH.
CSS_URLS = [
    "https://www.riacevents.org/ace/texas/css/participants.css?crc=3954210610",
    "https://www.riacevents.org/ace/texas/css/nomq_participants.css?crc=4090794593",
]
LOCAL_CSS_CACHE = [Path("/tmp/ace7-css.css"), Path("/tmp/ace7-css-nomq.css")]
IMG_BASE = "https://www.riacevents.org/ace/texas/"
HIST_JSON = ROOT / "data" / "_historical-participants.json"
PHOTO_DIR = ROOT / "public" / "participants" / "historical"
EDITION_ID = "ace-7-texas-2017"

# Filenames in the CSS that aren't participant portraits — flags, decor.
NOT_PORTRAITS = {
    "ale", "panama", "brazil", "belize", "uru", "clau", "israel",
    "guatemala", "argentina", "chile", "colombia", "ecuador",
    "honduras", "jamaica", "mexico", "paraguay", "peru", "trinidad",
    "germany", "haiti", "img_5820",
}


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:60] or "x"


def normalize_name(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip().lower()


import time

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.riacevents.org/ace/texas/participants.html",
}


import subprocess


def download(url: str, retries: int = 2) -> bytes | None:
    """The site rejects urllib for some reason — shell out to curl which
    works (we already used it for the CSS during exploration)."""
    for attempt in range(retries):
        try:
            res = subprocess.run(
                ["curl", "-sfL", "-A", HEADERS["User-Agent"],
                 "-e", HEADERS["Referer"], url],
                capture_output=True, timeout=30,
            )
            if res.returncode == 0 and res.stdout:
                return res.stdout
        except Exception:
            pass
        time.sleep(0.4)
    print(f"  ✗ {url}", file=sys.stderr)
    return None


def filename_to_label(filename: str) -> str:
    """Decode 'eugenio%20jos%c3%a9%20reyes%20-%20mexico' → 'eugenio jose reyes mexico'."""
    name = urllib.parse.unquote(filename)
    name = re.sub(r"\.[a-zA-Z]+$", "", name)            # drop extension
    name = name.split("?")[0]                            # drop query
    name = re.sub(r"\bface\s*photo\b", "", name, flags=re.I)
    name = re.sub(r"\boas[-\s]?riac[-\s]?\d+th[-\s]?ace\b", "", name, flags=re.I)
    name = re.sub(r"--+|-{2,}|--", " ", name)
    name = re.sub(r"-mexico|-eu|-eeuu|-usa", "", name, flags=re.I)
    name = name.replace("-", " ").replace("_", " ")
    return normalize_name(name)


def main() -> int:
    # Fetch BOTH CSS files (desktop + mobile views list different participants).
    css_text = ""
    for url, cache in zip(CSS_URLS, LOCAL_CSS_CACHE):
        print(f"Fetching {url}")
        css = download(url)
        if css is None and cache.exists():
            print(f"  …falling back to local cache: {cache}")
            css = cache.read_bytes()
        if css is not None:
            css_text += "\n" + css.decode("utf-8", errors="replace")
    if not css_text:
        return 1

    # Find all images/<filename>.<ext> URLs in the CSS.
    image_paths = re.findall(r'url\(["\']?(\.\./images/[^)"\']+)["\']?\)', css_text)
    seen = set()
    candidates: list[tuple[str, str]] = []   # (label, url)
    for path in image_paths:
        if not re.search(r"\.(jpg|jpeg|png)\??", path, re.I):
            continue
        url = IMG_BASE + path.lstrip("./").lstrip("/")
        if url in seen:
            continue
        seen.add(url)
        # Extract bare filename (no path / no query / no extension).
        m = re.search(r"images/([^?]+)\.(jpg|jpeg|png)", path, re.I)
        if not m:
            continue
        bare = urllib.parse.unquote(m.group(1)).lower()
        if bare in NOT_PORTRAITS:
            continue
        if bare.startswith("recurso") or bare.startswith("svg"):
            continue
        label = filename_to_label(m.group(1))
        if len(label.split()) < 1:
            continue
        candidates.append((label, url))
    print(f"Found {len(candidates)} portrait candidates in CSS")

    # Build name index from historical participants — Memphis isn't relevant
    # here but the dedup-time merge works with raw historical only.
    records = json.loads(HIST_JSON.read_text())
    by_norm: dict[str, int] = {}
    for i, r in enumerate(records):
        by_norm.setdefault(normalize_name(r["name"]), i)

    PHOTO_DIR.mkdir(parents=True, exist_ok=True)
    matched = unmatched = downloaded = 0
    matched_names: list[str] = []
    unmatched_files: list[str] = []

    # Throttle to be nice to the server.
    THROTTLE = 0.4

    for label, url in candidates:
        # Try exact match first, then progressively-shorter prefixes.
        idx = by_norm.get(label)
        if idx is None:
            tokens = label.split()
            if len(tokens) >= 2:
                # First+last
                idx = by_norm.get(f"{tokens[0]} {tokens[-1]}")
            if idx is None and len(tokens) >= 2:
                # All but last (sometimes filename has extra "mexico" etc.)
                idx = by_norm.get(" ".join(tokens[:-1]))
            if idx is None and len(tokens) >= 2:
                # Subset match — every token in candidate is in some name
                for n, i in by_norm.items():
                    nt = n.split()
                    if len(nt) >= 2 and all(t in nt for t in tokens):
                        idx = i
                        break

        if idx is None:
            unmatched += 1
            if len(unmatched_files) < 12:
                unmatched_files.append(label)
            continue

        rec = records[idx]
        # Always set ACE 7 in their editions if it isn't there.
        if EDITION_ID not in rec["editionIds"]:
            rec["editionIds"] = sorted(set(rec["editionIds"] + [EDITION_ID]))

        # Download + save.
        slug = slugify(rec["name"])
        dest = PHOTO_DIR / f"ACE7web-{slug}.jpg"
        if not dest.exists():
            data = download(url)
            time.sleep(THROTTLE)
            if data is None:
                continue
            dest.write_bytes(data)
            downloaded += 1
        rec["photoUrl"] = f"/participants/historical/ACE7web-{slug}.jpg"
        matched += 1
        if len(matched_names) < 12:
            matched_names.append(rec["name"])

    HIST_JSON.write_text(json.dumps(records, ensure_ascii=False, indent=2))
    print(f"\nMatched: {matched}")
    print(f"Downloaded new: {downloaded}")
    print(f"Unmatched: {unmatched}")
    if matched_names:
        print("Sample matched:")
        for n in matched_names:
            print(f"  ✓ {n}")
    if unmatched_files:
        print("Sample unmatched filenames:")
        for f in unmatched_files:
            print(f"  ? {f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
