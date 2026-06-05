/**
 * @brief Bir rotanın coğrafi sınır kutusunu temsil eder.
 */
export interface RouteBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * @brief Verilen sayının geçerli bir enlem değeri olup olmadığını kontrol eder.
 * @param value Kontrol edilecek sayısal değer.
 * @returns Değer [-90, 90] aralığında sonlu bir sayıysa true, aksi halde false.
 */
export function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

/**
 * @brief Verilen sayının geçerli bir boylam değeri olup olmadığını kontrol eder.
 * @param value Kontrol edilecek sayısal değer.
 * @returns Değer [-180, 180] aralığında sonlu bir sayıysa true, aksi halde false.
 */
export function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

/**
 * @brief Bir konumun belirtilen süreyi aşıp aşmadığını kontrol eder.
 * @param recordedAtMillis Konumun kaydedildiği Unix zaman damgası (ms). null veya undefined ise konum eski kabul edilir.
 * @param thresholdMinutes Bayat sayılma eşiği (dakika). Varsayılan: 15.
 * @returns Konum eşikten eski veya hiç kaydedilmemişse true.
 */
export function isLocationStale(recordedAtMillis?: number | null, thresholdMinutes = 15) {
  if (!recordedAtMillis) return true;

  const ageMs = Date.now() - recordedAtMillis;
  return ageMs > thresholdMinutes * 60 * 1000;
}

/**
 * @brief Bir nokta dizisinden minimum kapsayan sınır kutusunu hesaplar.
 * @param points Enlem/boylam çiftlerinden oluşan dizi.
 * @returns Tüm noktaları kapsayan RouteBounds nesnesi; dizi boşsa null.
 */
export function createBounds(points: Array<{ latitude: number; longitude: number }>) {
  if (points.length === 0) {
    return null;
  }

  return points.reduce<RouteBounds>(
    (accumulator, point) => ({
      north: Math.max(accumulator.north, point.latitude),
      south: Math.min(accumulator.south, point.latitude),
      east: Math.max(accumulator.east, point.longitude),
      west: Math.min(accumulator.west, point.longitude),
    }),
    {
      north: points[0].latitude,
      south: points[0].latitude,
      east: points[0].longitude,
      west: points[0].longitude,
    },
  );
}
