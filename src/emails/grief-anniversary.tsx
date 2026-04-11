import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr, Section,
} from '@react-email/components';

interface GriefAnniversaryEmailProps {
  userName?: string;
  label: string;
  prayerId?: string | null;
}

export default function GriefAnniversaryEmail({ userName, label, prayerId }: GriefAnniversaryEmailProps) {
  const greeting = userName ? `Dear ${userName}` : 'Dear friend';
  const prayerUrl = prayerId
    ? `https://prayerjar.org/p/${prayerId}`
    : 'https://prayerjar.org/my-prayers';

  return (
    <Html>
      <Head />
      <Preview>Remembering {label} with you today.</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px', marginBottom: '8px', color: '#374151' }}>
            Remembering {label} with you
          </Heading>

          <Text style={{ color: '#374151', lineHeight: '1.6' }}>
            {greeting},
          </Text>

          <Text style={{ color: '#374151', lineHeight: '1.6' }}>
            Today is an anniversary — and we wanted you to know that you are not alone in it.
            Grief doesn&apos;t follow a schedule, and some days still carry weight that surprises us.
            Whatever today feels like for you, that is okay.
          </Text>

          <Section style={{ margin: '20px 0', padding: '16px', backgroundColor: '#fdf4ff', borderRadius: '6px', borderLeft: '3px solid #a855f7' }}>
            <Text style={{ color: '#7c3aed', fontStyle: 'italic', margin: '0', lineHeight: '1.6' }}>
              &ldquo;The Lord is close to the brokenhearted and saves those who are crushed in spirit.&rdquo;
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: '12px', margin: '8px 0 0', fontWeight: '600' }}>
              — Psalm 34:18
            </Text>
          </Section>

          <Text style={{ color: '#6b7280', lineHeight: '1.6' }}>
            He is near. And so are the people who have been praying alongside you.
          </Text>

          {prayerId && (
            <Button
              href={prayerUrl}
              style={{ backgroundColor: '#7c3aed', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
            >
              Visit your prayer
            </Button>
          )}

          <Hr style={{ margin: '24px 0' }} />
          <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
            You received this because you added a remembrance date on Prayer Jar.{' '}
            <a href="https://prayerjar.org/settings/notifications">Manage notifications</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
