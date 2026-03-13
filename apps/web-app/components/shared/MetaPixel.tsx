"use client";

import { useEffect, useState } from "react";
import {
  COOKIE_PREFERENCES_UPDATED_EVENT,
  hasCookieConsent,
} from "@/libs/cookiePreferences";

type MetaPixelBootstrapFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: (...args: unknown[]) => void;
  loaded?: boolean;
  version?: string;
};

const META_PIXEL_SRC = "https://connect.facebook.net/en_US/fbevents.js";

function isTopWindowContext(): boolean {
  try {
    return window.top === window.self;
  } catch {
    return false;
  }
}

export default function MetaPixel(): null {
  const [isEnabled, setIsEnabled] = useState(false);
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  useEffect(() => {
    const syncConsent = () => {
      setIsEnabled(hasCookieConsent("analytics"));
    };

    syncConsent();
    window.addEventListener(COOKIE_PREFERENCES_UPDATED_EVENT, syncConsent);

    return () => {
      window.removeEventListener(COOKIE_PREFERENCES_UPDATED_EVENT, syncConsent);
    };
  }, []);

  useEffect(() => {
    if (!metaPixelId || !isEnabled || !isTopWindowContext()) {
      return;
    }

    if (window.__dinioMetaPixelInitialized) {
      return;
    }

    const fbq = function (...args: unknown[]) {
      if (typeof fbq.callMethod === "function") {
        fbq.callMethod(...args);
        return;
      }

      fbq.queue?.push(args);
    } as MetaPixelBootstrapFunction;

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];

    if (!window.fbq) {
      window.fbq = fbq;
    }

    if (!window._fbq) {
      window._fbq = window.fbq;
    }

    const scriptElement = document.createElement("script");
    scriptElement.async = true;
    scriptElement.src = META_PIXEL_SRC;

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(scriptElement, firstScript);
    } else {
      document.head.appendChild(scriptElement);
    }

    window.fbq("init", metaPixelId);
    window.fbq("track", "PageView");
    window.__dinioMetaPixelInitialized = true;
  }, [metaPixelId, isEnabled]);

  return null;
}
