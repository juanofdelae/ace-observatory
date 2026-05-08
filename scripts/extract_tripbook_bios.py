#!/usr/bin/env python3
"""
Extract delegate biographies from cached ACE tripbook PDFs and merge them
into data/_historical-participants.json.

Strategy
--------
For each (editionId → tripbook PDF cache) pair we:
  1. Concatenate every page's text into one corpus.
  2. For each participant in that edition who has no `shortBio` yet,
     search the corpus for the participant's name (with several
     accent-insensitive variants), and capture the surrounding paragraph
     up to the next known participant name or a clear delimiter.
  3. Clean the captured text (strip page numbers, headers, trailing
     country/email/social-handle lines) and validate that what we
     captured looks like a third-person bio (e.g. starts with the name
     followed by a recognised verb like "is/has/serves/leads/...").
  4. Write the bio back into the JSON record verbatim.

We never overwrite an existing bio, never touch other fields, and never
add new participants.

The output JSON is written in place. A backup must be made BEFORE running
this script (the wrapper makes one).
"""
from __future__ import annotations
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "_historical-participants.json"
PDF_CACHE = ROOT / "data" / "_pdf-cache"

# Edition → list of tripbook PDF cache JSON filenames (without .json suffix).
# Tripbooks for editions 17–22 are visual-heavy and don't carry bios, so
# they're left out. Edition-1 has no surviving tripbook in the cache.
EDITION_SOURCES: dict[str, list[str]] = {
    "ace-2-mexico-2014": ["ACE2-Trip-Book-COMPLETO"],
    "ace-3-midwest-2015": [],  # no tripbook with bios; existing CSV-derived bios stay
    "ace-4-cordoba-2015": ["ACE4-participantes"],
    "ace-5-arizona-california-2016": ["5ACE-TripBook-Final"],
    "ace-6-ontario-2016": ["6ace-tripbook"],
    "ace-7-texas-2017": ["ACE7-TRIPBOOK"],
    "ace-8-florida-2017": ["ACE8tripbook-ace8"],
    "ace-9-germany-israel-2018": ["ACE9-TripBook-ACE-9"],
    "ace-10-northern-california-2018": ["ACE10-Tripbook-ACE-10"],
    "ace-11-puerto-rico-2019": ["ACE11-TRIPBOOK-ace11"],
    "ace-12-chile-2019": ["ace12tripbook"],
    "ace-13-colorado-2021": ["ace13-TRIPBOOK-ACE-COLORADO"],
}

# Phrases that, immediately following a person's name, look like the
# start of a third-person biography. We use these to validate captures.
BIO_VERB_PATTERN = re.compile(
    r"^[^.]{0,60}\b(is|has|was|serves|served|works|worked|leads|led|"
    r"holds|joined|joins|became|began|brings|currently|previously|"
    r"received|founded|co[- ]?founded|directs|directed|manages|managed|"
    r"oversees|established|graduated|earned|obtained|holds the|started"
    r"|specializes|focuses|develops|developed|advises|advised)\b",
    re.IGNORECASE,
)

# Boilerplate lines we strip from any captured chunk before saving.
BOILERPLATE_PATTERNS = [
    re.compile(r"^\s*\d+\s*$"),                                  # page number
    re.compile(r"americas competitiveness exchange", re.I),
    re.compile(r"the \d+(st|nd|rd|th) americas competitiveness", re.I),
    re.compile(r"^www\.[a-z0-9./-]+$", re.I),
    re.compile(r"^@[a-z0-9_]+$", re.I),
    re.compile(r"^\s*$"),
    re.compile(r"\binnovation and entrepreneurship\b", re.I),
    re.compile(r"^[A-Z][a-z]+\s*-\s*[A-Z][a-z]+\s*\d{4}$"),       # "Texas - April 2017"
]


def strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )


def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", strip_accents(s).lower()).strip()


def load_pdf_text(stem: str) -> str | None:
    path = PDF_CACHE / f"{stem}.json"
    if not path.exists():
        return None
    obj = json.loads(path.read_text())
    return "\n".join(obj.get("text") or [])


def name_variants(full: str) -> list[str]:
    """Generate plausible textual variants of a name we might find in
    the PDF (with/without middle, dotted initials, etc.)."""
    cleaned = re.sub(r"\s+", " ", full.strip())
    parts = cleaned.split(" ")
    out = {cleaned}
    if len(parts) >= 3:
        out.add(f"{parts[0]} {parts[-1]}")
        out.add(f"{parts[0]} {parts[1][0]}. {parts[-1]}")
    if len(parts) == 2:
        out.add(cleaned)
    return list(out)


def find_in_text(text: str, name: str) -> int:
    """Return the byte offset of the first case-insensitive,
    accent-insensitive occurrence of `name` in `text`, or -1."""
    haystack = normalize(text)
    needle = normalize(name)
    if not needle:
        return -1
    pos = haystack.find(needle)
    return pos


