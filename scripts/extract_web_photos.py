#!/usr/bin/env python3
"""
Generic web-portrait extractor for the legacy ACE microsites.

Each microsite (ACE 5, 6, 7, 8, 9, 11, 12 …) ships a participants page
that lazy-loads portraits via `background-image: url(images/<name>.jpg)`
in a CSS file. This script:

  1. Fetches the page HTML and discovers the linked stylesheets.
  2. Downloads every stylesheet, harvests `images/*.jpg|.png|.jpeg` URLs.
  3. Tries to match each filename to a participant record by name
     (exact, first+last, subset-of-tokens, then first-name-only when
     unique within that edition).
  4. Downloads the matched portraits to public/participants/historical/
     and updates the historical JSON with the resulting `photoUrl`.

Usage:
    python3 scripts/extract_web_photos.py
"""
from __future__ import annotations
import json
import re
import subprocess
import sys
import time
import unicodedata
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HIST_JSON = ROOT / "data" / "_historical-participants.json"
PHOTO_DIR = ROOT / "public" / "participants" / "historical"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
)

# Per-microsite config: page URL → (editionId, file-prefix tag).
SITES = [
    # Adobe-Muse-style (CSS-driven backgrounds).
    ("https://www.riacevents.org/ace/texas/participants.html",
     "ace-7-texas-2017", "ACE7web"),
    ("https://riacnet.org/fifth-exchange/participants/",
     "ace-5-arizona-california-2016", "ACE5web"),
    ("https://www.riacevents.org/ace/canada2016/participants.html",
     "ace-6-ontario-2016", "ACE6web"),
    ("https://www.riacevents.org/ace/florida/participants.html",
     "ace-8-florida-2017", "ACE8web"),
    # WordPress-style (img src under /wp-content/uploads/).
    ("https://riacevents.org/ACE/germany-israel/participants/",
     "ace-9-germany-israel-2018", "ACE9web"),
    ("https://riacevents.org/ACE/puertorico/participants/",
     "ace-11-puerto-rico-2019", "ACE11web"),
    ("https://riacevents.org/ACE/chile/participants/",
     "ace-12-chile-2019", "ACE12web"),
    ("https://riacevents.org/ACE/colorado/?page_id=783",
     "ace-13-colorado-2021", "ACE13web"),
    ("https://riacevents.org/ACE/louisiana/?page_id=2165",
     "ace-14-louisiana-2022", "ACE14web"),
    ("https://riacevents.org/ACE/ecuador/ace-delegates-ecuador/",
     "ace-15-ecuador-2022", "ACE15web"),
    ("https://riacevents.org/ACE/panama/participants/",
     "ace-17-panama-2024", "ACE17web"),
    ("https://riacevents.org/ACE/michigan/participants/",
     "ace-18-michigan-2024", "ACE18web"),
    ("https://riacevents.org/ACE/armenia/participantes/",
     "ace-19-armenia-2024", "ACE19web"),
    ("https://riacevents.org/ACE/illinois/participants/",
     "ace-20-illinois-2025", "ACE20web"),
    ("https://riacevents.org/ACE/illinois/special-guests/",
     "ace-20-illinois-2025", "ACE20webSG"),
    ("https://riacevents.org/ACE/belem/participants/",
     "ace-21-belem-2025", "ACE21web"),
    ("https://riacevents.org/ACE/belem/special-guest/",
     "ace-21-belem-2025", "ACE21webSG"),
    ("https://riacevents.org/ACE/cordoba2025/participants/",
     "ace-22-cordoba-2025", "ACE22web"),
    ("https://riacevents.org/ACE/cordoba2025/special-guests/",
     "ace-22-cordoba-2025", "ACE22webSG"),
]

# Filename patterns we should never treat as a portrait. Equality match —
# these short stems collide too easily with participant slugs.
NOT_PORTRAITS = {
    "ale", "panama", "brazil", "belize", "uru", "clau", "israel",
    "guatemala", "argentina", "chile", "colombia", "ecuador",
    "honduras", "jamaica", "mexico", "paraguay", "peru", "trinidad",
    "germany", "haiti", "img_5820", "pa", "br", "ar", "us",
    "united-states", "united_states", "united-kingdom",
    "puerto-rico", "puerto_rico",
    "world", "globe", "map",
}

# Substring blocklist — if any of these tokens appears inside the bare
# filename (lowercased), the image is rejected. Catches things like
# `circle_11849315`, `flag-arg`, `world_16022540`, `microsoftteams-image-22`,
# `whatsapp-image-…`, `captura-de-pantalla-…`, etc.
NOT_PORTRAIT_SUBSTRINGS = (
    "flag", "circle_", "world_", "globe_", "wave-", "waves",
    "pattern", "texture", "microsoftteams", "captura",
    "screenshot", "imagen-",
    "english-oas", "spanish-oas", "oea-", "riac-",
    "round", "ace-image", "participants-",
)


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:60] or "x"


