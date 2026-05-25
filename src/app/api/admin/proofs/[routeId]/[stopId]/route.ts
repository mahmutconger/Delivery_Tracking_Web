import { redirect } from "next/navigation";

import { fail } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import { getStopProofUrl } from "@/features/routes/application/get-route-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ routeId: string; stopId: string }> },
) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const { routeId, stopId } = await context.params;
    const url = await getStopProofUrl(routeId, stopId);

    redirect(url);
  } catch (error) {
    return fail(error);
  }
}
