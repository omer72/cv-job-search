import type { UpgradedCv } from "./schemas";

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Direction comes from the CV's own text, not from the interface language: a
 * Hebrew-speaking user often keeps an English CV, and forcing that page RTL
 * throws the punctuation to the wrong side of every line.
 */
export function detectDir(cv: UpgradedCv): "ltr" | "rtl" {
  const text = [
    cv.name,
    cv.headline,
    cv.summary,
    ...cv.experience.flatMap((e) => [e.heading, ...e.bullets]),
    ...cv.sections.flatMap((sec) => [sec.title, ...sec.lines]),
  ].join(" ");
  const hebrew = (text.match(/[\u0590-\u05FF]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return hebrew > latin ? "rtl" : "ltr";
}

function body(cv: UpgradedCv, experienceTitle: string): string {
  const parts: string[] = [];
  if (cv.name) parts.push(`<h1 dir="auto">${escape(cv.name)}</h1>`);
  if (cv.headline) parts.push(`<p class="headline" dir="auto">${escape(cv.headline)}</p>`);
  if (cv.contact) parts.push(`<p class="contact" dir="auto">${escape(cv.contact)}</p>`);
  if (cv.summary) parts.push(`<p dir="auto">${escape(cv.summary)}</p>`);

  if (cv.experience.length) {
    parts.push(`<h2 dir="auto">${escape(experienceTitle)}</h2>`);
    for (const role of cv.experience) {
      parts.push('<div class="role">');
      parts.push(`<h3 dir="auto">${escape(role.heading)}</h3>`);
      if (role.bullets.length) {
        parts.push(`<ul>${role.bullets.map((b) => `<li dir="auto">${escape(b)}</li>`).join("")}</ul>`);
      }
      parts.push("</div>");
    }
  }

  for (const section of cv.sections) {
    parts.push('<div class="role">');
    parts.push(`<h2 dir="auto">${escape(section.title)}</h2>`);
    if (section.lines.length) {
      parts.push(`<ul>${section.lines.map((l) => `<li dir="auto">${escape(l)}</li>`).join("")}</ul>`);
    }
    parts.push("</div>");
  }
  return parts.join("\n");
}

/**
 * The rewrite laid out for the browser's own print-to-PDF. The browser's text
 * engine is what makes a mixed Hebrew/English line come out right, so the PDF
 * is printed rather than drawn by a bundled library.
 */
export function upgradedCvToPrintHtml(cv: UpgradedCv, opts: { experienceTitle: string }): string {
  const dir = detectDir(cv);
  const side = dir === "rtl" ? "right" : "left";
  return `<!doctype html>
<html dir="${dir}" lang="${dir === "rtl" ? "he" : "en"}"><head><meta charset="utf-8">
<title>${escape(cv.name || "CV")}</title>
<style>
  @page { size: A4; margin: 16mm 15mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.4; color: #111; }
  h1 { font-size: 20pt; margin: 0 0 2pt; }
  h2 { font-size: 11pt; margin: 12pt 0 4pt; text-transform: none; border-bottom: 0.6pt solid #888; padding-bottom: 2pt; }
  h3 { font-size: 10.5pt; margin: 8pt 0 1pt; }
  p { margin: 0 0 6pt; }
  p.headline { margin: 0 0 1pt; }
  p.contact { margin: 0 0 8pt; color: #444; font-size: 9.5pt; }
  ul { margin: 2pt 0 0; padding-${side}: 16pt; }
  li { margin-bottom: 2pt; }
  /* keep a role and its bullets together across a page break */
  .role { break-inside: avoid; page-break-inside: avoid; }
</style></head>
<body>${body(cv, opts.experienceTitle)}</body></html>`;
}

/**
 * The rewrite as a Word-openable document. Word, Pages and Google Docs all
 * open HTML served as .doc, which keeps the headings and bullets editable
 * without pulling in a document-writing dependency.
 */
export function upgradedCvToDocHtml(cv: UpgradedCv, opts: { experienceTitle: string }): string {
  const dir = detectDir(cv);
  return `<!doctype html>
<html dir="${dir}"><head><meta charset="utf-8"><title>${escape(cv.name || "CV")}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.35; }
  h1 { font-size: 20pt; margin: 0 0 2pt; }
  h2 { font-size: 12pt; margin: 16pt 0 4pt; border-bottom: 1px solid #999; padding-bottom: 2pt; }
  h3 { font-size: 11pt; margin: 10pt 0 2pt; }
  p.headline { margin: 0 0 2pt; }
  p.contact { margin: 0 0 10pt; color: #444; }
  ul { margin: 2pt 0 0; padding-${dir === "rtl" ? "right" : "left"}: 18pt; }
  li { margin-bottom: 2pt; }
</style></head>
<body>${body(cv, opts.experienceTitle)}</body></html>`;
}

/** A filename built from the candidate's name, e.g. "dana-levi-cv.doc". */
export function cvFileName(cv: UpgradedCv, extension: string): string {
  const slug = cv.name
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "upgraded"}-cv.${extension}`;
}
