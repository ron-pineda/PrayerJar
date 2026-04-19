"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { submitContactAction } from "@/app/actions/contact.actions";
import { toast } from "sonner";
import { Mail, Clock } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";

// Backend strict-matches these `value` strings (see contact.actions.ts z.enum).
// Labels are sentence-case display copy per sprint 20 brief.
const SUBJECTS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "General", label: "General question" },
  { value: "Church Partnership", label: "Church partnership" },
  { value: "Feedback", label: "Feedback" },
  { value: "Bug Report", label: "Bug report" },
  { value: "Other", label: "Other" },
] as const;

export default function ContactPage() {
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function resetForm() {
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);

    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", email);
    fd.set("subject", subject);
    fd.set("message", message);

    try {
      const result = await submitContactAction(fd);
      if ("success" in result) {
        toast.success("Message sent. We'll read it and get back to you.");
        resetForm();
      } else {
        console.error("[contact] submit returned error:", result.error);
        toast.error("We couldn't send that. Please try again.");
      }
    } catch (err) {
      console.error("[contact] submit threw:", err);
      toast.error("We couldn't send that. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <Mail
          className="h-10 w-10 text-amber-600 mx-auto"
          aria-hidden="true"
        />
        <h1 className="text-3xl font-bold tracking-tight mt-4 mb-3">
          Get in touch
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Questions, feedback, church partnerships — we read every message.
        </p>
        <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span>A real person reads these. We reply within one business day.</span>
        </p>
      </div>

      <ScrollReveal>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">Your name</Label>
            <Input
              id="contact-name"
              placeholder="First and last"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>What&apos;s this about?</Label>
            <Select value={subject} onValueChange={(v) => setSubject(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a topic" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-message">What&apos;s on your mind?</Label>
            <Textarea
              id="contact-message"
              placeholder="Tell us what's going on."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              required
              rows={5}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={pending || !name.trim() || !email.trim() || !subject || !message.trim()}
          >
            {pending ? "Sending\u2026" : "Send message"}
          </Button>
        </form>
      </ScrollReveal>

      <ScrollReveal>
        <p className="text-xs text-muted-foreground mt-8 text-center">
          For prayer-related support, please use the app directly.
          For data deletion requests, see our{" "}
          <a href="/privacy" className="underline underline-offset-4">Privacy Policy</a>.
        </p>
      </ScrollReveal>
    </main>
  );
}
