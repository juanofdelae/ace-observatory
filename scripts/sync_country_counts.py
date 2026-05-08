#!/usr/bin/env python3
"""
Syncs the hardcoded `participantsCount` values in data/countries.ts with the
live count from data/_historical-participants.json + data/_memphis-participants.json.

This is a one-shot maintenance script — safe to re-run after any CSV re-ingest.
"""
from __future__ import annotations
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COUNTRIES_TS = ROOT / "data" / "countries.ts"
HISTORICAL = ROOT / "data" / "_historical-participants.json"
MEMPHIS = ROOT / "data" / "_memphis-participants.json"


def load_counts() -> Counter[str]:
    counts: Counter[str] = Counter()
    with open(HISTORICAL) as f:
        for p in json.load(f):
            counts[p["countryId"]] += 1

    # Memphis source uses country name; mirror participants.ts logic crudely:
    # anything that maps to a known countries.ts id is added.
    NAME_TO_ID = {
        "United States": "us", "USA": "us", "United States of America": "us",
        "Canada": "ca", "Mexico": "mx", "Guatemala": "gt", "Belize": "bz",
        "Honduras": "hn", "El Salvador": "sv", "Costa Rica": "cr",
        "Panama": "pa", "Dominican Republic": "do", "Haiti": "ht", "Jamaica": "jm",
        "Trinidad & Tobago": "tt", "Trinidad and Tobago": "tt", "The Bahamas": "bs",
        "Bahamas": "bs", "Barbados": "bb", "St. Lucia": "lc", "Saint Lucia": "lc",
        "Grenada": "gd", "St. Kitts & Nevis": "kn", "Saint Kitts and Nevis": "kn",
        "Antigua & Barbuda": "ag", "Antigua and Barbuda": "ag", "Dominica": "dm",
        "Colombia": "co", "Peru": "pe", "Chile": "cl", "Argentina": "ar",
        "Brazil": "br", "Ecuador": "ec", "Uruguay": "uy", "Paraguay": "py",
        "Bolivia": "bo", "Guyana": "gy", "Suriname": "sr",
    }
    with open(MEMPHIS) as f:
        for p in json.load(f):
            cid = NAME_TO_ID.get((p.get("country") or "").strip())
            counts[cid or "us"] += 1
    return counts


def patch_countries_ts(counts: Counter[str]) -> int:
    text = COUNTRIES_TS.read_text()
    updates = 0
    # Each country entry is one line: { id: "xx", ..., participantsCount: N, ... }
    # We match id + participantsCount on the SAME line.
    pattern = re.compile(
        r'(\{\s*id:\s*"([a-zA-Z]+)"[^\n]*?participantsCount:\s*)(\d+)',
    )

    def repl(m: re.Match[str]) -> str:
        nonlocal updates
        cid = m.group(2)
        new = counts.get(cid, 0)
        if new == int(m.group(3)):
            return m.group(0)
        updates += 1
        return f"{m.group(1)}{new}"

    new_text = pattern.sub(repl, text)
    if new_text != text:
        COUNTRIES_TS.write_text(new_text)
    return updates


def main() -> int:
    counts = load_counts()
    n = patch_countries_ts(counts)
    print(f"Updated participantsCount for {n} countries.")
    print("Top counts:", counts.most_common(10))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
