import { CategoryPicker } from '@/components/category-picker';

export const metadata = { title: 'Pray for Someone | The Prayer Jar' };

export default async function PrayPage({
  searchParams,
}: {
  searchParams: Promise<{ urgent?: string }>;
}) {
  const { urgent } = await searchParams;
  const urgentOnly = urgent === '1';

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Pray for Someone</h1>
      <p className="text-muted-foreground mb-8">
        Choose a category — we&apos;ll bring you a prayer request to intercede for.
      </p>
      <CategoryPicker urgentOnly={urgentOnly} />
    </main>
  );
}
