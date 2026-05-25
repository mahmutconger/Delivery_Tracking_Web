import { fail, ok } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import { updateRoute } from "@/features/routes/application/get-route-data";
import { routeUpdateSchema } from "@/features/routes/domain/schemas";
import { FirestoreRouteRepository } from "@/features/routes/data/firestore-route-repository";
import { FirestoreDriverRepository } from "@/features/drivers/data/firestore-driver-repository";
import { sendNotification } from "@/features/notifications/application/send-notification";

const routeRepository = new FirestoreRouteRepository();
const driverRepository = new FirestoreDriverRepository();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ routeId: string }> },
) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const { routeId } = await context.params;
    const body = routeUpdateSchema.parse(await request.json());

    await updateRoute(routeId, body);

    if (body.status === "in_progress") {
      void notifyRouteStarted(routeId);
    }

    return ok({ routeId });
  } catch (error) {
    return fail(error);
  }
}

async function notifyRouteStarted(routeId: string) {
  try {
    const route = await routeRepository.getRouteById(routeId);
    if (!route?.driverId) return;
    const driver = await driverRepository.getDriverById(route.driverId);
    if (!driver?.phoneNumber) return;
    await sendNotification({
      routeId,
      driverId: route.driverId,
      channel: "sms",
      recipient: driver.phoneNumber,
      templateKey: "route_started",
    });
  } catch {
    // Bildirim hatası ana işlemi etkilemez
  }
}
