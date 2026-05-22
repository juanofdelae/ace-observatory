#!/usr/bin/env bash
# Build the public-facing static export for Apache deploy at
# riacevents.org/ACE/observatory (ADR-007).
#
# Strategy: quarantine admin/auth files into .build-quarantine/ before
# running `next build`, then restore them on exit. We can't just ignore
# them via next.config because static export still tries to compile every
# route under app/.
#
# Run from project root:  bash scripts/build-public.sh
# Or via npm:              npm run build:public

set -euo pipefail

QUARANTINE=".build-quarantine"

# Paths that must NOT ship in the public build. Order doesn't matter —
# we move them as a group.
PATHS=(
  "app/admin"
  "app/(auth)"
  "app/api/auth"
  "proxy.ts"
)

restore() {
  echo "↩ Restoring quarantined paths…"
  for p in "${PATHS[@]}"; do
    if [ -e "$QUARANTINE/$p" ]; then
      mkdir -p "$(dirname "$p")"
      mv "$QUARANTINE/$p" "$p"
    fi
  done
  rm -rf "$QUARANTINE"
}

# Always restore — even on failure or Ctrl-C — so the working tree is
# never left half-stripped.
trap restore EXIT

rm -rf "$QUARANTINE" .next
mkdir -p "$QUARANTINE"

echo "→ Quarantining admin/auth surface…"
for p in "${PATHS[@]}"; do
  if [ -e "$p" ]; then
    mkdir -p "$QUARANTINE/$(dirname "$p")"
    mv "$p" "$QUARANTINE/$p"
    echo "  · $p"
  fi
done

echo "→ Running public static export…"
BUILD_TARGET=public npm run build

echo "✓ Static export written to ./out/"
