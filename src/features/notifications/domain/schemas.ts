import { z } from "zod";

import { NOTIFICATION_CHANNELS } from "@/features/notifications/domain/models";

export const notificationCreateSchema = z.object({
  routeId: z.string().trim().min(1),
  stopId: z.string().trim().min(1).nullable().optional(),
  driverId: z.string().trim().min(1),
  channel: z.enum(NOTIFICATION_CHANNELS),
  recipient: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{6,14}$/, "Geçerli bir telefon numarası girin (+905XXXXXXXXX)"),
  templateKey: z.string().trim().min(1).max(64),
});

export const notificationStatusUpdateSchema = z.object({
  status: z.enum(["pending", "sent", "failed", "delivered"]),
  errorMessage: z.string().trim().nullable().optional(),
});
