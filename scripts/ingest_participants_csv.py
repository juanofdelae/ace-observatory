#!/usr/bin/env python3
"""
Phase A: Ingest the TablePress per-country CSV exports into a single JSON
file consumed by data/participants.ts.

Reads:   tablepress-export-*/NN-Country.xlsx-YYYY-MM-DD.csv
Writes:  data/_historical-participants.json
"""
from __future__ import annotations
import csv
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_DIR = ROOT / "tablepress-export-2026-04-24-01-55-36-csv"
OUT_JSON = ROOT / "data" / "_historical-participants.json"

# --- Country filename → countryId (matches data/countries.ts ids) ---
# Unknown / special / multinational orgs fold into the 'intl' bucket.
COUNTRY_MAP = {
    # Americas
    "Antigua-barbuda": "ag",
    "argentina": "ar",
    "Argentina": "ar",
    "Bahamas": "bs",
    "The-Bahamas": "bs",
    "Barbados": "bb",
    "Belize": "bz",
    "Bolivia": "bo",
    "Brazil": "br",
    "Canada": "ca",
    "Chile": "cl",
    "Colombia": "co",
    "Costa-Rica": "cr",
    "Dominica": "dm",
    "Dominican-Republic": "do",
    "Ecuador": "ec",
    "El-Salvador": "sv",
    "Grenada": "gd",
    "Guatemala": "gt",
    "Guyana": "gy",
    "Haiti": "ht",
    "Honduras": "hn",
    "Jamaica": "jm",
    "Mexico": "mx",
    "Panama": "pa",
    "Paraguay": "py",
    "Peru": "pe",
    "St.-Kitts-Nevis": "kn",
    "St.-Lucia": "lc",
    "Suriname": "sr",
    "Trinidad-and-Tobago": "tt",
    "United-States-of-America": "us",
    "Uruguay": "uy",
    # Europe / Asia — proper country records, not "intl".
    "Spain": "es",
    "Germany": "de",
    "United-Kingdom": "gb",
    "Norway": "no",
    "Estonia": "ee",
    "Cyprus": "cy",
    "Israel": "il",
    "Armenia": "am",
    "South-Korea": "kr",
    "Saudi-Arabia": "sa",
    "Georgia": "ge",
}

# Multilateral / supranational / multinational entities — these get
# countryId = 'intl' AND an organizationId pointing at data/organizations.ts,
# so the UI can surface the real affiliation instead of an opaque "intl" tag.
ORG_MAP = {
    "Caribbean-Developent-Bank": "org-cdb",  # sic — original sheet has a typo
    "Caribbean-Development-Bank": "org-cdb",
    "Development-Bank-of-Latin-America-CAF": "org-caf",
    "European-Commission": "org-european-commission",
    "European-Parliament": "org-european-parliament",
    "Inter-American-Development-Bank-IDB": "org-idb",
    "Organisation-of-Eastern-Caribbean-States-OECS": "org-oecs",
    "Pan-American-Development-Fundation": "org-padf",
    "UN-HABITAT": "org-un-habitat",
    "Walmart": "org-walmart",
    "U.S.-Mexico-Foundation-USMF": "org-usmf",
    "International-Economic-Development-Council": "org-iedc",
    "Foundation-United-States-Mexico-for-Science-FUMEC": "org-fumec",
    "Central-American-Integration-System-SICA": "org-sica",
}

# Generic catch-all files where the organization varies per row — we still use
# "intl" but don't assign a specific organizationId (participants keep whatever
# the Title field resolved into).
INTL_NAMES = {
    "International-Organizations-and-Multinational-Companies",
}

