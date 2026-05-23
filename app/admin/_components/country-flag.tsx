import { cn } from "@/lib/utils";

// Pure helper: converts an ISO-3166 alpha-2 code (lowercase per Country.id
// convention) into the regional-indicator emoji pair. No asset fetch, works
// for every ISO country, renders the OS native flag glyph. Returns null when
// the code is missing or malformed so callers don't need to guard.
function flagEmoji(iso2: string): string | null {
  const upper = iso2.toUpperCase();
  if (upper.length !== 2 || !/^[A-Z]{2}$/.test(upper)) return null;
  const a = upper.charCodeAt(0) - 65;
  const b = upper.charCodeAt(1) - 65;
  return String.fromCodePoint(0x1f1e6 + a, 0x1f1e6 + b);
}

export function CountryFlag({
  code,
  className,
  title,
}: {
  code: string | null | undefined;
  className?: string;
  title?: string;
}) {
  if (!code) return null;
  const emoji = flagEmoji(code);
  if (!emoji) return null;
  return (
    <span
      role="img"
      aria-label={title ?? `Bandera de ${code.toUpperCase()}`}
      title={title ?? code.toUpperCase()}
      className={cn("inline-block leading-none", className)}
    >
      {emoji}
    </span>
  );
}
