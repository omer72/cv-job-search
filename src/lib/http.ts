const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": UA, ...(init.headers || {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function getJson<T>(url: string, ms = 8000): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url, { headers: { accept: "application/json" } }, ms);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Fetch a page and reduce it to readable text, capped for prompt use. */
export async function getPageText(url: string, cap = 18000): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, { headers: { accept: "text/html" } }, 10000);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html") && !ct.includes("text")) return null;
    const html = await res.text();
    return htmlToText(html).slice(0, cap);
  } catch {
    return null;
  }
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(?:br|\/p|\/div|\/li|\/tr|\/h[1-6])>/gi, "\n")
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
      const text = String(label).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return text ? `${text} [${href}]` : " ";
    })
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
