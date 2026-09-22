import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useSeo } from "@/lib/useSeo";
import { base44 } from "@/api/base44Client";

export default function Contact() {
  useSeo(
    "Contact FlashFlow — Get Help with Your Study App",
    "Get help with FlashFlow, the free flashcard study app. Reach out with support questions, feedback, or feature ideas — we usually reply within 1–2 business days."
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setSending(true);
    try {
      await base44.functions.invoke("submitContact", {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSent(true);
    } catch (err) {
      setError("Something went wrong sending your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
      <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Back
      </Link>

      <span className="block mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Get in touch
      </span>
      <h1 className="font-display text-5xl text-foreground mt-2 tracking-tight">Contact us</h1>
      <p className="mt-3 font-body text-sm text-muted-foreground max-w-lg">
        Questions, feedback, or feature ideas? We'd love to hear from you. Send us a message and
        we'll get back to you as soon as we can.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-start gap-3 p-4 border border-border bg-card rounded-md">
            <Mail className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</p>
              <a href="mailto:support@flashflowstudy.com" className="font-body text-sm text-foreground hover:text-primary transition-colors">
                support@flashflowstudy.com
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 border border-border bg-card rounded-md">
            <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Response time</p>
              <p className="font-body text-sm text-foreground">Usually within 1–2 business days</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="md:col-span-2 space-y-4 p-5 border border-border bg-card rounded-md">
          {sent ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-positive mx-auto mb-3" />
              <h3 className="font-display text-2xl text-foreground">Message sent</h3>
              <p className="mt-2 font-body text-sm text-muted-foreground">Thanks for reaching out — we'll be in touch soon.</p>
              <button onClick={() => setSent(false)} className="mt-5 font-mono text-xs uppercase tracking-widest text-primary hover:underline">
                Send another →
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 px-4 py-3 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 px-4 py-3 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Subject (optional)</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary rounded-md"
                  placeholder="What's this about?"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full mt-1 px-4 py-3 bg-background border border-border font-body text-sm focus:outline-none focus:border-primary resize-none rounded-md"
                  placeholder="How can we help?"
                />
              </div>
              {error && <p className="font-body text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" /> {sending ? "Sending…" : "Send message"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}