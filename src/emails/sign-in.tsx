import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr, Section, Img,
} from '@react-email/components';

interface SignInEmailProps {
  url: string;
}

export default function SignInEmail({ url }: SignInEmailProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.org';
  const markSrc = `${siteUrl}/email-assets/prayer-jar-mark.png`;
  return (
    <Html>
      <Head />
      <Preview>Your sign-in link for The Prayer Jar</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Georgia, "Times New Roman", serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '0' }}>
          {/* Header */}
          <Section style={{ backgroundColor: '#1c1917', borderRadius: '8px 8px 0 0', padding: '32px 24px', textAlign: 'center' as const }}>
            <Img
              src={markSrc}
              alt=""
              width="36"
              height="36"
              style={{ display: 'inline-block', margin: '0 0 8px 0' }}
            />
            <Heading style={{ fontSize: '22px', color: '#fef3c7', margin: '0', fontWeight: 600 }}>
              The Prayer Jar
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: '#ffffff', padding: '32px 24px', borderRadius: '0 0 8px 8px' }}>
            <Heading style={{ fontSize: '18px', color: '#1c1917', margin: '0 0 12px 0' }}>
              Sign in to your account
            </Heading>
            <Text style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Click the button below to securely sign in. This link expires in 10 minutes and can only be used once.
            </Text>

            <Section style={{ textAlign: 'center' as const }}>
              <Button
                href={url}
                style={{
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  padding: '12px 32px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: 'sans-serif',
                }}
              >
                Sign in to Prayer Jar
              </Button>
            </Section>

            <Hr style={{ borderColor: '#e5e7eb', margin: '28px 0 16px 0' }} />
            <Text style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5', margin: '0' }}>
              If you didn&apos;t request this email, you can safely ignore it.
              Only someone with access to your email can use this link.
            </Text>
          </Section>

          {/* Footer */}
          <Text style={{ textAlign: 'center' as const, fontSize: '11px', color: '#9ca3af', margin: '16px 0 0 0' }}>
            prayerjar.org &mdash; A place to share your heart and intercede for others.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
