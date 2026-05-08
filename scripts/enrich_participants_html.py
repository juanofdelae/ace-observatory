#!/usr/bin/env python3
"""
Phase B (extended): Enrich / extend the historical participant roster using
the participant HTML pages archived under info-reports/.

Handles two CMS formats:
  - Divi `et_pb_team_member_<N>`   → ACE 9, 11, 12
  - Elementor `elementor-section…` → ACE 17, 18, 19, 20, 21, 22

For each participant it extracts: name, role, organization, bio (when
available), photo, social links. Photos referenced in the HTML are copied
into public/participants/historical/ so Next.js can serve them.

Matching against the CSV-ingested records uses accent-insensitive full-name
normalization. If the HTML participant isn't found in the CSV set AND they
look like a real person, we append them as a new record.
"""
from __future__ import annotations
import json
import re
import shutil
import unicodedata
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HISTORICAL_JSON = ROOT / "data" / "_historical-participants.json"
PUBLIC_PHOTO_DIR = ROOT / "public" / "participants" / "historical"

# Names the user has manually removed (did not actually attend the ACE their
# HTML page listed them on). Matched case-insensitively after name
# normalization, so accents / punctuation variants are caught too.
NAME_BLACKLIST = {
    "beatrice kinyua",
}

# Per-HTML source → matching country/edition/files-dir.
SOURCES = [
    # Divi-format pages.
    {"html": "ACE9 -Participants - ACE 9 Germany - Israel.html", "format": "divi", "edition": "ace-9-germany-israel-2018"},
    {"html": "ACE 11 Participants - Puerto Rico.html", "format": "divi", "edition": "ace-11-puerto-rico-2019"},
    {"html": "ACE12-Participantes - Chile ACE 12.html", "format": "divi", "edition": "ace-12-chile-2019"},
    # Elementor-format pages.
    {"html": "ACE12-Participants - ACE Colorado 2021.html", "format": "elementor", "edition": "ace-13-colorado-2021"},
    {"html": "ACE 14-Participants and Special Guests – Louisiana - ACE.html", "format": "elementor", "edition": "ace-14-louisiana-2022"},
    {"html": "ACE15 - Participants – ACE Ecuador.html", "format": "elementor", "edition": "ace-15-ecuador-2022"},
    {"html": "ACE15-ACE Delegates - Ecuador – ACE Ecuador.html", "format": "elementor", "edition": "ace-15-ecuador-2022"},
    {"html": "ACE17-Participants ACE Panama.html", "format": "elementor", "edition": "ace-17-panama-2024"},
    {"html": "ACE18-participants – Michigan.html", "format": "elementor", "edition": "ace-18-michigan-2024"},
    {"html": "ACE19 -Participants – ACE Armenia.html", "format": "elementor", "edition": "ace-19-armenia-2024"},
    {"html": "ACE20 -Participants – ACE Illinois.html", "format": "elementor", "edition": "ace-20-illinois-2025"},
    {"html": "ACE21 -Special Guest – ACE Belem - Brazil - 2025.html", "format": "elementor", "edition": "ace-21-belem-2025"},
    {"html": "ACE22-Participants-Cordoba–.html", "format": "elementor", "edition": "ace-22-cordoba-2025"},
]

SOCIAL_MAP = {
    "et_pb_twitter_icon": "twitter",
    "et_pb_linkedin_icon": "linkedin",
    "et_pb_facebook_icon": "facebook",
    "et_pb_instagram_icon": "instagram",
    "et_pb_youtube_icon": "youtube",
}

# Country name (as appearing in HTMLs) → data/countries.ts id.
COUNTRY_NAME_TO_ID = {
    # Americas
    "Argentina": "ar", "Bolivia": "bo", "Brazil": "br", "Brasil": "br",
    "Canada": "ca", "Canadá": "ca", "Chile": "cl", "Colombia": "co",
    "Costa Rica": "cr", "Dominica": "dm", "Dominican Republic": "do",
    "Ecuador": "ec", "El Salvador": "sv", "Guatemala": "gt", "Guyana": "gy",
    "Haiti": "ht", "Honduras": "hn", "Jamaica": "jm", "Mexico": "mx", "México": "mx",
    "Panama": "pa", "Panamá": "pa", "Paraguay": "py", "Peru": "pe", "Perú": "pe",
    "Puerto Rico": "us", "Suriname": "sr", "Trinidad and Tobago": "tt",
    "Trinidad & Tobago": "tt", "Uruguay": "uy",
    "United States": "us", "United States of America": "us", "USA": "us", "U.S.A.": "us",
    "Antigua & Barbuda": "ag", "Antigua and Barbuda": "ag", "Barbados": "bb", "Belize": "bz",
    "The Bahamas": "bs", "Bahamas": "bs", "Grenada": "gd",
    "St. Lucia": "lc", "Saint Lucia": "lc",
    "St. Kitts & Nevis": "kn", "Saint Kitts and Nevis": "kn",
    # Europe / Asia — now proper country records in data/countries.ts.
    "Germany": "de", "Alemania": "de", "Deutschland": "de",
    "Israel": "il",
    "Spain": "es", "España": "es",
    "United Kingdom": "gb", "UK": "gb", "Great Britain": "gb",
    "South Korea": "kr", "Korea": "kr", "Republic of Korea": "kr",
    "Norway": "no",
    "Armenia": "am",
    "Cyprus": "cy",
    "Estonia": "ee",
    "Saudi Arabia": "sa",
    "Georgia": "ge",
}


