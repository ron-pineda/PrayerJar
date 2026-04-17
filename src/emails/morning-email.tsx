import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr, Section, Row, Column,
} from '@react-email/components';

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

interface MorningEmailProps {
  userName?: string;
  date: string;
  verse: { text: string; reference: string };
  activity: {
    prayersReceived: number;
    encouragements: number;
    streak: number;
  };
  prayers: Array<{
    content: string;
    category: string;
    prayerCount: number;
  }>;
}

export default function MorningEmail({ userName, date, verse, activity, prayers }: MorningEmailProps) {
  const hasActivity = activity.prayersReceived > 0 || activity.encouragements > 0 || activity.streak > 0;

  return (
    <Html>
      <Head />
      <Preview>Your morning verse — {date}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' }}>

          {/* Header */}
          <Section style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '28px 32px 24px' }}>
            <Text style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: '0 0 6px' }}>
              PrayerJar · {date}
            </Text>
            <Heading style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0', lineHeight: '1.2' }}>
              Good morning{userName ? `, ${userName}` : ''}.
            </Heading>
          </Section>

          {/* Verse of the Day */}
          <Section style={{ padding: '24px 32px', backgroundColor: '#faf9ff', borderBottom: '1px solid #ede9fe' }}>
            <Text style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c3aed', margin: '0 0 12px' }}>
              ✦ Verse of the Day
            </Text>
            <Text style={{ fontSize: '17px', lineHeight: '1.65', color: '#1f1535', fontStyle: 'italic', margin: '0 0 10px' }}>
              &ldquo;{verse.text}&rdquo;
            </Text>
            <Text style={{ fontSize: '13px', color: '#6d28d9', fontWeight: '600', margin: '0' }}>
              — {verse.reference}
            </Text>
          </Section>

          {/* Activity (only shown if at least one stat is non-zero) */}
          {hasActivity && (
            <Section style={{ padding: '20px 32px', borderBottom: '1px solid #f3f4f6' }}>
              <Text style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 14px' }}>
                Your Activity Yesterday
              </Text>
              <Row>
                {activity.prayersReceived > 0 && (
                  <Column style={{ flex: '1', backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '12px', textAlign: 'center', marginRight: '8px' }}>
                    <Text style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a', margin: '0 0 4px' }}>
                      {activity.prayersReceived}
                    </Text>
                    <Text style={{ fontSize: '11px', color: '#166534', margin: '0' }}>
                      people prayed for you
                    </Text>
                  </Column>
                )}
                {activity.encouragements > 0 && (
                  <Column style={{ flex: '1', backgroundColor: '#eff6ff', borderRadius: '8px', padding: '12px', textAlign: 'center', marginRight: '8px' }}>
                    <Text style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb', margin: '0 0 4px' }}>
                      {activity.encouragements}
                    </Text>
                    <Text style={{ fontSize: '11px', color: '#1e40af', margin: '0' }}>
                      encouragements received
                    </Text>
                  </Column>
                )}
                {activity.streak > 0 && (
                  <Column style={{ flex: '1', backgroundColor: '#fff7ed', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <Text style={{ fontSize: '24px', fontWeight: '700', color: '#ea580c', margin: '0 0 4px' }}>
                      🔥 {activity.streak}
                    </Text>
                    <Text style={{ fontSize: '11px', color: '#9a3412', margin: '0' }}>
                      day streak
                    </Text>
                  </Column>
                )}
              </Row>
            </Section>
          )}

          {/* Prayers */}
          <Section style={{ padding: '20px 32px 28px' }}>
            <Text style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 14px' }}>
              3 Prayers Waiting for You
            </Text>

            {prayers.map((prayer, i) => {
              const snippet = prayer.content.length > 120 ? prayer.content.slice(0, 120) + '...' : prayer.content;
              const categoryLabel = CATEGORY_LABELS[prayer.category] ?? prayer.category;
              const prayUrl = `https://prayerjar.org/pray/${prayer.category}`;

              return (
                <Section key={i} style={{ marginBottom: '14px', padding: '14px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', borderLeft: '3px solid #4f46e5' }}>
                  <Text style={{ fontSize: '10px', fontWeight: '600', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
                    {categoryLabel}
                  </Text>
                  <Text style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5', margin: '0 0 8px' }}>
                    &ldquo;{snippet}&rdquo;
                  </Text>
                  <Text style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 10px' }}>
                    {prayer.prayerCount === 1 ? '1 person praying' : `${prayer.prayerCount} people praying`}
                  </Text>
                  <Button
                    href={prayUrl}
                    style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}
                  >
                    Pray Now
                  </Button>
                </Section>
              );
            })}

            <Text style={{ textAlign: 'center', margin: '16px 0 0' }}>
              <a href="https://prayerjar.org/browse" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
                Browse all prayers →
              </a>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={{ borderColor: '#f3f4f6', margin: '0' }} />
          <Section style={{ padding: '16px 32px', backgroundColor: '#f9fafb' }}>
            <Text style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', margin: '0' }}>
              You&apos;re receiving this because you have morning emails enabled.{' '}
              <a href="https://prayerjar.org/settings/notifications" style={{ color: '#6b7280' }}>
                Unsubscribe
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
