import { formatDateTime } from "@/core/utils/date";
import { Card, CardTitle } from "@/shared/components/card";
import { StatusBadge } from "@/shared/components/status-badge";
import type { Notification } from "@/features/notifications/domain/models";

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  return (
    <Card>
      <CardTitle>Bildirim geçmişi</CardTitle>

      {notifications.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Bu rota için henüz bildirim gönderilmedi.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={n.status} />
                  <StatusBadge value={n.channel} />
                  <span className="font-medium text-slate-800">{n.recipient}</span>
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
              </div>

              <p className="mt-1 text-slate-500">
                Şablon: <span className="font-medium text-slate-700">{n.templateKey}</span>
              </p>

              {n.sentAt && (
                <p className="text-xs text-slate-400">Gönderildi: {formatDateTime(n.sentAt)}</p>
              )}

              {n.errorMessage && (
                <p className="mt-1 text-xs text-rose-600">Hata: {n.errorMessage}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
