import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

export default function Welcome2Email() {
  return (
    <Html>
      <Head />
      <Preview>Someone may need your prayer today.</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px' }}>Someone may need your prayer today</Heading>
          <Text style={{ color: '#374151' }}>
            Right now there are people who submitted prayers and are waiting for someone to stand
            with them. They do not know who will show up — but you could be that person.
          </Text>
          <Text style={{ color: '#6b7280' }}>
            Even 30 seconds of prayer matters. You do not need the right words. Just show up.
          </Text>
          <Button
            href="https://prayerjar.org/pray"
            style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
          >
            See Today&apos;s Prayers
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
