import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr, Section,
} from '@react-email/components';

interface IntercessorThanksEmailProps {
  userName?: string;
  prayerCount: number;
}

export default function IntercessorThanksEmail({ userName, prayerCount }: IntercessorThanksEmailProps) {
  const greeting = userName ? `Dear ${userName}` : 'Dear friend';
  const prayerLabel = prayerCount === 1 ? '1 prayer' : `${prayerCount} prayers`;

  return (
    <Html>
      <Head />
      <Preview>Thank you for interceding — your prayers are making a difference.</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px', marginBottom: '8px' }}>
            Thank you for interceding 🙏
          </Heading>

          <Text style={{ color: '#374151', lineHeight: '1.6' }}>
            {greeting},
          </Text>

          <Text style={{ color: '#374151', lineHeight: '1.6' }}>
            This week you have stood in the gap for others — praying through {prayerLabel} on Prayer Jar.
            That is not a small thing. You gave someone else&apos;s burden your time, your attention, and your faith.
          </Text>

          <Section style={{ margin: '20px 0', padding: '16px', backgroundColor: '#f5f3ff', borderRadius: '6px', borderLeft: '3px solid #4f46e5' }}>
            <Text style={{ color: '#4f46e5', fontStyle: 'italic', margin: '0', lineHeight: '1.6' }}>
              &ldquo;He saw that there was no one, he was appalled that there was no one to intervene.&rdquo;
            </Text>
            <Text style={{ color: '#6b7280', fontSize: '12px', margin: '8px 0 0', fontWeight: '600' }}>
              — Isaiah 59:16
            </Text>
          </Section>

          <Text style={{ color: '#374151', lineHeight: '1.6' }}>
            God noticed that there was no one to intercede — and He was moved. You are that someone
            for the people on Prayer Jar. Thank you for showing up.
          </Text>

          <Button
            href="https://prayerjar.org"
            style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
          >
            Keep praying
          </Button>

          <Hr style={{ margin: '24px 0' }} />
          <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
            You received this because you have been active on Prayer Jar this week.{' '}
            <a href="https://prayerjar.org/settings/notifications">Manage notifications</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
