import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

const TRUST_KEY = "ff_trusted_devices";
const readTrusted = () => {
  try {
    return JSON.parse(localStorage.getItem(TRUST_KEY) || "{}");
  } catch {
    return {};
  }
};
const isTrusted = (email) => !!readTrusted()[(email || "").toLowerCase()];
const trustDevice = (email) => {
  const map = readTrusted();
  map[(email || "").toLowerCase()] = true;
  localStorage.setItem(TRUST_KEY, JSON.stringify(map));
};
const genCode = () => {
  if (window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return String(100000 + (arr[0] % 900000));
  }
  return String(Math.floor(100000 + Math.random() * 900000));
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("credentials"); // "credentials" | "code"
  const [generatedCode, setGeneratedCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [sending, setSending] = useState(false);
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();

  const sendCode = async (to) => {
    const code = genCode();
    setGeneratedCode(code);
    await base44.integrations.Core.SendEmail({
      to,
      subject: "Your FlashFlow sign-in code",
      body: `Your confirmation code is ${code}. Enter it to finish signing in. If you didn't try to sign in, you can ignore this email.`,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Trusted device + browser: skip the email code step.
    if (isTrusted(email)) {
      setLoading(true);
      try {
        await base44.auth.loginViaEmailPassword(email, password);
        window.location.href = returnTo;
      } catch (err) {
        setError(err.message || "Invalid email or password");
      } finally {
        setLoading(false);
      }
      return;
    }
    // New device/browser: email a confirmation code first.
    setSending(true);
    try {
      await sendCode(email);
      setStep("code");
    } catch (err) {
      setError(err.message || "Couldn't send the confirmation code. Try again.");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError("");
    if (enteredCode.trim() !== generatedCode) {
      setError("That code doesn't match. Try again.");
      return;
    }
    setLoading(true);
    try {
      trustDevice(email);
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid email or password");
      setStep("credentials");
      setEnteredCode("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    setSending(true);
    try {
      await sendCode(email);
    } catch {
      setError("Couldn't resend the code.");
    } finally {
      setSending(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", returnTo);
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {step === "code" ? (
        <>
          <div className="mb-6 flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it to confirm it's you.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={verifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Confirmation code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="123456"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & log in"
              )}
            </Button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={resend}
                disabled={sending}
                className="text-primary hover:underline disabled:opacity-50"
              >
                {sending ? "Sending…" : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("credentials"); setEnteredCode(""); setError(""); }}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium mb-6"
            onClick={handleGoogle}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">or</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}