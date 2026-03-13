import { createCheckout, getAnnualPriceId } from "@/libs/stripe";
import { createClient } from "@/libs/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// This function is used to create a Stripe Checkout Session (one-time payment or subscription)
// It's called by the <ButtonCheckout /> component
// Users must be authenticated. It will prefill the Checkout data with their email and/or credit card (if any)
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.successUrl || !body.cancelUrl) {
    return NextResponse.json(
      { error: "Success and cancel URLs are required" },
      { status: 400 },
    );
  } else if (!body.mode) {
    return NextResponse.json(
      {
        error:
          "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      mode,
      successUrl,
      cancelUrl,
      metaEventId,
      metaFbc,
      metaFbp,
      metaUserAgent,
    } = body;
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;

    const stripePriceId = getAnnualPriceId();
    if (!stripePriceId) {
      return NextResponse.json(
        {
          error: "Stripe annual price is not configured",
        },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    const profileUser =
      profile?.email && profile?.customer_id
        ? {
            email: profile?.email,
            customerId: profile?.customer_id,
          }
        : {};

    const isNewCustomer = !profile?.customer_id;
    const newUsersCouponId = process.env.STRIPE_NEW_USERS_COUPON_ID || null;

    const couponCandidates: (string | null)[] = isNewCustomer
      ? [newUsersCouponId, null]
      : [null];

    let stripeSessionURL: string | null = null;
    for (const couponId of couponCandidates) {
      if (
        couponId &&
        couponCandidates.indexOf(couponId) !==
          couponCandidates.lastIndexOf(couponId)
      ) {
        continue;
      }
      stripeSessionURL = await createCheckout({
        priceId: stripePriceId,
        mode,
        successUrl,
        cancelUrl,
        metaEventId,
        metaFbc,
        metaFbp,
        metaClientIp: clientIp,
        metaUserAgent,
        // If user is logged in, it will pass the user ID to the Stripe Session so it can be retrieved in the webhook later
        clientReferenceId: user?.id,
        user: profileUser,
        couponId,
      });

      if (stripeSessionURL) {
        break;
      }
    }

    if (!stripeSessionURL) {
      return NextResponse.json(
        { error: "Unable to create Stripe checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: stripeSessionURL });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
