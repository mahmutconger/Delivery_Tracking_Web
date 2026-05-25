/**
 * Triggers a browser file download from an in-memory string.
 *
 * No server round-trip: the content is converted to a Blob, a temporary
 * object URL is created, a hidden <a> element performs the click, then
 * the URL is immediately revoked to release memory.
 *
 * Must be called from a user-gesture handler (click / submit) to avoid
 * popup blockers in certain browsers.
 */
export function downloadAsFile(
  filename: string,
  content: string,
  mimeType = "text/csv;charset=utf-8;",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke after a tick so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
