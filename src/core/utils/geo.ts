export interface RouteBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isLocationStale(recordedAtMillis?: number | null, thresholdMinutes = 15) {
  if (!recordedAtMillis) return true;

  const ageMs = Date.now() - recordedAtMillis;
  return ageMs > thresholdMinutes * 60 * 1000;
}

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
