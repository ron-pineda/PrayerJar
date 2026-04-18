// Server-side analytics helpers — safe to import from server actions and route handlers.
// Uses @vercel/analytics/server which does NOT require a browser context.
// Spec: docs/analytics/church-funnel-spec.md v1.0 (Sprint 17); ChMS events added Sprint 18
//
// NOTE: Do NOT import this file from any 'use client' component.

import { track } from '@vercel/analytics/server';

/**
 * Fires when a church account is successfully created (church record written
 * to DB). Call from the API route / server action that performs the insert.
 */
export async function trackSignupComplete(props: {
  user_id: string;
  signup_method: string;
  plan_at_signup: string;
  church_size_bucket: string;
}) {
  await track('signup_complete', props).catch((err) =>
    console.error('[analytics] signup_complete failed:', err),
  );
}

/**
 * Fires when a church's Stripe subscription becomes active for the first time
 * (checkout.session.completed with type=subscription). Server-side only.
 */
export async function trackPlanActivated(props: {
  user_id: string;
  church_id: string;
  plan: string;
  billing_interval: string;
  stripe_subscription_id: string;
}) {
  await track('plan_activated', props).catch((err) =>
    console.error('[analytics] plan_activated failed:', err),
  );
}

/**
 * Fires when a church upgrades to a higher tier (customer.subscription.updated
 * where newTier > previousTier). Server-side only.
 */
export async function trackPlanUpgraded(props: {
  user_id: string;
  church_id: string;
  from_plan: string;
  to_plan: string;
  billing_interval: string;
  days_since_activation: number;
  stripe_subscription_id: string;
}) {
  await track('plan_upgraded', props).catch((err) =>
    console.error('[analytics] plan_upgraded failed:', err),
  );
}

/**
 * Fires after the enterprise demo lead is successfully persisted to
 * church_enterprise_leads. Call from /for-churches/demo/actions.ts.
 * TODO(pj-s17-enterprise-demo-ui): wire this from the demo server action
 * once that action is implemented.
 */
export async function trackDemoRequested(props: {
  church_size_bucket: string;
  has_calendly_booked: boolean;
  referrer_plan: string | null;
  source_utm: string | null;
}) {
  await track('demo_requested', props).catch((err) =>
    console.error('[analytics] demo_requested failed:', err),
  );
}

// --- ChMS Integration Events (Sprint 18 — pj-s18-12) ---

/**
 * Fires when a pastor initiates a ChMS connection (after auth + role check
 * pass, before the OAuth provider redirect). Call from the connect route.
 */
export async function trackChmsConnectionStarted(props: {
  church_id: string;
  provider: string;
  user_id: string;
}) {
  await track('chms_connection_started', props).catch((err) =>
    console.error('[analytics] chms_connection_started failed:', err),
  );
}

/**
 * Fires when the OAuth callback succeeds and tokens are stored in the DB.
 * sync_job_queued is always true — exchangeCodeForTokens inserts a full_sync job.
 */
export async function trackChmsConnectionCompleted(props: {
  church_id: string;
  provider: string;
  user_id: string;
  sync_job_queued: boolean;
}) {
  await track('chms_connection_completed', props).catch((err) =>
    console.error('[analytics] chms_connection_completed failed:', err),
  );
}

/**
 * Fires when a ChMS sync job is marked dead in the cron runner (auth error,
 * permanent error, or max retries exhausted).
 */
export async function trackChmsSyncFailed(props: {
  church_id: string;
  provider: string;
  job_type: string;
  error_class: 'transient' | 'auth' | 'permanent';
  attempt: number;
}) {
  await track('chms_sync_failed', props).catch((err) =>
    console.error('[analytics] chms_sync_failed failed:', err),
  );
}
