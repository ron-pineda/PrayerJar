import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

interface Props {
  churchSlug: string;
  adminName?: string;
}

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://prayerjar.org';

export default function ChurchWelcome1Email({ churchSlug, adminName }: Props) {
  const greeting = adminName ? `Hi ${adminName},` : 'Hi,';
  return (
    <Html>
      <Head />
      <Preview>Your church is live on PrayerJar — share your join link to get started.</Preview>
      <Body style={{ backgroundColor: '#fef9f0', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <Heading style={{ fontSize: '20px', color: '#1c1917' }}>Your church is live on PrayerJar</Heading>
          <Text style={{ color: '#44403c' }}>{greeting}</Text>
          <Text style={{ color: '#44403c' }}>
            Your church is set up and ready. The next step is simple: share your join link
            with your prayer team. When they join, your prayer wall comes alive.
          </Text>
          <Button
            href={`${BASE_URL}/church/${churchSlug}/dashboard/team`}
            style={{ backgroundColor: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
          >
            Get your join link
          </Button>
          <Text style={{ color: '#78716c', marginTop: '16px' }}>
            Want to finish your setup first?{' '}
            <a href={`${BASE_URL}/church/${churchSlug}/setup`} style={{ color: '#d97706' }}>
              Complete setup in 5 minutes
            </a>
          </Text>
          <Hr style={{ borderColor: '#fde68a', marginTop: '24px' }} />
          <Text style={{ fontSize: '12px', color: '#a8a29e' }}>
            You received this because you created a church on PrayerJar.{' '}
            <a href="{unsubscribeUrl}" style={{ color: '#a8a29e' }}>Unsubscribe</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
