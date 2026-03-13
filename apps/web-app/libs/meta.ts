import { createHash } from "crypto";

interface SendMetaSubscribeEventInput {
  email: string;
  value: number;
  currency: "BRL";
  eventId: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export async function sendMetaSubscribeEvent({
  email,
  value,
  currency,
  eventId,
  clientIpAddress,
  clientUserAgent,
  fbc,
  fbp,
}: SendMetaSubscribeEventInput): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn("[meta] META_PIXEL_ID or META_ACCESS_TOKEN not configured");
    return;
  }

  const hashedEmail = hashEmail(email);
  const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

  const payload = {
    data: [
      {
        event_name: "Subscribe",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        user_data: {
          em: hashedEmail,
          ...(clientIpAddress && { client_ip_address: clientIpAddress }),
          ...(clientUserAgent && { client_user_agent: clientUserAgent }),
          ...(fbc && { fbc }),
          ...(fbp && { fbp }),
        },
        custom_data: {
          currency,
          value,
        },
      },
    ],
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      console.error("[meta] Subscribe event failed", {
        status: response.status,
        responseBody,
        eventId,
      });
      return;
    }

    const data = await response.json();
  } catch (error) {
    console.error("[meta] Unexpected error sending Subscribe event", {
      eventId,
      error,
    });
  }
}
