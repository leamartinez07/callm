"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CallmLogo } from "@/components/CallmLogo";
import { useLocale } from "@/hooks/useLocale";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const token = fragment.get("token") ?? query.get("token");
    const error = fragment.get("error") ?? query.get("error");

    window.history.replaceState(null, "", "/auth/callback");
    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!token) {
      router.replace("/login?error=google_failed");
      return;
    }

    localStorage.setItem("callm_token", token);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "callm_token", newValue: token })
    );
    router.replace("/chat");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0812] flex flex-col items-center justify-center gap-6">
      <div className="animate-pulse">
        <CallmLogo size="lg" />
      </div>
      <p className="text-sm text-[#7a6d94] font-geist">{t("signingIn2")}</p>
    </div>
  );
}
