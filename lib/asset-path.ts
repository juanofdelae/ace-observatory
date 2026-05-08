// Prefix /public asset paths and PDF hrefs with the deploy basePath.
//
// Why this exists: with `output: "export"` + `images.unoptimized: true`,
// next/image renders a plain <img> and does NOT auto-prefix the basePath
// onto src — the result is `/photos/foo.jpg` instead of
// `/ACE/observatory/photos/foo.jpg`, which 404s on the host.
// Same applies to <a href="/documents/foo.pdf"> for PDF downloads.
//
// Keep BASE_PATH in sync with `basePath` in next.config.js.
const BASE_PATH = "/ACE/observatory";

export function asset(path: string | undefined | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  if (path.startsWith(BASE_PATH + "/") || path === BASE_PATH) return path;
  if (path.startsWith("/")) return `${BASE_PATH}${path}`;
  return path;
}

export { BASE_PATH };
