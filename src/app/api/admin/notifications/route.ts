import { fail, ok } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import { sendNotification } from "@/features/notifications/application/send-notification";
import { notificationCreateSchema } from "@/features/notifications/domain/schemas";

/**
 * POST /api/admin/notifications
 *
 * Sends a notification. Server-side throttle prevents duplicate sends
 * within 60 seconds for the same routeId + channel combination.
 */
export async function POST(request: Request) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const body = notificationCreateSchema.parse(await request.json());

    const result = await sendNotification(body);

    return ok(result, { status: result.status === "sent" ? 201 : 200 });
  } catch (error) {
    return fail(error);
  }
}
