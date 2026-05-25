/**
 * Escapes a single CSV cell value according to RFC 4180:
 * - Values containing commas, double-quotes, or newlines are wrapped in
 *   double-quotes.
 * - Existing double-quote characters are doubled ("").
 * - null / undefined become an empty string.
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
 * Converts an array of objects into a CSV string.
 *
 * Algorithm: single O(n * cols) pass using Array.join — avoids O(n²)
 * string concatenation that would occur with repeated + or += operators
 * on large datasets.
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
