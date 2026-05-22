import { Linkedin, Instagram, Twitter, Youtube, type LucideIcon } from "lucide-react";

// Public-facing social handles for the ACE program. The LinkedIn URL
// strips '/admin/dashboard/' from the source so it points at the
// company's public profile, not the admin console.
const SOCIALS: Array<
  | { href: string; label: string; icon: LucideIcon; svg?: never }
  | { href: string; label: string; svg: true; icon?: never }
> = [
  {
    href: "https://www.linkedin.com/company/80635657/",
    label: "LinkedIn",
    icon: Linkedin,
  },
  {
    href: "https://www.instagram.com/ace_the_americas_exchange/",
    label: "Instagram",
    icon: Instagram,
  },
  {
    href: "https://x.com/riacnetorg",
    label: "X (Twitter)",
    icon: Twitter,
  },
  {
    href: "https://www.flickr.com/photos/89835551@N02/sets/",
    label: "Flickr",
    svg: true,
  },
  {
    href: "https://www.youtube.com/user/riacnetorg/videos",
    label: "YouTube",
    icon: Youtube,
  },
];

// Floating social-media pill anchored top-right on desktop. Hidden on
// mobile so the existing top bar (logo + hamburger) stays clean — the
// drawer footer surfaces them on small screens instead.
export function SocialRail() {
  return (
    <div className="hidden lg:flex fixed top-4 right-6 z-30 items-center gap-0.5 bg-white/85 backdrop-blur-sm border border-surface-border rounded-full px-1.5 py-1 shadow-soft">
      {SOCIALS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
          className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-ink hover:bg-surface-canvas transition-colors"
        >
          {s.svg ? <FlickrIcon /> : <s.icon size={15} strokeWidth={1.75} />}
        </a>
      ))}
    </div>
  );
}

// Compact variant suitable for the mobile drawer footer or the
// desktop sidebar — same handles, smaller surface, no fixed
// positioning.
export function SocialRailInline({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {SOCIALS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
          className="w-9 h-9 rounded-full flex items-center justify-center text-sidebar-idle hover:text-white hover:bg-white/10 transition-colors"
        >
          {s.svg ? <FlickrIconLg /> : <s.icon size={17} strokeWidth={1.75} />}
        </a>
      ))}
    </div>
  );
}

// Larger Flickr glyph that visually matches the bumped-up lucide
// icons inside the sidebar variant.
function FlickrIconLg() {
  return (
    <svg viewBox="0 0 24 24" width={17} height={17} aria-hidden className="shrink-0">
      <circle cx="7.5" cy="12" r="3.5" fill="currentColor" />
      <circle cx="16.5" cy="12" r="3.5" fill="currentColor" />
    </svg>
  );
}

// Flickr is not in lucide-react, so render the standard two-dot mark
// inline. Sized to match the other 15-px lucide icons.
function FlickrIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={15}
      height={15}
      aria-hidden
      className="shrink-0"
    >
      <circle cx="7.5" cy="12" r="3.5" fill="currentColor" />
      <circle cx="16.5" cy="12" r="3.5" fill="currentColor" />
    </svg>
  );
}
