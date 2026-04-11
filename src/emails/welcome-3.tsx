import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

export default function Welcome3Email() {
  return (
    <Html>
      <Head />
      <Preview>How is your prayer going?</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px' }}>How is your prayer going?</Heading>
          <Text style={{ color: '#374151' }}>
            It has been a few days since you joined PrayerJar. Just checking in.
          </Text>
          <Text style={{ color: '#6b7280' }}>
            If you submitted a prayer — have you seen any movement? You can mark it answered
            right from your profile, and your testimony will encourage others.
          </Text>
          <Text style={{ color: '#6b7280' }}>
            Did you know you earn badges for praying consistently? The more you show up for
            others, the more the community grows around you.
          </Text>
          <Button
            href="https://prayerjar.org"
            style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
          >
            Visit PrayerJar
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
