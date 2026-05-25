export const NOTIFICATION_CHANNELS = ["sms", "whatsapp"] as const;
export const NOTIFICATION_STATUSES = [
  "pending",
  "sent",
  "failed",
  "delivered",
] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/**
 * Firestore document shape for the "notifications" collection.
 *
 * One document = one outbound message attempt.
 * Re-sends create a new document — the history is preserved.
 */
export interface Notification {
  id: string;
  routeId: string;
  stopId: string | null;
  driverId: string;
  channel: NotificationChannel;
  recipient: string;
  templateKey: string;
  status: NotificationStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  routeId: string;
  stopId?: string | null;
  driverId: string;
  channel: NotificationChannel;
  recipient: string;
  templateKey: string;
}
