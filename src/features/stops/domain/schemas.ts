import { z } from "zod";

import { isValidLatitude, isValidLongitude } from "@/core/utils/geo";
import {
  PROOF_UPLOAD_STATES,
  STOP_STATUSES,
} from "@/features/stops/domain/models";

export const stopBaseSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(240),
  latitude: z.number().refine(isValidLatitude, "Latitude must be between -90 and 90"),
  longitude: z
    .number()
    .refine(isValidLongitude, "Longitude must be between -180 and 180"),
  status: z.enum(STOP_STATUSES).default("pending"),
  deliveredAt: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine(
      (value) => !value || !Number.isNaN(new Date(value).valueOf()),
      "Delivered time must be a valid date-time.",
    ),
  proofImagePath: z.string().trim().nullable().optional(),
  proofUploadState: z.enum(PROOF_UPLOAD_STATES).default("none"),
});

export const stopCreateSchema = stopBaseSchema.extend({
  sequence: z.number().int().positive().optional(),
});

export const stopUpdateSchema = stopBaseSchema.partial();

export const stopReorderSchema = z.object({
  stopIds: z.array(z.string().trim().min(1)).min(1),
});
