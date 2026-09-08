/** Server-side PDF text extraction using the pdf.js legacy build (no worker). */
export async function pdfToText(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let line = "";
    let lastY: number | null = null;
    const parts: string[] = [];
    for (const item of content.items as { str: string; transform: number[] }[]) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 4) {
        parts.push(line.trim());
        line = "";
      }
      line += item.str + " ";
      lastY = y;
    }
    parts.push(line.trim());
    pages.push(parts.filter(Boolean).join("\n"));
  }
  await doc.destroy();
  return pages.join("\n\n").replace(/[ \t]{2,}/g, " ").trim();
}
