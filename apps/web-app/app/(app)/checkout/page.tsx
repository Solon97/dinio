"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts";
import apiClient from "@/libs/api";
import config from "@/config";
import { trackInitiateCheckout } from "@/libs/pixel";
import posthog from "posthog-js";
import { posthogEvents } from "@/libs/posthog";
import {
  clearCheckoutTrackingCookie,
  resolveCheckoutTrackingContext,
  SELECTED_PLAN_KEY,
} from "@/libs/checkoutTracking";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useUser();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initiateCheckout = async () => {
      // Wait for user data to load
      if (isLoadingUser) {
        return;
      }

      try {
        // Verify user is authenticated (apiClient handles 401 redirect)
        if (!user) {
          router.push(config.auth.loginUrl);
          return;
        }

        // Check if user already has access
        if (user.isPremium) {
          router.push("/dashboard");
          return;
        }

        const { plan: selectedPlan, funnelId, utmProperties } =
          resolveCheckoutTrackingContext();

        if (!selectedPlan) {
          posthog.capture(posthogEvents.CHECKOUT_MISSING_PLAN, {
            funnel_id: funnelId,
            ...utmProperties,
          });
          router.push("/#trial");
          return;
        }

        // Clear the stored plan
        sessionStorage.removeItem(SELECTED_PLAN_KEY);
        clearCheckoutTrackingCookie();

        const eventId = crypto.randomUUID();
        sessionStorage.setItem("dinio:meta:checkout_event_id", eventId);
        const successUrl = `${window.location.origin}/dashboard`;

        // Create checkout session
        const { url }: { url: string } = await apiClient.post(
          "/stripe/create-checkout",
          {
            recurrency: selectedPlan,
            successUrl,
            cancelUrl: `${window.location.origin}/#trial`,
            mode: "subscription",
            metaEventId: eventId,
            funnel_id: funnelId,
            ...utmProperties,
          },
        );

        trackInitiateCheckout(eventId);

        posthog.capture(posthogEvents.CHECKOUT_INITIATED, {
          funnel_id: funnelId,
          ...utmProperties,
        });

        // Redirect to Stripe checkout
        window.location.href = url;
        return;
      } catch (err) {
        setError("Erro ao processar checkout. Tente novamente mais tarde.");
        router.push("/");
        return;
      }
    };

    initiateCheckout();
  }, [router, user, isLoadingUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Erro no checkout
          </h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/#trial")}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Voltar aos planos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Preparando seu checkout...
        </h2>
        <p className="text-slate-600">
          Você será redirecionado em instantes para concluir a assinatura.
        </p>
      </div>
    </div>
  );
}
