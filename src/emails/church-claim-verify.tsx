import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr
} from "@react-email/components";

interface ChurchClaimVerifyEmailProps {
  claimerName: string;
  role: string;
  verifyUrl: string;
}

export function ChurchClaimVerifyEmail({
  claimerName,
  role,
  verifyUrl,
}: ChurchClaimVerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your church listing on The Prayer Jar</Preview>
      <Body style={{ backgroundColor: "#f8fafc", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
          <Heading style={{ color: "#0f172a", fontSize: 22 }}>
            Verify Your Church Listing
          </Heading>
          <Text style={{ color: "#475569" }}>
            Hi {claimerName},
          </Text>
          <Text style={{ color: "#475569" }}>
            You requested to claim a church listing as <strong>{role}</strong>.
            Click the button below to verify your email and complete the claim.
          </Text>
          <Button
            href={verifyUrl}
            style={{
              backgroundColor: "#10b981",
              color: "white",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              display: "inline-block",
              marginTop: 16,
            }}
          >
            Verify &amp; Claim Listing
          </Button>
          <Hr style={{ margin: "24px 0", borderColor: "#e2e8f0" }} />
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>
            This link expires in 48 hours. If you didn&apos;t request this, you can
            safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
