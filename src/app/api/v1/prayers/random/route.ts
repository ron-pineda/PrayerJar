import type { NextRequest } from 'next/server';
import { getRandomPrayer } from '@/services/prayer.service';
import type { CategoryValue } from '@/db/schema';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = (searchParams.get('category') ?? 'any') as CategoryValue | 'any';
  const urgentOnly = searchParams.get('urgent') === '1';

  try {
    const prayer = await getRandomPrayer(category, urgentOnly);
    if (!prayer) {
      return Response.json({ prayer: null }, { status: 200 });
    }
    return Response.json({ prayer }, { status: 200 });
  } catch (err) {
    console.error('[prayers/random]', err);
    return Response.json({ error: 'Failed to fetch prayer' }, { status: 500 });
  }
}
