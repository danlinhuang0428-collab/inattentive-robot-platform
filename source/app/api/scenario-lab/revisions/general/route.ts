import { openRouterJson } from "../../../../../lib/server/openrouter";

const revisionSchema = {
  type: "object", additionalProperties: false, required: ["retain", "change", "requiresScriptDiffConfirmation", "affectedVideoTypes", "revisedPrompts"], properties: {
    retain: { type: "array", items: { type: "string" } }, change: { type: "array", items: { type: "string" } }, requiresScriptDiffConfirmation: { type: "boolean" },
    affectedVideoTypes: { type: "array", items: { type: "string", enum: ["conflict", "choice_a", "choice_b"] } },
    revisedPrompts: { type: "object", additionalProperties: false, required: ["conflict", "choice_a", "choice_b"], properties: { conflict: { type: "string" }, choice_a: { type: "string" }, choice_b: { type: "string" } } },
  },
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { comment?: string; bundleVersion?: number; scope?: "video" | "bundle"; affectsResearchMeaning?: boolean; prompts?: Record<string, string>; scenario?: unknown } | null;
  if (!body?.comment?.trim() || !body.bundleVersion || !body.prompts) return Response.json({ error: "A revision comment, current bundle version, and prompt set are required." }, { status: 400 });
  try {
    const result = await openRouterJson<{ retain: string[]; change: string[]; requiresScriptDiffConfirmation: boolean; affectedVideoTypes: Array<"conflict" | "choice_a" | "choice_b">; revisedPrompts: Record<"conflict" | "choice_a" | "choice_b", string> }>({
      complexity: "complex",
      schemaName: "scenario_bundle_revision",
      schema: revisionSchema,
      temperature: 0.2,
      maxTokens: 12_000,
      system: "You revise a versioned MiniMax H3 three-video bundle by delta. Preserve every accepted research decision and continuity lock not explicitly targeted. Apply the researcher's shared correction consistently across affected prompts, but do not weaken P0/P1 action, emotion, branch meaning, the two reference-matched robot hands, readable camera continuity, concise dialogue, native audio, or the no-UI rule. Return complete replacement prompts, never append a pile of corrections. Flag script diff confirmation when dialogue, choices, research meaning, or participant interpretation changes.",
      user: `Scenario:\n${JSON.stringify(body.scenario ?? null, null, 2)}\n\nCurrent prompts:\n${JSON.stringify(body.prompts, null, 2)}\n\nGeneral revision comment:\n${body.comment.trim()}`,
    });
    return Response.json({ provider: "OpenRouter", model: result.model, revision: { parentBundleVersion: body.bundleVersion, bundleVersion: body.bundleVersion + 1, scope: body.scope ?? "bundle", ...result.data, paidTasksCreated: 0 } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Bundle revision failed." }, { status: 502 });
  }
}