# --- Existing edition IDs in data/editions.ts (number → id) ---
EDITION_IDS = {
    1: "ace-1-southeast-2014",
    2: "ace-2-mexico-2014",
    3: "ace-3-midwest-2015",
    4: "ace-4-cordoba-2015",
    5: "ace-5-arizona-california-2016",
    6: "ace-6-ontario-2016",
    7: "ace-7-texas-2017",
    8: "ace-8-florida-2017",
    9: "ace-9-germany-israel-2018",
    10: "ace-10-northern-california-2018",
    11: "ace-11-puerto-rico-2019",
    12: "ace-12-chile-2019",
    13: "ace-13-colorado-2021",
    14: "ace-14-louisiana-2022",
    15: "ace-15-ecuador-2022",
    16: "ace-16-seattle-2023",
    17: "ace-17-panama-2024",
    18: "ace-18-michigan-2024",
    19: "ace-19-armenia-2024",
    20: "ace-20-illinois-2025",
    21: "ace-21-belem-2025",
    22: "ace-22-cordoba-2025",
    23: "ace-23-memphis-2026",
}

# --- Actor type inference from title + organization strings ---
GOVERNMENT_KEYWORDS = [
    "ministry", "ministro", "minister", "secretary", "secretari",
    "government", "gobierno", "municipal", "city of", "state of", "department of",
    "agencia", "agency", "authority", "congress", "senator", "mayor", "governor",
    "president of", "vice president of", "director general", "subsecreta",
    "parliament", "deputy", "diputad", "council", "office of the", "embassy",
    "consul", "public ",
]
ACADEMIA_KEYWORDS = [
    "university", "universidad", "college", "faculty", "professor",
    "dean", "school of", "institute of technology", "polytechnic",
    "research center", "research institute",
]
INTL_ORG_KEYWORDS = [
    "world bank", "idb", "inter-american development", "iadb", "oas",
    "organization of american", "organisation of american",
    "united nations", "un ", "un-", "caf", "sica", "unido",
    "unesco", "oecd", "european commission", "european parliament",
    "development bank", "bid", "multilater",
]
ECOSYSTEM_KEYWORDS = [
    "chamber", "cámara", "camara", "cluster", "incubator", "accelerator",
    "hub", "foundation", "fundación", "fundacion", "association",
    "asociación", "asociacion", "ngo", "non-profit", "nonprofit",
    "ecosystem", "startup", "entrepreneurs",
]

def infer_actor_type(title: str, org: str) -> str:
    s = f"{title} {org}".lower()
    for kw in INTL_ORG_KEYWORDS:
        if kw in s:
            return "International Organization"
    for kw in GOVERNMENT_KEYWORDS:
        if kw in s:
            return "Government"
    for kw in ACADEMIA_KEYWORDS:
        if kw in s:
            return "Academia"
    for kw in ECOSYSTEM_KEYWORDS:
        if kw in s:
            return "Entrepreneurial Ecosystem"
    return "Private Sector"


# --- Sector inference from interests/title/org strings ---
def infer_sectors(text: str) -> list[str]:
    t = text.lower()
    out: set[str] = set()
    if any(k in t for k in ["innovation", "innov"]):
        out.add("sec-innovation")
    if any(k in t for k in ["entrepreneur", "emprendedor", "startup", "incubator", "accelerator"]):
        out.add("sec-entrepreneurship")
    if any(k in t for k in ["digital", "ai ", " ai", "artificial intelligence", "technology", "software", "cyber", "ict"]):
        out.add("sec-digital")
    if any(k in t for k in ["manufactur", "industr"]):
        out.add("sec-advanced-manufacturing")
    if any(k in t for k in ["trade", "logistic", "commerce", "export", "import", "supply chain"]):
        out.add("sec-logistics")
    if any(k in t for k in ["agri", "food", "biotech", "biology", "biolog"]):
        out.add("sec-agrifood")
    if any(k in t for k in ["energy", "climate", "sustain", "renewable", "environment"]):
        out.add("sec-clean-energy")
    if any(k in t for k in ["smart cit", "urban", "infrastructure", "mobility", "transport"]):
        out.add("sec-smart-cities")
    if any(k in t for k in ["education", "talent", "workforce", "training", "university", "academic"]):
        out.add("sec-talent")
    if any(k in t for k in ["health", "medical", "pharma", "hospital"]):
        out.add("sec-health")
    return sorted(out)


