/**
 * Self-check for the rate limiter: `node src/lib/ratelimit.check.ts`
 * (also wired up as `npm run check`).
 */
import assert from "node:assert/strict";
import { rateLimit } from "./ratelimit.ts";

const req = (ip: string) => new Request("https://example.test/api", { headers: { "x-forwarded-for": ip } });
const message = (minutes: number) => `Too many requests. Try again in ${minutes} minute(s).`;
const opts = { name: "check", max: 3, windowMs: 120, message };

// Requests inside the budget pass.
for (let i = 0; i < 3; i++) {
  assert.equal(rateLimit(req("10.0.0.1"), opts), null, `request ${i + 1} should pass`);
}

// The one over the budget is refused, with a retry hint.
const refused = rateLimit(req("10.0.0.1"), opts);
assert.ok(refused, "the 4th request should be refused");
assert.equal(refused.status, 429);
assert.ok(Number(refused.headers.get("retry-after")) > 0, "retry-after should be set");
assert.match((await refused.json()).error, /Too many requests/);

// A different caller has its own budget.
assert.equal(rateLimit(req("10.0.0.2"), opts), null, "a second IP should not inherit the first one's count");

// Proxy chains report the client first.
assert.equal(
  rateLimit(new Request("https://example.test/api", { headers: { "x-forwarded-for": "10.0.0.2, 172.16.0.1" } }), opts),
  null,
  "the leading IP identifies the caller"
);

// The window expires.
await new Promise((r) => setTimeout(r, opts.windowMs + 40));
assert.equal(rateLimit(req("10.0.0.1"), opts), null, "the budget should reset once the window passes");

// Buckets are independent per route.
assert.equal(rateLimit(req("10.0.0.2"), { ...opts, name: "other" }), null, "each route counts separately");

console.log("ratelimit: all checks passed");
