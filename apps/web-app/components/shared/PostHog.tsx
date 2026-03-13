"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import {
  COOKIE_PREFERENCES_UPDATED_EVENT,
  hasCookieConsent,
} from "@/libs/cookiePreferences";

export default function PostHog(): null {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  useEffect(() => {
    if (!posthogKey) return;

    posthog.init(posthogKey, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_API_HOST ?? "https://us.i.posthog.com",
      opt_out_capturing_by_default: true,
      ui_host:
        process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.i.posthog.com",
    });

    const syncConsent = () => {
      if (hasCookieConsent("analytics")) {
        posthog.opt_in_capturing();
      } else {
        posthog.opt_out_capturing();
      }
    };

    syncConsent();
    window.addEventListener(COOKIE_PREFERENCES_UPDATED_EVENT, syncConsent);
    return () =>
      window.removeEventListener(COOKIE_PREFERENCES_UPDATED_EVENT, syncConsent);
  }, [posthogKey]);

  return null;
}