# ---------- Helpers ----------
def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:80] or "x"


def parse_editions(field: str) -> list[int]:
    if not field:
        return []
    nums = re.findall(r"\d+", field)
    return sorted({int(n) for n in nums if 1 <= int(n) <= 23})


def parse_website(cell: str) -> str | None:
    if not cell:
        return None
    c = cell.strip()
    if not c:
        return None
    m = re.search(r'href="([^"]+)"', c)
    if m:
        return m.group(1)
    if c.lower().startswith(("http://", "https://", "www.")):
        return c
    return None


def split_title_org(title: str) -> tuple[str, str]:
    """
    The TablePress Title field often bundles both the role AND the organization
    in one cell. Common formats:
      'Founder\nUpSquad'                          → role='Founder', org='UpSquad'
      'President/CEO, Imperial Valley EDC'        → role='President/CEO', org='Imperial Valley EDC'
      'Minister of X - Government of Y'           → role='Minister of X', org='Government of Y'
      'CEO'                                       → role='CEO', org=''
    We split on newline first (most reliable), then ' - ' then first comma.
    """
    if not title:
        return "", ""
    t = title.strip()
    # Newline split is the cleanest separator the source uses.
    if "\n" in t:
        role, org = t.split("\n", 1)
        return role.strip(), org.strip().replace("\n", " ")
    # ' - ' between role and org
    m = re.match(r"^(.+?)\s-\s(.+)$", t)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    # first comma (only if the left side looks like a role, i.e. short)
    if "," in t:
        left, right = t.split(",", 1)
        if len(left) < 60:
            return left.strip(), right.strip()
    return t, ""


def source_from_filename(name: str) -> tuple[str, str | None, str | None, bool]:
    """
    Returns (display_name, countryId_or_None, organizationId_or_None, is_copy).

    Participant CSV filenames follow the pattern
        '<N>-<Slug>.xlsx-YYYY-MM-DD.csv'      (older sheets)
        '<N>-<Slug>-YYYY-MM-DD.csv'           (newer sheets)
    and '<Slug>' is either a country name, a multilateral org, or
    'Copy-of-<Slug>' for duplicated sheets.
    """
    m = re.match(r"^\d+-(.+?)(?:\.xlsx)?-\d{4}-\d{2}-\d{2}\.csv$", name)
    if not m:
        return (name, None, None, False)
    slug = m.group(1)
    is_copy = slug.startswith("Copy-of-")
    if is_copy:
        slug = slug[len("Copy-of-"):]

    # Exact matches first.
    if slug in COUNTRY_MAP:
        return (slug.replace("-", " "), COUNTRY_MAP[slug], None, is_copy)
    if slug in ORG_MAP:
        return (slug.replace("-", " "), "intl", ORG_MAP[slug], is_copy)
    if slug in INTL_NAMES:
        return (slug.replace("-", " "), "intl", None, is_copy)

    # Case-insensitive fallback.
    for key, val in COUNTRY_MAP.items():
        if slug.lower() == key.lower():
            return (slug.replace("-", " "), val, None, is_copy)
    for key, val in ORG_MAP.items():
        if slug.lower() == key.lower():
            return (slug.replace("-", " "), "intl", val, is_copy)
    for key in INTL_NAMES:
        if slug.lower() == key.lower():
            return (slug.replace("-", " "), "intl", None, is_copy)

    return (slug.replace("-", " "), None, None, is_copy)


