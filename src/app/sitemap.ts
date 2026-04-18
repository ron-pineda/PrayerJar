import type { MetadataRoute } from 'next'

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
    { url: `${baseUrl}/testimony`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/world-prayer`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/map`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/campaigns`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/partners`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/press`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/trust`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/wrapped`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/docs`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/docs/features`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/docs/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/docs/churches`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/docs/paid`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]

  // Note: /church/[slug]/* routes are all member/admin-gated (auth-required).
  // robots.ts correctly disallows /church/. Submitting these URLs to the sitemap
  // while blocking them in robots causes GSC "submitted URL blocked by robots.txt"
  // warnings and wastes crawl budget. Church slug URLs are intentionally omitted.
  return staticRoutes
}
