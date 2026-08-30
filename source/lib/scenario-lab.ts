import type {
  Family,
  FrameAsset,
  GeneratedScenario,
  ProductionPackage,
  PromptDirection,
  ResearchScript,
  ScriptBeat,
  VideoBundle,
  VideoType,
  VisualBible,
} from "./types";

export const SCENARIO_TAGS = [
  "Physical safety",
  "Emotional reassurance",
  "Spatial separation",
  "Single-body constraint",
  "Simultaneous claims",
  "Vulnerability & dependence",
  "Task interruption",
  "Property & resource protection",
  "Authority & obedience",
  "Uncertain severity",
];

export const VIDEO_LABELS: Record<VideoType, string> = {
  conflict: "Conflict Scenario",
  choice_a: "Choice A Consequence",
  choice_b: "Choice B Consequence",
};

export const WORKFLOW_STAGES = [
  { id: "brief", number: "01", label: "Scenario Brief" },
  { id: "scripts", number: "02", label: "Editable Scripts" },
  { id: "production", number: "03", label: "Production Plan & Prompts" },
  { id: "frames", number: "04", label: "Keyframes Review" },
  { id: "generation", number: "05", label: "Video Generation" },
  { id: "qa", number: "06", label: "QA & Export" },
] as const;

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function scenarioOne(): GeneratedScenario {
  const stamp = "2026-08-14T00:00:00.000Z";
  return {
    id: "scenario-01",
    familyId: "F-001",
    title: "Kitchen or Care?",
    description: "A pancake is about to burn while Younger Sister has fallen in the living room. The robot has one body and cannot stabilize the pan and check her at the same time.",
    choiceA: "Help Mom flip the pancake",
    choiceB: "Attend to Younger Sister",
    tags: ["Physical safety", "Simultaneous claims", "Single-body constraint", "Vulnerability & dependence"],
    memberTags: ["Mother", "Younger Sister"],
    valueTags: ["Physical safety", "Task interruption"],
    selected: false,
    source: "experience",
    status: "draft",
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function normalizeScenario(input: Partial<GeneratedScenario>, fallbackFamilyId = "F-001"): GeneratedScenario {
  const stamp = input.createdAt || new Date().toISOString();
  const tags = input.tags?.length ? input.tags : [...(input.valueTags ?? []), ...(input.memberTags ?? [])].filter(Boolean);
  return {
    id: input.id || uid("scenario"),
    familyId: input.familyId || fallbackFamilyId,
    title: input.title?.trim() || "Untitled scenario",
    description: input.description?.trim() || "Two household requests compete for the robot's single body.",
    choiceA: input.choiceA?.trim() || "Respond to the first request",
    choiceB: input.choiceB?.trim() || "Respond to the second request",
    tags: tags.length ? Array.from(new Set(tags)) : ["Single-body constraint"],
    memberTags: input.memberTags ?? [],
    valueTags: input.valueTags ?? tags,
    selected: Boolean(input.selected),
    source: input.source === "manual_lab_entry" || input.source === "experience" || input.source === "openrouter" ? input.source : "openai",
    status: input.status ?? "draft",
    createdAt: stamp,
    updatedAt: input.updatedAt || stamp,
  };
}

export type ManualScenarioInput = Pick<GeneratedScenario, "title" | "description" | "choiceA" | "choiceB" | "tags" | "familyId">;
export type ManualScenarioErrors = Partial<Record<keyof ManualScenarioInput, string>>;

export function validateManualScenario(input: Partial<ManualScenarioInput>, familyIds: string[]) {
  const errors: ManualScenarioErrors = {};
  if (!input.title?.trim()) errors.title = "Add a short working title.";
  if (!input.description?.trim()) errors.description = "Describe both competing requests and why the robot cannot do both.";
  if (!input.choiceA?.trim()) errors.choiceA = "Choice A is required.";
  if (!input.choiceB?.trim()) errors.choiceB = "Choice B is required.";
  if (input.choiceA?.trim() && input.choiceB?.trim() && input.choiceA.trim().toLocaleLowerCase() === input.choiceB.trim().toLocaleLowerCase()) errors.choiceB = "Choice B must differ from Choice A.";
  if (!input.tags?.length) errors.tags = "Add at least one research tag.";
  if (!input.familyId || !familyIds.includes(input.familyId)) errors.familyId = "Choose a family from this project.";
  return errors;
}

export function createManualScenario(input: ManualScenarioInput): GeneratedScenario {
  const stamp = new Date().toISOString();
  return normalizeScenario({
    ...input,
    id: uid("scenario"),
    memberTags: [],
    valueTags: input.tags,
    selected: false,
    source: "manual_lab_entry",
    status: "draft",
    createdAt: stamp,
    updatedAt: stamp,
  });
}

export function createVisualBible(family?: Family): VisualBible {
  return {
    style: "Photorealistic, natural cinematic household documentary; restrained depth of field and consistent color grade.",
    familyAppearance: family?.members.map((member) => member.name === member.role ? `${member.role}, age ${member.age || "not recorded"}` : `${member.name} — ${member.role}, age ${member.age || "not recorded"}`) ?? [],
    wardrobe: ["Keep each approved character outfit unchanged across all three videos"],
    roomGeometry: `${family?.location || "Household"} home; one coherent path connects the competing requests.`,
    timeOfDay: "Early evening",
    lighting: "Credible warm interior practicals with natural ambient fill",
    cameraHeight: "Domestic robot eye level",
    lens: "Natural 35 mm equivalent, restrained depth of field",
    appearanceProfile: family?.photos.length
      ? "Family photos available. Confirm each character mapping before generating frames."
      : "No family photo is available. Researcher confirmation is required before frame generation; do not infer ethnicity from names or location.",
    robotHands: {
      count: 2,
      mandatoryReferenceAsset: "/inattentive-assets/scenario-02.png",
      referenceScope: "Copy only the two robot hands and forearms at the bottom; ignore all people, doorway, weather, and environment.",
      primaryColor: "Silver-white / white hard shell",
      secondaryColor: "Black articulated joints, palm mechanism, and wrist internals",
      fingerStructure: "Five human-like articulated fingers with segmented joints",
      defaultPose: "Both palms slightly open and angled upward/inward toward the center",
      leftScreenZone: "lower-left",
      rightScreenZone: "lower-right",
      forearmPerspective: "Both forearms enter from the lower corners with the reference image's scale and first-person perspective",
      referenceAssets: ["/inattentive-assets/scenario-02.png"],
    },
    persistentObjects: [],
    forbiddenDrift: ["third robot hand", "human first-person hand", "third-person camera", "identity or wardrobe swap", "generated UI or subtitles"],
    locks: [
      { id: "robot-pov", label: "Robot first-person viewpoint", value: "Same domestic robot head/eye camera", locked: true },
      { id: "robot-hands", label: "Two reference-matched robot hands", value: "/inattentive-assets/scenario-02.png", locked: true },
      { id: "room", label: "Room geometry", value: "One coherent household layout", locked: true },
      { id: "identity", label: "Character identity & wardrobe", value: "Approved appearance profile", locked: true },
    ],
  };
}

export function createBundle(scenario: GeneratedScenario, family?: Family): VideoBundle {
  const stamp = new Date().toISOString();
  return {
    id: uid("bundle"),
    scenarioId: scenario.id,
    familyId: scenario.familyId,
    version: 1,
    parentVersion: null,
    status: "draft",
    currentStage: "brief",
    saveState: "saved",
    scripts: {},
    productionPackages: {},
    visualBible: createVisualBible(family),
    frames: [],
    generalRevisions: [],
    videoTasks: [],
    qaReviews: [],
    acceptedAt: null,
    publishedAt: null,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

function words(line: string) {
  return line.trim().split(/\s+/).filter(Boolean).length;
}

function beat(order: number, timeRange: string, whatHappens: string, cameraAttention: string, speaker: string, line: string, emotion: string, action: string): ScriptBeat {
  return {
    id: uid("beat"),
    order,
    timeRange,
    whatHappens,
    cameraAttention,
    actions: [{ characterId: speaker, action, emotion }],
    dialogue: line ? [{ speaker, line, delivery: emotion, looksAtRobot: true }] : [],
    ambientSound: ["Household room tone"],
  };
}

export function generateScripts(scenario: GeneratedScenario, family?: Family): Record<VideoType, ResearchScript> {
  const location = family?.location ? `${family.location} family home` : "family home";
  const shared = {
    estimatedDurationSeconds: 15,
    space: {
      location,
      layout: "Both claims occupy one continuous household layout, with a readable path between them and no hidden relocation.",
      characterPositions: [],
      importantObjects: scenario.title.toLowerCase().includes("kitchen") ? ["pancake pan", "toy area"] : ["objects named in the scenario brief"],
    },
    continuityNotes: ["Same identities, wardrobe, room geometry, light, robot POV, and two reference-matched robot hands across all branches."],
    openQuestions: family?.photos.length ? [] : ["Confirm or edit the suggested appearance profile before keyframe generation."],
  };
  return {
    conflict: {
      videoType: "conflict",
      title: `${scenario.title} · Conflict`,
      purpose: "Present both competing claims fairly and stop before the robot chooses.",
      ...shared,
      beats: [
        beat(1, "0.0–5.0", `The first request is made: ${scenario.choiceA}.`, "The robot is settled on the first claimant.", "Claimant A", "I need you here now.", "urgent but controlled", "Makes the first request while keeping direct eye contact."),
        beat(2, "5.0–7.0", "The robot turns through the shared room while the first request remains audible and the competing claim enters attention.", "The viewpoint and story may progress together through one physically continuous path.", "Claimant A", "Please don't forget me.", "still urgent off-screen", "Maintains the first claim while the robot redirects attention."),
        beat(3, "7.0–15.0", `The competing request is made: ${scenario.choiceB}. Both claims remain unresolved.`, "The robot settles on the second claimant.", "Claimant B", "Please help me first.", "urgent and dependent", "Makes the second request while the first demand remains audible off-screen."),
      ],
      endingState: "Both requests remain live. The robot has not acted and the participant receives no moral cue.",
      researchMeaning: "The participant must decide how a single embodied robot should allocate attention between simultaneous claims.",
    },
    choice_a: {
      videoType: "choice_a",
      title: `${scenario.choiceA} · Consequence`,
      purpose: `Show the direct benefit of “${scenario.choiceA}” and the cost borne by the unmet side.`,
      ...shared,
      beats: [
        beat(1, "0.0–5.0", `The robot completes ${scenario.choiceA.toLowerCase()}.`, "The robot stays with the chosen action.", "Claimant A", "Thank you—that helped.", "relieved, not triumphant", "Responds to the completed help."),
        beat(2, "5.0–7.0", "The robot turns toward the unmet claim as its direct consequence becomes visible.", "One continuous move keeps the cause-and-effect relationship legible.", "Claimant B", "I still need you.", "hurt urgency", "Calls after the robot while the consequence develops."),
        beat(3, "7.0–15.0", `The unmet side reacts to the robot not choosing “${scenario.choiceB}”.`, "Camera settled close enough to read the reaction.", "Claimant B", "You heard me. Why did I have to wait?", "hurt and frustrated", "Shows a readable consequence without inventing new harm."),
      ],
      endingState: "The selected side receives help while the unmet side's reaction remains visible and unresolved.",
      researchMeaning: "The branch makes the tradeoff legible without framing Choice A as reward or punishment.",
    },
    choice_b: {
      videoType: "choice_b",
      title: `${scenario.choiceB} · Consequence`,
      purpose: `Show the direct benefit of “${scenario.choiceB}” and the cost borne by the unmet side.`,
      ...shared,
      beats: [
        beat(1, "0.0–5.0", `The robot completes ${scenario.choiceB.toLowerCase()}.`, "The robot stays with the chosen action.", "Claimant B", "Thank you for coming.", "relieved and steadying", "Responds to the completed help."),
        beat(2, "5.0–7.0", "The robot turns toward the other claim while its missed-task consequence develops.", "One continuous move preserves the connected household geography.", "Claimant A", "I needed that done now.", "contained frustration", "Reasserts the unmet claim while the robot redirects attention."),
        beat(3, "7.0–15.0", `The unmet side reacts to the robot not choosing “${scenario.choiceA}”.`, "Camera settled close enough to read the reaction and changed object state.", "Claimant A", "I needed you here, and now it is too late.", "frustrated and disappointed", "Shows the concrete cost without adding unsupported danger."),
      ],
      endingState: "The selected side receives help while the other request has a concrete, readable cost.",
      researchMeaning: "The branch makes the reverse tradeoff legible without framing Choice B as automatically correct.",
    },
  };
}

function sentence(value: string) {
  const clean = value.trim();
  return clean && !/[.!?]$/.test(clean) ? `${clean}.` : clean;
}

function inlineClause(value: string) {
  return value.trim().replace(/[\r\n]+/g, " ").replace(/[.!?]+\s*/g, "; ").replace(/[; ]+$/g, "");
}

function uniqueText(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function limitText(value: string, maxCharacters: number) {
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length <= maxCharacters) return clean;
  const slice = clean.slice(0, maxCharacters - 1);
  const boundary = slice.lastIndexOf(" ");
  return `${slice.slice(0, boundary > maxCharacters * 0.65 ? boundary : slice.length).replace(/[,;:]$/, "")}.`;
}

function timedHeading(value: string, fallbackOrder: number) {
  const match = value.match(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/);
  if (match) return `${match[1]}–${match[2]} seconds`;
  const defaults = ["0.0–5.0 seconds", "5.0–7.0 seconds", "7.0–15.0 seconds"];
  return defaults[fallbackOrder] ?? `${fallbackOrder}.0–${fallbackOrder + 1}.0 seconds`;
}

function timeRangeSeconds(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/);
  return match ? Math.max(0, Number(match[2]) - Number(match[1])) : 5;
}

function defaultPromptDirection(videoType: VideoType, script: ResearchScript): PromptDirection {
  const beats = [0, 1, 2].map((index) => {
    const item = script.beats[index] ?? script.beats.at(-1)!;
    return {
      attentionOwner: item.actions.map((action) => action.characterId).filter(Boolean).join(" and ") || (index === 1 ? "The shared room path" : "The active claimant"),
      visibleAction: item.whatHappens,
      observablePerformance: item.actions.map((action) => `${action.characterId}: ${action.action}; eyes, brows, mouth or jaw, posture, breath, and voice visibly carry ${action.emotion}.`).join(" ") || "Preserve readable character, object, and emotional continuity through this interval.",
      cameraBehavior: item.cameraAttention,
      sound: [...item.ambientSound, ...item.dialogue.map((line) => `${line.speaker} speaks with ${line.delivery}`)].join("; ") || "Continuous household room tone",
    };
  }) as PromptDirection["beatDirections"];
  return {
    singleResearchTurn: script.researchMeaning,
    mode: "FLF2V",
    modeReason: "Strict first and last anchors protect the opening state, exact consequence endpoint, room geometry, robot viewpoint, and two-hand foreground.",
    cameraPath: "One continuous robot-head camera move through the same connected household space; it settles completely before any consequence action begins.",
    openingState: script.beats[0]?.whatHappens ?? "The approved scenario is already active at time zero.",
    exactEndingState: script.endingState,
    p0Owner: videoType === "conflict" ? "Both competing claimants" : "The person who bears the consequence of the robot's choice",
    p0Trigger: videoType === "conflict" ? "Both claims become simultaneously urgent" : "The robot completes one choice and the other claim remains unmet",
    p0CompleteAction: "Show preparation, initiating cause or contact, the full physical trajectory, the visible consequence, and a held aftermath without hiding a link in the chain.",
    p0ObservablePerformance: "Use readable eyes and brows, an active mouth or jaw, purposeful posture, motivated hand or shoulder tension, audible breath, and an emotionally specific voice.",
    p0IntensityPersistence: "Reach intensity 4 of 5 after the trigger and hold the consequence without returning to neutral through the final frame.",
    beatDirections: beats,
    speakerOrder: script.beats.flatMap((item) => item.dialogue.map((line) => line.speaker)).join(" → ") || "No dialogue",
    ambientBed: "Continuous natural household room tone matched across the complete shot",
    motivatedSoundCues: script.beats.flatMap((item) => item.ambientSound).filter(Boolean).join("; ") || "Only sounds caused by visible people and objects",
    intentionalSilence: "Use silence only where the approved script contains no dialogue; preserve room tone",
    positiveContinuity: ["The same approved identities and wardrobe persist", "The room remains one connected physical layout", "Exactly two reference-matched robot hands stay visible in their lower-corner zones"],
    exclusions: ["third-person camera", "hidden cut", "extra person", "identity drift", "extra, missing, duplicated, or human robot-view hands", "subtitle, caption, logo, watermark, or UI", "invented graphic injury"],
    warnings: [],
  };
}

function compilePrompt(videoType: VideoType, scenario: GeneratedScenario, script: ResearchScript, direction: PromptDirection, visualBible?: VisualBible) {
  direction = {
    ...direction,
    singleResearchTurn: limitText(direction.singleResearchTurn, 140),
    modeReason: limitText(direction.modeReason, 160),
    cameraPath: limitText(direction.cameraPath, 130),
    openingState: limitText(direction.openingState, 170),
    exactEndingState: limitText(direction.exactEndingState, 170),
    p0Owner: limitText(direction.p0Owner, 80),
    p0Trigger: limitText(direction.p0Trigger, 120),
    p0CompleteAction: limitText(direction.p0CompleteAction, 150),
    p0ObservablePerformance: limitText(direction.p0ObservablePerformance, 150),
    p0IntensityPersistence: limitText(direction.p0IntensityPersistence, 120),
    beatDirections: direction.beatDirections.map((beatDirection) => ({
      attentionOwner: limitText(beatDirection.attentionOwner, 80),
      visibleAction: limitText(beatDirection.visibleAction, 140),
      observablePerformance: limitText(beatDirection.observablePerformance, 140),
      cameraBehavior: limitText(beatDirection.cameraBehavior, 110),
      sound: limitText(beatDirection.sound, 80),
    })) as PromptDirection["beatDirections"],
    speakerOrder: limitText(direction.speakerOrder, 100),
    ambientBed: limitText(direction.ambientBed, 100),
    motivatedSoundCues: limitText(direction.motivatedSoundCues, 100),
    intentionalSilence: limitText(direction.intentionalSilence, 90),
    positiveContinuity: direction.positiveContinuity.slice(0, 3).map((item) => limitText(item, 80)),
    exclusions: direction.exclusions.slice(0, 8).map((item) => limitText(item, 50)),
  };
  const label = VIDEO_LABELS[videoType];
  const beats = script.beats.slice(0, 3).map((item, index) => {
    const heading = timedHeading(item.timeRange, index);
    const directed = direction.beatDirections[index] ?? defaultPromptDirection(videoType, script).beatDirections[index];
    const dialogue = item.dialogue.length
      ? item.dialogue.map((line) => `${line.speaker}: “${line.line}” Exact speaker ownership; ${line.delivery}; ${line.looksAtRobot ? "direct gaze into the robot lens" : "use the approved eyeline"}; preserve a natural breath before or after the line.`).join(" ")
      : "No dialogue; communicate the beat through visible action, breath, and motivated sound.";
    const heldEmotion = item.actions.map((action) => action.emotion).filter(Boolean).join("; ");
    const endpoint = index === 2
      ? `\nEXACT ENDPOINT: End exactly on the supplied last-frame anchor: ${inlineClause(direction.exactEndingState)}; ${heldEmotion ? `${inlineClause(heldEmotion)} remains visibly active in ` : ""}eyes, brows, mouth or jaw, posture, breath, and voice at the required intensity. Hold through the final frame.`
      : "";
    const action = inlineClause(item.whatHappens).toLocaleLowerCase() === inlineClause(directed.visibleAction).toLocaleLowerCase()
      ? item.whatHappens
      : `${sentence(item.whatHappens)} ${directed.visibleAction}`;
    return `${heading} — STORY BEAT\nATTENTION OWNER: ${sentence(directed.attentionOwner)}\nVISIBLE ACTION: ${sentence(action)}\nOBSERVABLE PERFORMANCE: ${sentence(directed.observablePerformance)}\nCAMERA: Fully settled; ${sentence(directed.cameraBehavior)} No camera motion during the story-defining action.\nDIALOGUE: ${dialogue}\nSOUND: ${sentence(directed.sound)}${endpoint}`;
  }).join("\n\n");

  const bibleContinuity = visualBible
    ? [`Visual style: ${visualBible.style}`, `Wardrobe: ${visualBible.wardrobe.join("; ")}`, `Room geometry: ${visualBible.roomGeometry}`, `Time and lighting: ${visualBible.timeOfDay}; ${visualBible.lighting}`, `Lens and camera height: ${visualBible.lens}; ${visualBible.cameraHeight}`, ...visualBible.familyAppearance.slice(0, 4).map((item) => `Approved appearance: ${item}`)].map((item) => limitText(item, 140))
    : ["Photorealistic natural household documentary style", "Approved identities, wardrobe, lighting, props, and room geometry remain unchanged"];
  const positiveLocks = uniqueText([...bibleContinuity, ...direction.positiveContinuity]).slice(0, 7).map(sentence).join(" ");
  const exclusions = uniqueText(["third-person camera or hidden cut", "extra, missing, duplicated, or human robot-view hands", "identity or wardrobe drift", "subtitle, caption, logo, watermark, or UI", "invented graphic injury", "ethnicity, skin tone, or unsupported appearance inferred from a name or location", ...(visualBible?.forbiddenDrift ?? []), ...direction.exclusions]).slice(0, 12).map((item) => `no ${limitText(item.replace(/^no\s+/i, ""), 60)}`).join("; ");

  return `P0 PERFORMANCE CONTRACT\nOWNER: ${sentence(direction.p0Owner)} TRIGGER: ${sentence(direction.p0Trigger)}\nACTION CHAIN: ${sentence(direction.p0CompleteAction)}\nPERFORMANCE: ${sentence(direction.p0ObservablePerformance)}\nINTENSITY: ${sentence(direction.p0IntensityPersistence)}\nWEAK SUBSTITUTE FORBIDDEN: neutral dialogue, a generic worried face, or an off-screen report replacing visible action and held consequence.\n\nMODE AND ANCHOR CONTRACT\nCreate one continuous 15-second ${label.toLowerCase()} in FLF2V mode with native synchronized stereo audio. The supplied first frame is the strict time-zero image; the supplied last frame is the strict final endpoint. OPENING: ${sentence(direction.openingState)} ENDING: ${sentence(direction.exactEndingState)} Generate one continuous physical path between these compositions.\n\n${beats}\n\nSOUND CONTRACT\nSPEAKER ORDER: ${sentence(direction.speakerOrder)} AMBIENT: ${sentence(direction.ambientBed)} CUES: ${sentence(direction.motivatedSoundCues)} SILENCE: ${sentence(direction.intentionalSilence)} No unapproved music, subtitles, or generated text.\n\nVIEWPOINT AND CONTINUITY LOCKS\nUse the same domestic robot's first-person eye-level lens throughout. Exactly two silver-white robot hands with black articulated joints, five segmented fingers, and reference-matched forearms remain visible in the lower-left and lower-right zones; neither may leave its zone. ${positiveLocks}\n\nHARD INVARIANTS AND SAFE REPLACEMENTS\nMake household danger readable through object motion, defensive posture, recoil, breath, voice, and motivated sound while skin stays undamaged and no wound appears. Speaking characters address the robot lens. Keep one primary attention owner per beat while allowing camera movement, dialogue, emotion, object change, and story action in any interval required by the approved script. Exclude: ${exclusions}.\n\nRESEARCH INTENT\nPreserve one unbiased research decision point: ${sentence(direction.singleResearchTurn || script.researchMeaning)} Choice A remains ${scenario.choiceA}; Choice B remains ${scenario.choiceB}. Neither is morally endorsed, rewarded, or punished.`;
}

export type ProductionCompileOptions = {
  directions?: Partial<Record<VideoType, PromptDirection>>;
  visualBible?: VisualBible;
};

export function compileProduction(scenario: GeneratedScenario, scripts: Record<VideoType, ResearchScript>, options: ProductionCompileOptions = {}): Record<VideoType, ProductionPackage> {
  const stamp = new Date().toISOString();
  return (Object.keys(scripts) as VideoType[]).reduce((result, videoType) => {
    const script = scripts[videoType];
    const direction = options.directions?.[videoType] ?? defaultPromptDirection(videoType, script);
    const prompt = compilePrompt(videoType, scenario, script, direction, options.visualBible);
    const packageId = uid(`package-${videoType}`);
    const clipId = `${scenario.id}-${videoType}-c01`;
    const expectedRanges = ["0.0–5.0", "5.0–7.0", "7.0–15.0"];
    const blockingIssues: string[] = [];
    if (script.beats.length !== 3) blockingIssues.push("The script must contain exactly three production beats.");
    script.beats.slice(0, 3).forEach((beatItem, index) => {
      const normalized = beatItem.timeRange.replace(/\s/g, "").replace(/-/g, "–").replace(/s$/i, "");
      if (normalized !== expectedRanges[index]) blockingIssues.push(`Beat ${index + 1} must use ${expectedRanges[index]}.`);
    });
    const overBudget = script.beats.flatMap((beatItem) => beatItem.dialogue.map((line) => ({
      line,
      rate: words(line.line) / Math.max(1, timeRangeSeconds(beatItem.timeRange) - 1.2),
    }))).filter((item) => item.rate > 3.2);
    if (overBudget.length) blockingIssues.push(`Dialogue exceeds the 3.2 words/second ceiling after breath allowance: ${overBudget.map((item) => item.line.speaker).join(", ")}.`);
    result[videoType] = {
      id: packageId,
      videoType,
      version: 1,
      parentVersionId: null,
      finalDurationSeconds: 15,
      singleResearchTurn: direction.singleResearchTurn || script.researchMeaning,
      requirements: [
        { id: `${videoType}-R1`, priority: "P0", requirement: direction.p0CompleteAction, promptCarrier: "P0 performance contract, complete visible action, and exact endpoint", anchorEvidence: `First anchor: ${direction.openingState}; last anchor: ${direction.exactEndingState}`, qaTarget: "P0 onset, peak, held aftermath, and final frame", failurePolicy: "automatic_reject" },
        { id: `${videoType}-R2`, priority: "P1", requirement: "Correct speaker, attention owner, branch meaning, and direct robot gaze", promptCarrier: "Dialogue and gaze clauses", anchorEvidence: "Endpoint attention owner", qaTarget: "Each dialogue interval", failurePolicy: "automatic_reject" },
        { id: `${videoType}-R3`, priority: "P2", requirement: "Camera, blocking, action, and dialogue remain physically continuous and readable", promptCarrier: "Timed beat camera and action directions", anchorEvidence: "Compatible room path", qaTarget: "All three beat transitions", failurePolicy: "automatic_reject" },
        { id: `${videoType}-R4`, priority: "P3", requirement: "Exactly two reference-matched robot hands remain in lower corners", promptCarrier: "Global foreground continuity lock", anchorEvidence: "/inattentive-assets/scenario-02.png", qaTarget: "Every sampled frame", failurePolicy: "automatic_reject" },
      ],
      performanceContracts: [{
        owner: direction.p0Owner,
        trigger: direction.p0Trigger,
        startState: "Active household request",
        actionPath: [direction.p0CompleteAction],
        facialCarriers: [direction.p0ObservablePerformance],
        bodyCarriers: [direction.p0ObservablePerformance],
        voiceBreathCarriers: [direction.p0ObservablePerformance, direction.p0IntensityPersistence],
        targetIntensity: 4,
        onsetPeakPersistence: direction.p0IntensityPersistence,
        minimumReadableShotScale: "Face approximately 12% of frame height or unmistakable full-body carrier",
        prohibitedWeakSubstitute: "Neutral dialogue, a generic worried face, or an off-screen report of an unseen consequence",
      }],
      clips: [{
        clipId,
        order: 1,
        timelineRange: "0.0–15.0",
        durationSeconds: 15,
        purpose: script.purpose,
        attentionOwner: videoType === "conflict" ? "Claimant A → Claimant B" : "Chosen claimant → unmet claimant",
        offscreenCarrier: "The competing claim remains present through voice or motivated environmental sound.",
        mode: direction.mode,
        modeReason: direction.modeReason,
        cameraPath: direction.cameraPath,
        dialogueBudget: script.beats.flatMap((beatItem) => beatItem.dialogue.map((line) => {
          const wordCount = words(line.line);
          const secondsAvailable = Number(Math.max(1.5, (timeRangeSeconds(beatItem.timeRange) - 1.2) / Math.max(1, beatItem.dialogue.length)).toFixed(1));
          return { speaker: line.speaker, line: line.line, exactness: "semantic", wordCount, secondsAvailable, wordsPerSecond: Number((wordCount / secondsAvailable).toFixed(2)), delivery: line.delivery, pauseAndBreathAllowance: "Reserve nonverbal onset and a held reaction after the final word." };
        })),
        firstFrameSpec: { ratio: "16:9", resolution: "1920x1080", robotPov: true, robotHandsReference: "/inattentive-assets/scenario-02.png", openingState: direction.openingState, attentionOwner: direction.beatDirections[0].attentionOwner, cameraPath: direction.cameraPath },
        lastFrameSpec: { ratio: "16:9", resolution: "1920x1080", p0Intensity: 4, robotPov: true, robotHandsReference: "/inattentive-assets/scenario-02.png", exactEndingState: direction.exactEndingState, performance: direction.p0ObservablePerformance, persistence: direction.p0IntensityPersistence },
        promptVersions: [{ id: uid(`prompt-${videoType}`), version: 1, parentVersionId: null, prompt, createdAt: stamp, lastEditedBy: "ai", immutable: false }],
        qaContract: ["At 0.0 seconds the first raster is the exact opening state", "At 4.8, 7.2, 12.0, and 15.0 seconds the P0 action chain and held consequence remain readable without captions", "Across every beat boundary, camera, blocking, dialogue, emotion, and object changes remain physically continuous and understandable", "At 15.0 seconds the composition and P0 performance match the approved last raster", "Exactly two reference-matched robot hands remain visible in every sampled frame", "Speaker gaze, voice, and lip movement agree; no UI or subtitles are generated"],
      }],
      assemblyPlan: { clipOrder: [clipId], trim: [], audioTransitions: ["Preserve continuous room tone; no decorative transition"], targetDurationSeconds: 15 },
      warnings: [...direction.warnings, ...(script.beats.some((beatItem) => beatItem.dialogue.some((line) => words(line.line) / Math.max(1, timeRangeSeconds(beatItem.timeRange) - 1.2) > 3.2)) ? ["One or more dialogue lines exceed 3.2 words/second after breath allowance. Shorten the line before paid generation."] : ["Native audio may paraphrase wording; use controlled audio if exact language is methodologically critical."])],
      blockingIssues,
      createdAt: stamp,
    };
    return result;
  }, {} as Record<VideoType, ProductionPackage>);
}

const frameImages: Record<VideoType, { first: string; last: string }> = {
  conflict: { first: "/inattentive-assets/scenario-01-dilemma-frame.png", last: "/inattentive-assets/scenario-01-dilemma-last-frame.png" },
  choice_a: { first: "/inattentive-assets/scenario-01-choice-a-frame.png", last: "/inattentive-assets/scenario-01-outcome-a.png" },
  choice_b: { first: "/inattentive-assets/scenario-01-choice-b-frame.png", last: "/inattentive-assets/scenario-01-outcome-b.png" },
};

export function buildFrameTemplates(scenario: GeneratedScenario, packages: Record<VideoType, ProductionPackage>): FrameAsset[] {
  const stamp = new Date().toISOString();
  return (Object.keys(packages) as VideoType[]).flatMap((videoType) => {
    const clip = packages[videoType].clips[0];
    return (["first", "last"] as const).map((frameRole) => ({
      frameId: uid(`frame-${videoType}-${frameRole}`),
      videoType,
      clipId: clip.clipId,
      frameRole,
      assetUrl: frameImages[videoType][frameRole],
      width: 1920,
      height: 1080,
      version: 1,
      promptVersion: clip.promptVersions.at(-1)?.id ?? "unknown",
      generationTaskId: `pending-frame-${scenario.id}-${videoType}-${frameRole}`,
      parentFrameId: null,
      sha256: `pending-sha256-${scenario.id}-${videoType}-${frameRole}`,
      status: "generated",
      comment: "",
      prompt: `Create the ${frameRole} 1920×1080 anchor for ${VIDEO_LABELS[videoType]}. Use the mandatory robot reference as a true image input. Copy only the two hands and forearms at the bottom; ignore the reference people, doorway, weather, and environment. Preserve the current visual bible and ${frameRole === "last" ? "make the P0 consequence readable at thumbnail size" : "show the exact time-zero state"}.`,
      robotReference: { assetPath: "/inattentive-assets/scenario-02.png", role: "mandatory_robot_hands_shape_position_reference", scope: "copy only the two robot hands and forearms; ignore people and environment" },
      anchorGate: { silentStoryPass: false, thumbnailPass: false, intensityPass: false, shotScalePass: false, contradictionPass: false, persistencePass: false, transitionPass: false, robotHandsPass: false, reviewedAt: null },
      createdAt: stamp,
    }));
  });
}

export function isResearchScript(value: unknown): value is ResearchScript {
  if (!value || typeof value !== "object") return false;
  const script = value as ResearchScript;
  return ["conflict", "choice_a", "choice_b"].includes(script.videoType) && typeof script.title === "string" && Array.isArray(script.beats) && script.beats.length > 0 && script.beats.every((item) => typeof item.whatHappens === "string" && Array.isArray(item.dialogue));
}

export function allVideoTypes<T>(record: Partial<Record<VideoType, T>>): record is Record<VideoType, T> {
  return Boolean(record.conflict && record.choice_a && record.choice_b);
}
