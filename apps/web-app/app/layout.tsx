import { ReactNode } from "react";
import { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/shared/LayoutClient";
import { UserProvider } from "@/contexts";
import PostHog from "@/components/shared/PostHog";
import CookieConsent from "@/components/shared/CookieConsent";
import MetaPixel from "../components/shared/MetaPixel";
import config from "@/config";
import "./globals.css";

export const viewport: Viewport = {
  // Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme={config.colors.theme} className="font-sans">
      <head>
        {process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION ? (
          <meta
            name="facebook-domain-verification"
            content={process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION}
          />
        ) : null}
      </head>
      <body>
        <UserProvider>
          <MetaPixel />
          <PostHog />
          <ClientLayout>{children}</ClientLayout>
          <CookieConsent />
        </UserProvider>
      </body>
    </html>
  );
}
