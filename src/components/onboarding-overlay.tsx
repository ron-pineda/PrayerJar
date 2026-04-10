'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'prayerjar_onboarded';

export function OnboardingOverlay() {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  }

  function handleStart() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
    router.push('/pray');
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-card border rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center space-y-6 animate-fade-slide-up"
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
        >
          ✕
        </button>

        <div className="text-5xl">🕯</div>

        <div>
          <h2 id="onboarding-title" className="text-xl font-bold tracking-tight mb-2">
            Welcome to Prayer Jar
          </h2>
          <p className="text-sm text-muted-foreground">
            A place where anyone can share a prayer need and anyone can pray for others.
          </p>
        </div>

        <div className="flex justify-center gap-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-2xl mx-auto mb-2">
              ✍️
            </div>
            <p className="text-xs text-muted-foreground">Share a<br />prayer need</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-2xl mx-auto mb-2">
              🙏
            </div>
            <p className="text-xs text-muted-foreground">Pray for<br />someone</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-2xl mx-auto mb-2">
              ⭐
            </div>
            <p className="text-xs text-muted-foreground">Celebrate<br />answered prayers</p>
          </div>
        </div>

        <Button onClick={handleStart} className="w-full">Start Praying →</Button>
      </div>
    </div>
  );
}
