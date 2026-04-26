import webpush from "web-push";
import { env } from "@/env";

let configured = false;

function configure() {
  if (configured) return;
  if (
    !env.VAPID_PUBLIC_KEY ||
    !env.VAPID_PRIVATE_KEY ||
    !env.VAPID_SUBJECT
  ) {
    return;
  }
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  configured = true;
}

export function isPushConfigured(): boolean {
  configure();
  return configured;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
): Promise<{ ok: true } | { ok: false; gone: boolean; error: string }> {
  configure();
  if (!configured) return { ok: false, gone: false, error: "Push não configurado." };

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
    return { ok: true };
  } catch (err) {
    const status =
      err && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;
    const gone = status === 404 || status === 410;
    return {
      ok: false,
      gone,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
