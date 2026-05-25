import { z } from "zod";

import { isValidLatitude, isValidLongitude } from "@/core/utils/geo";
import { stopCreateSchema } from "@/features/stops/domain/schemas";

/**
 * Known field-name aliases from external systems (Tally, Excel exports, etc.).
 * Add entries here to support additional column naming conventions without
 * touching the normalisation logic.
 */
const FIELD_ALIASES: Record<string, string> = {
  // Customer name variants
  CUST_NAME: "customerName",
  cust_name: "customerName",
  customer: "customerName",
  name: "customerName",
  müşteri: "customerName",
  musteri: "customerName",

  // Address variants
  ADDR: "address",
  addr: "address",
  ADDRESS: "address",
  adres: "address",

  // Latitude variants
  LAT: "latitude",
  lat: "latitude",
  LATITUDE: "latitude",
  enlem: "latitude",

  // Longitude variants
  LON: "longitude",
  LNG: "longitude",
  lng: "longitude",
  LONGITUDE: "longitude",
  boylam: "longitude",

  // Sequence variants
  SEQ: "sequence",
  seq: "sequence",
  order: "sequence",
  sira: "sequence",
  sıra: "sequence",
};

type StopCreateInput = z.input<typeof stopCreateSchema>;

export interface NormalizeResult {
  valid: StopCreateInput[];
  rejected: Array<{ rowIndex: number; rawRow: Record<string, string>; reason: string }>;
}

/**
 * Converts an array of raw CSV rows (from parseCsv) into validated stop
 * create inputs.
 *
 * Algorithm:
 * 1. Remap known alias column names to canonical field names.
 * 2. Coerce latitude / longitude strings to numbers.
 * 3. Run each row through stopCreateSchema — collect errors for invalid rows.
 * 4. Auto-assign sequence numbers to valid rows (preserving CSV order).
 *
 * Returns { valid[], rejected[] } so the caller can surface rejected rows
 * to the admin without aborting the whole import.
 */
export function normalizeImportRows(
  rows: Record<string, string>[],
): NormalizeResult {
  const valid: StopCreateInput[] = [];
  const rejected: NormalizeResult["rejected"] = [];

  rows.forEach((rawRow, rowIndex) => {
    // Step 1 — remap aliases to canonical names
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawRow)) {
      const canonical = FIELD_ALIASES[key] ?? key;
      mapped[canonical] = value;
    }

    // Step 2 — coerce numeric fields
    if (mapped.latitude !== undefined) {
      mapped.latitude = Number(mapped.latitude);
    }
    if (mapped.longitude !== undefined) {
      mapped.longitude = Number(mapped.longitude);
    }
    if (mapped.sequence !== undefined) {
      const seq = Number(mapped.sequence);
      mapped.sequence = Number.isNaN(seq) ? undefined : seq;
    }

    // Step 3 — validate
    const result = stopCreateSchema.safeParse(mapped);

    if (!result.success) {
      const reason = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      rejected.push({ rowIndex, rawRow, reason });
      return;
    }

    // Extra coordinate sanity check (schema already does it, but be explicit)
    if (
      !isValidLatitude(result.data.latitude) ||
      !isValidLongitude(result.data.longitude)
    ) {
      rejected.push({
        rowIndex,
        rawRow,
        reason: "Koordinatlar geçerli aralıkta değil.",
      });
      return;
    }

    valid.push(result.data);
  });

  // Step 4 — assign sequential sequence numbers to valid rows that lack one
  let nextSequence = 1;
  for (const stop of valid) {
    if (!stop.sequence) {
      stop.sequence = nextSequence;
    }
    nextSequence = Math.max(nextSequence, stop.sequence) + 1;
  }

  return { valid, rejected };
}
