/**
 * @brief RFC 4180 standardına göre tek bir CSV hücre değerini kaçış karakterleriyle kodlar.
 * @param value Kaçış uygulanacak değer. null/undefined boş dizeye dönüştürülür.
 * @returns Güvenli CSV hücre dizesi; virgül, tırnak veya satır sonu içeriyorsa çift tırnaklarla sarılır.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  const str = String(value);

  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => unknown;
}

/**
 * @brief Nesne dizisini CSV dizesine dönüştürür.
 * @param rows Dönüştürülecek nesne dizisi.
 * @param columns Sütun başlıklarını ve accessor fonksiyonlarını tanımlayan yapılandırma.
 * @returns Başlık satırı dahil tam CSV dizesi. O(n * cols) karmaşıklığında Array.join kullanır.
 */
export function buildCsvRows<T extends object>(
  rows: T[],
  columns: CsvColumn<T>[],
): string {
  const headerRow = columns.map((col) => escapeCsvCell(col.header)).join(",");

  const dataRows = rows.map((row) =>
    columns.map((col) => escapeCsvCell(col.accessor(row))).join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}
