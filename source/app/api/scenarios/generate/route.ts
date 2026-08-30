import { openRouterJson, openRouterStatus } from "../../../../lib/server/openrouter";

type FamilyPayload = {
  id?: string;
  label?: string;
  location?: string;
  members?: Array<{ name?: string; role?: string; age?: string; occupation?: string; notes?: string }>;
  protocol?: string;
  memos?: string;
};

const scenarioSchema = {
  name: "family_conflict_scenarios",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["scenarios"],
    properties: {
      scenarios: {
        type: "array",
        minItems: 10,
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "description", "choiceA", "choiceB", "tags", "memberTags", "valueTags"],
          properties: {
            title: { type: "string", minLength: 3, maxLength: 70 },
            description: { type: "string", minLength: 80, maxLength: 420 },
            choiceA: { type: "string", minLength: 3, maxLength: 90 },
            choiceB: { type: "string", minLength: 3, maxLength: 90 },
            tags: { type: "array", minItems: 1, maxItems: 7, items: { type: "string" } },
            memberTags: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
            valueTags: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
          },
        },
      },
    },
  },
};

function cleanFamily(input: FamilyPayload) {
  return {
    id: String(input.id || "Unknown family").slice(0, 40),
    label: String(input.label || "Family").slice(0, 80),
    location: String(input.location || "Not recorded").slice(0, 120),
    members: Array.isArray(input.members) ? input.members.slice(0, 20).map((member) => ({
      name: String(member.name || "").slice(0, 80),
      role: String(member.role || "").slice(0, 80),
      age: String(member.age || "").slice(0, 20),
      occupation: String(member.occupation || "").slice(0, 120),
      notes: String(member.notes || "").slice(0, 500),
    })) : [],
    protocol: String(input.protocol || "No protocol recorded").slice(0, 8_000),
    memos: String(input.memos || "No memos recorded").slice(0, 5_000),
  };
}

export async function GET() {
  const settings = openRouterStatus();
  return Response.json({ configured: settings.configured, model: settings.fastModel, provider: "OpenRouter" });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { project?: string; family?: FamilyPayload };
  if (!body.family) return Response.json({ error: "Family context is required." }, { status: 400 });
  const family = cleanFamily(body.family);
  if (!family.members.length) return Response.json({ error: "Add at least one family member before generating scenarios." }, { status: 400 });

  const valueVocabulary = [
    "Physical safety", "Medical & health", "Emotional reassurance", "Daily care", "Education & tutoring",
    "Housework & object handling", "Privacy & dignity", "Autonomy & preference", "Simultaneous requests",
    "Task interruption", "Spatial separation", "Single-body constraint", "Investigation first", "Authority & obedience",
    "Vulnerability & dependency", "Fairness & turn-taking", "Consent & autonomy", "Protective intervention",
    "Interruption rights", "Responsibility & accountability", "Rules in conflict", "Individual vs family interest",
  ];

  try {
    const result = await openRouterJson<{ scenarios: unknown[] }>({
      complexity: "fast",
      schemaName: scenarioSchema.name,
      schema: scenarioSchema.schema,
      temperature: 0.8,
      maxTokens: 4_500,
      system: "You are an HCI research scenario designer studying attention politics in domestic robots. Generate concrete, plausible, ethically ambiguous conflicts. A single embodied robot cannot be in two places or complete two physical actions at once. Do not make one answer obviously correct. Identify blind spots the family protocol does not already settle. Use only member names in the supplied family context. Return exactly ten scenarios in the required schema.",
      user: `Project: ${String(body.project || "Inattentive Robot").slice(0, 120)}\n\nFamily context:\n${JSON.stringify(family, null, 2)}\n\nApproved value tag vocabulary:\n${valueVocabulary.join("; ")}\n\nFor each draft: use a sharp title; write 2–3 sentences showing both competing claims, why each cannot wait, and the consequence of delay; provide distinct robot actions for Choice A and Choice B; tag only involved family members; choose 2–5 valueTags exactly from the vocabulary and repeat the combined research tags in tags. Prioritize unexpected protocol failures.`,
    });
    if (!Array.isArray(result.data.scenarios) || result.data.scenarios.length !== 10) throw new Error("OpenRouter returned an invalid scenario count.");
    return Response.json({ scenarios: result.data.scenarios, provider: "OpenRouter", model: result.model });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "OpenRouter scenario generation failed." }, { status: 502 });
  }
}
