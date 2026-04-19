import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PrayerDialog } from "@/components/prayer-dialog";
import { PrayerJar } from "@/components/prayer-jar";
import { ScrollReveal } from "@/components/scroll-reveal";

export const metadata: Metadata = { title: "About | The Prayer Jar" };

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <PrayerJar count={0} size="sm" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">About The Prayer Jar</h1>
        <p className="text-muted-foreground leading-relaxed">
          How a 2am moment became a place for everyone carrying something heavy.
        </p>
      </div>

      <div className="space-y-10 leading-relaxed">

        <ScrollReveal delay={0}>
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">Why it was built</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                It started at 2am on a Tuesday. Someone was sitting alone in their car outside a
                hospital, their mother on the other side of glass they couldn&apos;t pass through.
                They wanted prayer — not in the morning, not at a service, not over text to a friend
                they didn&apos;t want to wake. Right then. In that parking lot. In the dark.
              </p>
              <p>
                There was nowhere to go. So they sat there alone.
              </p>
              <p>
                The Prayer Jar exists because that moment shouldn&apos;t have been so lonely. Prayer
                doesn&apos;t wait for business hours, and neither should a place to ask for it.
              </p>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">What it is</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                The Prayer Jar is a place to submit a prayer request and have real people pray over
                it — day or night, anywhere in the world. You can share your name or stay completely
                anonymous. No account required to ask for prayer.
              </p>
              <p>
                Every submission is reviewed before it goes live. Automated moderation catches
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
        </ScrollReveal>

        <ScrollReveal delay={160}>
          <div className="border-t border-b border-amber-900/20 bg-amber-950/10 py-4 max-w-lg mx-auto px-4 text-center">
            <p className="text-sm italic text-muted-foreground leading-relaxed">
              &ldquo;Bear one another&apos;s burdens, and so fulfill the law of Christ.&rdquo;
            </p>
            <p className="text-xs text-primary mt-2">Galatians 6:2</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={240}>
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">The mission</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                This is not a church, a theology degree, or a set of right words. The mission is
                simple: anyone carrying something heavy should be able to be seen and prayed for —
                tonight, if they need it.
              </p>
              <p>
                We believe prayer does something. We believe being witnessed matters. We believe the
                stranger across the world who stops to pray for your mother in the hospital is doing
                something real and good.
              </p>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={320}>
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">What it is not</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                The Prayer Jar is not a church, and it is not trying to be one. It won&apos;t tell you
                what to believe, push a denomination, or ask you to sign up for anything beyond what
                you came here for.
              </p>
              <p>
                It is not a debate product. Comments are not a feature here. If you pray for
                someone, you pray — you don&apos;t critique, correct, or counsel unsolicited.
              </p>
              <p>
                Prayer is free — always. No ads, no data brokers, no paywall on asking for prayer or
                praying for others. Churches can subscribe for pastoral features like a private
                prayer wall, pastoral notes, and a care dashboard — but the core is free for
                everyone.
              </p>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={400}>
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
        </ScrollReveal>

      </div>
    </main>
  );
}
