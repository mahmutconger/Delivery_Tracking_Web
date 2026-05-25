import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

export function toRouteDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function formatRouteDate(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy") : value;
}

export function formatDateTime(value?: string | number | null) {
  if (!value && value !== 0) return "N/A";

  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (!isValid(date)) return "N/A";

  return format(date, "MMM d, yyyy HH:mm");
}

export function getRelativeTime(value?: string | number | null) {
  if (!value && value !== 0) return "never";

  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (!isValid(date)) return "unknown";

  return formatDistanceToNowStrict(date, { addSuffix: true });
}
