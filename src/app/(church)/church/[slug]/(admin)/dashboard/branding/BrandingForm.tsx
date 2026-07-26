'use client';

import { useState } from 'react';

interface BrandingFormProps {
  churchSlug: string;
  initialLogoUrl: string | null;
  initialPrimaryColor: string;
  initialSubdomain: string | null;
  /** Whether the church's current plan grants access to custom subdomains. */
  canClaimSubdomain: boolean;
}

const SUBDOMAIN_REGEX = /^[a-z0-9-]{1,32}$/;

export default function BrandingForm({
  churchSlug,
  initialLogoUrl,
  initialPrimaryColor,
  initialSubdomain,
  canClaimSubdomain,
}: BrandingFormProps) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor);
  const [subdomain, setSubdomain] = useState(initialSubdomain ?? '');
  const [subdomainError, setSubdomainError] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleSubdomainChange(val: string) {
    setSubdomain(val);
    if (val && !SUBDOMAIN_REGEX.test(val)) {
      setSubdomainError(
        'Subdomain must be 1–32 characters: lowercase letters, numbers, and hyphens only.',
      );
    } else {
      setSubdomainError('');
    }
  }

  async function handleSave() {
    if (subdomainError) return;

    setStatus('saving');
    setErrorMsg('');

    try {
      const body: Record<string, string | null> = {
        primaryColor,
      };

      // Send logoUrl — empty string means "clear it"
      body.logoUrl = logoUrl.trim() || null;
      body.subdomain = subdomain.trim() || null;

      const res = await fetch(`/api/v1/church/${churchSlug}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to save');
      }

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Logo URL */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="logoUrl" className="text-sm font-medium">
          Logo URL
        </label>
        <input
          id="logoUrl"
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Enter a publicly accessible URL for your church logo.
        </p>
      </div>

      {/* Primary color */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="primaryColor" className="text-sm font-medium">
          Primary Color
        </label>
        <div className="flex items-center gap-3">
          <input
            id="primaryColor"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-input bg-background p-1"
          />
          <span className="text-sm font-mono text-muted-foreground">
            {primaryColor.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Subdomain */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="subdomain" className="text-sm font-medium">
          Custom subdomain
        </label>
        {canClaimSubdomain ? (
          <>
            <div className="flex items-center rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
              <input
                id="subdomain"
                type="text"
                value={subdomain}
                onChange={(e) => handleSubdomainChange(e.target.value.toLowerCase())}
                placeholder="grace-chapel"
                maxLength={32}
                className="flex-1 px-3 py-2 text-sm bg-transparent placeholder:text-muted-foreground focus:outline-none"
              />
              <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-l border-input select-none">
                .prayerjar.org
              </span>
            </div>
            {subdomainError && (
              <p className="text-xs text-destructive">{subdomainError}</p>
            )}
            {!subdomainError && subdomain && (
              <p className="text-xs text-muted-foreground">
                Your church will be available at{' '}
                <span className="font-mono">{subdomain}.prayerjar.org</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only. Max 32 characters.
              No leading or trailing hyphens.
            </p>
          </>
        ) : (
          <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
            Custom subdomains like{' '}
            <span className="font-mono">yourchurch.prayerjar.org</span> aren&apos;t
            available yet.{' '}
            <a href="/contact" className="text-primary hover:underline">
              Get in touch
            </a>{' '}
            if you need one.
          </div>
        )}
      </div>

      {/* Save button + feedback */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={status === 'saving' || !!subdomainError || (!canClaimSubdomain && !!subdomain)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'saving' ? 'Saving…' : 'Save branding'}
        </button>

        {status === 'success' && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Branding saved.
          </span>
        )}
        {status === 'error' && (
          <span className="text-sm text-destructive">{errorMsg}</span>
        )}
      </div>
    </div>
  );
}
