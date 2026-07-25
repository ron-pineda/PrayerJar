import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PRAYER_CATEGORIES, PRAYER_ROUTE_SLUGS } from '@/lib/utils';
import PrayByCategoryClient from './client';

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ urgent?: string }>;
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  any: 'Pray for whoever needs it most. A real request from a real person, drawn from every category on PrayerJar.',
  health:
    'Pray for people facing illness, recovery, and medical challenges. Join others lifting health prayers on PrayerJar.',
  family:
    'Stand with families navigating conflict, distance, and change. Bring your family prayers to a community that cares.',
  financial:
    'Lift up those facing debt, job loss, and financial uncertainty. Your prayers over financial struggles matter deeply.',
  grief:
    'Sit with those who are mourning loss, heartbreak, and sorrow. Join a community that prays through grief together.',
  gratitude:
    'Celebrate answered prayers and blessings. Add your voice to a chorus of thanksgiving on PrayerJar.',
  guidance:
    'Pray for those seeking direction in major decisions and life transitions. Wisdom comes when people pray together.',
  relationships:
    'Cover friendships, marriages, and broken bonds in prayer. People here are believing for restored relationships.',
  work_career:
    'Pray for those navigating career uncertainty, new opportunities, and workplace challenges. Work-life prayers welcome here.',
  spiritual_growth:
    'Intercede for those pursuing deeper faith, freedom, and closeness with God. Spiritual growth prayers find a home here.',
  other:
    'Every prayer need belongs here. Bring the requests that do not fit a category — they matter just as much.',
};

/**
 * `any` is not a PRAYER_CATEGORIES value — it is the sentinel `getRandomPrayer`
 * accepts to draw from every category, and it backs the first and most
 * prominent card in the category picker (`category-picker.tsx:12`).
 *
 * It must be listed here explicitly. The first version of the slug guard below
 * validated against PRAYER_CATEGORIES alone and 404'd /pray/any in production —
 * killing the main "pray for anyone" entry point. Do not remove.
 */
const ANY_OPTION = { value: 'any', label: 'Any' } as const;

/**
 * Only `any` plus the ten values in PRAYER_CATEGORIES are real routes. Anything
 * else used to render a 200 page that reflected the raw slug straight into the
 * <title> and meta description (e.g. /pray/cheap-viagra → "cheap-viagra Prayer
 * Requests | PrayerJar"), which gave crawlers an unbounded soft-404 space and
 * let anyone mint a PrayerJar-branded title of their choosing. Unknown slugs
 * now 404.
 */
function findCategory(value: string) {
  // PRAYER_ROUTE_SLUGS is the single source of truth the picker also reads, so
  // the two cannot drift apart again.
  if (!PRAYER_ROUTE_SLUGS.includes(value)) return undefined;
  if (value === ANY_OPTION.value) return ANY_OPTION;
  return PRAYER_CATEGORIES.find((c) => c.value === value);
}

/** "Any Prayer Requests" reads badly; everything else follows the label. */
function titleFor(value: string, label: string) {
  return value === ANY_OPTION.value
    ? 'Pray for Anyone | PrayerJar'
    : `${label} Prayer Requests | PrayerJar`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const found = findCategory(category);
  if (!found) return { title: 'Not Found | PrayerJar' };

  const label = found.label;
  // The `?? ''` is unreachable: findCategory has already gated this path to
  // `any` plus the ten PRAYER_CATEGORIES values, and CATEGORY_DESCRIPTIONS has
  // a key for each. Kept only so the two maps drifting apart degrades instead
  // of crashing. Verified 2026-07-25: all eleven routes emit a description.
  const description = CATEGORY_DESCRIPTIONS[category] ?? '';
  const title = titleFor(category, label);
  const url = `https://prayerjar.org/pray/${category}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'PrayerJar',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PrayByCategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const { urgent } = await searchParams;

  const found = findCategory(category);
  if (!found) notFound();

  const label = found.label;
  // The `?? ''` is unreachable: findCategory has already gated this path to
  // `any` plus the ten PRAYER_CATEGORIES values, and CATEGORY_DESCRIPTIONS has
  // a key for each. Kept only so the two maps drifting apart degrades instead
  // of crashing. Verified 2026-07-25: all eleven routes emit a description.
  const description = CATEGORY_DESCRIPTIONS[category] ?? '';
  const url = `https://prayerjar.org/pray/${category}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    // Strip the site suffix so the structured-data name matches the <title>
    // without repeating the brand.
    name: titleFor(category, label).replace(' | PrayerJar', ''),
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'PrayerJar',
      url: 'https://prayerjar.org',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PrayByCategoryClient category={category} urgent={urgent} />
    </>
  );
}
