"use client";

import ServiceWorkerRegistration from "@/components/app/ServiceWorkerRegistration";
import config from "@/config";
import { useUser } from "@/contexts";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import DashboardProvider from "./DashboardProvider";

export default function LayoutPrivate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (config.leadMode) {
      router.push("/");
      return;
    }

    if (isLoading) return;

    if (!user) {
      router.push(config.auth.loginUrl);
      return;
    }
    if (user.isPremium) {
      return;
    }

    const selectedPlan = sessionStorage.getItem("selectedPlan");
    // Redirect to subscribe page if no active subscription
    if (selectedPlan) {
      router.push("/checkout");
      return;
    }

    if (user.wasSubscriber) {
      router.push("/subscribe");
      return;
    }

    router.push("/#trial");
    return;
  }, [user, isLoading, router]);

  // Show nothing while checking auth
  if (isLoading || !user || !user.isPremium) {
    return null;
  }

  return (
    <DashboardProvider>
      <ServiceWorkerRegistration />
      <div className="min-h-screen bg-slate-50 font-sans">{children}</div>
    </DashboardProvider>
  );
}
