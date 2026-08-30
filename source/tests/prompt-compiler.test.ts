import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileProduction, createVisualBible, generateScripts, normalizeScenario } from "../lib/scenario-lab";
import type { PromptDirection, VideoType } from "../lib/types";

const scenario = normalizeScenario({
  id: "hot-soup-grandmother",
  familyId: "F-001",
  title: "Hot Soup and Grandmother at the Door",
  description: "The robot and Mother are carrying a pot of hot soup when Grandmother crosses the front door and says she is going home.",
  choiceA: "Release the pot and immediately stop Grandmother",
  choiceB: "Stabilize the pot before following Grandmother",
  tags: ["Physical safety", "Simultaneous claims", "Task interruption"],
});

test("the deterministic H3 compiler preserves the complete English prompt grammar", () => {
  const scripts = generateScripts(scenario);
  const packages = compileProduction(scenario, scripts, { visualBible: createVisualBible() });

  for (const type of ["conflict", "choice_a", "choice_b"] as VideoType[]) {
    const clip = packages[type].clips[0];
    const prompt = clip.promptVersions[0].prompt;
    const timedBlocks = [...prompt.matchAll(/(?:^|\n)(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)\s+seconds\b/g)];
    const englishWords = prompt.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? [];

    assert.equal(clip.mode, "FLF2V");
    assert.match(prompt, /^P0 PERFORMANCE CONTRACT/);
    assert.match(prompt, /Create one continuous 15-second/i);
    assert.match(prompt, /supplied first frame is the strict time-zero image/i);
    assert.match(prompt, /supplied last frame is the strict final endpoint/i);
    assert.equal(timedBlocks.length, 3);
    assert.deepEqual(timedBlocks.map((match) => `${match[1]}-${match[2]}`), ["0.0-5.0", "5.0-7.0", "7.0-15.0"]);
    assert.match(prompt, /5\.0–7\.0 seconds — STORY BEAT/);
    assert.doesNotMatch(prompt, /only the camera changes|CAMERA-ONLY/i);
    assert.match(prompt, /EXACT ENDPOINT: End exactly on the supplied last-frame anchor/);
    assert.match(prompt, /SOUND CONTRACT/);
    assert.match(prompt, /VIEWPOINT AND CONTINUITY LOCKS/);
    assert.match(prompt, /HARD INVARIANTS AND SAFE REPLACEMENTS/);
    assert.match(prompt, /Exactly two silver-white robot hands/);
    assert.ok(englishWords.length >= 500, `${type} prompt is unexpectedly sparse (${englishWords.length} words)`);
    assert.ok(prompt.length <= 7_000, `${type} prompt exceeds the 7,000-character H3 budget (${prompt.length})`);
  }
});

test("all three compiled prompts pass the project H3 static audit", async () => {
  const scripts = generateScripts(scenario);
  const packages = compileProduction(scenario, scripts, { visualBible: createVisualBible() });
  const directory = await mkdtemp(join(tmpdir(), "scenario-lab-prompt-audit-"));
  const auditScript = new URL("../../../skills/minimax-h3-video-prompt/scripts/audit-h3-prompt.mjs", import.meta.url);

  try {
    for (const type of ["conflict", "choice_a", "choice_b"] as VideoType[]) {
      const fixture = join(directory, `${type}.json`);
      await writeFile(fixture, JSON.stringify({ mode: "FLF2V", duration: 15, prompt: packages[type].clips[0].promptVersions[0].prompt }));
      const output = execFileSync(process.execPath, [fileURLToPath(auditScript), fixture], { encoding: "utf8" });
      const result = JSON.parse(output) as { blocks: unknown[]; duration: number | null; warnings: string[] };
      assert.equal(result.duration, 15);
      assert.equal(result.blocks.length, 3);
      assert.deepEqual(result.warnings, [], `${type} static audit warnings: ${result.warnings.join(" | ")}`);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("schema-sized AI direction data cannot inflate the final prompt past 7,000 characters", () => {
  const scripts = generateScripts(scenario);
  const fill = (label: string, length: number) => `${label} ${"precise visible behavior ".repeat(Math.ceil(length / 25))}`.slice(0, length);
  const direction: PromptDirection = {
    singleResearchTurn: fill("Research", 300),
    mode: "FLF2V",
    modeReason: fill("Mode", 240),
    cameraPath: fill("Camera", 220),
    openingState: fill("Opening", 320),
    exactEndingState: fill("Ending", 320),
    p0Owner: fill("Owner", 120),
    p0Trigger: fill("Trigger", 220),
    p0CompleteAction: fill("Action", 300),
    p0ObservablePerformance: fill("Performance with brows mouth jaw shoulders breath", 300),
    p0IntensityPersistence: fill("Intensity", 200),
    beatDirections: [0, 1, 2].map(() => ({ attentionOwner: fill("Attention", 120), visibleAction: fill("Visible", 300), observablePerformance: fill("Brows mouth jaw shoulders breath", 300), cameraBehavior: fill("Settled", 180), sound: fill("Sound", 140) })) as PromptDirection["beatDirections"],
    speakerOrder: fill("Speakers", 180),
    ambientBed: fill("Ambient", 160),
    motivatedSoundCues: fill("Cues", 180),
    intentionalSilence: fill("Silence", 140),
    positiveContinuity: Array.from({ length: 5 }, (_, index) => fill(`Lock ${index}`, 120)),
    exclusions: Array.from({ length: 10 }, (_, index) => fill(`Drift ${index}`, 80)),
    warnings: [],
  };
  const directions = Object.fromEntries((["conflict", "choice_a", "choice_b"] as VideoType[]).map((type) => [type, direction]));
  const packages = compileProduction(scenario, scripts, { directions, visualBible: createVisualBible() });
  for (const type of ["conflict", "choice_a", "choice_b"] as VideoType[]) {
    const length = packages[type].clips[0].promptVersions[0].prompt.length;
    assert.ok(length <= 7_000, `${type} exceeded the hard prompt budget (${length})`);
  }
});
