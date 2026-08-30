import { falStatus, queryFal, submitFal } from "../../../../../lib/server/fal";
import type { VideoType } from "../../../../../lib/types";

type SubmittedTask = { taskId: string; videoType: VideoType; clipId: string; status: "queued"; provider: string; model: string; paid: true; createdAt: string; idempotencyKey: string };
const globalTasks = globalThis as typeof globalThis & { __scenarioLabH3Tasks?: Map<string, SubmittedTask[]> };
const taskCache = globalTasks.__scenarioLabH3Tasks ??= new Map<string, SubmittedTask[]>();

export async function GET(request: Request) {
  const taskId = new URL(request.url).searchParams.get("taskId");
  const settings = falStatus();
  if (!taskId) return Response.json({ configured: settings.configured, provider: "fal.ai", model: settings.finalVideoModel, paid: true, modes: ["T2V", "I2V", "FLF2V"], durations: [5, 15], resolution: ["2K"] });
  try {
    const queried = await queryFal("finalVideo", taskId);
    if (queried.status !== "succeeded") return Response.json({ taskId, status: queried.status, provider: "fal.ai", model: queried.model });
    const outputUrl = ((queried.result as { video?: { url?: string } }).video?.url) || null;
    if (!outputUrl) throw new Error("MiniMax H3 completed without a video URL.");
    return Response.json({ taskId, status: "succeeded", outputUrl, provider: "fal.ai", model: queried.model, queriedExistingTask: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to query the MiniMax H3 task." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { confirmed?: boolean; candidateCount?: number; idempotencyKey?: string; tasks?: Array<{ videoType?: VideoType; clipId?: string; prompt?: string; mode?: string; request?: { duration?: number; resolution?: string }; inputs?: { firstFrameUrl?: string | null; lastFrameUrl?: string | null } }> } | null;
  if (!body?.confirmed) return Response.json({ error: "Paid MiniMax H3 submission requires explicit confirmation." }, { status: 409 });
  if (!body.idempotencyKey || !/^[a-zA-Z0-9:_-]{8,180}$/.test(body.idempotencyKey)) return Response.json({ error: "A valid idempotency key is required." }, { status: 400 });
  if (body.candidateCount !== 1) return Response.json({ error: "This safety boundary accepts exactly one paid candidate per clip." }, { status: 422 });
  if (!body.tasks?.length || body.tasks.some((task) => !task.videoType || !task.clipId || !task.prompt)) return Response.json({ error: "Every task needs a video type, clip ID, and immutable prompt snapshot." }, { status: 422 });
  const cached = taskCache.get(body.idempotencyKey) ?? [];
  if (cached.length === body.tasks.length) return Response.json({ tasks: cached, duplicateSafe: true, paidTasksCreated: 0, reused: true }, { status: 200 });
  try {
    const createdAt = new Date().toISOString();
    const tasks = [...cached];
    let paidTasksCreated = 0;
    for (const task of body.tasks) {
      if (tasks.some((existing) => existing.clipId === task.clipId)) continue;
      const duration = Math.min(15, Math.max(5, Number(task.request?.duration || 15)));
      const submitted = await submitFal("finalVideo", {
        prompt: task.prompt,
        duration,
        resolution: "2K",
        enable_prompt_expansion: false,
        enable_safety_checker: true,
        ...(task.inputs?.firstFrameUrl ? { image_url: task.inputs.firstFrameUrl } : {}),
        ...(task.inputs?.lastFrameUrl ? { end_image_url: task.inputs.lastFrameUrl } : {}),
      });
      tasks.push({ taskId: submitted.requestId, videoType: task.videoType as VideoType, clipId: task.clipId as string, status: "queued", provider: "fal.ai", model: submitted.model, paid: true, createdAt, idempotencyKey: body.idempotencyKey as string });
      paidTasksCreated += 1;
      // Persist after every paid submission. A retry only submits missing clips.
      taskCache.set(body.idempotencyKey, [...tasks]);
    }
    return Response.json({ tasks, duplicateSafe: true, paidTasksCreated }, { status: 202 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "MiniMax H3 task submission failed." }, { status: 502 });
  }
}