def normalize_name(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip().lower()


def download(url: str, retries: int = 3) -> bytes | None:
    headers = ["-A", USER_AGENT, "-e", url.rsplit("/", 1)[0] + "/"]
    for attempt in range(retries):
        try:
            r = subprocess.run(
                ["curl", "-sfL", *headers, url],
                capture_output=True, timeout=30,
            )
            if r.returncode == 0 and r.stdout:
                return r.stdout
        except Exception:
            pass
        time.sleep(0.5 * (attempt + 1))
    print(f"  ✗ failed: {url}", file=sys.stderr)
    return None


def filename_to_label(filename: str) -> str:
    """`eugenio%20jos%c3%a9%20reyes%20-%20mexico` → `eugenio jose reyes mexico`."""
    name = urllib.parse.unquote(filename)
    name = re.sub(r"\.[a-zA-Z]+$", "", name)
    name = name.split("?")[0]
    name = re.sub(r"\bface[\s-]?photo\b", "", name, flags=re.I)
    name = re.sub(r"\boas[-\s]?riac[-\s]?\d+th[-\s]?ace\b", "", name, flags=re.I)
    name = re.sub(r"-(mexico|peru|chile|argentina|brazil|canada|panama|usa|eu|eeuu)", "", name, flags=re.I)
    name = re.sub(r"\bfoto\b", "", name, flags=re.I)   # "juan foto" → "juan"
    name = re.sub(r"\bpic\b|\bpicture\b", "", name, flags=re.I)
    name = name.replace("--", " ").replace("-", " ").replace("_", " ")
    return normalize_name(name)


def discover_stylesheets(page_url: str, html: str) -> list[str]:
    base = page_url.rsplit("/", 1)[0] + "/"
    sheets = []
    for m in re.finditer(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css[^"]*)"', html):
        href = m.group(1)
        sheets.append(urllib.parse.urljoin(base, href))
    return sheets


def harvest_image_urls(css_text: str, page_url: str) -> list[tuple[str, str]]:
    """Return [(label, absolute_url)] from `background-image: url(...)` rules
    AND from raw `<img src=...>` patterns. Accepts both Adobe-Muse-style
    /images/<file>.jpg and WordPress-style /wp-content/uploads/.../<file>.jpg.
    """
    base = page_url.rsplit("/", 1)[0] + "/"
    out: list[tuple[str, str]] = []
    seen: set[str] = set()

    # Combined regex — picks up url(...) AND src="..." references.
    pattern = re.compile(
        r'(?:url\(|src=)["\']?([^()"\'\s>]+\.(?:jpe?g|png))(?:\?[^()"\'\s>]*)?',
        re.IGNORECASE,
    )
    for m in pattern.finditer(css_text):
        path = m.group(1)
        # Accept either /images/ path or /wp-content/uploads/ (WordPress).
        is_legacy = "/images/" in path or path.startswith("images/")
        is_wp = "/wp-content/uploads/" in path
        if not (is_legacy or is_wp):
            continue
        # Resolve relative paths.
        url = urllib.parse.urljoin(base, path) if not path.startswith("http") else path
        if url in seen:
            continue
        seen.add(url)

        # Reject SVGs outright — flag badges and icon overlays use SVG; real
        # participant portraits are JPEG/PNG.
        if path.lower().endswith(".svg"):
            continue
        # Filter out flags / decorations / triangles etc.
        bare = re.sub(r"\.[a-z]+$", "",
                      urllib.parse.unquote(path.rsplit("/", 1)[-1])).lower()
        if bare in NOT_PORTRAITS:
            continue
        if any(sub in bare for sub in NOT_PORTRAIT_SUBSTRINGS):
            continue
        if bare.startswith((
            "recurso", "svg", "snow", "background", "bg", "triangle",
            "banner", "header", "footer", "modern", "geometric",
        )):
            continue
        if "logo" in bare or "icon" in bare or "lineasepara" in bare:
            continue
        # Numbered-only filenames (ACE 9 trip-book style): "1.jpg", "2-3.jpg"
        # carry no name signal, skip.
        if re.fullmatch(r"\d+(-\d+)?", bare):
            continue
        # Filenames shorter than 3 chars (like `pa`, `br`) are almost never
        # real names — usually country abbreviations.
        if len(bare) < 3:
            continue

        label = filename_to_label(path.rsplit("/", 1)[-1])
        if not label or len(label) < 3:
            continue
        out.append((label, url))
    return out


def build_indexes(records: list[dict], edition_id: str):
    """Return:
        full_norm  → record index   (full-name match)
        first_last → record index   (firstname + lastname match)
        first_name → list of indexes for records with that first name in `edition_id`
    """
    full_norm: dict[str, int] = {}
    first_last: dict[str, int] = {}
    first_name_in_ed: dict[str, list[int]] = {}
    for i, r in enumerate(records):
        n = normalize_name(r["name"])
        full_norm.setdefault(n, i)
        tokens = n.split()
        if len(tokens) >= 2:
            first_last.setdefault(f"{tokens[0]} {tokens[-1]}", i)
            if edition_id in r["editionIds"]:
                first_name_in_ed.setdefault(tokens[0], []).append(i)
    return full_norm, first_last, first_name_in_ed


def match_label(label: str, full_norm, first_last, first_name_in_ed,
                records: list[dict], edition_id: str) -> int | None:
    """Return record index for a filename label, or None."""
    if not label:
        return None
    # Exact full match
    if label in full_norm:
        return full_norm[label]
    tokens = label.split()
    # First + last token
    if len(tokens) >= 2:
        key = f"{tokens[0]} {tokens[-1]}"
        if key in first_last:
            return first_last[key]
    # All filename tokens are a subset of some name's tokens
    if len(tokens) >= 2:
        for n, idx in full_norm.items():
            nt = n.split()
            if len(nt) >= 2 and all(t in nt for t in tokens):
                return idx
    # First-name-only — pick if unique among ACE attendees of THIS edition
    if len(tokens) >= 1:
        candidates = first_name_in_ed.get(tokens[0], [])
        # Filter candidates that already have a photo so we don't overwrite
        # a real match with a guess.
        no_photo = [c for c in candidates if not records[c].get("photoUrl")]
        if len(no_photo) == 1:
            return no_photo[0]
    return None


def process_site(page_url: str, edition_id: str, prefix: str, records: list[dict]) -> dict:
    print(f"\n=== {edition_id} → {page_url} ===")
    html = download(page_url)
    if html is None:
        return {"matched": 0, "downloaded": 0, "unmatched": 0}
    html_text = html.decode("utf-8", errors="replace")

    sheets = discover_stylesheets(page_url, html_text)
    print(f"  stylesheets: {len(sheets)}")
    css_text = ""
    for s in sheets:
        css = download(s)
        time.sleep(0.3)
        if css is not None:
            css_text += "\n" + css.decode("utf-8", errors="replace")

    # Some pages also embed <img src=...> tags; harvest those too.
    extra_img_text = "\n".join(
        f"url({m.group(1)})"
        for m in re.finditer(
            r'<img[^>]+src="([^"]+\.(?:jpe?g|png)(?:\?[^"]*)?)"', html_text, re.I,
        )
    )
    candidates = harvest_image_urls(css_text + "\n" + extra_img_text, page_url)
    print(f"  candidate portraits: {len(candidates)}")

    full_norm, first_last, first_name_in_ed = build_indexes(records, edition_id)

    matched = downloaded = 0
    matched_names: list[str] = []
    unmatched: list[str] = []

    for label, url in candidates:
        idx = match_label(label, full_norm, first_last, first_name_in_ed,
                          records, edition_id)
        if idx is None:
            unmatched.append(label)
            continue

        rec = records[idx]
        if edition_id not in rec["editionIds"]:
            rec["editionIds"] = sorted(set(rec["editionIds"] + [edition_id]))

        slug = slugify(rec["name"])
        dest = PHOTO_DIR / f"{prefix}-{slug}.jpg"
        if not dest.exists():
            data = download(url)
            time.sleep(0.4)
            if data is None:
                continue
            # Sanity-check the payload: any JPEG portrait in this dataset
            # weighs ≥ 4 KB; flag PNGs and tiny icons land below that. We
            # reject smaller-than-2KB to err on the side of letting things
            # through (the substring filter is the primary gate).
            if len(data) < 2000:
                continue
            dest.write_bytes(data)
            downloaded += 1

        # Only set photoUrl if the record doesn't already have one — we don't
        # want to overwrite a higher-quality portrait that another source
        # already supplied.
        if not rec.get("photoUrl"):
            rec["photoUrl"] = f"/participants/historical/{prefix}-{slug}.jpg"
        matched += 1
        if len(matched_names) < 8:
            matched_names.append(rec["name"])

    print(f"  matched: {matched}  downloaded new: {downloaded}  unmatched: {len(unmatched)}")
    if matched_names:
        print("  sample:", ", ".join(matched_names))
    if unmatched[:6]:
        print("  unmatched:", ", ".join(unmatched[:6]))

    return {"matched": matched, "downloaded": downloaded, "unmatched": len(unmatched)}


def main() -> int:
    PHOTO_DIR.mkdir(parents=True, exist_ok=True)
    records = json.loads(HIST_JSON.read_text())

    totals = {"matched": 0, "downloaded": 0, "unmatched": 0}
    for page_url, edition_id, prefix in SITES:
        s = process_site(page_url, edition_id, prefix, records)
        for k, v in s.items():
            totals[k] += v

    HIST_JSON.write_text(json.dumps(records, ensure_ascii=False, indent=2))
    print("\n=== TOTALS ===")
    for k, v in totals.items():
        print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
