import { ImageResponse } from '@vercel/og';
import { getWrappedStats } from '@/services/wrapped.service';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  const currentYear = new Date().getFullYear();
  const year = yearParam ? parseInt(yearParam, 10) : currentYear;

  const stats = await getWrappedStats(userId, year);

  if (!stats) {
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
          <div style={{ fontSize: 64, marginBottom: 24, display: 'flex' }}>🙏</div>
          <div style={{ fontSize: 36, color: '#d4a843', fontWeight: 700, display: 'flex' }}>
            {year} Year in Prayer
          </div>
          <div style={{ fontSize: 18, color: '#888', marginTop: 16, display: 'flex' }}>
            prayerjar.org
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const topCategoryDisplay = stats.topCategory
    ? stats.topCategory.replace(/_/g, ' ')
    : '—';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1a1a2e, #2a1a1e)',
          padding: '56px 64px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 48, display: 'flex' }}>🙏</div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 700,
              color: '#d4a843',
              letterSpacing: '-0.5px',
              display: 'flex',
            }}
          >
            {year} Year in Prayer
          </div>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {[
            { label: 'Prayers', value: stats.totalPrayers.toString(), emoji: '📖' },
            { label: 'Answered', value: stats.answeredCount.toString(), emoji: '🌟' },
            { label: 'Day Streak', value: stats.longestStreak.toString(), emoji: '🔥' },
            { label: 'Top Category', value: topCategoryDisplay, emoji: '🏷️' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '28px 32px',
                minWidth: 200,
                gap: 8,
              }}
            >
              <div style={{ fontSize: 36, display: 'flex' }}>{item.emoji}</div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: '#e8e0d4',
                  lineHeight: 1,
                  display: 'flex',
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: '#888',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1.5px',
                  display: 'flex',
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 16, color: '#d4a843', display: 'flex' }}>
            prayerjar.org · Your faith in numbers
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
