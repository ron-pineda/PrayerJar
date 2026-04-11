import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { collections } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());
  return adminEmails.includes(email);
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  coverEmoji: z.string().max(10).optional(),
  isPublished: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Check for slug conflict
  const [existing] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, parsed.data.slug))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
  }

  const [created] = await db
    .insert(collections)
    .values({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      slug: parsed.data.slug,
      coverEmoji: parsed.data.coverEmoji ?? null,
      isPublished: parsed.data.isPublished,
    })
    .returning();

  return NextResponse.json({ collection: created }, { status: 201 });
}
