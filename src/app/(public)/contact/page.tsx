import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact | The Prayer Jar" };

export default function ContactPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <span className="text-5xl">✉️</span>
      <h1 className="text-3xl font-bold tracking-tight mt-4 mb-3">Get in Touch</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Have a question, feedback, or want to partner with us? We'd love to hear from you.
      </p>
      <a
        href="mailto:hello@prayerjar.org"
        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        hello@prayerjar.org
      </a>
      <p className="text-xs text-muted-foreground mt-8">
        For prayer-related support, please use the app directly.
        For data deletion requests, see our{" "}
        <a href="/privacy" className="underline underline-offset-4">Privacy Policy</a>.
      </p>
    </main>
  );
}
