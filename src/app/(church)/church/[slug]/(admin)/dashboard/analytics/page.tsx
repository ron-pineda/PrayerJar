import { notFound } from 'next/navigation';

/**
 * Church Analytics — hidden since Sprint 27 (pj-s27-02).
 *
 * Four of the five charts (Prayer Trend, Interaction Trend, Category Breakdown,
 * Answered Rate) filter on `prayers.church_id`, a column the schema declares and
 * nothing writes. They render permanent zeroes. Only Member Growth is real, and
 * one live chart does not carry a page of four flat lines — a zeroed chart reads
 * as "your congregation isn't praying", which is a false statement about a church.
 *
 * This is a hide, not a delete. The page markup is in git at 6109ec6 and
 * `AnalyticsCharts.tsx` / `AnalyticsChartsLazy.tsx` beside this file are
 * untouched. Restore all of it when pj-s26-10 writes `prayers.church_id`.
 */
export default async function ChurchAnalyticsPage() {
  notFound();
}
