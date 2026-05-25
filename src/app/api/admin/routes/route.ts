import { fail, ok } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import { createRoute } from "@/features/routes/application/get-route-data";
import { routeCreateSchema } from "@/features/routes/domain/schemas";

export async function POST(request: Request) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const body = routeCreateSchema.parse(await request.json());
    const routeId = await createRoute({
      routeName: body.routeName,
      routeDate: body.routeDate,
      driverId: body.driverId ?? null,
      status: body.status,
      encodedPolyline: body.encodedPolyline ?? null,
      bounds: body.bounds ?? null,
    });

    return ok({ routeId }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
