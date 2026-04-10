import type { NextRequest } from 'next/server';
import { searchPrayers } from '@/services/prayer.service';
import type { CategoryValue } from '@/db/schema';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') ?? undefined;
  const category = (searchParams.get('category') ?? 'any') as CategoryValue | 'any';
  const urgent = searchParams.get('urgent') === '1';
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);
  const offset = Number(searchParams.get('offset') ?? 0);

  try {
    const results = await searchPrayers({ query: q, category, urgentOnly: urgent, limit, offset });
    return Response.json(results);
  } catch {
    return Response.json({ error: 'Failed to search prayers' }, { status: 500 });
  }
}
