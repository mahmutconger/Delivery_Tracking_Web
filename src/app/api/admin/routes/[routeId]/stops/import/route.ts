import { AppError } from "@/core/errors/app-error";
import { fail, ok } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import { parseCsv } from "@/core/utils/csv-parser";
import { normalizeImportRows } from "@/features/stops/application/normalize-import-rows";
import { FirestoreRouteRepository } from "@/features/routes/data/firestore-route-repository";

const routeRepository = new FirestoreRouteRepository();

/**
 * POST /api/admin/routes/:routeId/stops/import
 * Content-Type: multipart/form-data  (field name: "file")
 *
 * Parses a CSV file and bulk-imports valid rows as stops on the route.
 *
 * Algorithm:
 * 1. Read the uploaded file as text.
 * 2. parseCsv → normalizeImportRows to split valid / rejected rows.
 * 3. Persist each valid stop sequentially (Firestore transactions handle
 *    sequence integrity individually).
 * 4. Return { imported, rejected } so the admin can review failures.
 *
 * Invalid rows never block valid ones — partial import is allowed.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ routeId: string }> },
) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const { routeId } = await context.params;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      throw new AppError({
        message: "Multipart form field 'file' with a CSV attachment is required.",
        statusCode: 400,
      });
    }

    const csvText = await (file as File).text();

    if (!csvText.trim()) {
      throw new AppError({ message: "Yüklenen CSV dosyası boş.", statusCode: 400 });
    }

    const rawRows = parseCsv(csvText);

    if (rawRows.length === 0) {
      throw new AppError({ message: "CSV dosyasında veri satırı bulunamadı.", statusCode: 400 });
    }

    const { valid, rejected } = normalizeImportRows(rawRows);

    const importedIds: string[] = [];
    const importErrors: Array<{ stopInput: unknown; error: string }> = [];

    for (const stopInput of valid) {
      try {
        const stopId = await routeRepository.createStop(routeId, {
          customerName: stopInput.customerName,
          address: stopInput.address,
          latitude: stopInput.latitude,
          longitude: stopInput.longitude,
          status: stopInput.status ?? "pending",
          sequence: stopInput.sequence,
          deliveredAt: stopInput.deliveredAt ?? null,
          proofImagePath: stopInput.proofImagePath ?? null,
          proofUploadState: stopInput.proofUploadState ?? "none",
        });
        importedIds.push(stopId);
      } catch (createError) {
        importErrors.push({
          stopInput,
          error: createError instanceof Error ? createError.message : "Bilinmeyen hata",
        });
      }
    }

    return ok(
      {
        imported: importedIds.length,
        rejected: rejected.map(({ rowIndex, rawRow, reason }) => ({
          rowIndex,
          rawRow,
          reason,
        })),
        importErrors,
      },
      { status: 201 },
    );
  } catch (error) {
    return fail(error);
  }
}
