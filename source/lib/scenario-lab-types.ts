export type ScenarioLabStatus =
  | "draft"
  | "script_ready"
  | "script_approved"
  | "plan_ready"
  | "frames_generating"
  | "frames_review"
  | "frames_approved"
  | "video_queued"
  | "video_generating"
  | "video_review"
  | "accepted"
  | "failed";

export type VideoType = "conflict" | "choice_a" | "choice_b";
export type VideoMode = "T2V" | "I2V" | "FLF2V";
export type WorkflowStage = "brief" | "scripts" | "production" | "frames" | "generation" | "qa";

export type ScenarioLabScenario = {
  id: string;
  familyId: string;
  title: string;
  description: string;
  choiceA: string;
  choiceB: string;
  tags: string[];
  memberTags: string[];
  valueTags: string[];
  selected: boolean;
  source: "openai" | "openrouter" | "experience" | "manual_lab_entry";
  status: ScenarioLabStatus;
  createdAt: string;
  updatedAt: string;
};

export type ScriptBeat = {
  id: string;
  order: number;
  timeRange: string;
  whatHappens: string;
  cameraAttention: string;
  actions: Array<{ characterId: string; action: string; emotion: string }>;
  dialogue: Array<{ speaker: string; line: string; delivery: string; looksAtRobot: boolean }>;
  ambientSound: string[];
};

export type ResearchScript = {
  videoType: VideoType;
  title: string;
  purpose: string;
  estimatedDurationSeconds: number;
  space: {
    location: string;
    layout: string;
    characterPositions: Array<{ characterId: string; position: string; distanceFromRobot: string }>;
    importantObjects: string[];
  };
  beats: ScriptBeat[];
  endingState: string;
  continuityNotes: string[];
  researchMeaning: string;
  openQuestions: string[];
};

export type ScriptVersion = {
  id: string;
  version: number;
  parentVersionId: string | null;
  script: ResearchScript;
  status: "draft" | "approved";
  createdAt: string;
  updatedAt: string;
  createdBy: "ai" | "researcher";
};

export type ContinuityLock = { id: string; label: string; value: string; locked: boolean };

export type VisualBible = {
  style: string;
  familyAppearance: string[];
  wardrobe: string[];
  roomGeometry: string;
  timeOfDay: string;
  lighting: string;
  cameraHeight: string;
  lens: string;
  appearanceProfile: string;
  robotHands: {
    count: 2;
    mandatoryReferenceAsset: "/inattentive-assets/scenario-02.png";
    referenceScope: string;
    primaryColor: string;
    secondaryColor: string;
    fingerStructure: string;
    defaultPose: string;
    leftScreenZone: "lower-left";
    rightScreenZone: "lower-right";
    forearmPerspective: string;
    referenceAssets: string[];
  };
  persistentObjects: string[];
  forbiddenDrift: string[];
  locks: ContinuityLock[];
};

export type Requirement = {
  id: string;
  priority: "P0" | "P1" | "P2" | "P3" | "P4";
  requirement: string;
  promptCarrier: string;
  anchorEvidence: string | null;
  qaTarget: string;
  failurePolicy: "automatic_reject" | "review" | "tolerable";
};

export type PerformanceContract = {
  owner: string;
  trigger: string;
  startState: string;
  actionPath: string[];
  facialCarriers: string[];
  bodyCarriers: string[];
  voiceBreathCarriers: string[];
  targetIntensity: number;
  onsetPeakPersistence: string;
  minimumReadableShotScale: string;
  prohibitedWeakSubstitute: string;
};

export type PromptBeatDirection = {
  attentionOwner: string;
  visibleAction: string;
  observablePerformance: string;
  cameraBehavior: string;
  sound: string;
};

export type PromptDirection = {
  singleResearchTurn: string;
  mode: VideoMode;
  modeReason: string;
  cameraPath: string;
  openingState: string;
  exactEndingState: string;
  p0Owner: string;
  p0Trigger: string;
  p0CompleteAction: string;
  p0ObservablePerformance: string;
  p0IntensityPersistence: string;
  beatDirections: [PromptBeatDirection, PromptBeatDirection, PromptBeatDirection];
  speakerOrder: string;
  ambientBed: string;
  motivatedSoundCues: string;
  intentionalSilence: string;
  positiveContinuity: string[];
  exclusions: string[];
  warnings: string[];
};

