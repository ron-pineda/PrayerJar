/**
 * Canonical list of third-party sub-processors used by PrayerJar in
 * production. Each entry must correspond to a real dependency or service
 * currently in use (verified against package.json, env config, and
 * imports under `src/`).
 *
 * Update this file (and SUBPROCESSOR_LIST_VERSION below) whenever a
 * sub-processor is added, removed, or materially changed. Enterprise
 * customers are given 30 days' notice of material changes per the DPA.
 */

export interface Subprocessor {
  name: string;
  purpose: string;
  dataCategories: string;
  region: string;
  dpaUrl: string;
}

export const SUBPROCESSOR_LIST_VERSION = "v1.1-2026-04-18";
export const SUBPROCESSOR_LIST_LAST_UPDATED = "2026-04-18";

export const SUBPROCESSORS: Subprocessor[] = [
  {
    name: "Vercel, Inc.",
    purpose:
      "Web application hosting, edge runtime, file/blob storage (Vercel Blob), analytics, and image rendering. Primary platform provider.",
    dataCategories:
      "All application data transits Vercel infrastructure. IP addresses, request metadata, uploaded media, OG images.",
    region: "United States (global edge)",
    dpaUrl: "https://vercel.com/legal/dpa",
  },
  {
    name: "Neon, Inc.",
    purpose:
      "Primary PostgreSQL database (Neon serverless). Stores users, prayers, church records, pastoral notes, and all application data.",
    dataCategories:
      "All personal data stored by PrayerJar including prayer content and pastoral-care content.",
    region: "United States",
    dpaUrl: "https://neon.tech/dpa",
  },
  {
    name: "Resend, Inc.",
    purpose:
      "Transactional email delivery — magic-link sign-in, notifications, digest emails, admin alerts.",
    dataCategories: "Recipient email address, email body (may include prayer-related content).",
    region: "United States",
    dpaUrl: "https://resend.com/legal/dpa",
  },
  {
    name: "Stripe, Inc.",
    purpose:
      "Payment processing for subscriptions and donations. Checkout, invoicing, webhook events.",
    dataCategories:
      "Billing contact, payment method metadata (no card numbers stored by PrayerJar), church/plan identifiers.",
    region: "United States",
    dpaUrl: "https://stripe.com/legal/dpa",
  },
  {
    name: "Vercel AI Gateway",
    purpose:
      "AI request routing used to call downstream model providers (see Anthropic below) for prayer categorization and content moderation.",
    dataCategories:
      "Prayer text and image URLs sent for categorization / moderation. No training use.",
    region: "United States (global edge)",
    dpaUrl: "https://vercel.com/legal/dpa",
  },
  {
    name: "Anthropic, PBC",
    purpose:
      "AI model provider reached via Vercel AI Gateway (claude-haiku-4.5). Used for prayer categorization and content moderation only. Anthropic's zero-retention commitments via the Gateway apply.",
    dataCategories: "Prayer text and image URLs sent for categorization / moderation.",
    region: "United States",
    dpaUrl: "https://www.anthropic.com/legal/dpa",
  },
  {
    name: "Sentry (Functional Software, Inc.)",
    purpose: "Application error and performance monitoring.",
    dataCategories:
      "Error stack traces, scrubbed request context, limited user identifiers. Prayer content is not intentionally logged.",
    region: "United States",
    dpaUrl: "https://sentry.io/legal/dpa/",
  },
  {
    name: "Google LLC — Places API",
    purpose:
      "Church-finder lookup (Google Places) on the public /find-a-church experience.",
    dataCategories:
      "Search queries (e.g., city/zip), approximate device location if provided. No personal account data.",
    region: "United States (global)",
    dpaUrl: "https://cloud.google.com/terms/data-processing-addendum",
  },
  {
    name: "Planning Center Online, Inc.",
    purpose:
      "Optional Church Management Software (ChMS) integration. When a church admin connects PrayerJar to their Planning Center account, PrayerJar reads member rosters and small-group membership over OAuth-scoped API access. Connection is opt-in per church.",
    dataCategories:
      "Inbound from PCO to PrayerJar: member names, primary email addresses, phone numbers (where the church stores them), membership status, small-group membership. Outbound from PrayerJar to PCO: weekly prayer-activity summary written to the person's Notes record (only for churches that enable the push-back feature).",
    region: "United States",
    dpaUrl: "https://www.planningcenter.com/legal/dpa",
  },
  {
    name: "Apple Push Notification service & Google / Firebase Cloud Messaging",
    purpose:
      "Delivery of push notifications to iOS and Android devices via Capacitor push. Device push tokens are sent to the respective platform.",
    dataCategories: "Device push tokens, notification payload (title/body).",
    region: "Global (Apple / Google regions)",
    dpaUrl:
      "https://www.apple.com/legal/privacy/data/en/apple-push-notification-service/",
  },
];
