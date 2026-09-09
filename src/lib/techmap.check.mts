/** Self-check for the techmap reader: `npm run check`. */
import assert from "node:assert/strict";
import { filterRows, parseCsv, rowToJob, rowsToRecords } from "./techmap.ts";

// Quoted commas, escaped quotes, CRLF and a BOM all survive the reader.
const csv =
  '﻿"company","category","size","title","level","city","url","updated"\r\n' +
  '"Acme, Inc","Fintech","l","Backend Engineer, Payments","Engineer","תל אביב-יפו","https://x.test/1","2026-09-09"\r\n' +
  '"Beta","Security","m","QA ""Automation"" Lead","Tech Lead","חיפה","https://x.test/2","2026-09-08"\r\n';

const records = rowsToRecords(parseCsv(csv));
assert.equal(records.length, 2, "both rows should be read");
assert.equal(records[0].company, "Acme, Inc", "a quoted comma stays inside the field");
assert.equal(records[0].title, "Backend Engineer, Payments");
assert.equal(records[1].title, 'QA "Automation" Lead', "escaped quotes unescape");
assert.equal(records[0].city, "תל אביב-יפו", "Hebrew city names survive");

// Blank lines never become rows.
assert.equal(rowsToRecords(parseCsv('"a","b"\n"1","2"\n\n')).length, 1);

// Filtering: free text hits title, company and industry; city is a substring; level is exact.
assert.equal(filterRows(records, { types: [], query: "backend" }).length, 1);
assert.equal(filterRows(records, { types: [], query: "acme" }).length, 1, "company matches too");
assert.equal(filterRows(records, { types: [], query: "fintech" }).length, 1, "industry matches too");
assert.equal(filterRows(records, { types: [], query: "backend qa" }).length, 2, "terms are OR-ed");
assert.equal(filterRows(records, { types: [], query: "nothing-here" }).length, 0);
assert.equal(filterRows(records, { types: [], city: "חיפה" }).length, 1);
assert.equal(filterRows(records, { types: [], level: "tech lead" }).length, 1, "level is case-insensitive");
assert.equal(filterRows(records, { types: [], level: "lead" }).length, 0, "level is exact, not partial");
assert.equal(filterRows(records, { types: [] }).length, 2, "no filter keeps everything");

// Mapping to a job keeps the apply link and gives the scorer something to read.
const job = rowToJob(records[0], "software", 0);
assert.equal(job.company, "Acme, Inc");
assert.equal(job.url, "https://x.test/1");
assert.equal(job.source, "techmap");
assert.equal(job.department, "software");
assert.equal(job.postedAt, "2026-09-09");
assert.ok(job.description.includes("Engineer") && job.description.includes("Fintech"));
assert.ok(job.id.startsWith("techmap:"), "ids are namespaced by source");
assert.notEqual(job.id, rowToJob(records[0], "frontend", 0).id, "the same row in two types stays distinct");

console.log("techmap: all checks passed");
