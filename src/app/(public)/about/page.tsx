import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "About | The Prayer Jar" };

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-10 text-center">
        <span className="text-5xl">🫙</span>
        <h1 className="text-3xl font-bold tracking-tight mt-4 mb-3">About The Prayer Jar</h1>
        <p className="text-muted-foreground leading-relaxed">
          A simple place to bring your prayers and intercede for others.
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Our Mission</h2>
          <p>
            The Prayer Jar exists to connect people through prayer. Whether you're carrying
            something too heavy to carry alone, or you want to intercede for strangers around
            the world — this is a place to do that. Every name is known by God. Every prayer matters.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">How It Works</h2>
          <p>
            Anyone can submit a prayer request — anonymously or with their name. Others in the
            community can pray over each request and leave an encouragement message. When a prayer
            is answered, it becomes a "Light Released" — a testimony of God's faithfulness shared
            with the whole community.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Community Standards</h2>
          <p>
            The Prayer Jar is a faith-based community. All content is moderated to keep this a
            safe, encouraging space. Prayer requests that include harmful, abusive, or off-topic
            content may be removed. We take the safety and dignity of every person seriously.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Built with care</h2>
          <p>
            This app is built and maintained independently, motivated by a belief that technology
            can serve the local and global church. If you have feedback, questions, or want to
            partner with us, we'd love to hear from you.
          </p>
        </section>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
        <Button render={<Link href="/pray" />}>Pray for Someone</Button>
        <Button variant="outline" render={<Link href="/contact" />}>Get in Touch</Button>
      </div>
    </main>
  );
}
