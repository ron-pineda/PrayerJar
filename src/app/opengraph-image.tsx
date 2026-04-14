import { ImageResponse } from '@vercel/og';
import { db } from '@/db';
import { prayers, prayerInteractions } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const alt = 'The Prayer Jar — A global community of prayer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const [prayerRow, interactionRow] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(prayers).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(prayerInteractions).then((r) => Number(r[0]?.count ?? 0)),
  ]);

  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
    return String(n);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#1c1c1e',
          fontFamily: 'Georgia, "Times New Roman", serif',
          position: 'relative',
        }}
      >
        {/* Top gold bar */}
        <div style={{ width: '100%', height: 6, background: '#d4a843', display: 'flex' }} />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '52px 64px 48px',
          }}
        >
          {/* Top label */}
          <div
            style={{
              fontSize: 13,
              color: '#d4a843',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              display: 'flex',
            }}
          >
            A community of prayer
          </div>

          {/* Center content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: '#ede8df',
                lineHeight: 1.1,
                display: 'flex',
              }}
            >
              The Prayer Jar
            </div>
            <div
              style={{
                fontSize: 28,
                color: '#a09880',
                lineHeight: 1.5,
                fontStyle: 'italic',
                display: 'flex',
              }}
            >
              Share your heart. Intercede for others.
            </div>
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Stats */}
            <div style={{ display: 'flex', gap: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#d4a843', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
                  {fmt(prayerRow)}
                </div>
                <div style={{ fontSize: 13, color: '#666', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
                  Prayers submitted
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#d4a843', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
                  {fmt(interactionRow)}
                </div>
                <div style={{ fontSize: 13, color: '#666', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
                  Times prayed
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#d4a843', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
                  Free
                </div>
                <div style={{ fontSize: 13, color: '#666', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
                  Always
                </div>
              </div>
            </div>

            {/* Domain */}
            <div
              style={{
                fontSize: 16,
                color: '#d4a843',
                fontFamily: 'system-ui, sans-serif',
                display: 'flex',
              }}
            >
              prayerjar.org
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
