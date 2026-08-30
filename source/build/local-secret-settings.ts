import { chmod, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const SETTINGS_PATHS = new Set(["/__local-settings/ai", "/__local-settings/openai"]);
const MAX_BODY_BYTES = 4_096;

function respond(response: ServerResponse, status: number, payload: Record<string, unknown>) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function isSameLocalOrigin(request: IncomingMessage) {
  const host = request.headers.host || "";
  const origin = request.headers.origin || "";
  const hostname = host.replace(/:\d+$/, "");
  return ["127.0.0.1", "localhost"].includes(hostname) && origin === `http://${host}`;
}

async function readJsonBody(request: IncomingMessage) {
  let body = "";
  for await (const chunk of request) {
    body += String(chunk);
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) throw new Error("Body too large");
  }
  return JSON.parse(body) as { openRouterKey?: unknown; falKey?: unknown; apiKey?: unknown };
}

async function saveAiKeys(openRouterKey: string, falKey: string) {
  const envPath = resolve(process.cwd(), ".env.local");
  let existing = "";
  try {
    existing = await readFile(envPath, "utf8");
  } catch {
    // The local settings form may create the ignored file on first use.
  }

  const lines = existing
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => line && !line.startsWith("OPENROUTER_API_KEY=") && !line.startsWith("OPENROUTER_FAST_MODEL=") && !line.startsWith("OPENROUTER_COMPLEX_MODEL=") && !line.startsWith("FAL_KEY=") && !line.startsWith("FAL_IMAGE_FAST_MODEL=") && !line.startsWith("FAL_IMAGE_REFERENCE_MODEL=") && !line.startsWith("FAL_VIDEO_MODEL=") && !line.startsWith("FAL_VIDEO_QA_MODEL="));
  if (openRouterKey) lines.push(`OPENROUTER_API_KEY=${openRouterKey}`);
  else if (process.env.OPENROUTER_API_KEY) lines.push(`OPENROUTER_API_KEY=${process.env.OPENROUTER_API_KEY}`);
  if (falKey) lines.push(`FAL_KEY=${falKey}`);
  else if (process.env.FAL_KEY) lines.push(`FAL_KEY=${process.env.FAL_KEY}`);
  lines.push(
    "OPENROUTER_FAST_MODEL=google/gemini-3.1-flash-lite",
    "OPENROUTER_COMPLEX_MODEL=google/gemini-3.5-flash",
    "FAL_IMAGE_FAST_MODEL=fal-ai/flux/schnell",
    "FAL_IMAGE_REFERENCE_MODEL=fal-ai/nano-banana-2/edit",
    "FAL_VIDEO_MODEL=minimax/h3/image-to-video",
    "FAL_VIDEO_QA_MODEL=fal-ai/video-understanding",
  );
  await writeFile(envPath, `${lines.join("\n")}\n`, { encoding: "utf8", mode: 0o600 });
  await chmod(envPath, 0o600);
}

export function localSecretSettings(): Plugin {
  return {
    name: "local-secret-settings",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url || "/", "http://localhost").pathname;
        if (!SETTINGS_PATHS.has(pathname)) return next();
        if (request.method !== "POST") return respond(response, 405, { error: "Method not allowed." });
        if (!isSameLocalOrigin(request)) return respond(response, 403, { error: "Local same-origin request required." });

        try {
          const body = await readJsonBody(request);
          const legacy = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
          const openRouterKey = typeof body.openRouterKey === "string" ? body.openRouterKey.trim() : legacy;
          const falKey = typeof body.falKey === "string" ? body.falKey.trim() : "";
          if (!openRouterKey && !falKey) return respond(response, 400, { error: "Paste at least one API key." });
          if (openRouterKey && (!/^sk-or-[A-Za-z0-9_-]{16,500}$/.test(openRouterKey) || /\s/.test(openRouterKey))) return respond(response, 400, { error: "Enter a valid OpenRouter API key." });
          if (falKey && (falKey.length < 20 || falKey.length > 500 || /\s/.test(falKey))) return respond(response, 400, { error: "Enter a valid fal.ai API key." });

          await saveAiKeys(openRouterKey, falKey);
          if (openRouterKey) process.env.OPENROUTER_API_KEY = openRouterKey;
          if (falKey) process.env.FAL_KEY = falKey;
          process.env.OPENROUTER_FAST_MODEL = "google/gemini-3.1-flash-lite";
          process.env.OPENROUTER_COMPLEX_MODEL = "google/gemini-3.5-flash";
          process.env.FAL_IMAGE_FAST_MODEL = "fal-ai/flux/schnell";
          process.env.FAL_IMAGE_REFERENCE_MODEL = "fal-ai/nano-banana-2/edit";
          process.env.FAL_VIDEO_MODEL = "minimax/h3/image-to-video";
          process.env.FAL_VIDEO_QA_MODEL = "fal-ai/video-understanding";
          respond(response, 200, { saved: true, openRouterSaved: Boolean(openRouterKey), falSaved: Boolean(falKey) });
        } catch {
          respond(response, 500, { error: "Could not save the local API setting." });
        }
      });
    },
  };
}
