import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { moderateImage } from '@/services/ai.service';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB (already compressed client-side)
const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png'];

export async function POST(request: NextRequest) {
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

  // Moderate asynchronously — don't block the response
  // If flagged, the image stays but the prayer goes to review queue
  try {
    const moderation = await moderateImage(blob.url);
    if (!moderation.safe) {
      return NextResponse.json({
        url: blob.url,
        flagged: true,
        reason: moderation.reason,
      });
    }
  } catch {
    // If moderation fails, allow the upload (manual review can catch it)
  }

  return NextResponse.json({ url: blob.url });
}
