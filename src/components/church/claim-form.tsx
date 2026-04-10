"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClaimFormProps {
  placeId: string;
}

export function ClaimForm({ placeId }: ClaimFormProps) {
  const [claimerName, setClaimerName] = useState("");
  const [role, setRole] = useState("");
  const [churchEmail, setChurchEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!claimerName || !role || !churchEmail) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/churches/${placeId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimerName, role, churchEmail }),
      });
      if (!res.ok) throw new Error("Claim failed");
      setPending(true);
    } catch {
      setError("Failed to send verification email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (pending) {
    const maskedEmail = churchEmail.replace(/^(.).*(@.*)$/, "$1***$2");
    return (
      <p className="text-amber-400 text-sm">
        We've sent a verification email to {maskedEmail}. Click the link to complete your claim.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        aria-label="Your name"
        value={claimerName}
        onChange={(e) => setClaimerName(e.target.value)}
        placeholder="Your name"
        className="bg-slate-900 border-slate-700 text-slate-100"
      />
      <Input
        aria-label="Your role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Your role (e.g. Pastor, Office Manager)"
        className="bg-slate-900 border-slate-700 text-slate-100"
      />
      <Input
        aria-label="Church email address"
        type="email"
        value={churchEmail}
        onChange={(e) => setChurchEmail(e.target.value)}
        placeholder="Church email address"
        className="bg-slate-900 border-slate-700 text-slate-100"
      />
      <Button
        onClick={handleSubmit}
        disabled={submitting || !claimerName || !role || !churchEmail}
        className="w-full"
      >
        {submitting ? "Sending..." : "Send Verification Email"}
      </Button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
