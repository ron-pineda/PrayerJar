import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // User uploads (prayer photos, testimonies, church logos) live in Vercel Blob.
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },
  experimental: {
    serverActions: {
      // Allow sign-in Server Actions from church subdomains (e.g. testchurch.prayerjar.org).
      // Without this, Next.js's CSRF check rejects POSTs where x-forwarded-host != origin.
      allowedOrigins: ['*.prayerjar.org'],
    },
  },
  /**
   * Sprint 27 (pj-s27-02). Both source routes were deleted with the paid tiers.
   *
   * `/docs/paid` was in the sitemap at priority 0.4 and linked from four places,
   * so a 404 there would have produced Search Console errors on a URL Google
   * already knows. `/docs/churches` is its successor.
   *
   * `/for-churches/demo` was never in the sitemap, but a 308 is nearly free and
   * covers any link shared in outreach email.
   *
   * `permanent: true` emits 308, not 301. Redirects are evaluated before the
   * filesystem, so these fire regardless of what is on disk. This belongs in
   * config, not in src/proxy.ts — that file is Next 16's renamed middleware and
   * already carries subdomain tenant resolution and admin gating.
   */
  async redirects() {
    return [
      { source: '/docs/paid', destination: '/docs/churches', permanent: true },
      { source: '/for-churches/demo', destination: '/for-churches', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  disableLogger: true,
});
