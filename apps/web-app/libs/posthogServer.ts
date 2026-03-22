import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

function getClient(): PostHog {
  if (!_client) {
    _client = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_dummy_key",
      {
        host:
          process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://us.i.posthog.com",
      },
    );
  }
  return _client;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const client = getClient();
  client.capture({ distinctId, event, properties });
  await client.flush();
}
