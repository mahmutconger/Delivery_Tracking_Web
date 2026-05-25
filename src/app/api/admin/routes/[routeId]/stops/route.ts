import { fail, ok } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import { createStop } from "@/features/routes/application/get-route-data";
import { stopCreateSchema } from "@/features/stops/domain/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ routeId: string }> },
) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const { routeId } = await context.params;
    const body = stopCreateSchema.parse(await request.json());
    const stopId = await createStop(routeId, body);

    return ok({ routeId, stopId }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
