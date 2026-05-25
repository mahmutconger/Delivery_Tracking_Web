import { fail, ok } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import {
  deleteStop,
  updateStop,
} from "@/features/routes/application/get-route-data";
import { stopUpdateSchema } from "@/features/stops/domain/schemas";
import { FirestoreRouteRepository } from "@/features/routes/data/firestore-route-repository";
import { FirestoreDriverRepository } from "@/features/drivers/data/firestore-driver-repository";
import { sendNotification } from "@/features/notifications/application/send-notification";

const routeRepository = new FirestoreRouteRepository();
const driverRepository = new FirestoreDriverRepository();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ routeId: string; stopId: string }> },
) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const { routeId, stopId } = await context.params;
    const body = stopUpdateSchema.parse(await request.json());
    await updateStop(routeId, stopId, body);

    if (body.status === "delivered") {
      void notifyStopStatusChanged(routeId, stopId);
    }

    return ok({ routeId, stopId });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ routeId: string; stopId: string }> },
) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const { routeId, stopId } = await context.params;
    await deleteStop(routeId, stopId);

    return ok({ routeId, stopId });
  } catch (error) {
    return fail(error);
  }
}

async function notifyStopStatusChanged(routeId: string, stopId: string) {
  try {
    const route = await routeRepository.getRouteById(routeId);
    if (!route?.driverId) return;
    const driver = await driverRepository.getDriverById(route.driverId);
    if (!driver?.phoneNumber) return;
    await sendNotification({
      routeId,
      stopId,
      driverId: route.driverId,
      channel: "sms",
      recipient: driver.phoneNumber,
      templateKey: "stop_delivered",
    });
  } catch {
    // Bildirim hatası ana işlemi etkilemez
  }
}
