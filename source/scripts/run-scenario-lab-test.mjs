import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactDir = resolve(root, "test-artifacts/low-battery-grandmother");
const statePath = resolve(artifactDir, "workflow-state.json");
const baseUrl = process.env.SCENARIO_LAB_BASE_URL || "http://127.0.0.1:3001";
const stage = process.argv[2];

async function loadState() {
  return JSON.parse(await readFile(statePath, "utf8"));
}

async function saveState(state) {
  await mkdir(artifactDir, { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({ error: `Non-JSON response (${response.status})` }));
  if (!response.ok) throw new Error(`${path} ${response.status}: ${payload.error || JSON.stringify(payload)}`);
  return payload;
}

async function withRetries(label, operation) {
  const failures = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const value = await operation(attempt);
      return { value, attempt, failures };
    } catch (error) {
      failures.push({ attempt, error: error instanceof Error ? error.message : String(error), at: new Date().toISOString() });
      if (attempt === 3) throw new Error(`${label} failed three consecutive times: ${JSON.stringify(failures)}`);
    }
  }
}

async function runScripts() {
  const state = await loadState();
  const result = await withRetries("Stage 02 scripts", () => post("/api/scenario-lab/scripts/generate", {
    scenario: state.scenario,
    familyContext: state.family,
  }));
  state.stage02 = { ...result.value, attempt: result.attempt, failures: result.failures, completedAt: new Date().toISOString() };
  await saveState(state);
  process.stdout.write(`${JSON.stringify({ attempt: result.attempt, provider: result.value.provider, model: result.value.model, scripts: Object.fromEntries(Object.entries(result.value.scripts).map(([key, script]) => [key, { title: script.title, purpose: script.purpose, beats: script.beats.map((beat) => ({ timeRange: beat.timeRange, whatHappens: beat.whatHappens, dialogue: beat.dialogue })), endingState: script.endingState }])) }, null, 2)}\n`);
}

if (stage === "scripts") await runScripts();
else throw new Error("Usage: node scripts/run-scenario-lab-test.mjs scripts");
