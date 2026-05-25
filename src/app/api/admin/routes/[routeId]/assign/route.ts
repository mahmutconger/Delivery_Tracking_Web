import { fail, ok } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import { assignRoute } from "@/features/routes/application/get-route-data";
import { routeAssignSchema } from "@/features/routes/domain/schemas";
import { FirestoreDriverRepository } from "@/features/drivers/data/firestore-driver-repository";
import { sendNotification } from "@/features/notifications/application/send-notification";

const driverRepository = new FirestoreDriverRepository();

export async function POST(
  request: Request,
  context: { params: Promise<{ routeId: string }> },
) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const { routeId } = await context.params;
    const body = routeAssignSchema.parse(await request.json());
    await assignRoute(routeId, body.driverId ?? null);

    if (body.driverId) {
      void notifyDriverAssigned(routeId, body.driverId);
    }

    return ok({ routeId });
  } catch (error) {
    return fail(error);
  }
}

async function notifyDriverAssigned(routeId: string, driverId: string) {
  try {
    const driver = await driverRepository.getDriverById(driverId);
    if (!driver?.phoneNumber) return;
    await sendNotification({
      routeId,
      driverId,
      channel: "sms",
      recipient: driver.phoneNumber,
      templateKey: "route_assigned",
    });
  } catch {
    // Bildirim hatası ana işlemi etkilemez
  }
}
