/**
 * @brief Google Encoded Polyline Algorithm Format ile kodlanmış bir dizeyi koordinat çiftlerine dönüştürür.
 * @param encoded Kodlanmış polyline dizesi. null veya undefined ise boş dizi döner.
 * @returns [enlem, boylam] çiftlerinden oluşan dizi.
 */
export function decodePolyline(encoded?: string | null) {
  if (!encoded) {
    return [] as Array<[number, number]>;
  }

  const points: Array<[number, number]> = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    points.push([latitude / 1e5, longitude / 1e5]);
  }

  return points;
}