def clean_bio_chunk(chunk: str, name: str) -> str:
    lines = [ln.strip() for ln in chunk.splitlines()]
    out: list[str] = []
    for ln in lines:
        if any(p.search(ln) for p in BOILERPLATE_PATTERNS):
            continue
        # Drop standalone email / handle lines and country-only lines.
        if re.match(r"^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]+$", ln, re.I):
            continue
        if re.match(r"^[A-Z][a-zA-Z\s]+$", ln) and len(ln) <= 22 and ln.endswith((".", "")):
            # Country-name-only line ("United States", "Mexico", "Belize").
            country_like = {
                "United States", "Mexico", "Canada", "Argentina", "Chile",
                "Brazil", "Brasil", "Ecuador", "Panama", "Peru", "Colombia",
                "Jamaica", "Bahamas", "Belize", "Costa Rica", "Honduras",
                "Guatemala", "El Salvador", "Nicaragua", "Dominican Republic",
                "Paraguay", "Uruguay", "Bolivia", "Venezuela", "Trinidad",
                "Suriname", "Guyana", "Israel", "Germany", "Armenia",
            }
            if ln in country_like:
                continue
        out.append(ln)
    text = " ".join(out)
    text = re.sub(r"\s+", " ", text).strip()

    # Trim everything before the bio's actual subject (sometimes there's
    # a title line before the name in tripbooks like ACE 8/9).
    nm_norm = normalize(name)
    text_norm = normalize(text)
    pos = text_norm.find(nm_norm)
    if pos > 0:
        text = text[pos:]

    # Older tripbooks footnote each bio with the participant's Twitter
    # handle. Cut at the first @handle so we don't carry the *next*
    # participant's title across into this bio.
    m = re.search(r"\s+@[A-Za-z0-9_]+", text)
    if m:
        text = text[: m.start()]

    # If we ended mid-sentence (no closing punctuation), back up to the
    # last sentence terminator we can find without losing too much text.
    if text and not text.rstrip().endswith((".", "!", "?", '"', "”")):
        last_p = max(text.rfind("."), text.rfind("!"), text.rfind("?"))
        if last_p > 0 and len(text) - last_p < 250:
            text = text[: last_p + 1]

    return text.strip()


def looks_like_bio(text: str, name: str) -> bool:
    if len(text) < 120 or len(text) > 4000:
        return False
    nm_norm = normalize(name)
    text_norm = normalize(text)
    if not text_norm.startswith(nm_norm):
        # Allow up to a 60-char prefix before the name (common for
        # tripbooks that print "Director · Foo" before the bio).
        idx = text_norm.find(nm_norm)
        if idx < 0 or idx > 60:
            return False
    after_name = text_norm[len(nm_norm):].lstrip(",.: ")
    if BIO_VERB_PATTERN.match(after_name):
        return True
    return False


def extract_bios(participants: list[dict], edition: str, sources: list[str]) -> dict[str, str]:
    """Returns a dict {participant_id → bio_text} for every participant we
    successfully matched in `sources` for `edition`."""
    if not sources:
        return {}
    text = ""
    for src in sources:
        t = load_pdf_text(src)
        if t:
            text += "\n" + t
    if not text:
        return {}

    edition_pps = [p for p in participants if edition in (p.get("editionIds") or [])]
    # Names of every other participant in the same edition — used to find
    # where the current bio ends (the next person's bio starts).
    all_norm_names = {normalize(p["name"]) for p in edition_pps}

    matched: dict[str, str] = {}
    for p in edition_pps:
        if p.get("shortBio"):
            continue
        for variant in name_variants(p["name"]):
            pos = find_in_text(text, variant)
            if pos < 0:
                continue
            # Map the normalized offset back into the original text using
            # a coarse character-to-character mapping. Since `normalize`
            # only applies casing and accent stripping (length-preserving
            # for ASCII; possibly shorter for accented characters), we
            # find the variant in the ORIGINAL text instead, falling back
            # to a slice anchored at `pos`.
            raw_re = re.compile(re.escape(variant), re.IGNORECASE)
            m = raw_re.search(text)
            if not m:
                # Accented variant — use the normalized position as a hint
                # and grab a generous window from the original.
                start = max(0, pos)
                end = min(len(text), pos + 1800)
            else:
                start = m.start()
                end = min(len(text), m.end() + 1800)

            chunk = text[start:end]

            # Cut at the next other-person's name occurrence within the
            # chunk so two bios don't bleed into one. We search the RAW
            # chunk case-insensitively (not the normalized form) — the
            # normalized form's length differs from the raw chunk's when
            # the source has multiple consecutive whitespace characters,
            # so positions in the two strings aren't interchangeable.
            cut_at = len(chunk)
            search_from = len(variant) + 2  # past our own name
            for other_p in edition_pps:
                if other_p["id"] == p["id"]:
                    continue
                other_re = re.compile(re.escape(other_p["name"]), re.IGNORECASE)
                other_m = other_re.search(chunk, search_from)
                if other_m and other_m.start() < cut_at:
                    cut_at = other_m.start()
            chunk = chunk[:cut_at]

            cleaned = clean_bio_chunk(chunk, p["name"])
            if looks_like_bio(cleaned, p["name"]):
                matched[p["id"]] = cleaned
                break
    return matched


def main() -> None:
    participants = json.loads(DATA.read_text())
    by_id = {p["id"]: p for p in participants}

    total_added = 0
    per_edition: dict[str, int] = {}
    for edition, sources in EDITION_SOURCES.items():
        bios = extract_bios(participants, edition, sources)
        for pid, bio in bios.items():
            if not by_id[pid].get("shortBio"):
                by_id[pid]["shortBio"] = bio
                total_added += 1
                per_edition[edition] = per_edition.get(edition, 0) + 1

    DATA.write_text(json.dumps(participants, indent=2, ensure_ascii=False) + "\n")

    print(f"Bios added: {total_added}")
    for ed, n in sorted(per_edition.items()):
        print(f"  {ed}: +{n}")


if __name__ == "__main__":
    main()
