import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

interface Props {
  churchSlug: string;
}

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://prayerjar.org';

export default function ChurchWelcome2Email({ churchSlug }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your prayer wall is ready — the first invite is the hardest part.</Preview>
      <Body style={{ backgroundColor: '#fef9f0', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <Heading style={{ fontSize: '20px', color: '#1c1917' }}>Your prayer wall is waiting</Heading>
          <Text style={{ color: '#44403c' }}>
            Your church is set up, but your prayer wall is still empty. That changes the
            moment your first member joins.
          </Text>
          <Text style={{ color: '#44403c' }}>
            Here is how: copy your join link → share it with your prayer team in a group
            chat or Sunday announcement → members join and start submitting prayers.
          </Text>
          <Text style={{ color: '#44403c' }}>
            The first invite is the hardest part. Everything else follows.
          </Text>
          <Button
            href={`${BASE_URL}/church/${churchSlug}/dashboard/team`}
            style={{ backgroundColor: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
          >
            Share your join link
          </Button>
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
