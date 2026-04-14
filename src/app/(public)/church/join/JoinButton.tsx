"use client";

import { useState } from "react";
import { joinChurchAction } from "@/app/actions/church-join.actions";

interface Props {
  slug: string;
  churchName: string;
}

export function JoinButton({ slug, churchName }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setPending(true);
    setError(null);
    try {
      const result = await joinChurchAction(slug);
      if (result && "error" in result) {
        setError(result.error);
      }
      // On success joinChurchAction redirects, so nothing else needed.
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive text-center">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleJoin}
        disabled={pending}
        className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "Joining…" : `Join ${churchName}`}
      </button>
    </div>
  );
}
