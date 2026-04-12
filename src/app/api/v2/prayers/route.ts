import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { createPrayer, ModerationError } from '@/services/prayer.service';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { eq, and, gt, isNull, count } from 'drizzle-orm';
import { z } from 'zod';

const getQuerySchema = z.object({
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const postBodySchema = z.object({
  content: z.string().min(1).max(2000),
  category: z.string().min(1),
  isAnonymous: z.boolean(),
  isUrgent: z.boolean(),
});

export async function GET(req: NextRequest) {
  const apiKey = await authenticateApiKey(req);
  if (!apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const parsed = getQuerySchema.safeParse({
    category: searchParams.get('category') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { category, limit, offset } = parsed.data;
  const now = new Date();

  const conditions = [
    eq(prayers.status, 'active'),
    gt(prayers.expiresAt, now),
    isNull(prayers.groupId),
  ];

  if (category) {
    conditions.push(eq(prayers.category, category as typeof prayers.category.dataType));
  }

  const whereClause = and(...conditions);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: prayers.id,
        content: prayers.content,
        category: prayers.category,
        createdAt: prayers.createdAt,
        isAnonymous: prayers.isAnonymous,
        prayerCount: prayers.prayerCount,
      })
      .from(prayers)
      .where(whereClause)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(prayers).where(whereClause),
  ]);

  const total = Number(totalRows[0]?.total ?? 0);

  return NextResponse.json({ prayers: rows, total, limit, offset });
}

export async function POST(req: NextRequest) {
  const apiKey = await authenticateApiKey(req);
  if (!apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const prayer = await createPrayer({
      content: parsed.data.content,
      isAnonymous: parsed.data.isAnonymous,
      isUrgent: parsed.data.isUrgent,
      authorId: null, // API submissions are always anonymous at the DB level
    });

    return NextResponse.json(
      {
        prayer: {
          id: prayer.id,
          content: prayer.content,
          category: prayer.category,
          createdAt: prayer.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ModerationError) {
      return NextResponse.json({ error: 'moderation', selfHarm: err.selfHarm }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
