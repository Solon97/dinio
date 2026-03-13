import AppHeader from "@/components/app/AppHeader";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  applicationName: "Dinio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dinio",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <OnboardingProvider>
      <AppHeader />
      {children}
    </OnboardingProvider>
  );
}
