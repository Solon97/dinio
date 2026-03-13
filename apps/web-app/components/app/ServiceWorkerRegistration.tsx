"use client";

import { useEffect } from "react";

function isRunningAsStandalone(): boolean {
  // Check for iOS standalone mode
  if ("standalone" in window.navigator) {
    return (window.navigator as Navigator & { standalone: boolean }).standalone;
  }
  // Check for display-mode: standalone (Android/Desktop PWA)
  return window.matchMedia("(display-mode: standalone)").matches;
}

function notifyServiceWorkerStandaloneMode(
  registration: ServiceWorkerRegistration,
): void {
  const isStandalone = isRunningAsStandalone();

  const sendMessage = (sw: ServiceWorker) => {
    sw.postMessage({
      type: "SET_STANDALONE_MODE",
      isStandalone,
    });
  };

  // Send to active SW
  if (registration.active) {
    sendMessage(registration.active);
  }

  // Also listen for new SW activations
  registration.addEventListener("controllerchange", () => {
    if (navigator.serviceWorker.controller) {
      sendMessage(navigator.serviceWorker.controller);
    }
  });
}

export default function ServiceWorkerRegistration(): null {
  useEffect(() => {
    if (
      "serviceWorker" in navigator &&
      process.env.NODE_ENV !== "development"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Notify SW about standalone mode
          notifyServiceWorkerStandaloneMode(registration);

          // Re-check on display mode change (e.g., user installs PWA)
          window
            .matchMedia("(display-mode: standalone)")
            .addEventListener("change", () => {
              notifyServiceWorkerStandaloneMode(registration);
            });
        })
        .catch((error) => {});
    }
  }, []);

  return null;
}
