import { ImageResponse } from 'next/og';
import { getPrayerById } from '@/services/prayer.service';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prayer = await getPrayerById(id);

  if (!prayer) {
    return new Response('Not found', { status: 404 });
  }

  const truncated = prayer.content.length > 120
    ? prayer.content.slice(0, 117) + '...'
    : prayer.content;

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
          background: 'linear-gradient(135deg, #1a1a2e, #2a1a1e)',
          padding: '48px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 14, color: '#d4a843', letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: 24, display: 'flex' }}>
          🕯 Prayer Request
        </div>
        <div style={{ fontSize: 28, color: '#e8e0d4', lineHeight: 1.5, textAlign: 'center' as const, fontStyle: 'italic' as const, marginBottom: 24, maxWidth: '80%', display: 'flex' }}>
          "{truncated}"
        </div>
        <div style={{ fontSize: 16, color: '#888', display: 'flex' }}>
          {prayer.prayerCount} {prayer.prayerCount === 1 ? 'person has' : 'people have'} prayed for this
        </div>
        <div style={{ fontSize: 14, color: '#d4a843', marginTop: 24, display: 'flex' }}>
          prayerjar.org · Pray with me
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
