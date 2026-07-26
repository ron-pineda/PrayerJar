import { notFound } from 'next/navigation';

/**
 * Flagged Prayers — hidden since Sprint 27 (pj-s27-02).
 *
 * The queue reads `prayer_flags`, and the only function that writes that table
 * (`flagPrayer` in pastoral.service.ts) has no caller outside its own tests. The
 * queue can therefore never fill: every church that opened this page saw an empty
 * list and no way to change that. Sprint 27 removed the paid tiers, so shipping a
 * feature that cannot work is no longer offset by anything.
 *
 * This is a hide, not a delete. The page markup is in git at 6109ec6 and
 * `FlagActions.tsx` beside this file is untouched. Restore both when pj-s26-10
 * wires up the church-scoped prayer write path.
 */
export default async function FlaggedPrayersPage() {
  notFound();
}