# ---------- utilities ----------
def normalize_name(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def clean_text(s: str) -> str:
    s = unescape(s)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:80] or "x"


# Words that are unmistakably titles/roles and never part of a personal name.
_TITLE_WORDS = frozenset([
    "director", "executive", "secretary", "minister", "president",
    "ceo", "coo", "cfo", "cto", "chief", "head", "manager", "coordinator",
    "founder", "cofounder", "owner", "partner", "ambassador", "consul",
    "counsellor", "counselor", "deputy", "advisor", "assistant",
    "vice", "vicepresident", "senior", "junior", "strategic", "honorary",
    "chairman", "chairwoman", "dean", "professor", "researcher", "analyst",
    "investor", "attache", "specialist", "officer", "engineer", "architect",
    "lead", "associate", "managing", "economist", "maritime", "industry",
    "department", "sales", "marketing", "development", "operations",
    "strategy", "affairs", "commercial", "political", "public",
    "research", "fellow", "intern", "consultant", "trainee", "exchange",
    "representative", "permanent",
])


def looks_like_person_name(name: str) -> bool:
    """Strict heuristic: does this string read like a real person's name?

    - 2 to 5 words
    - Every word starts with an uppercase letter (accent-aware)
    - None of the words (after stripping punctuation) are role/title keywords
    - Doesn't contain connector words that appear in titles ("of", "for", "&")
    - No commas (a real person's name never has a comma in it)
    """
    if not name:
        return False
    n = name.strip()
    if len(n) > 50:
        return False
    if "," in n:
        return False
    words = n.split()
    if not (2 <= len(words) <= 5):
        return False
    for w in words:
        if not re.match(r"^[A-ZÀ-Ý]", w):
            return False
    # Strip punctuation off each word before comparing against the title list.
    bare_words = [re.sub(r"[^\w]", "", w).lower() for w in words]
    if any(bw in _TITLE_WORDS for bw in bare_words):
        return False
    if any(w in ("of", "for", "and", "&", "–", "at", "to", "the") for w in bare_words):
        return False
    return True


# ---------- parsers ----------
def parse_divi(html: str) -> list[dict]:
    m = re.search(r"<article[^>]*>(.*?)</article>", html, re.DOTALL)
    body = m.group(1) if m else html
    pattern = re.compile(
        r'<div class="[^"]*et_pb_team_member_\d+[^"]*"[^>]*>(.*?)(?=<div class="[^"]*et_pb_team_member_\d+|<div class="[^"]*et_pb_divider|</article>|</body>)',
        re.DOTALL,
    )
    out = []
    for m in pattern.finditer(body):
        block = m.group(1)
        name_m = re.search(r'<h4 class="et_pb_module_header">([^<]+)</h4>', block)
        if not name_m:
            continue
        name = clean_text(name_m.group(1))
        pos_m = re.search(r'<p class="et_pb_member_position">([^<]+)</p>', block)
        position = clean_text(pos_m.group(1)) if pos_m else ""
        # Bio: <p> tags except the position one
        paras = re.findall(r"<p(?![^>]*et_pb_member_position)[^>]*>(.+?)</p>", block, re.DOTALL)
        bio = " ".join(clean_text(p) for p in paras if clean_text(p))
        # Photo
        img_m = re.search(r'<div class="et_pb_team_member_image[^"]*"[^>]*>\s*<img[^>]*src="([^"]+)"', block)
        photo_src = img_m.group(1) if img_m else None
        # Socials
        socials = {}
        for icon_class, key in SOCIAL_MAP.items():
            m2 = re.search(rf'<a href="([^"]+)"[^>]*class="[^"]*{icon_class}[^"]*"', block)
            if not m2:
                m2 = re.search(rf'<a[^>]*class="[^"]*{icon_class}[^"]*"[^>]*href="([^"]+)"', block)
            if m2:
                socials[key] = m2.group(1)
        # Split position into role/org
        role, org = "", ""
        if position:
            parts = re.split(r"\s-\s|\s–\s", position, maxsplit=1)
            if len(parts) == 2:
                role, org = parts[0].strip(), parts[1].strip()
            else:
                role = position
        out.append({"name": name, "role": role, "organization": org, "bio": bio,
                    "photo_src": photo_src, "socials": socials, "country": None})
    return out


