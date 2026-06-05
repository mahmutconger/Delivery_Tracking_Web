/**
 * @brief Bellekteki bir dizeyi tarayıcı üzerinden dosya olarak indirtir.
 * @param filename İndirilen dosyaya verilecek ad.
 * @param content Dosya içeriği olarak kullanılacak dize.
 * @param mimeType Blob MIME türü. Varsayılan: "text/csv;charset=utf-8;".
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
