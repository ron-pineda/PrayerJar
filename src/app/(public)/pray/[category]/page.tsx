import type { Metadata } from 'next';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import PrayByCategoryClient from './client';

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ urgent?: string }>;
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  health:
    'Pray for people facing illness, recovery, and medical challenges. Join thousands lifting health prayers on PrayerJar.',
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
    'Cover friendships, marriages, and broken bonds in prayer. Thousands are believing for restored relationships on PrayerJar.',
  work_career:
    'Pray for those navigating career uncertainty, new opportunities, and workplace challenges. Work-life prayers welcome here.',
  spiritual_growth:
    'Intercede for those pursuing deeper faith, freedom, and closeness with God. Spiritual growth prayers find a home here.',
  other:
    'Every prayer need belongs here. Bring the requests that do not fit a category — they matter just as much.',
};

function getCategoryLabel(value: string): string {
  const found = PRAYER_CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value.replace('_', ' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const label = getCategoryLabel(category);
  const description =
    CATEGORY_DESCRIPTIONS[category] ??
    `Pray for ${label.toLowerCase()} requests submitted by real people. Join the PrayerJar community today.`;
  const title = `${label} Prayer Requests | PrayerJar`;
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

  const label = getCategoryLabel(category);
  const description =
    CATEGORY_DESCRIPTIONS[category] ??
    `Pray for ${label.toLowerCase()} requests submitted by real people. Join the PrayerJar community today.`;
  const url = `https://prayerjar.org/pray/${category}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${label} Prayer Requests`,
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
