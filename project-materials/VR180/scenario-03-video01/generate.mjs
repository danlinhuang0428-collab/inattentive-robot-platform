#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const manifestPath = path.join(here, "generation-manifest.json");
const assetsDir = path.join(here, "assets");
const qaDir = path.join(here, "qa");
const paths = {
  first: path.join(assetsDir, "video01-vr180-first.png"),
  last: path.join(assetsDir, "video01-vr180-last.png"),
  candidate: path.join(assetsDir, "video01-vr180-h3-candidate.mp4"),
  depth: path.join(assetsDir, "video01-vr180-h3-candidate.depth.mp4"),
  master: path.join(assetsDir, "video01-vr180-color-master-2880.mp4"),
};

function parseEnv(source) {
  return Object.fromEntries(source.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    return match ? [[match[1], match[2]]] : [];
  }));
}

async function settings() {
  const env = parseEnv(await fs.readFile(path.join(projectRoot, ".env.local"), "utf8"));
  const key = process.env.FAL_KEY || env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY is not configured.");
  return { key };
}

async function loadManifest() {
  try { return JSON.parse(await fs.readFile(manifestPath, "utf8")); }
  catch { return { paidTaskLimit: 3, paidTasks: [], outputs: {} }; }
}

async function saveManifest(manifest) {
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

async function dataUri(file, mime = "image/png") {
  const body = await fs.readFile(file);
  return `data:${mime};base64,${body.toString("base64")}`;
}

function falError(payload, fallback) {
  return payload?.detail || payload?.message || payload?.error?.message || payload?.error || fallback;
}

async function submit(model, input, label) {
  const manifest = await loadManifest();
  const existing = manifest.paidTasks.find((task) => task.label === label);
  if (existing) return { task: existing, key: (await settings()).key };
  if (manifest.paidTasks.length >= manifest.paidTaskLimit) throw new Error(`Paid task limit reached before ${label}.`);
  const { key } = await settings();
  const response = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
      "X-Fal-Object-Lifecycle-Preference": JSON.stringify({ expiration_duration_seconds: 2592000 }),
    },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.request_id) throw new Error(falError(payload, `${model} could not be queued.`));
  const task = {
    number: manifest.paidTasks.length + 1,
    label,
    model,
    requestId: payload.request_id,
    statusUrl: payload.status_url,
    responseUrl: payload.response_url,
    submittedAt: new Date().toISOString(),
    status: "queued",
  };
  manifest.paidTasks.push(task);
  await saveManifest(manifest);
  console.log(`PAID_TASK ${task.number}/${manifest.paidTaskLimit} ${label} ${task.requestId}`);
  return { task, key };
}

async function waitFor(task, key) {
  const statusUrl = task.statusUrl || `https://queue.fal.run/${task.model}/requests/${task.requestId}/status`;
  const responseUrl = task.responseUrl || `https://queue.fal.run/${task.model}/requests/${task.requestId}`;
  for (let attempt = 0; attempt < 720; attempt += 1) {
    const statusResponse = await fetch(statusUrl, { headers: { Authorization: `Key ${key}` } });
    const status = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok) throw new Error(falError(status, `Unable to read ${task.label} status.`));
    if (status.status === "FAILED") throw new Error(falError(status, `${task.label} failed.`));
    if (status.status === "COMPLETED") {
      const resultResponse = await fetch(responseUrl, { headers: { Authorization: `Key ${key}` } });
      const result = await resultResponse.json().catch(() => ({}));
      if (!resultResponse.ok) throw new Error(falError(result, `Unable to read ${task.label} result.`));
      return result;
    }
    if (attempt % 12 === 0) console.log(`WAITING ${task.label} ${status.status || "queued"}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`${task.label} is still running; resume this task instead of resubmitting.`);
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to download generated media (${response.status}).`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, bytes);
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

async function recordSuccess(requestId, outputKey, remoteUrl, localPath, metadata = {}) {
  const manifest = await loadManifest();
  const task = manifest.paidTasks.find((item) => item.requestId === requestId);
  if (task) Object.assign(task, { status: "succeeded", completedAt: new Date().toISOString() });
  manifest.outputs[outputKey] = { remoteUrl, localPath, savedAt: new Date().toISOString(), ...metadata };
  await saveManifest(manifest);
}

async function video() {
  const manifest = await loadManifest();
  if (manifest.outputs.video?.localPath) return;
  const prompt = await fs.readFile(path.join(here, "prompt.txt"), "utf8");
  const { task, key } = await submit("minimax/h3/image-to-video", {
    prompt,
    image_url: await dataUri(paths.first),
    end_image_url: await dataUri(paths.last),
    duration: 15,
    resolution: "2K",
    seed: 180301,
    enable_prompt_expansion: false,
    enable_safety_checker: true,
  }, "scenario03-video01-minimax-h3");
  const result = await waitFor(task, key);
  const url = result.video?.url;
  if (!url) throw new Error("MiniMax H3 completed without a video URL.");
  const saved = await download(url, paths.candidate);
  await recordSuccess(task.requestId, "video", url, paths.candidate, { ...saved, promptSha256: sha256(Buffer.from(prompt)) });
}

async function depth() {
  const manifest = await loadManifest();
  const source = manifest.outputs.video;
  if (!source?.remoteUrl) throw new Error("Generate and approve the motion candidate first.");
  if (manifest.outputs.depth?.localPath) return;
  const { task, key } = await submit("fal-ai/depth-anything-video", {
    video_url: source.remoteUrl,
    model: "VDA-Large",
    colormap: "grayscale",
    resolution: "auto",
    side_by_side: false,
    include_raw_depths: false,
  }, "scenario03-video01-depth-vda-large");
  const result = await waitFor(task, key);
  const url = result.video?.url;
  if (!url) throw new Error("Depth generation completed without a video URL.");
  const saved = await download(url, paths.depth);
  await recordSuccess(task.requestId, "depth", url, paths.depth, saved);
}

async function upscale() {
  const manifest = await loadManifest();
  const source = manifest.outputs.video;
  if (!source?.remoteUrl) throw new Error("Generate and approve the motion candidate first.");
  if (manifest.outputs.upscale?.localPath) return;
  const { task, key } = await submit("fal-ai/topaz/upscale/video", {
    video_url: source.remoteUrl,
    model: "Starlight Precise 2.5",
    upscale_factor: 1.5,
    compression: 0.18,
    noise: 0.08,
    halo: 0.08,
    grain: 0.01,
    recover_detail: 0.72,
    H264_output: true,
  }, "scenario03-video01-topaz-1.5x");
  const result = await waitFor(task, key);
  const url = result.video?.url;
  if (!url) throw new Error("Topaz upscale completed without a video URL.");
  const saved = await download(url, paths.master);
  await recordSuccess(task.requestId, "upscale", url, paths.master, saved);
}

async function provenance() {
  const sources = await Promise.all([paths.first, paths.last, path.join(here, "prompt.txt")].map(async (file) => ({ file, sha256: sha256(await fs.readFile(file)) })));
  await fs.writeFile(path.join(qaDir, "provenance.json"), `${JSON.stringify({ createdAt: new Date().toISOString(), sources }, null, 2)}\n`);
}

const action = process.argv[2];
if (action === "video") await video();
else if (action === "depth") await depth();
else if (action === "upscale") await upscale();
else if (action === "provenance") await provenance();
else throw new Error("Usage: node generate.mjs <video|depth|upscale|provenance>");
