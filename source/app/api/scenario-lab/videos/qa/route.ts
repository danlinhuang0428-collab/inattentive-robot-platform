import { runFal } from "../../../../../lib/server/fal";
import { openRouterJson } from "../../../../../lib/server/openrouter";

const qaSchema = {
  type: "object", additionalProperties: false, required: ["technicalPass", "checks", "audioReview", "finalVerdict"], properties: {
    technicalPass: { type: "boolean" },
    checks: { type: "array", items: { type: "object", additionalProperties: false, required: ["requirementId", "priority", "status", "timestamp", "observation", "severity"], properties: {
      requirementId: { type: "string" }, priority: { type: "string", enum: ["P0", "P1", "P2", "P3", "P4"] }, status: { type: "string", enum: ["pass", "fail", "needs_review"] }, timestamp: { type: "number" }, observation: { type: "string" }, severity: { type: "string", enum: ["critical", "tolerable"] },
    } } },
    audioReview: { type: "array", items: { type: "string" } }, finalVerdict: { type: "string", enum: ["accept", "reject", "researcher_review"] },
  },
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { videoType?: string; outputUrl?: string; requirements?: Array<{ id?: string; priority?: string; requirement?: string; qaTarget?: string; failurePolicy?: string }> } | null;
  if (!body?.videoType || !body.outputUrl || !body.requirements?.length) return Response.json({ error: "A generated video and its QA contract are required." }, { status: 422 });
  try {
    const visionPrompt = `Inspect the full video timeline and audio for this HCI branch (${body.videoType}). Report timestamped evidence for every requirement. Check story-defining action and emotion, branch meaning, speaker identity/order, direct robot-lens gaze, physically continuous and readable camera/action blocking, stable people/wardrobe/room, exactly two silver-white robot hands in the lower corners throughout, anatomy, no UI/text/subtitles, native dialogue intelligibility, lip movement, ambient sound, duration, and decodability. Camera movement, dialogue, emotion, object change, and story action are allowed in every interval. Be literal and do not infer a pass from the filename. Requirements: ${JSON.stringify(body.requirements)}`;
    const vision = await runFal("videoUnderstanding", { video_url: body.outputUrl, prompt: visionPrompt, detailed_analysis: true });
    const rawAnalysis = String(vision.result.output || "");
    if (!rawAnalysis) throw new Error("fal.ai video understanding returned no QA evidence.");
    const adjudication = await openRouterJson<{ technicalPass: boolean; checks: Array<{ requirementId: string; priority: "P0" | "P1" | "P2" | "P3" | "P4"; status: "pass" | "fail" | "needs_review"; timestamp: number; observation: string; severity: "critical" | "tolerable" }>; audioReview: string[]; finalVerdict: "accept" | "reject" | "researcher_review" }>({
      complexity: "complex",
      schemaName: "scenario_video_qa",
      schema: qaSchema,
      temperature: 0.1,
      maxTokens: 5_000,
      system: "You are a conservative HCI video QA adjudicator. Convert video-understanding evidence into exactly one check per supplied requirement. P0 or P1 failure means reject. Unknown or insufficient evidence means needs_review, never pass. AI evidence cannot replace the researcher's full-timeline and audio acceptance, so use researcher_review unless there is an explicit critical failure. Preserve the supplied requirement IDs and priorities exactly.",
      user: `Video type: ${body.videoType}\nRequirements:\n${JSON.stringify(body.requirements, null, 2)}\n\nfal.ai full-video analysis:\n${rawAnalysis}`,
    });
    return Response.json({ provider: "fal.ai + OpenRouter", models: [vision.model, adjudication.model], qa: { videoType: body.videoType, ...adjudication.data } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "AI video QA failed." }, { status: 502 });
  }
}
