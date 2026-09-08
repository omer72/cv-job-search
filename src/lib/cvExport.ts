import type { UpgradedCv } from "./schemas";

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * The rewrite as a Word-openable document. Word, Pages and Google Docs all
 * open HTML served as .doc, which keeps the headings and bullets editable
 * without pulling in a document-writing dependency.
 */
export function upgradedCvToDocHtml(
  cv: UpgradedCv,
  opts: { dir: "ltr" | "rtl"; experienceTitle: string }
): string {
  const parts: string[] = [];
  if (cv.name) parts.push(`<h1>${escape(cv.name)}</h1>`);
  if (cv.headline) parts.push(`<p class="headline">${escape(cv.headline)}</p>`);
  if (cv.contact) parts.push(`<p class="contact">${escape(cv.contact)}</p>`);
  if (cv.summary) parts.push(`<p>${escape(cv.summary)}</p>`);

  if (cv.experience.length) {
    parts.push(`<h2>${escape(opts.experienceTitle)}</h2>`);
    for (const role of cv.experience) {
      parts.push(`<h3>${escape(role.heading)}</h3>`);
      if (role.bullets.length) {
        parts.push(`<ul>${role.bullets.map((b) => `<li>${escape(b)}</li>`).join("")}</ul>`);
      }
    }
  }

  for (const section of cv.sections) {
    parts.push(`<h2>${escape(section.title)}</h2>`);
    if (section.lines.length) {
      parts.push(`<ul>${section.lines.map((l) => `<li>${escape(l)}</li>`).join("")}</ul>`);
    }
  }

  return `<!doctype html>
<html dir="${opts.dir}"><head><meta charset="utf-8"><title>${escape(cv.name || "CV")}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.35; }
  h1 { font-size: 20pt; margin: 0 0 2pt; }
  h2 { font-size: 12pt; margin: 16pt 0 4pt; border-bottom: 1px solid #999; padding-bottom: 2pt; }
  h3 { font-size: 11pt; margin: 10pt 0 2pt; }
  p.headline { margin: 0 0 2pt; }
  p.contact { margin: 0 0 10pt; color: #444; }
  ul { margin: 2pt 0 0; padding-${opts.dir === "rtl" ? "right" : "left"}: 18pt; }
  li { margin-bottom: 2pt; }
</style></head>
<body>${parts.join("\n")}</body></html>`;
}

/** A filename built from the candidate's name, e.g. "dana-levi-cv.doc". */
export function cvFileName(cv: UpgradedCv, extension: string): string {
  const slug = cv.name
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "upgraded"}-cv.${extension}`;
}
