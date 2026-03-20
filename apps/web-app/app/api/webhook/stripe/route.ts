import { sendMetaSubscribeEvent } from "@/libs/meta";
import { findCheckoutSession, getAnnualPriceId } from "@/libs/stripe";
import { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getProfile } from "./get-user";
import { PostHog } from "posthog-node";
import { posthogEvents } from "@/libs/posthog";

const posthogClient = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_dummy_key",
  {
    host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://us.i.posthog.com",
  },
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
  typescript: true,
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req: NextRequest) {
  const body = await req.text();

  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  let eventType;
  let event;

  // Create a private supabase client using the secret service_role API key
  const supabase = new SupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  eventType = event.type;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Checkout.Session = event.data
          .object as Stripe.Checkout.Session;
        const session = await findCheckoutSession(stripeObject.id);
        const customerId = session?.customer;

        if (!customerId || typeof customerId !== "string") {
          console.warn("Missing or invalid customer ID on checkout session", {
            sessionId: stripeObject.id,
            customerId,
          });
          break;
        }

        const subscriptionId =
          typeof stripeObject.subscription === "string"
            ? stripeObject.subscription
            : stripeObject.subscription?.id;
        // Safely read price id from the first line item (may be undefined if not expanded or empty)
        const priceId = session?.line_items?.data?.[0]?.price?.id ?? null;
        const contractedPlanValue =
          (session?.line_items?.data?.[0]?.price?.unit_amount ??
            stripeObject.amount_total ??
            0) / 100;
        const annualPriceId = getAnnualPriceId();
        const userId = stripeObject.client_reference_id;

        const customer = (await stripe.customers.retrieve(
          customerId as string,
        )) as Stripe.Customer;
        const distinctId =
          typeof userId === "string" && userId ? userId : customerId;

        const customerEmail =
          stripeObject.customer_details?.email ||
          stripeObject.customer_email ||
          customer.email;

        if (!annualPriceId || priceId !== annualPriceId) {
          console.warn(`No valid annual plan found for price ID: ${priceId}`);
          break;
        }

        const user = await getProfile(supabase, userId, customerEmail);

        await supabase
          .from("profiles")
          .update({
            customer_id: customerId,
            price_id: priceId,
            has_access: true,
            subscription_status: "active",
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", user?.id);

        const metadata = stripeObject.metadata || {};
        const utmProperties = {
          utm_source: metadata.utm_source || "",
          utm_medium: metadata.utm_medium || "",
          utm_campaign: metadata.utm_campaign || "",
          utm_content: metadata.utm_content || "",
        };

        posthogClient.capture({
          distinctId,
          event: posthogEvents.SUBSCRIPTION_CREATED,
          properties: {
            revenue: contractedPlanValue,
            currency: "BRL",
            plan: priceId,
            eventId: stripeObject.id,
          },
        });

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
          );

          if (subscription.status === "trialing") {
            posthogClient.capture({
              distinctId,
              event: posthogEvents.TRIAL_STARTED,
              properties: {
                plan: priceId,
                eventId: stripeObject.id,
                ...utmProperties,
              },
            });
          }
        }

        await posthogClient.flush();

        if (customerEmail && contractedPlanValue > 0) {
          const meta = metadata;
          await sendMetaSubscribeEvent({
            email: customerEmail,
            value: contractedPlanValue,
            currency: "BRL",
            eventId: meta.meta_event_id || undefined,
            clientIpAddress: meta.meta_client_ip || undefined,
            clientUserAgent: meta.meta_user_agent || undefined,
            fbc: meta.meta_fbc || undefined,
            fbp: meta.meta_fbp || undefined,
          });
        } else {
          console.warn("[meta] Missing customerEmail or invalid amount", {
            eventId: stripeObject.id,
            customerEmail,
            amountTotal: contractedPlanValue,
          });
        }

        // Extra: send email with user link, product page, etc...
        // try {
        //   await sendEmail(...);
        // } catch (e) {
        //   console.error("Email issue:" + e?.message);
        // }

        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // You don't need to do anything here, by you can send an email to the user to remind him to complete the transaction, for instance
        break;
      }

      case "customer.subscription.updated": {
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        // You don't need to do anything here, because Stripe will let us know when the subscription is canceled for good (at the end of the billing cycle) in the "customer.subscription.deleted" event
        // You can update the user data to show a "Cancel soon" badge for instance
        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        const stripeObject: Stripe.Subscription = event.data
          .object as Stripe.Subscription;
        const subscription = await stripe.subscriptions.retrieve(
          stripeObject.id,
        );

        await supabase
          .from("profiles")
          .update({ has_access: false, subscription_status: "canceled" })
          .eq("customer_id", subscription.customer);
        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Invoice = event.data
          .object as Stripe.Invoice;
        const priceId = stripeObject.lines?.data?.[0]?.price?.id ?? null;
        const customerId =
          typeof stripeObject.customer === "string"
            ? stripeObject.customer
            : null;
        const invoiceSubscriptionId =
          typeof stripeObject.subscription === "string"
            ? stripeObject.subscription
            : stripeObject.subscription?.id;
        const amountPaid = (stripeObject.amount_paid ?? 0) / 100;

        if (!customerId) {
          console.warn("Missing customer ID on invoice.paid", {
            invoiceId: stripeObject.id,
          });
          break;
        }

        // Find profile where customer_id equals the customerId (in table called 'profiles')
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("customer_id", customerId)
          .single();

        // Make sure the invoice is for the same plan (priceId) the user subscribed to
        if (!priceId || profile.price_id !== priceId) break;

        // Grant the profile access to your product. It's a boolean in the database, but could be a number of credits, etc...
        await supabase
          .from("profiles")
          .update({
            has_access: true,
            subscription_status: "active",
            stripe_subscription_id: invoiceSubscriptionId,
          })
          .eq("customer_id", customerId);

        const customerEmail =
          stripeObject.customer_email || profile?.email || undefined;

        if (customerEmail && amountPaid > 0) {
          await sendMetaSubscribeEvent({
            email: customerEmail,
            value: amountPaid,
            currency: "BRL",
            eventId: stripeObject.id,
          });
        } else {
          console.warn(
            "[meta] Missing customerEmail or invalid renewal amount",
            {
              eventId: stripeObject.id,
              customerEmail,
              amountPaid,
            },
          );
        }

        break;
      }

      case "invoice.payment_failed": {
        // A payment failed (for instance the customer does not have a valid payment method)
        // ❌ Revoke access to the product
        // ⏳ OR wait for the customer to pay (more friendly):
        //      - Stripe will automatically email the customer (Smart Retries)
        //      - We will receive a "customer.subscription.deleted" when all retries were made and the subscription has expired

        const stripeObject: Stripe.Invoice = event.data
          .object as Stripe.Invoice;

        const customerId =
          typeof stripeObject.customer === "string"
            ? stripeObject.customer
            : null;

        if (!customerId) {
          console.warn("Missing customer ID on invoice.payment_failed", {
            invoiceId: stripeObject.id,
          });
          break;
        }

        await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("customer_id", customerId);

        break;
      }

      default:
      // Unhandled event type
    }
  } catch (e) {
    console.error("stripe error: ", e.message, eventType);
  }

  return NextResponse.json({});
}
