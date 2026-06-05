/**
 * @brief Sunucu tarafı veri okuma sonucunu temsil eden discriminated union.
 *
 * "ready" durumu verinin hazır olduğunu, "setup_required" ise kullanıcının
 * yapılandırma adımlarını tamamlaması gerektiğini gösterir.
 */
export type ServerReadState<T> =
  | {
      status: "ready";
      data: T;
    }
  | {
      status: "setup_required";
      message: string;
      data: T;
    };

/**
 * @brief Verinin başarıyla hazırlandığını belirten bir ServerReadState oluşturur.
 * @param data Döndürülecek veri.
 * @returns status "ready" olan ServerReadState nesnesi.
 */
export function readyState<T>(data: T): ServerReadState<T> {
  return {
    status: "ready",
    data,
  };
}

/**
 * @brief Kullanıcıdan yapılandırma gerektiren bir ServerReadState oluşturur.
 * @param message Kullanıcıya gösterilecek açıklama mesajı.
 * @param data Varsayılan veya boş veri; sayfanın render edilmesini sağlar.
 * @returns status "setup_required" olan ServerReadState nesnesi.
 */
export function setupRequiredState<T>(
  message: string,
  data: T,
): ServerReadState<T> {
  return {
    status: "setup_required",
    message,
    data,
  };
}
