'use client';

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-slate-400 text-sm hover:text-slate-300 block mb-4 text-left"
    >
      ← Back to results
    </button>
  );
}
