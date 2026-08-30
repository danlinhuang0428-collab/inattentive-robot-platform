import { isResearchScript, normalizeScenario } from "../../../../../lib/scenario-lab";
import { openRouterJson } from "../../../../../lib/server/openrouter";
import type { Family, ResearchScript, VideoType } from "../../../../../lib/types";

const dialogueSchema = {
  type: "object", additionalProperties: false,
  required: ["speaker", "line", "delivery", "looksAtRobot"],
  properties: { speaker: { type: "string" }, line: { type: "string" }, delivery: { type: "string" }, looksAtRobot: { type: "boolean" } },
};

const beatSchema = {
  type: "object", additionalProperties: false,
  required: ["id", "order", "timeRange", "whatHappens", "cameraAttention", "actions", "dialogue", "ambientSound"],
  properties: {
    id: { type: "string" }, order: { type: "integer" }, timeRange: { type: "string" }, whatHappens: { type: "string" }, cameraAttention: { type: "string" },
    actions: { type: "array", items: { type: "object", additionalProperties: false, required: ["characterId", "action", "emotion"], properties: { characterId: { type: "string" }, action: { type: "string" }, emotion: { type: "string" } } } },
    dialogue: { type: "array", items: dialogueSchema }, ambientSound: { type: "array", items: { type: "string" } },
  },
};

const scriptSchema = {
  type: "object", additionalProperties: false,
  required: ["title", "purpose", "estimatedDurationSeconds", "space", "beats", "endingState", "continuityNotes", "researchMeaning", "openQuestions"],
  properties: {
    title: { type: "string" }, purpose: { type: "string" }, estimatedDurationSeconds: { type: "integer", enum: [15] },
    space: { type: "object", additionalProperties: false, required: ["location", "layout", "characterPositions", "importantObjects"], properties: {
      location: { type: "string" }, layout: { type: "string" },
      characterPositions: { type: "array", items: { type: "object", additionalProperties: false, required: ["characterId", "position", "distanceFromRobot"], properties: { characterId: { type: "string" }, position: { type: "string" }, distanceFromRobot: { type: "string" } } } },
      importantObjects: { type: "array", items: { type: "string" } },
    } },
    beats: { type: "array", minItems: 2, maxItems: 3, items: beatSchema }, endingState: { type: "string" }, continuityNotes: { type: "array", items: { type: "string" } }, researchMeaning: { type: "string" }, openQuestions: { type: "array", items: { type: "string" } },
  },
};

const responseSchema = {
  type: "object", additionalProperties: false, required: ["scripts"],
  properties: { scripts: { type: "array", minItems: 3, maxItems: 3, items: scriptSchema } },
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function textList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => textValue(item)).filter(Boolean) : value == null ? [] : [textValue(value)].filter(Boolean);
}

