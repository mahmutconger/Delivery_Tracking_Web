import { fail, ok } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import { reorderStops } from "@/features/routes/application/get-route-data";
import { stopReorderSchema } from "@/features/stops/domain/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ routeId: string }> },
) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const { routeId } = await context.params;
    const body = stopReorderSchema.parse(await request.json());
    await reorderStops(routeId, body.stopIds);

    return ok({ routeId });
  } catch (error) {
    return fail(error);
  }
}
