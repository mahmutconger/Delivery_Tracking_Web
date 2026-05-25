import twilio from "twilio";

import { AppError } from "@/core/errors/app-error";
import { FirestoreNotificationRepository } from "@/features/notifications/data/firestore-notification-repository";
import type { CreateNotificationInput } from "@/features/notifications/domain/models";

const MESSAGE_TEMPLATES: Record<string, string> = {
  route_assigned: "Rotanız atandı. Teslimat detayları için uygulamayı kontrol edin.",
  route_started: "Teslimat rotanız başladı. İyi yolculuklar!",
  stop_delivered: "Teslimat tamamlandı. Teşekkürler!",
  stop_failed: "Teslimat gerçekleştirilemedi. Lütfen sürücüyle iletişime geçin.",
};

function resolveTemplate(templateKey: string): string {
  return MESSAGE_TEMPLATES[templateKey] ?? templateKey;
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new AppError({
      message: "Twilio kimlik bilgileri yapılandırılmamış.",
      statusCode: 500,
      code: "PROVIDER_NOT_CONFIGURED",
    });
  }

  return twilio(accountSid, authToken);
}

const THROTTLE_WINDOW_MS = 60_000;

const notificationRepository = new FirestoreNotificationRepository();

/**
 * Sends an outbound notification (SMS or WhatsApp) to the given recipient.
 *
 * Algorithm:
 * 1. Check if a notification for the same routeId + channel was already
 *    sent within THROTTLE_WINDOW_MS — if so, reject with 429.
 * 2. Persist the notification document with status "pending" FIRST.
 *    This guarantees we have an audit trail even if the provider call fails.
 * 3. Call the external provider (currently logged, ready for real SDK).
 * 4. On success → update status to "sent".
 *    On failure → update status to "failed" + record errorMessage.
 *    Provider errors are caught independently so the audit record is
 *    never lost due to a provider outage.
 */
export async function sendNotification(
  input: CreateNotificationInput,
): Promise<{ notificationId: string; status: "sent" | "failed" }> {
  // Step 1 — throttle check (server-side, Firestore-backed)
  const lastSentAt = await notificationRepository.getLastSentAt(
    input.routeId,
    input.channel,
  );

  if (lastSentAt) {
    const elapsedMs = Date.now() - lastSentAt.getTime();
    if (elapsedMs < THROTTLE_WINDOW_MS) {
      const remainingSeconds = Math.ceil((THROTTLE_WINDOW_MS - elapsedMs) / 1000);
      throw new AppError({
        message: `Bu rota için ${input.channel} bildirimi ${remainingSeconds} saniye içinde tekrar gönderilemez.`,
        statusCode: 429,
        code: "NOTIFICATION_THROTTLED",
        details: { remainingSeconds },
      });
    }
  }

  // Step 2 — persist audit record before touching the provider
  const notificationId = await notificationRepository.createNotification(input);

  // Step 3 & 4 — call provider, update status regardless of outcome
  try {
    await dispatchToProvider(input);
    await notificationRepository.updateStatus(notificationId, "sent");
    return { notificationId, status: "sent" };
  } catch (providerError) {
    const errorMessage =
      providerError instanceof Error
        ? providerError.message
        : "Bilinmeyen sağlayıcı hatası";

    await notificationRepository.updateStatus(notificationId, "failed", {
      errorMessage,
    });

    return { notificationId, status: "failed" };
  }
}

export async function getNotificationsForRoute(routeId: string) {
  return notificationRepository.getNotificationsByRoute(routeId);
}

async function dispatchToProvider(input: CreateNotificationInput): Promise<void> {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!fromNumber) {
    throw new AppError({
      message: "TWILIO_FROM_NUMBER yapılandırılmamış.",
      statusCode: 500,
      code: "PROVIDER_NOT_CONFIGURED",
    });
  }

  const body = resolveTemplate(input.templateKey);

  const from =
    input.channel === "whatsapp"
      ? `whatsapp:${fromNumber}`
      : fromNumber;

  const to =
    input.channel === "whatsapp"
      ? `whatsapp:${input.recipient}`
      : input.recipient;

  await client.messages.create({ from, to, body });
}
