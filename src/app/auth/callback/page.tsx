"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CallmLogo } from "@/components/CallmLogo";

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      router.replace(`/login?error=${error}`);
      return;
    }

    if (token) {
      localStorage.setItem("callm_token", token);
      // Dispatch storage event so useAuth hook picks it up in the same tab
      window.dispatchEvent(new StorageEvent("storage", { key: "callm_token", newValue: token }));
      router.replace("/chat");
    } else {
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0a0812] flex flex-col items-center justify-center gap-6">
      <div className="animate-pulse">
        <CallmLogo size="lg" />
      </div>
      <p className="text-sm text-[#7a6d94] font-geist">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallback />
    </Suspense>
  );
}
