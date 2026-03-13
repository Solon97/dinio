"use client";

type FbqTrackFunction = (
  method: "track",
  eventName: string,
  parameters?: Record<string, unknown>,
  options?: { eventID?: string },
) => void;

type FbqInitFunction = (method: "init", pixelId: string) => void;

export type FbqFunction = FbqTrackFunction & FbqInitFunction;

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    __dinioMetaPixelInitialized?: boolean;
  }
}

const BRL = "BRL";

function track(
  eventName: "CompleteRegistration" | "InitiateCheckout" | "Purchase" | "Lead",
  parameters: Record<string, unknown> = {},
  eventId?: string,
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }
  window.fbq("track", eventName, parameters, {
    eventID: eventId,
  });
}

export function trackCompleteRegistration(eventId?: string) {
  track("CompleteRegistration", { currency: BRL }, eventId);
}

export function trackInitiateCheckout(eventId?: string) {
  track("InitiateCheckout", { currency: BRL }, eventId);
}

export function trackPurchase(value: number, eventId: string) {
  track("Purchase", { value, currency: BRL }, eventId);
}
