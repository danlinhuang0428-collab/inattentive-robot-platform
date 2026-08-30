const DEFAULT_MODEL = "fal-ai/flux/schnell";

const STYLE_PROMPT = `A series of warm, textured digital illustrations, rendered in a hand-painted digital art style characterized by simple, distinct color blocks and visible, rich brushstrokes, directly referencing the artistic style seen in image-reference. The overall color palette is distinctly darker and cozier than in image-reference, using muted, rich domestic hues like deep ochres, terracotta, forest greens, and deep teal, with soft, directional indoor lighting from a table lamp creating deep but comfortable shadows and an intimate, lived-in domestic atmosphere. The central figure is one consistent humanoid robot modeled after image-reference: smooth panel-based design, cylindrical joint structure, matte white exterior, matte grey and black joints, and vibrant blue eye-slits and body-panel accents. Preserve this exact robot design throughout the series while changing its pose and action.`;

function settings() {
  return {
    key: process.env.FAL_KEY?.trim() || "",
    model: process.env.FAL_IMAGE_FAST_MODEL?.trim() || DEFAULT_MODEL,
  };
}

function validRequestId(id: string) {
  return /^[a-zA-Z0-9-]{20,100}$/.test(id);
}

function falUrl(model: string, suffix = "") {
  const queueModel = suffix && model === "fal-ai/flux/schnell" ? "fal-ai/flux" : model;
  return `https://queue.fal.run/${queueModel}${suffix}`;
}

export async function POST(request: Request) {
  const { key, model } = settings();
  if (!key) return Response.json({ error: "Add FAL_KEY to .env.local, then restart the local server." }, { status: 503 });
  if (!/^[a-z0-9-]+\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i.test(model)) return Response.json({ error: "FAL_IMAGE_FAST_MODEL is invalid." }, { status: 500 });
  const body = await request.json().catch(() => ({})) as { task?: string; requester?: string; role?: string };
  const task = String(body.task || "").trim().slice(0, 180);
  if (!task) return Response.json({ error: "A robot task is required." }, { status: 400 });
  const requester = String(body.requester || "a family member").trim().slice(0, 80);
  const role = String(body.role || "family member").trim().slice(0, 80);
  const actionPrompt = ` Scene: the robot is ${task.toLowerCase()} alongside ${requester}, the family ${role.toLowerCase()}, in a believable domestic setting. Show the task clearly through pose, hands, objects, and interaction. No text, caption, logo, extra robot, or watermark.`;

  const response = await fetch(falUrl(model), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${key}` },
    body: JSON.stringify({ prompt: `${STYLE_PROMPT}${actionPrompt}`.slice(0, 1500), image_size: "landscape_4_3", num_images: 1, num_inference_steps: 4, acceleration: "high", output_format: "jpeg", enable_safety_checker: true }),
  });
  const payload = await response.json().catch(() => ({})) as { request_id?: string; detail?: string; error?: string };
  if (!response.ok || !payload.request_id) return Response.json({ error: payload.detail || payload.error || "fal.ai image generation could not be queued." }, { status: response.status || 502 });
  return Response.json({ requestId: payload.request_id, status: "queued", model }, { status: 202 });
}

export async function GET(request: Request) {
  const { key, model } = settings();
  if (!key) return Response.json({ error: "FAL_KEY is not configured." }, { status: 503 });
  const requestId = new URL(request.url).searchParams.get("id") || "";
  if (!validRequestId(requestId)) return Response.json({ error: "Invalid fal.ai request ID." }, { status: 400 });
  const headers = { Authorization: `Key ${key}` };
  const statusResponse = await fetch(falUrl(model, `/requests/${encodeURIComponent(requestId)}/status`), { headers, cache: "no-store" });
  const status = await statusResponse.json().catch(() => ({})) as { status?: string; error?: string; detail?: string };
  if (!statusResponse.ok) return Response.json({ error: status.detail || status.error || "Unable to read fal.ai task status." }, { status: statusResponse.status });
  if (status.status === "COMPLETED") {
    const resultResponse = await fetch(falUrl(model, `/requests/${encodeURIComponent(requestId)}`), { headers, cache: "no-store" });
    const result = await resultResponse.json().catch(() => ({})) as { images?: Array<{ url?: string }>; error?: string; detail?: string };
    const imageUrl = result.images?.[0]?.url;
    if (!resultResponse.ok || !imageUrl) return Response.json({ status: "failed", error: result.detail || result.error || "fal.ai completed without an image." }, { status: 502 });
    return Response.json({ status: "succeeded", imageUrl });
  }
  if (status.status === "FAILED") return Response.json({ status: "failed", error: status.error || "fal.ai image generation failed." });
  return Response.json({ status: status.status === "IN_PROGRESS" ? "generating" : "queued" });
}
