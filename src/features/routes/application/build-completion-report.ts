import { buildCsvRows, type CsvColumn } from "@/core/utils/csv";
import { formatDateTime } from "@/core/utils/date";
import type { DailyRoute } from "@/features/routes/domain/models";
import type { DeliveryStop } from "@/features/stops/domain/models";

export interface RouteWithStops {
  route: DailyRoute;
  stops: DeliveryStop[];
}

interface ReportRow {
  routeDate: string;
  routeName: string;
  routeStatus: string;
  stopSequence: number;
  customerName: string;
  address: string;
  stopStatus: string;
  deliveredAt: string;
  proofUploadState: string;
}

/**
 * Aggregates route + stop data into a flat report structure.
 *
 * Algorithm: two-level reduce — outer iterates routes, inner iterates stops.
 * Result: { rows, summary } where summary holds aggregate counts.
 *
 * This is a pure function with no side effects — safe to call in tests
 * and usable both server-side (API route) and client-side (export button).
 */
export function buildCompletionReport(data: RouteWithStops[]): {
  csvContent: string;
  summary: {
    totalRoutes: number;
    totalStops: number;
    delivered: number;
    pending: number;
    failedProofUploads: number;
  };
} {
  const rows: ReportRow[] = [];

  const summary = data.reduce(
    (acc, { route, stops }) => {
      acc.totalRoutes += 1;

      stops.forEach((stop) => {
        acc.totalStops += 1;
        if (stop.status === "delivered") acc.delivered += 1;
        if (stop.status === "pending") acc.pending += 1;
        if (stop.proofUploadState === "failed") acc.failedProofUploads += 1;

        rows.push({
          routeDate: route.routeDate,
          routeName: route.routeName,
          routeStatus: route.status,
          stopSequence: stop.sequence,
          customerName: stop.customerName,
          address: stop.address,
          stopStatus: stop.status,
          deliveredAt: formatDateTime(stop.deliveredAt),
          proofUploadState: stop.proofUploadState,
        });
      });

      return acc;
    },
    {
      totalRoutes: 0,
      totalStops: 0,
      delivered: 0,
      pending: 0,
      failedProofUploads: 0,
    },
  );

  const columns: CsvColumn<ReportRow>[] = [
    { header: "Rota Tarihi", accessor: (r) => r.routeDate },
    { header: "Rota Adı", accessor: (r) => r.routeName },
    { header: "Rota Durumu", accessor: (r) => r.routeStatus },
    { header: "Sıra", accessor: (r) => r.stopSequence },
    { header: "Müşteri", accessor: (r) => r.customerName },
    { header: "Adres", accessor: (r) => r.address },
    { header: "Durak Durumu", accessor: (r) => r.stopStatus },
    { header: "Teslim Tarihi", accessor: (r) => r.deliveredAt },
    { header: "Kanıt Durumu", accessor: (r) => r.proofUploadState },
  ];

  return { csvContent: buildCsvRows(rows, columns), summary };
}
