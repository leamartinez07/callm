"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CallmLogo } from "@/components/CallmLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthRequestError, useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.532 24.552c0-1.636-.147-3.2-.42-4.704H24.48v8.894h12.984c-.56 3.024-2.24 5.584-4.784 7.308v6.072h7.744c4.528-4.172 7.108-10.312 7.108-17.57z" fill="#4285F4"/>
      <path d="M24.48 48c6.512 0 11.972-2.16 15.96-5.868l-7.744-6.072c-2.152 1.44-4.908 2.292-8.216 2.292-6.32 0-11.668-4.268-13.584-10.004H2.9v6.264C6.872 42.772 15.104 48 24.48 48z" fill="#34A853"/>
      <path d="M10.896 28.348A14.373 14.373 0 0 1 9.96 24c0-1.512.26-2.976.936-4.348V13.388H2.9A23.938 23.938 0 0 0 .48 24c0 3.868.928 7.52 2.42 10.612l8-6.264z" fill="#FBBC05"/>
      <path d="M24.48 9.648c3.556 0 6.748 1.224 9.268 3.624l6.944-6.944C36.44 2.42 30.992 0 24.48 0 15.104 0 6.872 5.228 2.9 13.388l8 6.264z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/chat");
    } catch (err: unknown) {
      if (err instanceof AuthRequestError) {
        const messages: Record<string, string> = {
          AUTH_UNAVAILABLE: t("authUnavailable"),
          EMAIL_ALREADY_REGISTERED: t("emailAlreadyRegistered"),
        };
        setError((err.code && messages[err.code]) || err.message);
      } else {
        setError(t("googleFailed"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0812] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <CallmLogo size="lg" />
        </div>

        <div className="bg-[#16132a] border border-[#252040] rounded-2xl p-6 shadow-[0_0_60px_rgba(157,91,244,0.08)] relative">
          {/* Language toggle */}
          <LanguageSwitcher className="absolute top-4 right-4" />

          <>
              <h1 className="text-lg font-syne font-bold text-white mb-1">{t("signUp")}</h1>
              <p className="text-sm text-[#7a6d94] mb-6">{t("startChatting")}</p>

              {/* Google sign-in */}
              <a
                href="/api/auth/google"
                onClick={(event) => {
                  if (window.self !== window.top) {
                    event.preventDefault();
                    window.open("/api/auth/google", "_blank", "noopener,noreferrer");
                  }
                }}
                className="flex items-center justify-center gap-2.5 w-full bg-[#1c1830] hover:bg-[#252040] border border-[#2e2950] text-[#d4d4d8] text-sm font-medium rounded-xl py-2.5 transition mb-4"
              >
                <GoogleIcon />
                {t("continueWithGoogle")}
              </a>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#252040]" />
                <span className="text-xs text-[#52525b]">{t("or")}</span>
                <div className="flex-1 h-px bg-[#252040]" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="register-name" className="block text-xs font-medium text-[#7a6d94] mb-1.5">{t("nameLabel")}</label>
                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    className="w-full bg-[#1c1830] border border-[#2e2950] focus:border-[#9d5bf4]/60 rounded-xl px-4 py-2.5 text-sm text-[#d4d4d8] placeholder:text-[#52525b] outline-none transition"
                    placeholder="Leandro"
                  />
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-xs font-medium text-[#7a6d94] mb-1.5">{t("emailLabel")}</label>
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full bg-[#1c1830] border border-[#2e2950] focus:border-[#9d5bf4]/60 rounded-xl px-4 py-2.5 text-sm text-[#d4d4d8] placeholder:text-[#52525b] outline-none transition"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="register-password" className="block text-xs font-medium text-[#7a6d94] mb-1.5">{t("passwordLabel")}</label>
                  <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    pattern="(?=.*[A-Z])(?=.*[0-9]).{8,}"
                    title={t("passwordRequirements")}
                    aria-describedby="register-password-help"
                    className="w-full bg-[#1c1830] border border-[#2e2950] focus:border-[#9d5bf4]/60 rounded-xl px-4 py-2.5 text-sm text-[#d4d4d8] placeholder:text-[#52525b] outline-none transition"
                    placeholder="••••••••"
                  />
                  <p id="register-password-help" className="mt-1.5 text-[10px] leading-4 text-[#625879]">
                    {t("passwordRequirements")}
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-syne font-bold text-sm rounded-xl py-2.5 transition disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#9d5bf4,#e879f9)" }}
                >
                  {loading ? t("creatingAccount") : t("signUp")}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-[#52525b]">
                {t("alreadyAccount")}{" "}
                <Link href="/login" className="text-[#c084fc] hover:underline">
                  {t("signIn")}
                </Link>
              </p>
            </>
        </div>
      </div>
    </div>
  );
}
