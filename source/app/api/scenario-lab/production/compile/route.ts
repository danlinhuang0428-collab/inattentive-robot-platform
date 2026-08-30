import { compileProduction, isResearchScript, normalizeScenario } from "../../../../../lib/scenario-lab";
import { openRouterJson } from "../../../../../lib/server/openrouter";
import type { FailureEvidence, PromptDirection, ResearchScript, VideoType, VisualBible } from "../../../../../lib/types";

const branchKeys = ["conflict", "choice_a", "choice_b"] as const;

const beatDirectionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["attentionOwner", "visibleAction", "observablePerformance", "cameraBehavior", "sound"],
  properties: {
    attentionOwner: { type: "string", minLength: 3, maxLength: 80 },
    visibleAction: { type: "string", minLength: 20, maxLength: 140 },
    observablePerformance: { type: "string", minLength: 20, maxLength: 140 },
    cameraBehavior: { type: "string", minLength: 10, maxLength: 110 },
    sound: { type: "string", minLength: 5, maxLength: 80 },
  },
};

const directionProperties = {
  singleResearchTurn: { type: "string", minLength: 20, maxLength: 140 },
  mode: { type: "string", enum: ["FLF2V"] },
  modeReason: { type: "string", minLength: 20, maxLength: 160 },
  cameraPath: { type: "string", minLength: 20, maxLength: 130 },
  openingState: { type: "string", minLength: 30, maxLength: 170 },
  exactEndingState: { type: "string", minLength: 30, maxLength: 170 },
  p0Owner: { type: "string", minLength: 3, maxLength: 80 },
  p0Trigger: { type: "string", minLength: 10, maxLength: 120 },
  p0CompleteAction: { type: "string", minLength: 40, maxLength: 150 },
  p0ObservablePerformance: { type: "string", minLength: 40, maxLength: 150 },
  p0IntensityPersistence: { type: "string", minLength: 20, maxLength: 120 },
  beatDirections: { type: "array", minItems: 3, maxItems: 3, items: beatDirectionSchema },
  speakerOrder: { type: "string", minLength: 3, maxLength: 100 },
  ambientBed: { type: "string", minLength: 5, maxLength: 100 },
  motivatedSoundCues: { type: "string", minLength: 5, maxLength: 100 },
  intentionalSilence: { type: "string", minLength: 5, maxLength: 90 },
  positiveContinuity: { type: "array", minItems: 3, maxItems: 3, items: { type: "string", minLength: 5, maxLength: 80 } },
  exclusions: { type: "array", minItems: 3, maxItems: 8, items: { type: "string", minLength: 3, maxLength: 50 } },
  warnings: { type: "array", maxItems: 12, items: { type: "string", minLength: 3, maxLength: 500 } },
};

const directionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["directions"],
  properties: {
    directions: {
      type: "object",
      additionalProperties: false,
      required: [...branchKeys],
      properties: Object.fromEntries(branchKeys.map((key) => [key, {
        type: "object",
        additionalProperties: false,
        required: Object.keys(directionProperties),
        properties: directionProperties,
      }])),
    },
  },
};

type CompileBody = {
  scenario?: Record<string, unknown>;
  approvedScripts?: Partial<Record<VideoType, ResearchScript>>;
  globalContinuity?: VisualBible;
  providerCapabilities?: Record<string, unknown>;
  previousFailureEvidence?: FailureEvidence[];
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as CompileBody | null;
  if (!body?.scenario || !body.approvedScripts) return Response.json({ error: "An approved three-script set is required." }, { status: 400 });
  const scripts = body.approvedScripts;
  if (!scripts.conflict || !scripts.choice_a || !scripts.choice_b || !Object.values(scripts).every(isResearchScript)) return Response.json({ error: "All three scripts must pass schema validation before compilation." }, { status: 422 });
  const scenario = normalizeScenario(body.scenario);
  const providerCapabilities = body.providerCapabilities ?? {
    provider: "fal.ai",
    model: "minimax/h3/image-to-video",
    durationSeconds: 15,
    modes: ["FLF2V"],
    nativeSynchronizedAudio: true,
    limitation: "Timestamps guide generation but are not frame-deterministic.",
  };
  try {
    const result = await openRouterJson<{ directions: Record<VideoType, PromptDirection> }>({
      complexity: "complex",
      schemaName: "minimax_h3_structured_production_directions_v2",
      schema: directionSchema,
      temperature: 0.2,
      maxTokens: 18_000,
      system: `You are the structured direction stage of a production-grade MiniMax H3 prompt compiler. Return structured English direction data only; the local deterministic compiler will assemble the final prompt and will never accept a free-form replacement prompt.

Priority order: P0 complete physical action and observable emotional performance; P1 unbiased research meaning and speaker ownership; P2 readable camera and blocking; P3 continuity, robot hands, sound, and finish. Each branch is one continuous 15-second FLF2V shot with strict first and last raster endpoints.

For every branch, define a complete P0 action chain: preparation, initiating cause or contact, physical trajectory, visible consequence, and held aftermath. Define observable emotion using face morphology (eyes, brows, mouth or jaw), body and breath carriers, voice behavior, target intensity, onset, peak, and persistence. Never use emotion adjectives alone.

Provide exactly three beat directions corresponding to the approved script beats. All three beats may contain story action, dialogue, emotional or object change, and camera movement when required by the approved script. Keep the physical order legible and assign one primary attention owner per beat.

Treat dialogue from the approved scripts as the only allowed spoken wording; do not invent or rewrite lines. Specify speaker order, delivery, breath, room tone, motivated object cues, and intentional silence. Describe exact opening and ending compositions that can be used as raster anchor specifications. Use positive continuity behavior first, then exclusions. Keep the hot-soup hazard non-graphic: express danger using object motion, defensive movement, breath, voice, and sound while skin remains undamaged. Keep exactly two silver-white articulated robot hands in the lower-left and lower-right zones for every frame; pose changes may occur only when required by the approved action. Do not infer ethnicity or unsupported appearance from names or locations. Do not claim timestamps are deterministic. Do not add moral framing.`,
      user: `SCENARIO\n${JSON.stringify(scenario, null, 2)}\n\nAPPROVED THREE-SCRIPT SET\n${JSON.stringify(scripts, null, 2)}\n\nGLOBAL CONTINUITY / VISUAL BIBLE\n${JSON.stringify(body.globalContinuity ?? { note: "No visual bible supplied; preserve only explicitly approved scenario and script details." }, null, 2)}\n\nPROVIDER CAPABILITIES\n${JSON.stringify(providerCapabilities, null, 2)}\n\nPREVIOUS FAILURE EVIDENCE\n${JSON.stringify(body.previousFailureEvidence ?? [], null, 2)}\n\nCompile three mutually coherent branch directions in English. Conflict must stop before a robot choice. Choice A and Choice B must each make both the chosen benefit and the unmet cost visible without inventing harm. Make the exact ending state specific enough to draw as a 16:9 last-frame anchor.`,
    });
    const packages = compileProduction(scenario, scripts as Record<VideoType, ResearchScript>, {
      directions: result.data.directions,
      visualBible: body.globalContinuity,
    });
    return Response.json({ provider: "OpenRouter", model: result.model, compilerVersion: "structured-h3-v2", packages });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Production compilation failed." }, { status: 502 });
  }
}