# ---------- Main ----------
def main() -> int:
    if not CSV_DIR.exists():
        print(f"ERROR: CSV dir not found: {CSV_DIR}", file=sys.stderr)
        return 2

    out: list[dict] = []
    seen: dict[str, int] = {}       # name|country|firstEdition → index in out (dedup within country)
    stats = {"files": 0, "rows": 0, "dedup": 0, "unknown_country": 0, "skipped_copy": 0}
    unknown_countries: list[str] = []

    for csv_path in sorted(CSV_DIR.glob("*.csv")):
        disp, cid, org_id, is_copy = source_from_filename(csv_path.name)
        if is_copy:
            stats["skipped_copy"] += 1
            continue  # Copy-of-* duplicates – skip.
        if cid is None:
            stats["unknown_country"] += 1
            unknown_countries.append(disp)
            continue

        stats["files"] += 1
        # Default organization label (for rows that don't have an explicit title
        # → organization split). When the CSV IS the organization we fall back
        # to the sheet name cleaned up a bit so the participant card doesn't
        # render an empty 'organization' field.
        default_org_label = disp if org_id else ""

        with open(csv_path, newline="", encoding="utf-8", errors="replace") as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                name = (row.get("Name") or "").strip()
                if not name:
                    continue
                title = (row.get("Title") or "").strip()
                edition_numbers = parse_editions(row.get("ACE Edition", ""))
                website = parse_website(row.get("Website", ""))

                role, org = split_title_org(title)
                if org_id and not org:
                    org = default_org_label
                actor_type = infer_actor_type(role, org)
                sectors = infer_sectors(f"{role} {org}")
                edition_ids = [EDITION_IDS[n] for n in edition_numbers if n in EDITION_IDS]

                dedup_key = f"{name}|{cid}|{edition_numbers[0] if edition_numbers else 0}"
                if dedup_key in seen:
                    # Merge editions into the existing record. If the newer
                    # row carries an organizationId (e.g. from the specific
                    # IDB/CAF/EC sheet) we promote it into the dedup'd record
                    # so we don't lose the affiliation when the catch-all
                    # sheet was processed first.
                    idx = seen[dedup_key]
                    existing = out[idx]
                    merged = sorted(set(existing["editionIds"] + edition_ids))
                    existing["editionIds"] = merged
                    if org_id and not existing.get("organizationId"):
                        existing["organizationId"] = org_id
                        # Also prefer the cleaner org label from the specific sheet.
                        if default_org_label and not existing.get("organization"):
                            existing["organization"] = default_org_label
                    stats["dedup"] += 1
                    continue

                record = {
                    "id": f"p-hist-{cid}-{slugify(name)}",
                    "name": name,
                    "countryId": cid,
                    "organization": org,
                    "role": role,
                    "sectorIds": sectors,
                    "actorType": actor_type,
                    "editionIds": edition_ids,
                    "areasOfInterest": [],
                    "website": website,
                    "source": "tablepress-2026-04-24",
                }
                if org_id:
                    record["organizationId"] = org_id
                seen[dedup_key] = len(out)
                out.append(record)
                stats["rows"] += 1

    # Ensure IDs are globally unique (names can repeat across countries).
    id_counts: dict[str, int] = {}
    for r in out:
        base = r["id"]
        n = id_counts.get(base, 0)
        if n:
            r["id"] = f"{base}-{n+1}"
        id_counts[base] = n + 1

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as fp:
        json.dump(out, fp, ensure_ascii=False, indent=2)

    print(f"Wrote {len(out)} participants → {OUT_JSON.relative_to(ROOT)}")
    print(f"Stats: {stats}")
    if unknown_countries:
        print("Unknown country slugs (skipped):", unknown_countries)

    # Quick breakdown
    by_country: dict[str, int] = {}
    by_edition: dict[str, int] = {}
    by_actor: dict[str, int] = {}
    for r in out:
        by_country[r["countryId"]] = by_country.get(r["countryId"], 0) + 1
        for e in r["editionIds"]:
            by_edition[e] = by_edition.get(e, 0) + 1
        by_actor[r["actorType"]] = by_actor.get(r["actorType"], 0) + 1
    print("Top 10 countries:", sorted(by_country.items(), key=lambda x: -x[1])[:10])
    print("Actor types:", by_actor)
    print("Editions covered:", len(by_edition))
    return 0


if __name__ == "__main__":
    sys.exit(main())
