'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'prayerjar_onboarded';

export function OnboardingOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center space-y-6 animate-fade-slide-up">
        <div className="text-5xl">🕯</div>

        <div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Welcome to Prayer Jar</h2>
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

        <div className="space-y-2">
          <Button onClick={dismiss} className="w-full">Start Praying</Button>
          <button onClick={dismiss} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
