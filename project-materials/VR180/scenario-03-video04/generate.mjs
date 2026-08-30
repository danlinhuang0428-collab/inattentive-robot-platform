#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const vrRoot = path.resolve(here, "..");
const projectRoot = path.resolve(vrRoot, "../..");
const workspaceRoot = path.resolve(projectRoot, "../..");
const manifestPath = path.join(here, "generation-manifest.json");
const assetsDir = path.join(here, "assets");
const qaDir = path.join(here, "qa");
const geometryPath = path.join(vrRoot, "references/reference-geometry.png");
const sourceRoot = path.join(workspaceRoot, "03_AI影游资料/01_最终版影游资料/Family_01/Scenario_03_外婆说不要拦我/关键帧");
const firstSourcePath = path.join(sourceRoot, "02_共用暂停帧.png");
const lastSourcePath = path.join(sourceRoot, "05_选择C_最终帧.png");

const paths = {
  first: path.join(assetsDir, "video04-vr180-first.png"),
  last: path.join(assetsDir, "video04-vr180-last.png"),
  candidate: path.join(assetsDir, "video04-vr180-h3-candidate.mp4"),
  depth: path.join(assetsDir, "video04-vr180-h3-candidate.depth.mp4"),
  master: path.join(assetsDir, "video04-vr180-color-master-2880.mp4"),
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
  catch { return { paidTaskLimit: 5, paidTasks: [], outputs: {} }; }
}

