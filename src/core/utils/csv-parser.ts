/**
 * Parses a RFC 4180-compliant CSV string into an array of objects.
 *
 * Algorithm:
 * - Normalise line endings (\r\n / \r → \n).
 * - Tokenise each row with a state-machine that handles quoted fields
 *   containing commas, double-quotes, and embedded newlines.
 * - First row becomes the header; subsequent rows become keyed objects.
 * - Empty rows are skipped.
 *
 * Time complexity: O(n) where n = total character count.
 */
export function parseCsv(raw: string): Record<string, string>[] {
  const normalised = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const rows = tokeniseRows(normalised);
  if (rows.length === 0) return [];

  const headers = rows[0];
  const results: Record<string, string>[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const cells = rows[rowIndex];
    if (cells.length === 0 || (cells.length === 1 && cells[0] === "")) {
      continue; // skip blank rows
    }

    const record: Record<string, string> = {};
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      record[headers[colIndex]] = cells[colIndex] ?? "";
    }

    results.push(record);
  }

  return results;
}

/**
 * State-machine tokeniser.
 * Returns a 2-D array: rows of cell strings.
 * Handles: quoted fields, escaped double-quotes (""), embedded newlines.
 */
function tokeniseRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        // Peek ahead — doubled quote = escaped quote character
        if (input[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        // Closing quote
        inQuotes = false;
        i++;
        continue;
      }
      cell += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (char === ",") {
      row.push(cell.trim());
      cell = "";
      i++;
      continue;
    }

    if (char === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      i++;
      continue;
    }

    cell += char;
    i++;
  }

  // Flush last cell/row
  row.push(cell.trim());
  if (row.some((c) => c !== "")) {
    rows.push(row);
  }

  return rows;
}
