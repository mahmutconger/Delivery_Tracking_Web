import { z } from "zod";

import { fail } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import { buildCompletionReport } from "@/features/routes/application/build-completion-report";
import { FirestoreRouteRepository } from "@/features/routes/data/firestore-route-repository";

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"),
});

const routeRepository = new FirestoreRouteRepository();

/**
 * GET /api/admin/routes/export?startDate=2026-05-01&endDate=2026-05-31
 *
 * Returns a CSV file of all route stops in the given date range.
 * Stops for each route are fetched in parallel (Promise.all).
 * The CSV is built server-side using buildCompletionReport so the same
 * pure algorithm can also be used client-side without a network call.
 */
export async function GET(request: Request) {
  try {
    await requireSession(["admin", "dispatcher"]);

    const { searchParams } = new URL(request.url);
    const { startDate, endDate } = querySchema.parse({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    if (startDate > endDate) {
      return new Response(
        JSON.stringify({ ok: false, error: { message: "startDate must be ≤ endDate" } }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    const routes = await routeRepository.listRoutesByDateRange(startDate, endDate);

    const routesWithStops = await Promise.all(
      routes.map(async (route) => {
        const detail = await routeRepository.getRouteWithStops(route.id);
        return {
          route,
          stops: detail?.stops ?? [],
        };
      }),
    );

    const { csvContent, summary } = buildCompletionReport(routesWithStops);
    const filename = `teslimat-raporu-${startDate}-${endDate}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "x-report-total-routes": String(summary.totalRoutes),
        "x-report-total-stops": String(summary.totalStops),
        "x-report-delivered": String(summary.delivered),
      },
    });
  } catch (error) {
    return fail(error);
  }
}
