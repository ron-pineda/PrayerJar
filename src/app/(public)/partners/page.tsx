import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Partner with PrayerJar | The Prayer Jar" };

export default function PartnersPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Partner with PrayerJar</h1>
        <p className="text-muted-foreground leading-relaxed">
          Join us in building the world&apos;s most caring prayer network
        </p>
      </div>

      <div className="space-y-10">

        <section className="border rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">Church Partners</h2>
            <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full shrink-0">
              Free to start
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bring PrayerJar to your congregation. Custom prayer wall, pastoral tools, and live
            event features.
          </p>
          <Button size="lg" render={<Link href="/church/create" />}>
            Start a Church Account
          </Button>
        </section>

        <section className="border rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">Ministry Partners</h2>
            <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full shrink-0">
              API access available
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Integrate prayer into your ministry&apos;s workflow. Embed our prayer widget, access
            our API, and connect your community.
          </p>
          <Button size="lg" variant="outline" render={<Link href="/api/v2" />}>
            Learn About Integration
          </Button>
        </section>

        <section className="border rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">Mental Health Partners</h2>
            <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full shrink-0">
              Mission-driven
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Partner with us to connect people in crisis with professional resources. We&apos;re
            building something that matters.
          </p>
          <Button size="lg" variant="outline" render={<Link href="/contact" />}>
            Get in Touch
          </Button>
        </section>

        <div className="border-t pt-10 space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Already a church?{" "}
            <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
              Sign in to your account
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            General inquiries:{" "}
            <a
              href="mailto:partners@prayerjar.org"
              className="text-primary underline-offset-4 hover:underline"
            >
              partners@prayerjar.org
            </a>
          </p>
        </div>

      </div>
    </main>
  );
}