async function saveManifest(manifest) {
  await fs.mkdir(here, { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

async function dataUri(file) {
  const body = await fs.readFile(file);
  return `data:image/png;base64,${body.toString("base64")}`;
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
    number: manifest.paidTasks.length + 1, label, model, requestId: payload.request_id,
    statusUrl: payload.status_url, responseUrl: payload.response_url,
    submittedAt: new Date().toISOString(), status: "queued",
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
  throw new Error(`${task.label} is still running; resume instead of resubmitting.`);
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to download generated media (${response.status}).`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(destination), { recursive: true });
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

const projectionBase = `Use image 1 only as the validated geometric projection template. Use image 2 as the sole source of scene content and identity. Rebuild image 2 as a photorealistic VR180 half-equirectangular image, exactly 180 degrees horizontal by 180 degrees vertical, square 1:1, edge to edge. Preserve image 1's wrap-around projection geometry: extreme left and right are yaw minus/plus 90 degrees, top is the ceiling directly above, bottom is the floor directly below, and architecture bows naturally away from center. Extend unseen peripheral, ceiling, and floor regions; do not crop, stretch, letterbox, or place the 16:9 source inside a square canvas. Preserve every visible person's identity, age, hair, clothes, pose, gaze, expression, the apartment entrance, open door, corridor, furniture, shoes, plants, warm evening illumination, and central blocking. First-person adult domestic robot view, stable level horizon at 165 cm. Exactly two silver-white mechanical forearms and complete five-finger hands with black articulated joints remain prominent in the lower foreground. No circular fisheye border, vignette, black corners, seams, text, subtitles, watermark, logo, extra people, extra arms, duplicate hands, fused hands, or deformed fingers.`;

const projectionPrompts = {
  first: `${projectionBase}\n\nOpening anchor: preserve the elderly East Asian grandmother centered closest to camera in beige cardigan and olive shirt, calm and determined. Preserve the blue-shirt woman behind her near the doorway and the beige-top woman deeper left. Keep the entire open threshold readable and both robot hands low, open, complete, and non-contacting.`,
  last: `${projectionBase}\n\nEnding anchor: preserve the same elderly East Asian grandmother at the elevator lobby in beige cardigan and olive shirt, turned toward the camera with angry, resigned direct eye contact. Preserve the elevator doors and illuminated call button at right, the corridor back to the open apartment at left, and no other person in the hallway. Keep both complete robot hands low, open, passive, and non-contacting. Do not invent the sister, mother, or any extra person.`,
};

async function projectFrame(key, sourcePath) {
  const outputKey = `projection-${key}`;
  const manifest = await loadManifest();
  if (manifest.outputs[outputKey]?.localPath) return manifest.outputs[outputKey];
  const imageUrls = await Promise.all([dataUri(geometryPath), dataUri(sourcePath)]);
  const { task, key: apiKey } = await submit("fal-ai/nano-banana-pro/edit", {
    prompt: projectionPrompts[key], image_urls: imageUrls, num_images: 1,
    aspect_ratio: "1:1", resolution: "2K", output_format: "png",
    limit_generations: true, enable_web_search: false,
  }, `scenario03-video04-projection-${key}`);
  const result = await waitFor(task, apiKey);
  const url = result.images?.[0]?.url;
  if (!url) throw new Error(`Projection ${key} completed without an image URL.`);
  const saved = await download(url, paths[key]);
  await recordSuccess(task.requestId, outputKey, url, paths[key], saved);
  return { remoteUrl: url, localPath: paths[key], ...saved };
}

async function project() {
  await projectFrame("first", firstSourcePath);
  await projectFrame("last", lastSourcePath);
}

async function video() {
  const manifest = await loadManifest();
  const first = manifest.outputs["projection-first"];
  const last = manifest.outputs["projection-last"];
  if (!first?.remoteUrl || !last?.remoteUrl) throw new Error("Generate and inspect both projection anchors first.");
  if (manifest.outputs.video?.localPath) return;
  const prompt = await fs.readFile(path.join(here, "prompt.txt"), "utf8");
  const { task, key } = await submit("minimax/h3/image-to-video", {
    prompt, image_url: first.remoteUrl, end_image_url: last.remoteUrl,
    duration: 15, resolution: "2K", seed: 180304,
    enable_prompt_expansion: false, enable_safety_checker: true,
  }, "scenario03-video04-minimax-h3");
  const result = await waitFor(task, key);
  const url = result.video?.url;
  if (!url) throw new Error("MiniMax H3 completed without a video URL.");
  const saved = await download(url, paths.candidate);
  await recordSuccess(task.requestId, "video", url, paths.candidate, { ...saved, promptSha256: sha256(Buffer.from(prompt)) });
}

async function depth() {
  const manifest = await loadManifest();
  const source = manifest.outputs.video;
  if (!source?.remoteUrl) throw new Error("Generate and accept the motion candidate first.");
  if (manifest.outputs.depth?.localPath) return;
  const { task, key } = await submit("fal-ai/depth-anything-video", {
    video_url: source.remoteUrl, model: "VDA-Large", colormap: "grayscale",
    resolution: "auto", side_by_side: false, include_raw_depths: false,
  }, "scenario03-video04-depth-vda-large");
  const result = await waitFor(task, key);
  const url = result.video?.url;
  if (!url) throw new Error("Depth generation completed without a video URL.");
  const saved = await download(url, paths.depth);
  await recordSuccess(task.requestId, "depth", url, paths.depth, saved);
}

async function upscale() {
  const manifest = await loadManifest();
  const source = manifest.outputs.video;
  if (!source?.remoteUrl) throw new Error("Generate and accept the motion candidate first.");
  if (manifest.outputs.upscale?.localPath) return;
  const { task, key } = await submit("fal-ai/topaz/upscale/video", {
    video_url: source.remoteUrl, model: "Starlight Precise 2.5", upscale_factor: 1.5,
    compression: 0.18, noise: 0.08, halo: 0.08, grain: 0.01,
    recover_detail: 0.72, H264_output: true,
  }, "scenario03-video04-topaz-1.5x");
  const result = await waitFor(task, key);
  const url = result.video?.url;
  if (!url) throw new Error("Topaz upscale completed without a video URL.");
  const saved = await download(url, paths.master);
  await recordSuccess(task.requestId, "upscale", url, paths.master, saved);
}

async function provenance() {
  const prompt = await fs.readFile(path.join(here, "prompt.txt"));
  const sources = await Promise.all([firstSourcePath, lastSourcePath, geometryPath].map(async (file) => ({ file, sha256: sha256(await fs.readFile(file)) })));
  await fs.mkdir(qaDir, { recursive: true });
  await fs.writeFile(path.join(qaDir, "provenance.json"), `${JSON.stringify({ createdAt: new Date().toISOString(), promptSha256: sha256(prompt), sources }, null, 2)}\n`);
}

const action = process.argv[2];
if (action === "project") await project();
else if (action === "video") await video();
else if (action === "depth") await depth();
else if (action === "upscale") await upscale();
else if (action === "provenance") await provenance();
else throw new Error("Usage: node generate.mjs <project|video|depth|upscale|provenance>");