export type DialogueBudget = {
  speaker: string;
  line: string;
  exactness: "semantic" | "preferred" | "research-critical";
  wordCount: number;
  secondsAvailable: number;
  wordsPerSecond: number;
  delivery: string;
  pauseAndBreathAllowance: string;
};

export type PromptVersion = {
  id: string;
  version: number;
  parentVersionId: string | null;
  prompt: string;
  createdAt: string;
  lastEditedBy: "ai" | "researcher";
  immutable: boolean;
};

export type ProductionClip = {
  clipId: string;
  order: number;
  timelineRange: string;
  durationSeconds: number;
  purpose: string;
  attentionOwner: string;
  offscreenCarrier: string | null;
  mode: VideoMode;
  modeReason: string;
  cameraPath: string;
  dialogueBudget: DialogueBudget[];
  firstFrameSpec: Record<string, unknown>;
  lastFrameSpec: Record<string, unknown> | null;
  promptVersions: PromptVersion[];
  qaContract: string[];
};

export type ProductionPackage = {
  id: string;
  videoType: VideoType;
  version: number;
  parentVersionId: string | null;
  finalDurationSeconds: number;
  singleResearchTurn: string;
  requirements: Requirement[];
  performanceContracts: PerformanceContract[];
  clips: ProductionClip[];
  assemblyPlan: { clipOrder: string[]; trim: string[]; audioTransitions: string[]; targetDurationSeconds: number };
  warnings: string[];
  blockingIssues: string[];
  createdAt: string;
};

export type AnchorGate = {
  silentStoryPass: boolean;
  thumbnailPass: boolean;
  intensityPass: boolean;
  shotScalePass: boolean;
  contradictionPass: boolean;
  persistencePass: boolean;
  transitionPass: boolean;
  robotHandsPass: boolean;
  reviewedAt: string | null;
};

export type FrameAsset = {
  frameId: string;
  videoType: VideoType;
  clipId: string;
  frameRole: "first" | "last";
  assetUrl: string;
  width: 1920;
  height: 1080;
  version: number;
  promptVersion: string;
  generationTaskId: string;
  parentFrameId: string | null;
  sha256: string;
  status: "generated" | "approved" | "rejected" | "failed";
  comment: string;
  prompt: string;
  robotReference: { assetPath: string; role: string; scope: string };
  anchorGate: AnchorGate;
  createdAt: string;
};

export type FailureEvidence = {
  time: number;
  layer: "anchor" | "blocking" | "camera" | "performance" | "dialogue" | "audio" | "robot_hands" | "integration";
  severity: "critical" | "tolerable";
  observation: string;
};

export type VideoGenerationTask = {
  taskId: string;
  scenarioId: string;
  videoType: VideoType;
  clipId: string;
  bundleVersion: number;
  promptVersion: string;
  parentPromptVersion: string | null;
  prompt: string;
  mode: VideoMode;
  request: Record<string, unknown>;
  inputs: { firstFrame: { url: string; sha256: string } | null; lastFrame: { url: string; sha256: string } | null };
  failureEvidence: FailureEvidence[];
  retain: string[];
  change: string[];
  createdAt: string;
  updatedAt: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  outputUrl: string | null;
  idempotencyKey: string;
  provider: string;
};

export type QaCheck = {
  id: string;
  requirementId: string;
  priority: "P0" | "P1" | "P2" | "P3" | "P4";
  status: "pass" | "fail" | "needs_review";
  timestamp: number;
  observation: string;
  severity: "critical" | "tolerable";
};

export type QaReview = {
  videoType: VideoType;
  technicalPass: boolean;
  checks: QaCheck[];
  audioReview: string[];
  finalVerdict: "accept" | "reject" | "researcher_review";
  comment: string;
};

export type GeneralRevision = {
  id: string;
  level: "video" | "bundle";
  comment: string;
  retain: string[];
  change: string[];
  affectedVideoTypes: VideoType[];
  parentBundleVersion: number;
  createdAt: string;
};

export type VideoBundle = {
  id: string;
  scenarioId: string;
  familyId: string;
  version: number;
  parentVersion: number | null;
  status: ScenarioLabStatus;
  currentStage: WorkflowStage;
  saveState: "saved" | "saving" | "error";
  scripts: Partial<Record<VideoType, ScriptVersion[]>>;
  productionPackages: Partial<Record<VideoType, ProductionPackage[]>>;
  visualBible: VisualBible;
  frames: FrameAsset[];
  generalRevisions: GeneralRevision[];
  videoTasks: VideoGenerationTask[];
  qaReviews: QaReview[];
  acceptedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
