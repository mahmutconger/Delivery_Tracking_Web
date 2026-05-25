import { FieldValue } from "firebase-admin/firestore";

import { toFirestoreReadinessError } from "@/core/errors/app-error";
import { getAdminDb, isAdminAvailable } from "@/lib/firebase/admin";
import type {
  CreateNotificationInput,
  Notification,
  NotificationStatus,
} from "@/features/notifications/domain/models";

function mapNotificationDocument(
  id: string,
  data: FirebaseFirestore.DocumentData,
): Notification {
  return {
    id,
    routeId: String(data.routeId ?? ""),
    stopId: data.stopId ?? null,
    driverId: String(data.driverId ?? ""),
    channel: data.channel,
    recipient: String(data.recipient ?? ""),
    templateKey: String(data.templateKey ?? ""),
    status: data.status,
    sentAt: data.sentAt?.toDate?.()?.toISOString() ?? null,
    deliveredAt: data.deliveredAt?.toDate?.()?.toISOString() ?? null,
    errorMessage: data.errorMessage ?? null,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export class FirestoreNotificationRepository {
  private readonly collection = "notifications";

  private normalizeReadError(error: unknown): never {
    const readinessError = toFirestoreReadinessError(error);
    throw readinessError ?? error;
  }

  async createNotification(input: CreateNotificationInput): Promise<string> {
    if (!isAdminAvailable()) {
      throw new Error("Firebase Admin is not configured.");
    }

    const id = crypto.randomUUID();
    await getAdminDb()
      .collection(this.collection)
      .doc(id)
      .set({
        ...input,
        stopId: input.stopId ?? null,
        status: "pending",
        sentAt: null,
        deliveredAt: null,
        errorMessage: null,
        createdAt: FieldValue.serverTimestamp(),
      });

    return id;
  }

  async getNotificationsByRoute(routeId: string): Promise<Notification[]> {
    if (!isAdminAvailable()) return [];

    try {
      const snapshot = await getAdminDb()
        .collection(this.collection)
        .where("routeId", "==", routeId)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) =>
        mapNotificationDocument(doc.id, doc.data()),
      );
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  async getLastSentAt(
    routeId: string,
    channel: string,
  ): Promise<Date | null> {
    if (!isAdminAvailable()) return null;

    try {
      const snapshot = await getAdminDb()
        .collection(this.collection)
        .where("routeId", "==", routeId)
        .where("channel", "==", channel)
        .where("status", "in", ["sent", "pending"])
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data();
      return data.createdAt?.toDate?.() ?? null;
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  async updateStatus(
    notificationId: string,
    status: NotificationStatus,
    details?: { errorMessage?: string | null },
  ): Promise<void> {
    if (!isAdminAvailable()) return;

    const update: Record<string, unknown> = { status };

    if (status === "sent") {
      update.sentAt = FieldValue.serverTimestamp();
    } else if (status === "delivered") {
      update.deliveredAt = FieldValue.serverTimestamp();
    } else if (status === "failed" && details?.errorMessage) {
      update.errorMessage = details.errorMessage;
    }

    await getAdminDb()
      .collection(this.collection)
      .doc(notificationId)
      .update(update);
  }
}
