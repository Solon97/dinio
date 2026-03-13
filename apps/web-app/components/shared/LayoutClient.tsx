"use client";

import { useEffect, ReactNode, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Crisp } from "crisp-sdk-web";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import { useUser } from "@/contexts";
import {
  COOKIE_PREFERENCES_UPDATED_EVENT,
  hasCookieConsent,
} from "@/libs/cookiePreferences";
import config from "@/config";

function isTopWindowContext(): boolean {
  try {
    return window.top === window.self;
  } catch {
    return false;
  }
}

// Crisp customer chat support:
// This component is separated from ClientLayout because it needs to be wrapped with <SessionProvider> to use useSession() hook
const CrispChat = (): null => {
  const pathname = usePathname();
  const { user } = useUser();
  const [supportConsent, setSupportConsent] = useState(false);
  const isCrispConfiguredRef = useRef(false);
  const hasCloseHandlerRef = useRef(false);

  useEffect(() => {
    const syncConsent = () => {
      setSupportConsent(hasCookieConsent("support"));
    };

    syncConsent();
    window.addEventListener(COOKIE_PREFERENCES_UPDATED_EVENT, syncConsent);

    return () => {
      window.removeEventListener(COOKIE_PREFERENCES_UPDATED_EVENT, syncConsent);
    };
  }, []);

  useEffect(() => {
    if (!config?.crisp?.id || !isTopWindowContext()) {
      return;
    }

    if (supportConsent) {
      if (!isCrispConfiguredRef.current) {
        Crisp.configure(config.crisp.id);
        isCrispConfiguredRef.current = true;
      }

      // (Optional) If onlyShowOnRoutes array is not empty in config.js file, Crisp will be hidden on the routes in the array.
      // Use <AppButtonSupport> instead to show it (user clicks on the button to show Crisp—it cleans the UI)
      if (
        config.crisp.onlyShowOnRoutes &&
        !config.crisp.onlyShowOnRoutes?.includes(pathname)
      ) {
        Crisp.chat.hide();
        if (!hasCloseHandlerRef.current) {
          Crisp.chat.onChatClosed(() => {
            Crisp.chat.hide();
          });
          hasCloseHandlerRef.current = true;
        }
      } else {
        Crisp.chat.show();
      }
      return;
    }

    if (isCrispConfiguredRef.current) {
      Crisp.chat.hide();
    }
  }, [pathname, supportConsent]);

  // Add User Unique ID to Crisp to easily identify users when reaching support (optional)
  useEffect(() => {
    if (user && config?.crisp?.id && supportConsent && isTopWindowContext()) {
      Crisp.session.setData({ userId: user.id });
    }
  }, [user, supportConsent]);

  return null;
};

// All the client wrappers are here (they can't be in server components)
// 1. NextTopLoader: Show a progress bar at the top when navigating between pages
// 2. Toaster: Show Success/Error messages anywhere from the app with toast()
// 3. Tooltip: Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content=""
// 4. CrispChat: Set Crisp customer chat support (see above)
const ClientLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {/* Show a progress bar at the top when navigating between pages */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {/* Content inside app/page.js files  */}
      {children}

      {/* Show Success/Error messages anywhere from the app with toast() */}
      <Toaster
        toastOptions={{
          duration: 3000,
        }}
      />

      {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
      <Tooltip
        id="tooltip"
        className="z-[60] !opacity-100 max-w-sm shadow-lg"
      />

      {/* Set Crisp customer chat support */}
      <CrispChat />
    </>
  );
};

export default ClientLayout;
