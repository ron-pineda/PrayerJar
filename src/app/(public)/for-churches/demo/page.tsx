import type { Metadata } from 'next';
import Link from 'next/link';
import { DemoForm } from './demo-form';

export const metadata: Metadata = {
  title: 'Request a Network Demo — PrayerJar',
  description:
    'Request a personalized demo of PrayerJar Network for large churches, multi-site ministries, and denominational networks. Starting at $199/mo.',
};

export default function EnterpriseDemoPage() {
  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground mb-8">
          <Link href="/for-churches" className="hover:text-foreground transition-colors">
            For Churches
          </Link>
          <span className="mx-2">/</span>
          <span>Network Demo</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            PrayerJar Network
          </p>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Let&apos;s build this together.
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Network is for large churches, multi-site ministries, and denominational networks.
            Tell us about your church and we&apos;ll schedule a call tailored to what you actually need —
            not a canned demo.
          </p>
        </div>

        {/* Form */}
        <DemoForm />
      </div>
    </main>
  );
}
