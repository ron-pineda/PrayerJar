import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr, Section, Row, Column,
} from '@react-email/components';

interface DigestStats {
  newPrayers: number;
  answeredPrayers: number;
  totalInteractions: number;
  newMembers: number;
}

interface TopPrayer {
  content: string;
  prayedCount: number;
  category: string;
}

export interface ChurchDigestEmailProps {
  churchName: string;
  weekOf: string;
  stats: DigestStats;
  flaggedCount: number;
  topPrayers: TopPrayer[];
  digestUrl: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  health: 'Health',
  family: 'Family',
  financial: 'Financial',
  grief: 'Grief',
  gratitude: 'Gratitude',
  guidance: 'Guidance',
  relationships: 'Relationships',
  work_career: 'Work & Career',
  spiritual_growth: 'Spiritual Growth',
  other: 'Other',
};

const statBox = {
  textAlign: 'center' as const,
  padding: '12px 8px',
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
};

export default function ChurchDigestEmail({
  churchName,
  weekOf,
  stats,
  flaggedCount,
  topPrayers,
  digestUrl,
}: ChurchDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Weekly Prayer Digest — {churchName}</Preview>
      <Body style={{ backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '540px', margin: '40px auto', padding: '0', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden' }}>

          {/* Header */}
          <Section style={{ backgroundColor: '#4f46e5', padding: '28px 32px' }}>
            <Heading style={{ color: '#fff', fontSize: '22px', margin: '0 0 4px' }}>
              {churchName}
            </Heading>
            <Text style={{ color: '#c7d2fe', margin: '0', fontSize: '14px' }}>
              Weekly Prayer Digest — {weekOf}
            </Text>
          </Section>

          {/* Stats row */}
          <Section style={{ padding: '24px 32px 16px' }}>
            <Text style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', margin: '0 0 12px' }}>
              This Week at a Glance
            </Text>
            <Row>
              <Column style={{ ...statBox, width: '25%' }}>
                <Text style={{ fontSize: '24px', fontWeight: '700', color: '#4f46e5', margin: '0' }}>
                  {stats.newPrayers}
                </Text>
                <Text style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>
                  New Prayers
                </Text>
              </Column>
              <Column style={{ width: '4%' }} />
              <Column style={{ ...statBox, width: '25%' }}>
                <Text style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', margin: '0' }}>
                  {stats.answeredPrayers}
                </Text>
                <Text style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>
                  Answered
                </Text>
              </Column>
              <Column style={{ width: '4%' }} />
              <Column style={{ ...statBox, width: '25%' }}>
                <Text style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b', margin: '0' }}>
                  {stats.totalInteractions}
                </Text>
                <Text style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>
                  Times Prayed
                </Text>
              </Column>
              <Column style={{ width: '4%' }} />
              <Column style={{ ...statBox, width: '13%' }}>
                <Text style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6', margin: '0' }}>
                  {stats.newMembers}
                </Text>
                <Text style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>
                  New Members
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Flagged alert */}
          {flaggedCount > 0 && (
            <Section style={{ padding: '0 32px 16px' }}>
              <Section style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '6px', padding: '12px 16px' }}>
                <Text style={{ margin: '0', color: '#92400e', fontSize: '14px' }}>
                  ⚠️ <strong>{flaggedCount} {flaggedCount === 1 ? 'prayer needs' : 'prayers need'} your review.</strong>{' '}
                  <a href={`${digestUrl}/flagged`} style={{ color: '#92400e' }}>View flagged prayers →</a>
                </Text>
              </Section>
            </Section>
          )}

          {/* Top prayers */}
          {topPrayers.length > 0 && (
            <Section style={{ padding: '8px 32px 24px' }}>
              <Text style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', margin: '0 0 12px' }}>
                Most Prayed For This Week
              </Text>
              {topPrayers.map((prayer, i) => {
                const snippet = prayer.content.length > 100 ? prayer.content.slice(0, 100) + '…' : prayer.content;
                const categoryLabel = CATEGORY_LABELS[prayer.category] ?? prayer.category;
                return (
                  <Section key={i} style={{ marginBottom: '12px', padding: '14px 16px', backgroundColor: '#f9fafb', borderRadius: '6px', borderLeft: '3px solid #4f46e5' }}>
                    <Text style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4f46e5', margin: '0 0 6px' }}>
                      {categoryLabel}
                    </Text>
                    <Text style={{ color: '#374151', margin: '0 0 6px', lineHeight: '1.5', fontSize: '14px' }}>
                      &ldquo;{snippet}&rdquo;
                    </Text>
                    <Text style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>
                      {prayer.prayedCount === 1 ? '1 person prayed' : `${prayer.prayedCount} people prayed`}
                    </Text>
                  </Section>
                );
              })}
            </Section>
          )}

          {/* Footer */}
          <Section style={{ padding: '0 32px 32px' }}>
            <Button
              href={digestUrl}
              style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontSize: '14px' }}
            >
              View Church Dashboard
            </Button>
          </Section>

          <Hr style={{ margin: '0', borderColor: '#e5e7eb' }} />
          <Section style={{ padding: '16px 32px' }}>
            <Text style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>
              You&apos;re receiving this because you are an admin or pastor of {churchName} on Prayer Jar.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
