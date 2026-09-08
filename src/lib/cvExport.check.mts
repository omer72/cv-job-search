/** Self-check for the CV export: `npm run check`. */
import assert from "node:assert/strict";
import { cvFileName, upgradedCvToDocHtml } from "./cvExport.ts";

const cv = {
  name: "Dana Levi",
  headline: "Senior Backend Engineer",
  contact: "Tel Aviv — dana@example.com",
  summary: "Backend engineer with 7 years <building> payments & loyalty systems.",
  experience: [{ heading: "Senior Backend Engineer, Riskified (2021—2026)", bullets: ["Cut latency by 38%."] }],
  sections: [{ title: "Skills", lines: ["Node.js, TypeScript"] }],
  changes: ["Added quantified impact."],
};

const html = upgradedCvToDocHtml(cv, { dir: "ltr", experienceTitle: "Experience" });

// Every fact reaches the document.
for (const needle of ["Dana Levi", "Senior Backend Engineer", "dana@example.com", "Cut latency by 38%.", "Node.js, TypeScript"]) {
  assert.ok(html.includes(needle), `missing from the document: ${needle}`);
}

// Model text is escaped, never injected as markup.
assert.ok(html.includes("&lt;building&gt;"), "angle brackets should be escaped");
assert.ok(html.includes("&amp;"), "ampersands should be escaped");
assert.ok(!html.includes("<building>"), "raw markup leaked into the document");

// Hebrew documents lay out right to left.
const rtl = upgradedCvToDocHtml(cv, { dir: "rtl", experienceTitle: "ניסיון" });
assert.ok(rtl.includes('dir="rtl"'), "rtl documents need the dir attribute");
assert.ok(rtl.includes("padding-right"), "rtl bullets indent from the right");
assert.ok(rtl.includes("ניסיון"), "the section title should be translated");

// Filenames come from the candidate's name, and stay sane without one.
assert.equal(cvFileName(cv, "doc"), "dana-levi-cv.doc");
assert.equal(cvFileName({ ...cv, name: "" }, "doc"), "upgraded-cv.doc");
assert.equal(cvFileName({ ...cv, name: "דנה לוי" }, "doc"), "דנה-לוי-cv.doc");

console.log("cvExport: all checks passed");
