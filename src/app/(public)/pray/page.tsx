import { CategoryPicker } from '@/components/category-picker';
import { PrayerJar } from '@/components/prayer-jar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { and, eq, gt, isNull, count } from 'drizzle-orm';

export const metadata = { title: 'Pray for Someone | The Prayer Jar' };

async function getActivePrayerCount() {
  const now = new Date();
  const [row] = await db
    .select({ count: count() })
    .from(prayers)
    .where(and(eq(prayers.status, 'active'), gt(prayers.expiresAt, now), isNull(prayers.groupId)));
  return Number(row?.count ?? 0);
}

export default async function PrayPage({
  searchParams,
}: {
  searchParams: Promise<{ urgent?: string }>;
}) {
  const { urgent } = await searchParams;
  const urgentOnly = urgent === '1';
  const activeCount = await getActivePrayerCount();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-col items-center text-center mb-10">
        <PrayerJar
          count={activeCount}
          size="md"
          mode="slips"
          countLabel={`${activeCount.toLocaleString()} requests waiting`}
        />
        <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">
          Someone wrote this for you.
        </h1>
        <p className="text-muted-foreground max-w-md">
          Choose a category and intercede for a real request from the community.
        </p>
      </div>
      <CategoryPicker urgentOnly={urgentOnly} />
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Want to browse all requests?</p>
        <Button variant="ghost" size="sm" render={<Link href="/browse" />}>
          Browse Prayer Requests →
        </Button>
      </div>
    </main>
  );
}