function normalizeScriptDraft(value: unknown, videoType: VideoType, index: number): ResearchScript {
  const draft = objectValue(value);
  const space = objectValue(draft.space);
  const beats = Array.isArray(draft.beats) ? draft.beats.map((beatValue, beatIndex) => {
    const beat = objectValue(beatValue);
    const actions = Array.isArray(beat.actions) ? beat.actions : beat.actions ? [beat.actions] : [];
    const dialogue = Array.isArray(beat.dialogue) ? beat.dialogue : beat.dialogue ? [beat.dialogue] : [];
    return {
      id: textValue(beat.id, `${videoType}-b${beatIndex + 1}`),
      order: Number.isFinite(Number(beat.order)) ? Number(beat.order) : beatIndex + 1,
      timeRange: textValue(beat.timeRange, `${beatIndex * 5}-${(beatIndex + 1) * 5}s`),
      whatHappens: textValue(beat.whatHappens, "Visible branch action continues."),
      cameraAttention: textValue(beat.cameraAttention, "Robot first-person attention remains on the active claimant."),
      actions: actions.map((actionValue) => {
        if (typeof actionValue === "string") return { characterId: "participant", action: actionValue, emotion: "observable high-stakes tension" };
        const action = objectValue(actionValue);
        return { characterId: textValue(action.characterId, "participant"), action: textValue(action.action), emotion: textValue(action.emotion) };
      }),
      dialogue: dialogue.map((lineValue) => {
        if (typeof lineValue === "string") {
          const match = lineValue.match(/^([^:：]{1,40})[:：]\s*(.+)$/);
          return { speaker: match?.[1] || "Participant", line: match?.[2] || lineValue, delivery: "urgent natural delivery", looksAtRobot: true };
        }
        const line = objectValue(lineValue);
        return { speaker: textValue(line.speaker), line: textValue(line.line), delivery: textValue(line.delivery), looksAtRobot: line.looksAtRobot !== false };
      }),
      ambientSound: textList(beat.ambientSound),
    };
  }) : [];
  const positions = Array.isArray(space.characterPositions) ? space.characterPositions : [];
  return {
    videoType,
    title: textValue(draft.title, `Branch ${index + 1}`),
    purpose: textValue(draft.purpose),
    estimatedDurationSeconds: 15,
    space: {
      location: textValue(space.location),
      layout: textValue(space.layout),
      characterPositions: positions.map((positionValue) => {
        const position = objectValue(positionValue);
        return { characterId: textValue(position.characterId), position: textValue(position.position), distanceFromRobot: textValue(position.distanceFromRobot) };
      }),
      importantObjects: textList(space.importantObjects),
    },
    beats,
    endingState: textValue(draft.endingState),
    continuityNotes: textList(draft.continuityNotes),
    researchMeaning: textValue(draft.researchMeaning),
    openQuestions: textList(draft.openQuestions),
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { scenario?: Record<string, unknown>; familyContext?: Family; currentScript?: ResearchScript } | null;
  if (!body?.scenario) return Response.json({ error: "A valid scenario brief is required." }, { status: 400 });
  const scenario = normalizeScenario(body.scenario);
  if (!scenario.title || !scenario.description || !scenario.choiceA || !scenario.choiceB || !scenario.tags.length) return Response.json({ error: "The scenario brief is incomplete." }, { status: 422 });
  try {
    const result = await openRouterJson<{ scripts: Array<Omit<ResearchScript, "videoType">> }>({
      complexity: "complex",
      schemaName: "scenario_lab_research_scripts",
      schema: responseSchema,
      strictSchema: false,
      temperature: 0.45,
      maxTokens: 9_000,
      system: `You are the research-script director for an HCI study about attention politics in domestic robots. Return JSON only, with one top-level key named scripts. Produce exactly three editable 15-second scripts: conflict stops before the robot decides; choice_a shows the direct benefit of Choice A and the unmet cost of Choice B; choice_b shows the reverse. Every script needs title, purpose, estimatedDurationSeconds, space, beats, endingState, continuityNotes, researchMeaning, and openQuestions. Every beat needs id, order, timeRange, whatHappens, cameraAttention, actions, dialogue, and ambientSound. Use at most three beats and keep every action and camera path physically readable. Camera movement, dialogue, emotional change, and story action may coexist in any interval when the approved scenario needs them. Budget dialogue at 2.5–3.2 English words per second including emotion and pauses. Use observable action, gaze, face, posture, breath, and voice carriers. The viewpoint is the robot's first-person camera with exactly two reference-matched robot hands in the lower corners. Do not invent identities, ethnicities, injuries, UI, subtitles, or a morally correct answer.`,
      user: `Scenario:
${JSON.stringify(scenario, null, 2)}

Family context:
${JSON.stringify(body.familyContext ?? null, null, 2)}

Researcher-confirmed current script, if this is a focused regeneration:
${JSON.stringify(body.currentScript ?? null, null, 2)}

Return exactly three complete scripts in this fixed array order: first conflict, second choice_a, third choice_b. Do not include a videoType field; the server assigns it from array position.

Derive every person, object, hazard, action and spoken meaning only from the supplied scenario, choices, family context and current script. Never copy people or plot details from an example or another scenario. The conflict branch must end at the scenario's most legible pause point with both claims still live and must not begin either choice. Choice A must show the completed physical action named by Choice A, its direct benefit, and the observable unmet cost of Choice B. Choice B must do the reverse. Do not replace a requested action with a generic conversation or invent a more dramatic injury.

Use exactly these three intervals in every branch: 0.0–5.0, 5.0–7.0 and 7.0–15.0. Any interval may contain camera movement, dialogue, emotion, object change, or story action when physically motivated by the approved scenario. The final beat must state a drawable, observable endpoint rather than an abstract feeling. Dialogue must be an array of objects with speaker, line, delivery, and looksAtRobot; never return dialogue as plain strings. Actions must be an array of objects with characterId, action, and emotion. If a current script is supplied, improve only that branch while keeping the other branches mutually coherent. IDs must be short stable labels such as conflict-b1.`,
    });
    if (result.data.scripts.length !== 3) throw new Error("The AI returned an invalid structured script count.");
    const orderedTypes: VideoType[] = ["conflict", "choice_a", "choice_b"];
    const typedScripts = result.data.scripts.map((script, index) => normalizeScriptDraft(script, orderedTypes[index], index));
    if (!typedScripts.every(isResearchScript)) {
      const diagnostic = typedScripts.map((script) => ({
        videoType: script.videoType,
        keys: Object.keys(script),
        beatKeys: Array.isArray(script.beats) ? script.beats.map((beat) => Object.keys(beat)) : [],
      }));
      throw new Error(`The AI returned an invalid structured script set: ${JSON.stringify(diagnostic)}`);
    }
    const scripts = Object.fromEntries(typedScripts.map((script) => [script.videoType, script])) as Partial<Record<VideoType, ResearchScript>>;
    if (!scripts.conflict || !scripts.choice_a || !scripts.choice_b) throw new Error("The AI did not return one script for every branch.");
    return Response.json({ provider: "OpenRouter", model: result.model, scripts });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Script generation failed." }, { status: 502 });
  }
}
