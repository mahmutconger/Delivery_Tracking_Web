import { z } from "zod";

import { ROUTE_STATUSES } from "@/features/routes/domain/models";

export const routeIdSchema = z.string().trim().min(1);
export const routeDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const routeCreateSchema = z.object({
  routeName: z.string().trim().min(3).max(120),
  routeDate: routeDateSchema,
  driverId: z.string().trim().min(1).nullable().optional(),
  status: z.enum(ROUTE_STATUSES).default("draft"),
  encodedPolyline: z.string().trim().nullable().optional(),
  bounds: z
    .object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    })
    .nullable()
    .optional(),
});

export const routeUpdateSchema = routeCreateSchema.partial().extend({
  status: z.enum(ROUTE_STATUSES).optional(),
});

export const routeAssignSchema = z.object({
  driverId: z.string().trim().min(1).nullable(),
});
