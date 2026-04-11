import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PrayerDialog } from "@/components/prayer-dialog";

export const metadata: Metadata = { title: "About | The Prayer Jar" };

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-4">About The Prayer Jar</h1>
        <p className="text-muted-foreground leading-relaxed">
          How a 2am moment became a place for everyone carrying something heavy.
        </p>
      </div>

      <div className="space-y-10 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">Why it was built</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              It started at 2am on a Tuesday. Someone was sitting alone in their car outside a
              hospital, their mother on the other side of some glass they couldn&apos;t pass through.
              They wanted prayer — not in the morning, not at a service, not over text to a friend
              they didn&apos;t want to wake. Right then. In that parking lot. In the dark.
            </p>
            <p>
              There was nowhere to go. So they just sat there alone.
            </p>
            <p>
              The Prayer Jar exists because that moment shouldn&apos;t have been so lonely. Prayer
              doesn&apos;t wait for business hours, and neither should a place to ask for it.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">What it is</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              The Prayer Jar is a place to submit a prayer request and have real people pray over
              it — day or night, anywhere in the world. You can share your name or stay completely
              anonymous. No account required to ask for prayer.
            </p>
            <p>
              Every submission is reviewed before it goes live. AI-assisted moderation catches
              harmful content before any human has to read it, and connects anyone in crisis with
              the right resources. What makes it to the feed is real — someone&apos;s real grief,
              real fear, real hope.
            </p>
            <p>
              When a prayer is answered, it becomes a light released — a small testimony shared
              with the community that something shifted, something healed, something turned.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">The mission</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              This is not a religious platform. You don&apos;t need to belong to a church, hold a
              theology degree, or know the right words. The mission is simple: anyone carrying
              something heavy should be able to be seen and prayed for — tonight, if they need it.
            </p>
            <p>
              We believe prayer does something. We believe being witnessed matters. We believe the
              stranger across the world who stops to pray for your mother in the hospital is doing
              something real and good.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">What it is not</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              The Prayer Jar is not a church, and it is not trying to be one. It won&apos;t tell you
              what to believe, push a denomination, or ask you to sign up for anything beyond what
              you came here for.
            </p>
            <p>
              It is not a debate platform. Comments are not a feature here. If you pray for
              someone, you pray — you don&apos;t critique, correct, or counsel unsolicited.
            </p>
            <p>
              We are not selling anything. There are no ads, no data brokers, no premium tiers
              that gate the ability to ask for prayer. This is a tool, not a business model.
            </p>
          </div>
        </section>

        <div className="border-t pt-10">
          <p className="text-sm text-muted-foreground text-center mb-8">
            If something brought you here, you&apos;re welcome to stay. Whatever you&apos;re carrying,
            there are people here who will hold it with you for a moment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PrayerDialog />
            <Button size="lg" variant="outline" render={<Link href="/pray" />}>Pray for Someone</Button>
          </div>
        </div>

      </div>
    </main>
  );
}
