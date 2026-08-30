import { buildFrameTemplates, normalizeScenario } from "../../../../../lib/scenario-lab";
import { runFal } from "../../../../../lib/server/fal";
import type { FrameAsset, ProductionPackage, VideoType } from "../../../../../lib/types";

async function hashAsset(assetUrl: string) {
  try {
    const response = await fetch(assetUrl);
    const bytes = response.ok ? await response.arrayBuffer() : new TextEncoder().encode(assetUrl).buffer;
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return `fal-${assetUrl.split("/").at(-1) || Date.now()}`;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { scenario?: Record<string, unknown>; packages?: Partial<Record<VideoType, ProductionPackage>>; previousFrames?: FrameAsset[]; robotReference?: Array<{ assetPath?: string; scope?: string; dataUrl?: string }> } | null;
  if (!body?.scenario || !body.packages?.conflict || !body.packages.choice_a || !body.packages.choice_b) return Response.json({ error: "Three approved production packages are required." }, { status: 400 });
  const reference = body.robotReference?.[0];
  if (reference?.assetPath !== "/inattentive-assets/scenario-02.png" || !reference.scope?.includes("hands") || !reference.dataUrl?.startsWith("data:image/")) return Response.json({ error: "The mandatory scenario-02 robot-hands image input is missing." }, { status: 422 });
  const scenario = normalizeScenario(body.scenario);
  const packages = body.packages as Record<VideoType, ProductionPackage>;
  const templates = buildFrameTemplates(scenario, packages);
  const previous = body.previousFrames ?? [];
  try {
    const videoTypes = ["conflict", "choice_a", "choice_b"] as VideoType[];
    const firstResults: Array<{ videoType: VideoType; clip: ProductionPackage["clips"][number]; first: FrameAsset; firstImage: string }> = [];
    for (const videoType of videoTypes) {
      const pack = packages[videoType];
      const clip = pack.clips[0];
      const firstTemplate = templates.find((item) => item.videoType === videoType && item.frameRole === "first") as FrameAsset;
      const priorFirst = previous.filter((item) => item.clipId === clip.clipId && item.frameRole === "first").toSorted((a, b) => b.version - a.version)[0];
      const firstVersion = (priorFirst?.version ?? 0) + 1;
      const continuityMaster = firstResults[0]?.firstImage;
      const firstPrompt = `Create the strict FIRST frame (time zero) for the ${videoType} branch of one coherent three-film bundle. SCENARIO: ${scenario.title}. ${scenario.description} CHOICES: A=${scenario.choiceA}; B=${scenario.choiceB}. OPENING SPEC: ${JSON.stringify(clip.firstFrameSpec)}. ATTENTION OWNER: ${clip.attentionOwner}. Show only the physical state that already exists at time zero; do not begin the branch consequence. ${continuityMaster ? "Image 1 is the approved bundle continuity master: preserve exactly its people, faces, age, hair, wardrobe, home geometry, lens height, daylight and color grade while arranging only the branch-required opening state. Image 2 supplies the robot hands." : "Image 1 supplies the robot hands and establishes the bundle continuity master."} Copy exactly two silver-white articulated robot hands and forearms into the lower-left and lower-right corners. Ignore all people, environment and story in the robot reference. Keep natural anatomy, readable gaze and a feasible path for the single planned camera move. No text, subtitle, UI, watermark, extra person, extra/missing hand, third-person camera, graphic injury, or invented identity.`;
      const firstRun = await runFal("imageReference", { prompt: firstPrompt, image_urls: continuityMaster ? [continuityMaster, reference.dataUrl] : [reference.dataUrl], aspect_ratio: "16:9", resolution: "2K", output_format: "png", num_images: 1, limit_generations: true, safety_tolerance: "4" });
      const firstImage = (firstRun.result.images as Array<{ url?: string }> | undefined)?.[0]?.url;
      if (!firstImage) throw new Error(`fal.ai completed ${videoType} first frame without an image.`);
      const first: FrameAsset = { ...firstTemplate, assetUrl: firstImage, version: firstVersion, parentFrameId: priorFirst?.frameId ?? null, frameId: `frame-${videoType}-first-${firstRun.requestId}`, generationTaskId: firstRun.requestId, sha256: await hashAsset(firstImage), prompt: firstPrompt, createdAt: new Date().toISOString() };
      firstResults.push({ videoType, clip, first, firstImage });
    }

    const lastResults = await Promise.all(firstResults.map(async ({ videoType, clip, firstImage }) => {
      const pack = packages[videoType];
      const lastTemplate = templates.find((item) => item.videoType === videoType && item.frameRole === "last") as FrameAsset;
      const priorLast = previous.filter((item) => item.clipId === clip.clipId && item.frameRole === "last").toSorted((a, b) => b.version - a.version)[0];
      const lastVersion = (priorLast?.version ?? 0) + 1;
      const lastPrompt = `Create the strict LAST frame for the same continuous film as Image 1. ENDPOINT SPEC: ${JSON.stringify(clip.lastFrameSpec)}. P0 REQUIREMENT: ${pack.requirements.find((item) => item.priority === "P0")?.requirement}. Preserve the exact people, faces, age, hair, wardrobe, room geometry, lens height, light, props, and the two reference-matched robot hands from Image 1. The first and last frames alone must tell the intended branch change with no prompt. Make the completed physical consequence and unmet claimant's emotion readable at 25% thumbnail size using eyes, brows, mouth or jaw, asymmetric posture, breath, hand placement and changed object state; hold intensity through the endpoint. The endpoint must be physically reachable through the one camera path. Image 2 supplies only the mandatory robot-hand design. Safe non-graphic aftermath only. No neutral substitute, text, subtitle, UI, watermark, extra person, extra/missing hand, identity drift, third-person view, or invented injury. Scenario: ${scenario.title}. Branch: ${videoType}.`;
      const lastRun = await runFal("imageReference", { prompt: lastPrompt, image_urls: [firstImage, reference.dataUrl], aspect_ratio: "16:9", resolution: "2K", output_format: "png", num_images: 1, limit_generations: true, safety_tolerance: "4" });
      const lastImage = (lastRun.result.images as Array<{ url?: string }> | undefined)?.[0]?.url;
      if (!lastImage) throw new Error(`fal.ai completed ${videoType} last frame without an image.`);
      return { ...lastTemplate, assetUrl: lastImage, version: lastVersion, parentFrameId: priorLast?.frameId ?? null, frameId: `frame-${videoType}-last-${lastRun.requestId}`, generationTaskId: lastRun.requestId, sha256: await hashAsset(lastImage), prompt: lastPrompt, createdAt: new Date().toISOString() };
    }));
    const generated = [...firstResults.map(({ first }) => first), ...lastResults];
    return Response.json({ provider: "fal.ai", model: "fal-ai/nano-banana-2/edit", frames: generated });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Keyframe generation failed." }, { status: 502 });
  }
}
