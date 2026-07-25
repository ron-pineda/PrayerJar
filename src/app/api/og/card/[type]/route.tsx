import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

function PrayerCard({ text, category, count }: { text: string; category?: string; count?: string }) {
  const prayCount = count ? parseInt(count, 10) : 0;
  return (
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
      <div style={{ width: '100%', height: 6, background: '#d4a843', display: 'flex' }} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px 40px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            Someone needs prayer
          </div>
        </div>

        <div
          style={{
            fontSize: 32,
            color: '#ede8df',
            lineHeight: 1.55,
            fontStyle: 'italic',
            maxWidth: 960,
            display: 'flex',
          }}
        >
          &ldquo;{truncate(text, 120)}&rdquo;
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {category && (
              <div
                style={{
                  fontSize: 13,
                  color: '#1c1c1e',
                  background: '#d4a843',
                  borderRadius: 20,
                  padding: '4px 14px',
                  fontFamily: 'system-ui, sans-serif',
                  display: 'flex',
                }}
              >
                {category}
              </div>
            )}
            {prayCount > 0 && (
              <div
                style={{
                  fontSize: 13,
                  color: '#888',
                  fontFamily: 'system-ui, sans-serif',
                  display: 'flex',
                }}
              >
                {prayCount} {prayCount === 1 ? 'person' : 'people'} praying
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: 13,
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
  );
}

function AnsweredCard({ text, category }: { text: string; category?: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #2a1f00, #1a1200, #0e1a0e)',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 56px 44px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontSize: 15,
              color: '#f0c040',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              textShadow: '0 0 20px rgba(240,192,64,0.6)',
              display: 'flex',
            }}
          >
            Prayer Answered
          </div>
          <div
            style={{
              width: 48,
              height: 2,
              background: '#f0c040',
              opacity: 0.5,
              display: 'flex',
            }}
          />
        </div>

        <div
          style={{
            fontSize: 32,
            color: '#ede8df',
            lineHeight: 1.55,
            fontStyle: 'italic',
            maxWidth: 960,
            display: 'flex',
          }}
        >
          &ldquo;{truncate(text, 120)}&rdquo;
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {category && (
              <div
                style={{
                  fontSize: 13,
                  color: '#1a1200',
                  background: '#f0c040',
                  borderRadius: 20,
                  padding: '4px 14px',
                  fontFamily: 'system-ui, sans-serif',
                  display: 'flex',
                }}
              >
                {category}
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#f0c040',
              fontFamily: 'system-ui, sans-serif',
              display: 'flex',
            }}
          >
            prayerjar.org
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category, count }: { category: string; count?: string }) {
  const prayCount = count ? parseInt(count, 10) : 0;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#111113',
        fontFamily: 'system-ui, sans-serif',
        justifyContent: 'space-between',
        padding: '56px',
      }}
    >
      <div style={{ display: 'flex' }}>
        <div
          style={{
            fontSize: 13,
            color: '#d4a843',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          Prayer Jar
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 72, color: '#ede8df', fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>
          {category}
        </div>
        {prayCount > 0 && (
          <div style={{ fontSize: 24, color: '#888', display: 'flex' }}>
            {prayCount.toLocaleString()} {prayCount === 1 ? 'prayer' : 'prayers'} waiting
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, color: '#d4a843', display: 'flex' }}>
          Pray with us at prayerjar.org
        </div>
        <div
          style={{
            width: 48,
            height: 3,
            background: '#d4a843',
            display: 'flex',
          }}
        />
      </div>
    </div>
  );
}

function MilestoneCard({ count, stat }: { count?: string; stat?: string }) {
  const num = count ? parseInt(count, 10) : 0;
  const label = stat || 'prayers offered';
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1c1c1e',
        fontFamily: 'system-ui, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: '#d4a843',
          display: 'flex',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: '#d4a843',
            lineHeight: 1,
            letterSpacing: '-4px',
            display: 'flex',
          }}
        >
          {num > 0 ? num.toLocaleString() : '...'}
        </div>
        <div style={{ fontSize: 28, color: '#ede8df', display: 'flex' }}>
          {label}
        </div>
        <div
          style={{
            width: 64,
            height: 3,
            background: '#d4a843',
            opacity: 0.6,
            marginTop: 8,
            display: 'flex',
          }}
        />
        <div style={{ fontSize: 16, color: '#888', marginTop: 8, display: 'flex' }}>
          prayerjar.org
        </div>
      </div>
    </div>
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const { searchParams } = new URL(req.url);

  const text = searchParams.get('text') ?? '';
  const category = searchParams.get('category') ?? undefined;
  const count = searchParams.get('count') ?? undefined;
  const stat = searchParams.get('stat') ?? undefined;

  let element: React.ReactElement;

  switch (type) {
    case 'prayer':
      element = <PrayerCard text={text} category={category} count={count} />;
      break;
    case 'answered':
      element = <AnsweredCard text={text} category={category} />;
      break;
    case 'category':
      element = <CategoryCard category={category ?? 'Prayer'} count={count} />;
      break;
    case 'milestone':
      element = <MilestoneCard count={count} stat={stat} />;
      break;
    default:
      return new Response('Not found', { status: 404 });
  }

  return new ImageResponse(element, { width: W, height: H });
}
