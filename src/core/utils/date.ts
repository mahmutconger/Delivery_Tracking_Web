import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

/**
 * @brief Bir Date nesnesini rota sorgularında kullanılan "yyyy-MM-dd" biçimine dönüştürür.
 * @param date Dönüştürülecek tarih nesnesi.
 * @returns "yyyy-MM-dd" formatında tarih dizesi.
 */
export function toRouteDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/**
 * @brief Bir tarihi `<input type="datetime-local">` alanının beklediği yerel saat biçimine dönüştürür.
 * @param date Dönüştürülecek tarih nesnesi (varsayılan: şu an).
 * @returns "yyyy-MM-ddTHH:mm" formatında dize, geçersiz girişte boş dize.
 */
export function toDateTimeLocalInput(date: Date = new Date()) {
  return isValid(date) ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}

/**
 * @brief "yyyy-MM-dd" biçimindeki bir rota tarihini okunabilir formata çevirir.
 * @param value ISO 8601 tarih dizesi (örn. "2024-03-15").
 * @returns Geçerliyse "MMM d, yyyy" (örn. "Mar 15, 2024"), geçersizse orijinal değer.
 */
export function formatRouteDate(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy") : value;
}

/**
 * @brief Tarih/zaman değerini insan tarafından okunabilir biçime dönüştürür.
 * @param value ISO tarih dizesi veya Unix zaman damgası (ms). null/undefined ise "N/A" döner.
 * @returns "MMM d, yyyy HH:mm" formatında dize, geçersiz girişte "N/A".
 */
export function formatDateTime(value?: string | number | null) {
  if (!value && value !== 0) return "N/A";

  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (!isValid(date)) return "N/A";

  return format(date, "MMM d, yyyy HH:mm");
}

/**
 * @brief Bir zaman damgasını şu ana göre göreli süre olarak biçimlendirir.
 * @param value ISO tarih dizesi veya Unix zaman damgası (ms). null/undefined ise "hiç" döner.
 * @returns "3 dakika önce" gibi göreli zaman dizesi; geçersiz girişte "bilinmiyor".
 */
export function getRelativeTime(value?: string | number | null) {
  if (!value && value !== 0) return "hiç";

  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (!isValid(date)) return "bilinmiyor";

  return formatDistanceToNowStrict(date, { addSuffix: true, locale: tr });
}
