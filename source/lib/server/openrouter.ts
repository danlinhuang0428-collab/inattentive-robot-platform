import { textModel, type TextComplexity } from "../ai-models";

type JsonSchema = Record<string, unknown>;

function readableError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const value = payload as { error?: { message?: string; metadata?: { raw?: string; provider_name?: string } }; message?: string };
  const message = value.error?.message || value.message || fallback;
  const raw = value.error?.metadata?.raw?.trim();
  const provider = value.error?.metadata?.provider_name?.trim();
  return [message, provider && `Provider: ${provider}`, raw && raw.slice(0, 1_000)].filter(Boolean).join(" · ");
}

export function openRouterStatus() {
  return {
    configured: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    fastModel: textModel("fast"),
    complexModel: textModel("complex"),
  };
}

export async function openRouterJson<T>({
  complexity,
  schemaName,
  schema,
  system,
  user,
  temperature = 0.4,
  maxTokens = 8_000,
  strictSchema = true,
}: {
  complexity: TextComplexity;
  schemaName: string;
  schema: JsonSchema;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  strictSchema?: boolean;
}): Promise<{ data: T; model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured. Open API Settings in the website and paste it there.");
  const model = textModel(complexity);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://127.0.0.1:3001/",
      "X-OpenRouter-Title": "Inattentive Robot Scenario Lab",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature,
      max_tokens: maxTokens,
      reasoning: { effort: complexity === "complex" ? "low" : "minimal" },
      response_format: strictSchema ? { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } } : { type: "json_object" },
      provider: { require_parameters: strictSchema, allow_fallbacks: true },
    }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(readableError(payload, `OpenRouter ${model} request failed.`));
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error(`OpenRouter ${model} returned an empty response.`);
  try {
    return { data: JSON.parse(content) as T, model };
  } catch {
    throw new Error(`OpenRouter ${model} returned invalid structured JSON.`);
  }
}
