import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

interface BadgeEmailProps {
  badgeName: string;
  badgeDescription: string;
  profileUrl: string;
}

export default function BadgeEarnedEmail({ badgeName, badgeDescription, profileUrl }: BadgeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You earned the {badgeName} badge!</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px' }}>New badge earned!</Heading>
          <Text>You earned: <strong>{badgeName}</strong></Text>
          <Text style={{ color: '#6b7280' }}>{badgeDescription}</Text>
          <Button href={profileUrl} style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            View your badges
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