def parse_elementor(html: str) -> list[dict]:
    # Each participant is an inner section.
    sections = re.findall(
        r'<section class="elementor-section elementor-inner-section[^"]*"[^>]*>(.*?)</section>',
        html, re.DOTALL,
    )
    out = []
    for sec in sections:
        # Photo = first wp-image <img> whose src basename starts with an uppercase letter
        # (lowercase basenames are usually country-flag assets like "argentina-3.png").
        photo = None
        for src in re.findall(r'<img[^>]*src="([^"]+_files/[^"]+)"[^>]*class="[^"]*wp-image[^"]*"', sec):
            name_part = src.rsplit("/", 1)[-1]
            if re.search(r"(logo|icon|cropped|blanco|flag|bandera|pantalla|captura)", name_part, re.I):
                continue
            # Flags tend to start lowercase; participant assets tend to start with capital
            # letter OR with numeric WordPress IDs followed by a capitalised filename.
            if re.search(r"^[a-z][a-z]+-\d", name_part):
                continue
            photo = src
            break

        # All <h2> text blocks (these carry country / name / title / organization)
        h2s = re.findall(r'<h2[^>]*class="elementor-heading-title[^"]*"[^>]*>(.*?)</h2>', sec, re.DOTALL)
        texts = [clean_text(h) for h in h2s if clean_text(h)]
        # Minimum required: at least country + name
        if len(texts) < 2:
            continue
        country, name = texts[0], texts[1]
        title = texts[2] if len(texts) > 2 else ""
        organization = texts[3] if len(texts) > 3 else ""
        # Heuristic guard: name must contain at least two words with letters;
        # country must look like a country (short, title-case, known).
        if len(name.split()) < 2:
            continue
        if not re.match(r"^[A-ZÀ-Ý]", country):
            continue
        # Keep the parse loose so legitimate enrichment (matching against
        # existing CSV records) can still happen even when the structural
        # guess is slightly off. The strict "is this a real person name"
        # gate runs later, only before creating a brand-new record.
        out.append({
            "name": name,
            "role": title,
            "organization": organization,
            "bio": "",
            "photo_src": photo,
            "socials": {},
            "country": country,
        })
    return out


# ---------- main ----------
def copy_photo(src_path: str, files_dir: Path, dest_dir: Path, prefix: str) -> str | None:
    if not src_path:
        return None
    base = Path(src_path).name
    src = files_dir / base
    if not src.exists():
        return None
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_name = f"{prefix}-{base}"
    dest = dest_dir / dest_name
    if not dest.exists():
        shutil.copy2(src, dest)
    return f"/participants/historical/{dest_name}"


def infer_actor_type(role: str, org: str) -> str:
    s = f"{role} {org}".lower()
    if any(k in s for k in ["world bank", "idb", "inter-american development", "iadb", "oas",
                             "united nations", "caf", "sica", "european commission", "european parliament"]):
        return "International Organization"
    if any(k in s for k in ["ministry", "minister", "secretary", "government", "municipal",
                             "authority", "mayor", "governor", "agency", "department of",
                             "city of", "state of", "parliament", "deputy", "senator", "office of the"]):
        return "Government"
    if any(k in s for k in ["university", "college", "professor", "dean", "faculty", "school of"]):
        return "Academia"
    if any(k in s for k in ["chamber", "cluster", "incubator", "accelerator", "hub",
                             "foundation", "association", "ecosystem", "startup"]):
        return "Entrepreneurial Ecosystem"
    return "Private Sector"


