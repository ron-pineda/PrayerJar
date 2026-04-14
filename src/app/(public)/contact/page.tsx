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

const SUBJECTS = ["General", "Church Partnership", "Feedback", "Bug Report", "Other"] as const;

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
        toast.success("Message sent! We'll get back to you soon.");
        resetForm();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <span className="text-5xl" aria-hidden="true">&#x2709;&#xFE0F;</span>
        <h1 className="text-3xl font-bold tracking-tight mt-4 mb-3">Get in Touch</h1>
        <p className="text-muted-foreground leading-relaxed">
          Have a question, feedback, or want to partner with us? We'd love to hear from you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            placeholder="Your name"
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
          <Label>Subject</Label>
          <Select value={subject} onValueChange={(v) => setSubject(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-message">Message</Label>
          <Textarea
            id="contact-message"
            placeholder="How can we help?"
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
          {pending ? "Sending..." : "Send Message"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground mt-8 text-center">
        For prayer-related support, please use the app directly.
        For data deletion requests, see our{" "}
        <a href="/privacy" className="underline underline-offset-4">Privacy Policy</a>.
      </p>
    </main>
  );
}
