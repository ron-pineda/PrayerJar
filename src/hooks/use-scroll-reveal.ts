'use client';

import { useEffect, useRef } from 'react';

export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-slide-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all direct children
    Array.from(el.children).forEach((child) => {
      (child as HTMLElement).style.opacity = '0';
      observer.observe(child);
    });

    // Fallback: if intersection never fires, make children visible after 3 seconds
    const fallbackTimer = setTimeout(() => {
      Array.from(el.children).forEach((child) => {
        const htmlChild = child as HTMLElement;
        if (htmlChild.style.opacity === '0') {
          htmlChild.style.opacity = '';
        }
      });
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return ref;
}