def main() -> int:
    records = json.loads(HISTORICAL_JSON.read_text())
    by_norm: dict[str, list[int]] = {}
    for i, r in enumerate(records):
        by_norm.setdefault(normalize_name(r["name"]), []).append(i)

    stats = {"parsed": 0, "matched": 0, "new": 0, "skipped": 0, "photos_copied": 0}
    unmatched_samples: list[str] = []

    for src in SOURCES:
        html_path = ROOT / "info-reports" / src["html"]
        if not html_path.exists():
            print(f"skip (missing): {src['html']}")
            continue
        files_dir = ROOT / "info-reports" / f"{html_path.stem}_files"
        if not files_dir.exists():
            # Some HTMLs have the files dir with a slightly different stem
            files_dir = html_path.parent / (html_path.stem.replace("–", "–") + "_files")
        prefix_match = re.search(r"ACE[\s\-]?(\d+)", src["html"])
        prefix = f"ACE{prefix_match.group(1)}" if prefix_match else "ACE"

        html = html_path.read_text(encoding="utf-8", errors="replace")
        parsed = parse_divi(html) if src["format"] == "divi" else parse_elementor(html)
        stats["parsed"] += len(parsed)
        print(f"{src['html']}: parsed {len(parsed)}")

        for p in parsed:
            norm = normalize_name(p["name"])
            if not norm or len(norm) < 4:
                stats["skipped"] += 1
                continue
            if norm in NAME_BLACKLIST:
                stats["skipped"] += 1
                continue

            candidates = by_norm.get(norm, [])

            # Prefer a candidate already tagged with this edition.
            if len(candidates) > 1:
                with_edition = [i for i in candidates if src["edition"] in records[i]["editionIds"]]
                if with_edition:
                    candidates = with_edition

            # Last-name fuzzy fallback.
            if not candidates:
                last = norm.split()[-1] if norm else ""
                if last and len(last) >= 4:
                    for n, idxs in by_norm.items():
                        if last in n.split() and any(src["edition"] in records[i]["editionIds"] for i in idxs):
                            candidates = idxs
                            break

            if candidates:
                rec = records[candidates[0]]
                # Merge edition if missing (some HTMLs cover editions the CSV doesn't tag)
                if src["edition"] not in rec["editionIds"]:
                    rec["editionIds"] = sorted(set(rec["editionIds"] + [src["edition"]]))
                # Enrich bio (but never shorten an existing richer one)
                if p["bio"]:
                    new_bio = p["bio"].strip()
                    if len(new_bio) > 600:
                        new_bio = new_bio[:597].rsplit(" ", 1)[0] + "…"
                    if not rec.get("shortBio") or len(new_bio) > len(rec.get("shortBio", "")):
                        rec["shortBio"] = new_bio
                # Fill missing role/org
                if p["role"] and not rec.get("role"):
                    rec["role"] = p["role"]
                if p["organization"] and not rec.get("organization"):
                    rec["organization"] = p["organization"]
                # Photo
                url = copy_photo(p["photo_src"], files_dir, PUBLIC_PHOTO_DIR, prefix)
                if url and not rec.get("photoUrl"):
                    rec["photoUrl"] = url
                    stats["photos_copied"] += 1
                # Socials
                if p["socials"] and not rec.get("social"):
                    rec["social"] = p["socials"]
                stats["matched"] += 1
            else:
                # New participant (HTML-only; not in CSVs). Because the
                # Elementor column layout occasionally surfaces titles where
                # a name should be, apply a STRICT "looks like a real person
                # name" guard before committing a new record.
                if not looks_like_person_name(p["name"]):
                    stats["skipped"] += 1
                    continue
                country_id = COUNTRY_NAME_TO_ID.get(p["country"], "intl") if p["country"] else "intl"
                url = copy_photo(p["photo_src"], files_dir, PUBLIC_PHOTO_DIR, prefix)
                if url:
                    stats["photos_copied"] += 1
                new_rec = {
                    "id": f"p-hist-{country_id}-{slugify(p['name'])}",
                    "name": p["name"],
                    "countryId": country_id,
                    "organization": p["organization"] or "",
                    "role": p["role"] or "",
                    "sectorIds": [],
                    "actorType": infer_actor_type(p["role"], p["organization"]),
                    "editionIds": [src["edition"]],
                    "areasOfInterest": [],
                    "website": None,
                    "source": "html-only",
                    "shortBio": (p["bio"] or None),
                    "photoUrl": url,
                    "social": p["socials"] or None,
                }
                # Ensure globally unique id
                if any(r["id"] == new_rec["id"] for r in records):
                    n = 2
                    while any(r["id"] == f"{new_rec['id']}-{n}" for r in records):
                        n += 1
                    new_rec["id"] = f"{new_rec['id']}-{n}"
                records.append(new_rec)
                by_norm.setdefault(norm, []).append(len(records) - 1)
                stats["new"] += 1
                if len(unmatched_samples) < 10:
                    unmatched_samples.append(f"{prefix}: {p['name']} ({country_id})")

    HISTORICAL_JSON.write_text(json.dumps(records, ensure_ascii=False, indent=2))
    print(f"Wrote enriched {HISTORICAL_JSON.relative_to(ROOT)} ({len(records)} records total)")
    print("Stats:", stats)
    if unmatched_samples:
        print("Sample NEW HTML-only participants:")
        for s in unmatched_samples:
            print(" ", s)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
