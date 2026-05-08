/** @type {import('next').NextConfig} */
// Subpath deploy on riacevents.org/ACE/observatory.
// `basePath` makes Next.js emit every internal link, asset URL and
// API path under that prefix; `assetPrefix` ensures the static chunks
// (`_next/static/...`) resolve too. Both must stay in sync with the
// physical folder on the server.
const BASE_PATH = "/ACE/observatory";

const nextConfig = {
  reactStrictMode: true,
  // Static export — no server runtime in production. Sidesteps the
  // Next.js Image Optimizer, middleware, RSC streaming and rewrites
  // (and the CVE families that come with them). Security headers are
  // configured at the host (.htaccess for Apache).
  output: "export",
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  // Required by `output: "export"`. Images are served as-is from /public.
  images: { unoptimized: true },
  poweredByHeader: false,
  // Trailing slashes keep static-host routing predictable across hosts.
  trailingSlash: true,
};

module.exports = nextConfig;
