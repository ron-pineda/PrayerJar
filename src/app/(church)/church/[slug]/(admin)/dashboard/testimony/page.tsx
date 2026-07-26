import { notFound } from 'next/navigation';

/**
 * Testimony Approval Queue — hidden since Sprint 27 (pj-s27-02).
 *
 * The queue reads `testimony_approvals`. A write route exists at
 * `POST /api/v1/church/[slug]/testimony`, but no client anywhere in the app calls
 * it, so nothing ever lands in the queue. Structurally the same dead end as
 * Flagged Prayers.
 *
 * This is a hide, not a delete. The page markup is in git at 6109ec6 and
 * `TestimonyActions.tsx` beside this file is untouched. Restore both once a
 * client actually submits testimonies for approval.
 */
export default async function TestimonyQueuePage() {
  notFound();
}
