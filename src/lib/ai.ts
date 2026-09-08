import OpenAI from "openai";
import type { ZodTypeAny, output as ZodOutput } from "zod";

let client: OpenAI | null = null;

export function openai(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Copy .env.example to .env.local and add your key."
    );
  }
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.search(/[[{]/);
    const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (start === -1 || end === -1) throw new Error("Model did not return JSON");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

/**
 * Ask the model for JSON, validate it with zod, and retry once with the
 * validation error fed back in before giving up.
 */
export async function jsonCompletion<S extends ZodTypeAny>(opts: {
  system: string;
  user: string;
  schema: S;
  shape: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<ZodOutput<S>> {
  const system = `${opts.system}\n\nReply with a single JSON object and nothing else. It must match this shape:\n${opts.shape}`;
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: system },
    { role: "user", content: opts.user },
  ];

  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await openai().chat.completions.create({
      model: MODEL,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens ?? 2500,
      response_format: { type: "json_object" },
      messages,
    });
    const raw = res.choices[0]?.message?.content ?? "";
    try {
      return opts.schema.parse(extractJson(raw));
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      messages.push({ role: "assistant", content: raw.slice(0, 4000) });
      messages.push({
        role: "user",
        content: `That JSON failed validation: ${lastError}\nReturn corrected JSON only.`,
      });
    }
  }
  throw new Error(`Model returned invalid JSON: ${lastError}`);
}
