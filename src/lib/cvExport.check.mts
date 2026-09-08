/** Self-check for the CV export: `npm run check`. */
import assert from "node:assert/strict";
import { cvFileName, detectDir, upgradedCvToDocHtml, upgradedCvToPrintHtml } from "./cvExport.ts";

const cv = {
  name: "Dana Levi",
  headline: "Senior Backend Engineer",
  contact: "Tel Aviv — dana@example.com",
  summary: "Backend engineer with 7 years <building> payments & loyalty systems.",
  experience: [{ heading: "Senior Backend Engineer, Riskified (2021—2026)", bullets: ["Cut latency by 38%."] }],
  sections: [{ title: "Skills", lines: ["Node.js, TypeScript"] }],
  changes: ["Added quantified impact."],
};

const html = upgradedCvToDocHtml(cv, { experienceTitle: "Experience" });

// Every fact reaches the document.
for (const needle of ["Dana Levi", "Senior Backend Engineer", "dana@example.com", "Cut latency by 38%.", "Node.js, TypeScript"]) {
  assert.ok(html.includes(needle), `missing from the document: ${needle}`);
}

// Model text is escaped, never injected as markup.
assert.ok(html.includes("&lt;building&gt;"), "angle brackets should be escaped");
assert.ok(html.includes("&amp;"), "ampersands should be escaped");
assert.ok(!html.includes("<building>"), "raw markup leaked into the document");

// Direction follows the CV's own text, not the interface language.
assert.equal(detectDir(cv), "ltr", "an English CV stays left to right");
assert.ok(html.includes('dir="ltr"') && html.includes("padding-left"), "English documents indent from the left");

const hebrewCv = {
  ...cv,
  name: "דנה לוי",
  headline: "מהנדסת בקאנד בכירה",
  summary: "מהנדסת בקאנד עם שבע שנות ניסיון במערכות תשלומים ונאמנות לקוחות.",
  experience: [{ heading: "מהנדסת בקאנד בכירה, ריסקיפייד", bullets: ["הורדתי את זמן התגובה ב-38 אחוז."] }],
  sections: [{ title: "כישורים", lines: ["Node.js, TypeScript"] }],
};
assert.equal(detectDir(hebrewCv), "rtl", "a Hebrew CV reads right to left");
const rtl = upgradedCvToDocHtml(hebrewCv, { experienceTitle: "ניסיון" });
assert.ok(rtl.includes('dir="rtl"'), "rtl documents need the dir attribute");
assert.ok(rtl.includes("padding-right"), "rtl bullets indent from the right");
assert.ok(rtl.includes("ניסיון"), "the section title should be translated");

// Every line decides its own direction, so a mixed CV never flips punctuation.
assert.ok(html.includes('<li dir="auto">') && html.includes('<h3 dir="auto">'), "lines need dir=auto");

// Filenames come from the candidate's name, and stay sane without one.
assert.equal(cvFileName(cv, "doc"), "dana-levi-cv.doc");
assert.equal(cvFileName({ ...cv, name: "" }, "doc"), "upgraded-cv.doc");
assert.equal(cvFileName({ ...cv, name: "דנה לוי" }, "doc"), "דנה-לוי-cv.doc");

// The print document carries page setup, keeps roles whole, and escapes too.
const print = upgradedCvToPrintHtml(cv, { experienceTitle: "Experience" });
assert.ok(print.includes("@page"), "print needs page setup");
assert.ok(print.includes("size: A4"), "print should be A4");
assert.ok(print.includes("break-inside: avoid"), "a role should not split across pages");
assert.ok(print.includes("Cut latency by 38%."), "bullets must reach the print document");
assert.ok(print.includes("&lt;building&gt;") && !print.includes("<building>"), "print must escape model text");

const printRtl = upgradedCvToPrintHtml(hebrewCv, { experienceTitle: "ניסיון" });
assert.ok(printRtl.includes('dir="rtl"') && printRtl.includes('lang="he"'), "rtl print needs dir and lang");
assert.ok(printRtl.includes("padding-right"), "rtl print bullets indent from the right");

console.log("cvExport: all checks passed");
