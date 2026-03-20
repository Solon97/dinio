"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts";
import apiClient from "@/libs/api";
import config from "@/config";
import { trackInitiateCheckout } from "@/libs/pixel";
import posthog from "posthog-js";
import { posthogEvents } from "@/libs/posthog";
import { getSessionUtmProperties } from "@/libs/utm";

const ButtonCheckout = ({
  recurrency,
  mode = "subscription",
  text,
  onClickTracking,
  variant = "primary",
}: {
  recurrency: string;
  mode?: "payment" | "subscription";
  text?: string;
  onClickTracking?: () => void;
  variant?: "primary" | "outline-white";
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { user } = useUser();

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      // Check if user is authenticated
      if (!user) {
        // Redirect to login with plan preserved in query params
        router.push(`${config.auth.loginUrl}?plan=${recurrency}`);
        return;
      }
      if (user.isPremium) {
        router.push("/dashboard");
        return;
      }
      const eventId = crypto.randomUUID();
      sessionStorage.setItem("dinio:meta:checkout_event_id", eventId);
      const successUrl = `${window.location.origin}/dashboard`;

      const metaFbc = document.cookie.match(/(^|;)\s*_fbc=([^;]+)/)?.[2];
      const metaFbp = document.cookie.match(/(^|;)\s*_fbp=([^;]+)/)?.[2];
      const utmProperties = getSessionUtmProperties();

      // User is authenticated, proceed to checkout
      const { url }: { url: string } = await apiClient.post(
        "/stripe/create-checkout",
        {
          recurrency,
          successUrl,
          cancelUrl: window.location.href,
          mode,
          metaEventId: eventId,
          metaFbc,
          metaFbp,
          metaUserAgent: navigator.userAgent,
          ...utmProperties,
        },
      );

      trackInitiateCheckout(eventId);

      posthog.capture(posthogEvents.CHECKOUT_INITIATED, {
        ...utmProperties,
      });

      window.location.href = url;
    } catch (e) {
      console.error("Checkout error");
    } finally {
      setIsLoading(false);
    }
  };

  const variantClass =
    variant === "outline-white"
      ? "btn btn-block bg-white hover:bg-neutral-100 text-primary-700 border-none rounded-xl font-semibold group !normal-case"
      : "btn btn-block bg-[#0d9488] hover:bg-[#0f766e] text-white border-none rounded-xl font-semibold group !normal-case";

  return (
    <button
      className={variantClass}
      onClick={() => {
        if (onClickTracking) {
          onClickTracking();
        }
        handlePayment();
      }}
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {text || `Começar com ${config?.appName}`}
    </button>
  );
};

export default ButtonCheckout;
