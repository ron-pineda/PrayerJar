import { put, del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { moderateImage } from '@/services/ai.service';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB (already compressed client-side)
const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png'];

const uploadAttempts = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10; // per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = uploadAttempts.get(ip);
  if (!record || now > record.reset) {
    uploadAttempts.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  const blob = await put(`prayers/${crypto.randomUUID()}.webp`, file, {
    access: 'public',
    contentType: file.type,
  });

  try {
    const moderation = await moderateImage(blob.url);
    if (!moderation.safe) {
      await del(blob.url);
      return NextResponse.json({ error: 'Image could not be accepted.' }, { status: 400 });
    }
  } catch {
    // If moderation fails, allow the upload (manual review)
  }

  return NextResponse.json({ url: blob.url });
}
