import { falModel } from "../ai-models";

type FalKind = "imageFast" | "imageReference" | "finalVideo" | "videoUnderstanding";
type FalEndpoints = { statusUrl: string; responseUrl: string };
const falGlobals = globalThis as typeof globalThis & { __falQueueEndpoints?: Map<string, FalEndpoints> };
const falQueueEndpoints = falGlobals.__falQueueEndpoints ??= new Map<string, FalEndpoints>();

function settings(kind: FalKind) {
  return { key: process.env.FAL_KEY?.trim() || "", model: falModel(kind) };
}

function url(model: string, suffix = "") {
  return `https://queue.fal.run/${model}${suffix}`;
}

function fallbackQueueModel(model: string) {
  // FLUX variants share one canonical queue path even though submission uses /schnell.
  return model === "fal-ai/flux/schnell" ? "fal-ai/flux" : model;
}

function trustedFalUrl(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === "queue.fal.run" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function readableError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const value = payload as { detail?: string; error?: string | { message?: string }; message?: string };
  return typeof value.error === "string" ? value.error : value.error?.message || value.detail || value.message || fallback;
}

export function falStatus() {
  return {
    configured: Boolean(process.env.FAL_KEY?.trim()),
    imageFastModel: falModel("imageFast"),
    imageReferenceModel: falModel("imageReference"),
    finalVideoModel: falModel("finalVideo"),
    videoQaModel: falModel("videoUnderstanding"),
  };
}

export async function submitFal(kind: FalKind, input: Record<string, unknown>) {
  const { key, model } = settings(kind);
  if (!key) throw new Error("FAL_KEY is not configured. Open API Settings in the website and paste it there.");
  const response = await fetch(url(model), {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as { request_id?: string; status_url?: string; response_url?: string };
  if (!response.ok || !payload.request_id) throw new Error(readableError(payload, `fal.ai ${model} task could not be queued.`));
  const statusUrl = trustedFalUrl(payload.status_url);
  const responseUrl = trustedFalUrl(payload.response_url);
  if (statusUrl && responseUrl) falQueueEndpoints.set(payload.request_id, { statusUrl, responseUrl });
  return { requestId: payload.request_id, model, statusUrl, responseUrl };
}

export async function queryFal(kind: FalKind, requestId: string) {
  const { key, model } = settings(kind);
  if (!key) throw new Error("FAL_KEY is not configured.");
  if (!/^[A-Za-z0-9_-]{16,120}$/.test(requestId)) throw new Error("Invalid fal.ai request ID.");
  const headers = { Authorization: `Key ${key}` };
  const cached = falQueueEndpoints.get(requestId);
  const statusResponse = await fetch(cached?.statusUrl || url(fallbackQueueModel(model), `/requests/${encodeURIComponent(requestId)}/status`), { headers, cache: "no-store" });
  const status = await statusResponse.json().catch(() => ({})) as { status?: string; error?: string; detail?: string; status_url?: string; response_url?: string };
  if (!statusResponse.ok) throw new Error(readableError(status, `Unable to read fal.ai ${model} task status.`));
  const statusUrl = trustedFalUrl(status.status_url);
  const responseUrl = trustedFalUrl(status.response_url);
  if (statusUrl && responseUrl) falQueueEndpoints.set(requestId, { statusUrl, responseUrl });
  if (status.status === "FAILED") throw new Error(readableError(status, `fal.ai ${model} task ${requestId} failed.`));
  if (status.status !== "COMPLETED") return { status: status.status === "IN_PROGRESS" ? "running" as const : "queued" as const, model, result: null };
  const resultResponse = await fetch(responseUrl || cached?.responseUrl || url(fallbackQueueModel(model), `/requests/${encodeURIComponent(requestId)}`), { headers, cache: "no-store" });
  const result = await resultResponse.json().catch(() => ({}));
  if (!resultResponse.ok) throw new Error(readableError(result, `Unable to read fal.ai ${model} task result.`));
  return { status: "succeeded" as const, model, result };
}

export async function runFal(kind: FalKind, input: Record<string, unknown>, timeoutMs = 240_000) {
  const submitted = await submitFal(kind, input);
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    const queried = await queryFal(kind, submitted.requestId);
    if (queried.status === "succeeded") return { ...submitted, result: queried.result as Record<string, unknown> };
  }
  throw new Error(`fal.ai ${submitted.model} task ${submitted.requestId} is still running. Keep this task ID and query it again; do not resubmit.`);
}
