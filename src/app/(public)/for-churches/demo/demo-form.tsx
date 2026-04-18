'use client';

import { useRef, useState, useTransition } from 'react';
import { track } from '@vercel/analytics';
import { requestDemo } from './actions';

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL ?? '#';

// ── Dropdown option sets (must match schema enums exactly) ─────────────────

const MEMBER_BUCKETS = ['<50', '50–150', '150–500', '500–2,000', '2,000+'] as const;
const CAMPUS_COUNTS = ['1 (single site)', '2–4', '5–10', '11+'] as const;
const CHMS_OPTIONS = ['Planning Center', 'Breeze', 'ChurchTrac', 'Elvanto', 'Other', 'None'] as const;
const USE_CASES = ['Prayer ministry', 'Small groups', 'Pastoral care', 'All of the above'] as const;
const TIMELINES = ['Ready now', '1–3 months', '3–6 months', 'Just exploring'] as const;

// ── Confirmation step ──────────────────────────────────────────────────────

function ThankYouStep() {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="text-4xl">✓</div>
      <h2 className="text-2xl font-bold tracking-tight">Request received.</h2>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        We&apos;ll be in touch within 24 hours. In the meantime, book a time that works for you:
      </p>

      {CALENDLY_URL !== '#' ? (
        <div className="mt-4">
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Book a demo call
          </a>
          <p className="text-xs text-muted-foreground mt-2">Opens our scheduling calendar</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-4 italic">
          We&apos;ll reach out to schedule your call within one business day.
        </p>
      )}

      <div className="pt-4 border-t border-border/50 text-xs text-muted-foreground space-y-1">
        <p>
          Review our{' '}
          <a href="/legal/dpa" className="underline underline-offset-2 hover:text-foreground">
            Data Processing Agreement
          </a>{' '}
          and{' '}
          <a href="/legal/subprocessors" className="underline underline-offset-2 hover:text-foreground">
            sub-processor list
          </a>{' '}
          while you wait — both are public and require no login.
        </p>
      </div>
    </div>
  );
}

// ── Main form component ────────────────────────────────────────────────────

export function DemoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (submitted) {
    return <ThankYouStep />;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await requestDemo(formData);
      if ('error' in result) {
        setError(result.error);
      } else {
        // Fire the funnel event on successful submit
        track('demo_requested', {
          memberBucket: String(formData.get('memberBucket') ?? ''),
          timeline: String(formData.get('timeline') ?? ''),
        });
        setSubmitted(true);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ── Price anchor + trust signals ── */}
      <div className="rounded-lg border border-amber-900/20 bg-amber-950/10 p-4 space-y-2 text-sm">
        <p className="font-semibold text-foreground">
          Network plans start at $199/mo — we set this up with you, not through a checkout screen.
        </p>
        <ul className="text-muted-foreground space-y-1 text-xs">
          <li>
            Data Processing Agreement available at{' '}
            <a href="/legal/dpa" className="underline underline-offset-2 hover:text-foreground">
              /legal/dpa
            </a>
          </li>
          <li>
            Sub-processor list published at{' '}
            <a href="/legal/subprocessors" className="underline underline-offset-2 hover:text-foreground">
              /legal/subprocessors
            </a>
          </li>
          <li>No shared-wall data. Your congregation&apos;s prayers stay in your church.</li>
        </ul>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Field 1: Church / organization name ── */}
      <div className="space-y-1.5">
        <label htmlFor="churchName" className="text-sm font-medium">
          Church / organization name <span className="text-destructive">*</span>
        </label>
        <input
          id="churchName"
          name="churchName"
          type="text"
          required
          maxLength={200}
          placeholder="Grace Community Church"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      {/* ── Field 2: Denomination or network affiliation ── */}
      <div className="space-y-1.5">
        <label htmlFor="denomination" className="text-sm font-medium">
          Denomination or network affiliation{' '}
          <span className="text-xs text-muted-foreground font-normal">(optional — leave blank if independent)</span>
        </label>
        <input
          id="denomination"
          name="denomination"
          type="text"
          maxLength={200}
          placeholder="e.g. Southern Baptist Convention"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      {/* ── Field 3: Primary location ── */}
      <div className="space-y-1.5">
        <label htmlFor="cityState" className="text-sm font-medium">
          Primary location (City, State) <span className="text-destructive">*</span>
        </label>
        <input
          id="cityState"
          name="cityState"
          type="text"
          required
          maxLength={200}
          placeholder="Austin, TX"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      {/* ── Field 4: Church website ── */}
      <div className="space-y-1.5">
        <label htmlFor="website" className="text-sm font-medium">
          Church website <span className="text-destructive">*</span>
        </label>
        <input
          id="website"
          name="website"
          type="url"
          required
          maxLength={500}
          placeholder="https://yourchurch.org"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      {/* ── Fields 5 & 6: Member count + campuses (side by side on larger screens) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Field 5: Total members */}
        <div className="space-y-1.5">
          <label htmlFor="memberBucket" className="text-sm font-medium">
            Total members (approximate) <span className="text-destructive">*</span>
          </label>
          <select
            id="memberBucket"
            name="memberBucket"
            required
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="" disabled>Select a range</option>
            {MEMBER_BUCKETS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Field 6: Number of campuses */}
        <div className="space-y-1.5">
          <label htmlFor="campusCount" className="text-sm font-medium">
            Number of campuses <span className="text-destructive">*</span>
          </label>
          <select
            id="campusCount"
            name="campusCount"
            required
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="" disabled>Select</option>
            {CAMPUS_COUNTS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Field 7: Current ChMS ── */}
      <div className="space-y-1.5">
        <label htmlFor="chms" className="text-sm font-medium">
          Current ChMS in use <span className="text-destructive">*</span>
        </label>
        <select
          id="chms"
          name="chms"
          required
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="" disabled>Select your ChMS</option>
          {CHMS_OPTIONS.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* ── Field 8: Primary use case ── */}
      <div className="space-y-1.5">
        <label htmlFor="useCase" className="text-sm font-medium">
          Primary use case <span className="text-destructive">*</span>
        </label>
        <select
          id="useCase"
          name="useCase"
          required
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="" disabled>Select the primary use case</option>
          {USE_CASES.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* ── Field 9: Timeline ── */}
      <div className="space-y-1.5">
        <label htmlFor="timeline" className="text-sm font-medium">
          Timeline to get started <span className="text-destructive">*</span>
        </label>
        <select
          id="timeline"
          name="timeline"
          required
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="" disabled>Select a timeline</option>
          {TIMELINES.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* ── Field 10: Contact details ── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">
          Contact details <span className="text-destructive">*</span>
        </legend>

        <div className="space-y-1.5">
          <label htmlFor="contactName" className="text-sm text-muted-foreground">
            Full name <span className="text-destructive">*</span>
          </label>
          <input
            id="contactName"
            name="contactName"
            type="text"
            required
            maxLength={200}
            placeholder="Pastor Jane Smith"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contactEmail" className="text-sm text-muted-foreground">
            Email address <span className="text-destructive">*</span>
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            required
            maxLength={320}
            placeholder="jane@yourchurch.org"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contactPhone" className="text-sm text-muted-foreground">
            Phone number{' '}
            <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            maxLength={50}
            placeholder="+1 (555) 000-0000"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>
      </fieldset>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Sending…' : 'Request a demo'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        No contract, no commitment. We&apos;ll reach out within one business day.
      </p>
    </form>
  );
}
