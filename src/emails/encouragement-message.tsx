import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

interface EncouragementEmailProps {
  message: string;
  senderName: string;
  prayerUrl: string;
}

export default function EncouragementEmail({
  message,
  senderName,
  prayerUrl,
}: EncouragementEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Someone left you an encouragement message</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px' }}>A message for you</Heading>
          <Text style={{ color: '#6b7280' }}>
            {senderName} wrote: &ldquo;{message}&rdquo;
          </Text>
          <Button href={prayerUrl} style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            View your prayer
          </Button>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
            <a href="{unsubscribeUrl}">Unsubscribe</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
