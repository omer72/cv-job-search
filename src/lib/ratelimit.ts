type Window = { count: number; resetAt: number };

/**
 * ponytail: in-memory fixed window, so the ceiling is per server instance —
 * a request that lands on a cold instance starts a fresh count. That still
 * stops the case this exists for (one client hammering the OpenAI key), and
 * costs no dependency. Move to Vercel Firewall rate limiting or a Redis-backed
 * counter if the limits ever need to be exact across instances.
 */
const windows = new Map<string, Window>();

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function prune(now: number): void {
  if (windows.size < 5000) return;
  for (const [key, window] of windows) if (window.resetAt <= now) windows.delete(key);
}

/**
 * Count this request against `name`'s budget for the caller's IP. Returns a 429
 * to hand straight back to the client, or null when the request may proceed.
 */
export function rateLimit(
  req: Request,
  opts: {
    name: string;
    max: number;
    windowMs: number;
    /** Message for the caller, given the wait in whole minutes. */
    message: (minutes: number) => string;
  }
): Response | null {
  const now = Date.now();
  prune(now);

  const key = `${opts.name}:${clientIp(req)}`;
  const window = windows.get(key);

  if (!window || window.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }

  window.count += 1;
  if (window.count <= opts.max) return null;

  const retryAfter = Math.max(1, Math.ceil((window.resetAt - now) / 1000));
  const minutes = Math.max(1, Math.ceil(retryAfter / 60));
  return Response.json(
    { error: opts.message(minutes) },
    { status: 429, headers: { "retry-after": String(retryAfter) } }
  );
}
