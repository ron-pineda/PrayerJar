import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr, Section,
} from '@react-email/components';

interface DailyBriefPrayer {
  content: string;
  category: string;
  prayCount: number;
}

interface DailyBriefEmailProps {
  prayers: DailyBriefPrayer[];
  userName?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  health: 'Health',
  family: 'Family',
  financial: 'Financial',
  grief: 'Grief',
  gratitude: 'Gratitude',
  guidance: 'Guidance',
  relationships: 'Relationships',
  work_career: 'Work & Career',
  spiritual_growth: 'Spiritual Growth',
  other: 'Other',
};

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function DailyBriefEmail({ prayers, userName }: DailyBriefEmailProps) {
  const dateStr = formatDate();

  return (
    <Html>
      <Head />
      <Preview>Your morning prayers — {dateStr}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px', marginBottom: '4px' }}>
            Good morning{userName ? `, ${userName}` : ''}. Here are 3 prayers waiting for you.
          </Heading>
          <Text style={{ color: '#6b7280', marginTop: '0', marginBottom: '24px' }}>{dateStr}</Text>

          {prayers.map((prayer, i) => {
            const snippet = prayer.content.length > 100 ? prayer.content.slice(0, 100) + '...' : prayer.content;
            const categoryLabel = CATEGORY_LABELS[prayer.category] ?? prayer.category;
            const prayUrl = `https://prayerjar.org/pray/${prayer.category}`;

            return (
              <Section key={i} style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px', borderLeft: '3px solid #4f46e5' }}>
                <Text style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4f46e5', margin: '0 0 8px' }}>
                  {categoryLabel}
                </Text>
                <Text style={{ color: '#374151', margin: '0 0 8px', lineHeight: '1.5' }}>
                  &ldquo;{snippet}&rdquo;
                </Text>
                <Text style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 12px' }}>
                  {prayer.prayCount === 1 ? '1 person praying' : `${prayer.prayCount} people praying`}
                </Text>
                <Button href={prayUrl} style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontSize: '13px' }}>
                  Pray Now
                </Button>
              </Section>
            );
          })}

          <Hr />
          <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
            You&apos;re receiving this because you have daily prayer briefs enabled.{' '}
            <a href="https://prayerjar.org/settings/notifications">Unsubscribe</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
