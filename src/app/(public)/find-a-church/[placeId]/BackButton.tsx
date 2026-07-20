'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-slate-400 text-sm hover:text-slate-300 mb-4 text-left inline-flex items-center gap-1"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to results
    </button>
  );
}
