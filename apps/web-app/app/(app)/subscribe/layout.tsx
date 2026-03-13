"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts";
import config from "@/config";

export default function NoAccessLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (config.leadMode) {
      router.push("/");
      return;
    }

    if (isLoading) return;

    // if (!user) {
    //   router.push(config.auth.loginUrl);
    //   return;
    // }

    // If user already has access, redirect to dashboard
    if (user?.isPremium) {
      router.push("/dashboard");
      return;
    }
  }, [user, isLoading, router]);

  // Show nothing while checking auth
  if (isLoading || /*!user ||*/ user?.isPremium) {
    return null;
  }

  return <div className="min-h-screen bg-slate-50 font-sans">{children}</div>;
}
