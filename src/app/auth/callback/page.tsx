"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconChat } from "@/components/icons";

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
      localStorage.setItem("chatflow_token", token);
      // Dispatch storage event so useAuth hook picks it up in the same tab
      window.dispatchEvent(new StorageEvent("storage", { key: "chatflow_token", newValue: token }));
      router.replace("/chat");
    } else {
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#111118] flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-zinc-500">
        <IconChat width={20} height={20} className="text-accent animate-pulse" />
        <span className="text-sm">Signing you in…</span>
      </div>
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
