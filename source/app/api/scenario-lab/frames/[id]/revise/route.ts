import { runFal } from "../../../../../../lib/server/fal";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { frame?: { version?: number; assetUrl?: string; prompt?: string }; comment?: string; retain?: string[]; change?: string[]; robotReference?: { assetPath?: string; dataUrl?: string } } | null;
  if (!id || !body?.frame?.assetUrl || !body.comment?.trim()) return Response.json({ error: "A generated frame and focused comment are required." }, { status: 400 });
  if (body.robotReference?.assetPath !== "/inattentive-assets/scenario-02.png" || !body.robotReference.dataUrl?.startsWith("data:image/")) return Response.json({ error: "The mandatory robot-hands reference was not preserved as an image input." }, { status: 422 });
  try {
    const prompt = `Revise Image 1 using this focused researcher correction: ${body.comment.trim()}. Retain without change: ${(body.retain ?? ["all unmentioned frame layers", "global continuity locks"]).join("; ")}. Change only: ${(body.change ?? [body.comment.trim()]).join("; ")}. Image 2 supplies only the exact two silver-white articulated robot hands and forearms; ignore its people and environment. Preserve the original 16:9 composition, people, wardrobe, room geometry, camera, light, P0 research meaning, and all unmentioned details. No text, UI, watermark, extra hands, or identity drift.`;
    const run = await runFal("imageReference", { prompt, image_urls: [body.frame.assetUrl, body.robotReference.dataUrl], aspect_ratio: "16:9", resolution: "2K", output_format: "png", num_images: 1, limit_generations: true, safety_tolerance: "4" });
    const assetUrl = (run.result.images as Array<{ url?: string }> | undefined)?.[0]?.url;
    if (!assetUrl) throw new Error("fal.ai completed the frame revision without an image.");
    return Response.json({ provider: "fal.ai", model: run.model, revision: { parentFrameId: id, frameId: `${id}-r${Number(body.frame.version || 1) + 1}`, version: Number(body.frame.version || 1) + 1, status: "generated", comment: body.comment.trim(), prompt, assetUrl, generationTaskId: run.requestId } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Frame revision failed." }, { status: 502 });
  }
}
