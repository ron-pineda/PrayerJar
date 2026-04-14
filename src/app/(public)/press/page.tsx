import type { Metadata } from "next";
import { db } from "@/db";
import { prayers, users } from "@/db/schema";
import { sql } from "drizzle-orm";

export const metadata: Metadata = { title: "Press Kit | The Prayer Jar" };

async function getPressStats() {
  const [prayerCountRow, countriesRow, userCountRow] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(prayers).then((r) => Number(r[0]?.count ?? 0)),
    db
      .select({ count: sql<number>`count(distinct ${prayers.country})` })
      .from(prayers)
      .where(sql`${prayers.country} is not null`)
      .then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(users).then((r) => Number(r[0]?.count ?? 0)),
  ]);

  return { prayerCount: prayerCountRow, countries: countriesRow, userCount: userCountRow };
}

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K+`;
  return String(n);
}

export default async function PressPage() {
  const stats = await getPressStats();

  const keyStats = [
    { stat: stats.countries > 0 ? `${stats.countries}+` : '50+', label: 'Countries' },
    { stat: stats.prayerCount > 0 ? formatStat(stats.prayerCount) : '10,000+', label: 'Prayers submitted' },
    { stat: '24/7', label: 'Availability' },
    { stat: 'Free', label: 'For everyone' },
  ];

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Press Kit</h1>
        <p className="text-muted-foreground leading-relaxed">
          Everything you need to write about PrayerJar
        </p>
      </div>

      <div className="space-y-10 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">About PrayerJar</h2>
          <p className="text-sm text-muted-foreground">
            PrayerJar is a community prayer platform where people submit anonymous or named prayer
            requests, and anyone can pray for them. Built for the moment you need prayer right now
            — 24/7, no church membership required. Trusted by people across the globe.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">Key Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {keyStats.map(({ stat, label }) => (
              <div
                key={label}
                className="border rounded-xl p-4 text-center space-y-1"
              >
                <p className="text-2xl font-bold tracking-tight">{stat}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">Brand Assets</h2>
          <div className="rounded-xl border bg-muted/30 p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Official brand assets (logos, color guide, screenshots) are being prepared.
            </p>
            <p className="text-sm">
              Need assets now?{" "}
              <a
                href="mailto:press@prayerjar.org"
                className="text-primary underline underline-offset-4"
              >
                Email our press team
              </a>{" "}
              and we&apos;ll send them directly.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">Press Contact</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <a
                href="mailto:press@prayerjar.org"
                className="text-primary underline-offset-4 hover:underline"
              >
                press@prayerjar.org
              </a>
            </p>
            <p>For urgent media inquiries, we respond within 24 hours.</p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">Recent Coverage</h2>
          <div className="border rounded-xl p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No press coverage listed yet. Be the first to write about us.
            </p>
            <p className="text-sm">
              <a
                href="mailto:press@prayerjar.org"
                className="text-primary underline-offset-4 hover:underline"
              >
                Contact our press team
              </a>
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
