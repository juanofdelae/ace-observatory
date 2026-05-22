/** @type {import('next').NextConfig} */
// Two build targets from one repo — see docs/MERGE_PLAN.md ADR-007.
//
//   BUILD_TARGET=public  → Apache static export at /ACE/observatory
//                          (existing production surface — no admin, no auth)
//   BUILD_TARGET=admin   → full Next.js server for Vercel deploy
//                          (admin + auth + cron + API; default in dev)
//
// The public build still requires removing app/(auth), app/(admin), and
// app/api before `next build` — handled by the M-Build phase. Today the
// switch only chooses output mode; routes are pruned by a future
// scripts/build-public.sh.
const TARGET = process.env.BUILD_TARGET ?? "admin";
const isPublic = TARGET === "public";
const BASE_PATH = isPublic ? "/ACE/observatory" : "";

const nextConfig = {
  reactStrictMode: true,
  ...(isPublic
    ? {
        output: "export",
        basePath: BASE_PATH,
        assetPrefix: BASE_PATH,
        images: { unoptimized: true },
      }
    : {}),
  poweredByHeader: false,
  trailingSlash: true,
};

module.exports = nextConfig;
