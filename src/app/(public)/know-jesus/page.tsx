import { db } from '@/db';
import { salvationDecisions } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { SalvationClient } from '@/components/salvation-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Know Jesus | The Prayer Jar' };

export default async function KnowJesusPage() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salvationDecisions);

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Know Jesus</h1>
        <p className="text-muted-foreground">
          You don&rsquo;t have to have it all together. You just have to come as you are.
        </p>
      </div>

      <SalvationClient initialCount={Number(count)} />
    </main>
  );
}
