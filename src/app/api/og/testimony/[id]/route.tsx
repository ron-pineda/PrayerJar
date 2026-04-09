import { ImageResponse } from '@vercel/og';
import { getPrayerById } from '@/services/prayer.service';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prayer = await getPrayerById(id);

  if (!prayer || prayer.status !== 'answered') {
    return new Response('Not found', { status: 404 });
  }

  const text = prayer.testimony || prayer.content;
  const truncated = text.length > 120 ? text.slice(0, 117) + '...' : text;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a2a1a, #1a1a2e)',
          padding: '48px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 14, color: '#6a9a6a', letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: 24, display: 'flex' }}>
          ✨ Answered Prayer
        </div>
        <div style={{ fontSize: 28, color: '#e8e0d4', lineHeight: 1.5, textAlign: 'center' as const, fontStyle: 'italic' as const, marginBottom: 24, maxWidth: '80%', display: 'flex' }}>
          "{truncated}"
        </div>
        <div style={{ fontSize: 16, color: '#aaa', display: 'flex' }}>
          {prayer.prayerCount} people prayed
        </div>
        <div style={{ fontSize: 14, color: '#d4a843', marginTop: 24, display: 'flex' }}>
          prayerjar.app · Praise Wall
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
