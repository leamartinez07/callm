"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChat } from "@/components/icons";
import { useAuth } from "@/hooks/useAuth";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.532 24.552c0-1.636-.147-3.2-.42-4.704H24.48v8.894h12.984c-.56 3.024-2.24 5.584-4.784 7.308v6.072h7.744c4.528-4.172 7.108-10.312 7.108-17.57z" fill="#4285F4"/>
      <path d="M24.48 48c6.512 0 11.972-2.16 15.96-5.868l-7.744-6.072c-2.152 1.44-4.908 2.292-8.216 2.292-6.32 0-11.668-4.268-13.584-10.004H2.9v6.264C6.872 42.772 15.104 48 24.48 48z" fill="#34A853"/>
      <path d="M10.896 28.348A14.373 14.373 0 0 1 9.96 24c0-1.512.26-2.976.936-4.348V13.388H2.9A23.938 23.938 0 0 0 .48 24c0 3.868.928 7.52 2.42 10.612l8-6.264z" fill="#FBBC05"/>
      <path d="M24.48 9.648c3.556 0 6.748 1.224 9.268 3.624l6.944-6.944C36.44 2.42 30.992 0 24.48 0 15.104 0 6.872 5.228 2.9 13.388l8 6.264c1.916-5.736 7.264-10.004 13.58-10.004z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111118] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <IconChat width={20} height={20} className="text-accent" />
          </div>
          <span className="text-xl font-bold text-white">ChatFlow</span>
        </div>

        <div className="bg-surface-1 border border-white/10 rounded-2xl p-6">
          {done ? (
            /* ── Check your email screen ── */
            <div className="text-center py-4">
              <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-base font-semibold text-white mb-2">Check your email</h2>
              <p className="text-sm text-zinc-500 mb-1">
                We sent a verification link to
              </p>
              <p className="text-sm text-accent font-medium mb-4">{email}</p>
              <p className="text-xs text-zinc-600 mb-6">
                Click the link in the email to verify your account. The link expires in 24 hours.
              </p>
              <Link
                href="/login"
                className="inline-block bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl px-6 py-2.5 transition"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-white mb-1">Create an account</h1>
              <p className="text-sm text-zinc-500 mb-6">Start chatting in seconds</p>

              {/* Google sign-in */}
              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-2.5 w-full bg-surface-2 hover:bg-white/10 border border-white/10 text-zinc-200 text-sm font-medium rounded-xl py-2.5 transition mb-4"
              >
                <GoogleIcon />
                Continue with Google
              </a>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-zinc-600">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    className="w-full bg-surface-2 border border-transparent focus:border-accent/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition"
                    placeholder="Leandro"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full bg-surface-2 border border-transparent focus:border-accent/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-surface-2 border border-transparent focus:border-accent/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition"
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-xl py-2.5 transition disabled:opacity-60"
                >
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-zinc-600">
                Already have an account?{" "}
                <Link href="/login" className="text-accent hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
