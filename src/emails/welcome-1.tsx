import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

export default function Welcome1Email() {
  return (
    <Html>
      <Head />
      <Preview>Welcome to PrayerJar — you are not praying alone.</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px' }}>Welcome to PrayerJar</Heading>
          <Text style={{ color: '#374151' }}>
            You are now part of a community of people who pray for each other every day.
          </Text>
          <Text style={{ color: '#6b7280' }}>
            Here is how it works: submit a prayer and others will stand with you. Pray for
            someone else and let them know they are not alone. Come back to mark your prayer
            answered when God moves.
          </Text>
          <Button
            href="https://prayerjar.org/pray"
            style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
          >
            Pray for Someone Now
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
