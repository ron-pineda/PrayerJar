import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

interface PrayerFollowupEmailProps {
  prayerContent: string;
  prayCount: number;
  category: string;
  prayerId: string;
}

export default function PrayerFollowupEmail({
  prayerContent,
  prayCount,
  category: _category,
  prayerId: _prayerId,
}: PrayerFollowupEmailProps) {
  const snippet = prayerContent.length > 150
    ? prayerContent.slice(0, 150) + '...'
    : prayerContent;

  const prayerLabel = prayCount === 1
    ? '1 person has prayed for you'
    : `${prayCount} people have prayed for you`;

  return (
    <Html>
      <Head />
      <Preview>You submitted a prayer 3 days ago. People have been praying.</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px' }}>
            How&apos;s your prayer going?
          </Heading>
          <Text style={{ color: '#374151' }}>
            You submitted a prayer 3 days ago. People have been praying.
          </Text>
          <Text style={{ color: '#6b7280', fontStyle: 'italic', borderLeft: '3px solid #e5e7eb', paddingLeft: '12px', margin: '16px 0' }}>
            &ldquo;{snippet}&rdquo;
          </Text>
          <Text style={{ color: '#374151' }}>
            {prayerLabel}. That is not nothing &mdash; those are real people who paused their day
            and brought your need before God.
          </Text>
          <Text style={{ color: '#6b7280' }}>
            Waiting is hard. We know. Whether you are still holding on or you have seen God move,
            we would love to hear how things are going.
          </Text>
          <Button
            href="https://prayerjar.org/my-prayers"
            style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px', marginRight: '12px' }}
          >
            It was answered! Share the story
          </Button>
          <Button
            href="https://prayerjar.org/my-prayers"
            style={{ backgroundColor: '#fff', color: '#4f46e5', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px', border: '1px solid #4f46e5' }}
          >
            Still waiting &mdash; renew my prayer
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
