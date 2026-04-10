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

  async function handleSubmit() {
    if (!claimerName || !role || !churchEmail) return;
    setSubmitting(true);
    await fetch(`/api/v1/churches/${placeId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimerName, role, churchEmail }),
    });
    setPending(true);
    setSubmitting(false);
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
        value={claimerName}
        onChange={(e) => setClaimerName(e.target.value)}
        placeholder="Your name"
        className="bg-slate-900 border-slate-700 text-slate-100"
      />
      <Input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Your role (e.g. Pastor, Office Manager)"
        className="bg-slate-900 border-slate-700 text-slate-100"
      />
      <Input
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
    </div>
  );
}
