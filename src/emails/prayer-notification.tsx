import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

interface PrayerNotificationEmailProps {
  prayerCount: number;
  prayerSnippet: string;
  prayerUrl: string;
}

export default function PrayerNotificationEmail({
  prayerCount,
  prayerSnippet,
  prayerUrl,
}: PrayerNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {prayerCount === 1
          ? 'Someone prayed for your request'
          : `${prayerCount} people prayed for your request`}
      </Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px' }}>
            {prayerCount === 1 ? 'Someone prayed for you' : `${prayerCount} people prayed for you`}
          </Heading>
          <Text style={{ color: '#6b7280' }}>Your request: &ldquo;{prayerSnippet}&rdquo;</Text>
          <Button href={prayerUrl} style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            View your prayer
          </Button>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
            You received this because you have an account on Prayer Jar.
            <a href="{unsubscribeUrl}"> Unsubscribe</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
