import type { Metadata } from "next";
import Link from "next/link";
import {
  SUBPROCESSORS,
  SUBPROCESSOR_LIST_LAST_UPDATED,
  SUBPROCESSOR_LIST_VERSION,
} from "./data";

export const metadata: Metadata = {
  title: "Sub-processors | The Prayer Jar",
  description:
    "List of third-party sub-processors used by PrayerJar to operate the service.",
};

export default function SubprocessorsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Sub-processors</h1>
      <p className="text-sm text-muted-foreground mb-2">
        Last updated: {SUBPROCESSOR_LIST_LAST_UPDATED} (version{" "}
        {SUBPROCESSOR_LIST_VERSION})
      </p>

      <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 mb-8">
        <strong>Draft notice.</strong> This page is an AI-drafted starting
        point. PrayerJar is not a law firm. Consult qualified counsel before
        relying on this list for a signed customer commitment.
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground mb-10">
        <p>
          PrayerJar uses the third-party services ("sub-processors") below to
          operate the platform. Each sub-processor is engaged under terms no
          less protective than those in our{" "}
          <Link
            href="/legal/dpa"
            className="text-primary underline underline-offset-4"
          >
            Data Processing Addendum
          </Link>
          .
        </p>
        <p>
          We give enterprise customers 30 days' notice before adding a new
          sub-processor that processes their data. To be notified, email{" "}
          <a
            href="mailto:legal@prayerjar.org"
            className="text-primary underline underline-offset-4"
          >
            legal@prayerjar.org
          </a>
          .
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-foreground">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Processor</th>
              <th className="text-left font-semibold px-4 py-3">Purpose</th>
              <th className="text-left font-semibold px-4 py-3">
                Data categories
              </th>
              <th className="text-left font-semibold px-4 py-3">Region</th>
              <th className="text-left font-semibold px-4 py-3">DPA</th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((p) => (
              <tr key={p.name} className="border-t align-top">
                <td className="px-4 py-3 font-medium text-foreground">
                  {p.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.purpose}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.dataCategories}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.region}</td>
                <td className="px-4 py-3">
                  <a
                    href={p.dpaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-12 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground mb-2">
          Questions
        </h2>
        <p>
          Email{" "}
          <a
            href="mailto:legal@prayerjar.org"
            className="text-primary underline underline-offset-4"
          >
            legal@prayerjar.org
          </a>{" "}
          with any data-processing question, or read our{" "}
          <Link
            href="/legal/dpa"
            className="text-primary underline underline-offset-4"
          >
            Data Processing Addendum
          </Link>
          ,{" "}
          <Link
            href="/privacy"
            className="text-primary underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          , and{" "}
          <Link
            href="/terms"
            className="text-primary underline underline-offset-4"
          >
            Terms of Service
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
