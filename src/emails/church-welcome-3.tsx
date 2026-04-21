import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

interface Props {
  churchSlug: string;
}

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://prayerjar.org';

export default function ChurchWelcome3Email({ churchSlug }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Three quick wins before Sunday — your prayer community is almost ready.</Preview>
      <Body style={{ backgroundColor: '#fef9f0', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <Heading style={{ fontSize: '20px', color: '#1c1917' }}>Quick wins before Sunday</Heading>
          <Text style={{ color: '#44403c' }}>
            Your church is set up but not yet active. Five minutes now means your prayer
            community is ready when the congregation walks in.
          </Text>
          <Text style={{ color: '#44403c' }}>Three things to finish:</Text>
          <Text style={{ color: '#44403c', paddingLeft: '16px' }}>
            1. <strong>Add your church logo and colours</strong> — makes the prayer wall feel like home.<br />
            2. <strong>Write a welcome message</strong> — the first thing new members read when they join.<br />
            3. <strong>Share your join link</strong> — paste it in your church group chat before Sunday.
          </Text>
          <Button
            href={`${BASE_URL}/church/${churchSlug}/setup`}
            style={{ backgroundColor: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
          >
            Finish setup
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
