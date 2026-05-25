import { fail, ok } from "@/core/http/api-response";
import { AppError } from "@/core/errors/app-error";
import { requireSession } from "@/core/auth/session";
import { FirestoreNotificationRepository } from "@/features/notifications/data/firestore-notification-repository";
import { notificationStatusUpdateSchema } from "@/features/notifications/domain/schemas";

const notificationRepository = new FirestoreNotificationRepository();

/**
 * PATCH /api/admin/notifications/:notificationId
 * Allows admins to manually correct a notification status.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  try {
    await requireSession(["admin"]);
    const { notificationId } = await context.params;
    const body = notificationStatusUpdateSchema.parse(await request.json());

    await notificationRepository.updateStatus(notificationId, body.status, {
      errorMessage: body.errorMessage ?? null,
    });

    return ok({ notificationId });
  } catch (error) {
    return fail(error);
  }
}

/**
 * GET /api/admin/notifications?routeId=xxx
 * Returns all notifications for a given route.
 */
export async function GET(request: Request) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("routeId");

    if (!routeId) {
      throw new AppError({ message: "routeId query parameter is required", statusCode: 400 });
    }

    const notifications =
      await notificationRepository.getNotificationsByRoute(routeId);

    return ok({ notifications });
  } catch (error) {
    return fail(error);
  }
}
