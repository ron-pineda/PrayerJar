import type { MetadataRoute } from 'next'
import { PRAYER_CATEGORIES } from '@/lib/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.org'

  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/pray`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/browse`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/praise-wall`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/find-a-church`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/know-jesus`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/for-churches`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/give`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/world-prayer`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/map`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/partners`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/press`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/trust`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/docs`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/docs/features`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/docs/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/docs/churches`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/docs/paid`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]

  // Per-category prayer pages. These are the only routes on the site whose
  // titles match a phrase a real person types ("grief prayer requests"), and
  // the only ones carrying JSON-LD — they were previously absent from the
  // sitemap and reachable only by guessing the URL.
  const categoryRoutes: MetadataRoute.Sitemap = PRAYER_CATEGORIES.map((c) => ({
    url: `${baseUrl}/pray/${c.value}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Note: /church/[slug]/* routes are all member/admin-gated (auth-required).
  // robots.ts correctly disallows /church/. Submitting these URLs to the sitemap
  // while blocking them in robots causes GSC "submitted URL blocked by robots.txt"
  // warnings and wastes crawl budget. Church slug URLs are intentionally omitted.
  //
  // Note: /testimony, /campaigns and /wrapped were listed here until 2026-07-24
  // but no index route exists for any of them — only /testimony/[id],
  // /campaigns/[slug] and /wrapped/[year]. All three returned a hard 404 in
  // production. Re-add them only alongside a real index page.
  return [...staticRoutes, ...categoryRoutes]
}
