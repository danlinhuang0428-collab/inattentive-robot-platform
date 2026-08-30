"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { createBlankProject, initialWorkspaceData } from "../lib/seed-data";
import { type InterfaceLanguage, useInterfaceTranslation } from "../lib/interface-i18n";
import { projectStorage } from "../lib/storage";
import {
  cloudResponsesConfigured,
  currentResearcherSession,
  fetchCloudResponses,
  flushQueuedResponses,
  pendingResponseCount,
  responseCloud,
  signInResearcher,
  signOutResearcher,
  submitCloudResponse,
  subscribeToCloudResponses,
} from "../lib/cloud-responses";
import ScenarioLabWorkspace from "./scenario-lab/ScenarioLab";
import AiSettingsDialog from "./AiSettingsDialog";
import type {
  ExperienceResponse,
  Family,
  GeneratedScenario,
  Member,
  ProjectData,
  ProjectWorkspace,
  WishCard,
} from "../lib/types";

type View =
  | "cover"
  | "dashboard"
  | "families"
  | "family"
  | "scenario-lab"
  | "case-editor"
  | "experience-entry"
  | "experience-list"
  | "player"
  | "case-first"
  | "case-second"
  | "case-detail";

type FamilyTab = "background" | "meeting" | "generation" | "report";
type PlayerStage = "briefing" | "dilemma" | "decision" | "outcome" | "timeout" | "survey";

type ExperienceChoice = {
  id: "A" | "B" | "C";
  label: string;
  labelZh: string;
  labelEn: string;
  detailZh: string;
  detailEn: string;
  video: string;
  poster: string;
  duration: number;
  outcome: string;
  outcomeZh: string;
  outcomeEn: string;
};

type DialogueLine = {
  id: string;
  speakerZh: string;
  speakerEn: string;
  start: number;
  end: number;
  textZh: string;
  textEn: string;
  position: "left" | "right";
  offset?: "down-2" | "down-3" | "down-4";
  showBubble?: boolean;
};

type BriefingFact = {
  value: string;
  labelZh: string;
  labelEn: string;
  detailZh: string;
  detailEn: string;
};

type BilingualBriefing = {
  eyebrowZh: string;
  eyebrowEn: string;
  titleZh: string;
  titleEn: string;
  facts: BriefingFact[];
  bodyZh: string;
  bodyEn: string;
  startZh: string;
  startEn: string;
};

type BilingualDecision = {
  titleZh: string;
  titleEn: string;
  bodyZh: string;
  bodyEn: string;
};

type BilingualChoiceRecord = {
  alternativeQuestionZh: string;
  alternativeQuestionEn: string;
  alternativePlaceholderZh: string;
  alternativePlaceholderEn: string;
  rationaleQuestionZh: string;
  rationaleQuestionEn: string;
  rationalePlaceholderZh: string;
  rationalePlaceholderEn: string;
};

type ExperienceScenario = {
  id: string;
  number: string;
  experienceOrder?: number;
  familyId: string;
  title: string;
  titleZh: string;
  titleEn: string;
  brief: string;
  briefZh: string;
  briefEn: string;
  thumbnail: string;
  dilemmaVideo: string;
  dilemmaDuration: number;
  vrEnabled?: boolean;
  vr?: {
    dilemma: { video: string; depth?: string | null; placeholder?: boolean };
    choices: Partial<Record<"A" | "B" | "C", { video: string; depth?: string | null; placeholder?: boolean }>>;
  };
  voiceLanguage?: string;
  tags: string[];
  briefing: BilingualBriefing;
  decision: BilingualDecision;
  choiceRecord?: BilingualChoiceRecord;
  decisionTimeout?: {
    countdownSeconds: number;
    urgentSeconds: number;
    video04: { video: string; poster: string; duration: number; placeholder?: boolean };
  };
  choices: ExperienceChoice[];
  dialogue: { dilemma: DialogueLine[]; A: DialogueLine[]; B: DialogueLine[]; C?: DialogueLine[] };
};

type CaseArchiveItem = {
  id: string;
  number: string;
  familyId: string;
  title: string;
  brief: string;
  thumbnail: string;
  tags: string[];
  choices: Array<{ id: string; label: string; detail: string }>;
  status: "published" | "draft" | "placeholder";
  experience?: ExperienceScenario;
};

const CASE_SHOP_PLACEHOLDERS: CaseArchiveItem[] = [
  {
    id: "placeholder-threshold-divide",
    number: "P01",
    familyId: "PLACEHOLDER",
    title: "Threshold Divide",
    brief: "An older resident needs support while an unknown visitor waits at the door.",
    thumbnail: "/inattentive-assets/scenario-02.png",
    tags: ["Threshold safety", "Unknown visitor", "Competing requests"],
    choices: [
      { id: "A", label: "Branch pending", detail: "This placeholder branch has not been authored yet." },
      { id: "B", label: "Branch pending", detail: "This placeholder branch has not been authored yet." },
    ],
    status: "placeholder",
  },
  {
    id: "placeholder-signal-in-the-dark",
    number: "P02",
    familyId: "PLACEHOLDER",
    title: "Signal in the Dark",
    brief: "A temporary power cut creates two simultaneous requests.",
    thumbnail: "/inattentive-assets/scenario-03.png",
    tags: ["Infrastructure failure", "Low visibility", "Simultaneous claims"],
    choices: [
      { id: "A", label: "Branch pending", detail: "This placeholder branch has not been authored yet." },
      { id: "B", label: "Branch pending", detail: "This placeholder branch has not been authored yet." },
    ],
    status: "placeholder",
  },
  {
    id: "placeholder-split-attention",
    number: "P03",
    familyId: "PLACEHOLDER",
    title: "Split Attention",
    brief: "A work call competes with a time-sensitive utility-room problem.",
    thumbnail: "/inattentive-assets/scenario-04.png",
    tags: ["Remote work", "Household urgency", "Task interruption"],
    choices: [
      { id: "A", label: "Branch pending", detail: "This placeholder branch has not been authored yet." },
      { id: "B", label: "Branch pending", detail: "This placeholder branch has not been authored yet." },
    ],
    status: "placeholder",
  },
];

function buildCaseArchive(data: ProjectData, scenarios: ExperienceScenario[]): CaseArchiveItem[] {
  const published = scenarios
    .map((scenario) => ({
      id: scenario.id,
      number: scenario.number,
      familyId: scenario.familyId,
      title: scenario.title,
      brief: scenario.brief,
      thumbnail: scenario.thumbnail,
      tags: scenario.tags,
      choices: scenario.choices.map((choice) => ({ id: choice.id, label: choice.label, detail: choice.detailEn })),
      status: "published" as const,
      experience: scenario,
    }))
    .sort((first, second) => first.familyId.localeCompare(second.familyId) || first.number.localeCompare(second.number));
  const seen = new Set(published.map((item) => item.id));
  const drafts: CaseArchiveItem[] = [];
  for (const scenario of [...data.labScenarios, ...data.generatedScenarios]) {
    if (seen.has(scenario.id)) continue;
    seen.add(scenario.id);
    drafts.push({
      id: scenario.id,
      number: `D${String(drafts.length + 1).padStart(2, "0")}`,
      familyId: scenario.familyId,
      title: scenario.title,
      brief: scenario.description,
      thumbnail: `/inattentive-assets/scenario-0${(drafts.length % 3) + 2}.png`,
      tags: scenario.valueTags?.length ? scenario.valueTags : scenario.tags,
      choices: [
        { id: "A", label: scenario.choiceA, detail: "Draft branch from the current project scenario." },
        { id: "B", label: scenario.choiceB, detail: "Draft branch from the current project scenario." },
      ],
      status: "draft",
    });
  }
  return [...published, ...drafts, ...CASE_SHOP_PLACEHOLDERS];
}

type DialoguePosition = { x: number; y: number };

const DIALOGUE_POSITION_KEY = "inattentive-robot.dialogue-position.v1";

function initialDialogueTop(line: DialogueLine) {
  const base = line.position === "right" ? 40 : 20;
  if (line.offset === "down-2") return base + 14;
  if (line.offset === "down-3") return base + 21;
  if (line.offset === "down-4") return base + 28;
  return base;
}

function DialogueBubble({ scenarioId, sceneKey, line, language }: { scenarioId: string; sceneKey: string; line: DialogueLine; language: InterfaceLanguage }) {
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [position, setPosition] = useState<DialoguePosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const storageKey = `${DIALOGUE_POSITION_KEY}.${scenarioId}.${sceneKey}.${line.id}`;

  useEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DialoguePosition;
        if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
          setPosition({ x: Math.max(0, Math.min(100, parsed.x)), y: Math.max(0, Math.min(100, parsed.y)) });
          return;
        }
      } catch {
        // Fall back to the authored position when a saved preference is invalid.
      }
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rect = bubble.getBoundingClientRect();
    const left = line.position === "right"
      ? viewportWidth - rect.width - viewportWidth * 0.06
      : viewportWidth * 0.06;
    const top = viewportHeight * initialDialogueTop(line) / 100;
    setPosition({
      x: Math.max(0, Math.min(100, left / viewportWidth * 100)),
      y: Math.max(0, Math.min(100, top / viewportHeight * 100)),
    });
  }, [line, storageKey]);

  useEffect(() => {
    if (position) window.localStorage.setItem(storageKey, JSON.stringify(position));
  }, [position, storageKey]);

  function move(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const bubble = bubbleRef.current;
    if (!drag || !bubble || drag.pointerId !== event.pointerId) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left = Math.max(8, Math.min(viewportWidth - bubble.offsetWidth - 8, event.clientX - drag.offsetX));
    const top = Math.max(8, Math.min(viewportHeight - bubble.offsetHeight - 8, event.clientY - drag.offsetY));
    setPosition({ x: left / viewportWidth * 100, y: top / viewportHeight * 100 });
  }

  function finish(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div
      ref={bubbleRef}
      data-no-translate
      className={`dialogue draggable ${line.position}${line.offset ? ` ${line.offset}` : ""}${dragging ? " dragging" : ""}`}
      style={position ? { left: `${position.x}%`, right: "auto", top: `${position.y}%` } : undefined}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const rect = event.currentTarget.getBoundingClientRect();
        dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        event.preventDefault();
      }}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
      aria-label={`${language === "zh" ? line.speakerZh : line.speakerEn}${language === "zh" ? "，可拖动对白位置" : ", draggable dialogue position"}`}
    >
      <small><span>{language === "zh" ? `${line.speakerZh} / ${line.speakerEn}` : `${line.speakerEn} / ${line.speakerZh}`}</span><b>{language === "zh" ? "拖动" : "DRAG"}</b></small>
      <p className="dialogue-primary">{language === "zh" ? line.textZh : line.textEn}</p>
      <p className="dialogue-secondary" lang={language === "zh" ? "en" : "zh-CN"}>{language === "zh" ? line.textEn : line.textZh}</p>
    </div>
  );
}

function HudBattery({ value, label, tone = "danger" }: { value: number; label: string; tone?: "danger" | "warning" | "ready" }) {
  return (
    <div className={`hud-battery-card ${tone}`}>
      <span className="hud-battery"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>
      <b>{label}</b>
    </div>
  );
}

function ScenarioHud({ scenarioId, stage, choiceId, playback, language }: {
  scenarioId: string;
  stage: PlayerStage;
  choiceId?: ExperienceChoice["id"];
  playback: number;
  language: InterfaceLanguage;
}) {
  if (scenarioId !== "family01-scenario05" || (stage !== "dilemma" && stage !== "outcome")) return null;
  const copy = (zh: string, en: string) => language === "zh" ? zh : en;

  if (stage === "dilemma") {
    return (
      <div className="scenario-hud-layer" aria-hidden="true">
        {playback >= 5 && <div className="hud-top-right"><HudBattery value={8} label="8%" /></div>}
        {playback >= 5 && playback < 6.4 && <div className="hud-center-alert danger"><span className="hud-battery large"><i style={{ width: "8%" }} /></span><b>{copy("低电量", "LOW BATTERY")}</b><small>{copy("请及时安排充电", "Schedule charging soon")}</small></div>}
        {playback >= 6.2 && <div className="hud-task-panel"><b>{copy("今日任务", "TODAY'S TASKS")}</b><span>{copy("帮妹妹搬书 · 5 分钟后", "Move books for Younger Sister · in 5 min")}</span><span>{copy("帮助妈妈取快递 · 1 小时 20 分钟后", "Collect Mother's parcel · in 1 hr 20 min")}</span></div>}
      </div>
    );
  }

  if (choiceId === "A") {
    const batteryValue = playback < 4.8 ? 5 : playback < 9.7 ? 2 : 0;
    return (
      <div className="scenario-hud-layer" aria-hidden="true">
        {playback < 10.8 && <div className="hud-top-right"><HudBattery value={batteryValue} label={`${batteryValue}%`} /></div>}
        {playback >= 5 && playback < 9.8 && <div className="hud-task-panel compact"><b>{copy("任务提醒", "TASK REMINDER")}</b><span>{copy("帮妹妹搬书 · 现在", "Move books for Younger Sister · now")}</span></div>}
        {playback >= 9.8 && playback < 11.7 && <div className="hud-center-alert danger"><span className="hud-battery large" /><b>{copy("电量耗尽", "BATTERY DEPLETED")}</b><small>{copy("正在关机…", "Shutting down…")}</small></div>}
      </div>
    );
  }

  if (choiceId === "B") {
    const chargingValue = playback < 7 ? 16 : playback < 8 ? 56 : 100;
    return (
      <div className="scenario-hud-layer" aria-hidden="true">
        {playback >= 6 && playback < 9 && <div className="hud-center-alert charging"><b>{copy("正在充电", "CHARGING")}</b><span className="hud-battery large"><i style={{ width: `${chargingValue}%` }} /></span><small>{copy("40 分钟后", "40 minutes later")}</small></div>}
        {playback >= 9 && <div className="hud-top-right"><HudBattery value={100} label={copy("电量充足", "POWER RESTORED")} tone="ready" /></div>}
        {playback >= 9 && playback < 10.6 && <div className="hud-toast">{copy("充电完成 · 可继续执行任务", "Charging complete · ready for remaining tasks")}</div>}
        {playback >= 10.6 && <div className="hud-task-panel"><b>{copy("今日任务", "TODAY'S TASKS")}</b><span className="muted">{copy("帮妹妹搬书 · 已错过", "Move books for Younger Sister · missed")}</span><span className="ready">{copy("帮助妈妈取快递 · 可执行", "Collect Mother's parcel · available")}</span></div>}
      </div>
    );
  }

  return null;
}

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
};

const emptyMember: Omit<Member, "id"> = {
  name: "",
  role: "",
  age: "",
  occupation: "",
  notes: "",
};

function nowId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatSeconds(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mergeResponses(current: ExperienceResponse[], incoming: ExperienceResponse[]) {
  const merged = new Map(current.filter((response) => !response.id.startsWith("seed-")).map((response) => [response.id, response]));
  for (const response of incoming) merged.set(response.id, response);
  return Array.from(merged.values()).sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function GlassButton({ children, onClick, disabled, accent = false, type = "button" }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  accent?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button type={type} className={`button ${accent ? "button-accent" : ""}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function LanguageToggle({ language, onChange }: { language: InterfaceLanguage; onChange: (language: InterfaceLanguage) => void }) {
  const next = language === "en" ? "zh" : "en";
  return (
    <button
      className="language-toggle"
      data-no-translate
      type="button"
      onClick={() => onChange(next)}
      aria-label={language === "en" ? "切换到中文" : "Switch to English"}
      title={language === "en" ? "切换到中文" : "Switch to English"}
    >
      <span className={language === "en" ? "active" : ""}>EN</span>
      <i aria-hidden="true" />
      <span className={language === "zh" ? "active" : ""}>中文</span>
    </button>
  );
}

function Cover({ projects, activeProjectId, onSelectProject, onCreateProject, onRenameProject, onEnter }: {
  projects: ProjectData[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onEnter: (view: View) => void;
}) {
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const [editor, setEditor] = useState<"new" | "rename" | null>(null);
  const [draftName, setDraftName] = useState("");

  function openEditor(next: "new" | "rename") {
    setEditor(next);
    setDraftName(next === "rename" ? activeProject.name : "");
  }

  function submitProject(event: React.FormEvent) {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) return;
    if (editor === "new") onCreateProject(name);
    if (editor === "rename") onRenameProject(activeProject.id, name);
    setEditor(null);
  }

  return (
    <main className="cover-screen">
      <div className="cover-aurora" />
      <aside className="cover-project glass-panel">
        <label>
          <span>PROJECT</span>
          <select value={activeProject.id} onChange={(event) => onSelectProject(event.target.value)}>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <div><button onClick={() => openEditor("new")}>＋ New</button><button onClick={() => openEditor("rename")}>Rename</button></div>
        {editor && <form onSubmit={submitProject}><input value={draftName} onChange={(event) => setDraftName(event.target.value)} aria-label={editor === "new" ? "New project name" : "Rename project"} /><button type="submit">{editor === "new" ? "Create" : "Save"}</button><button type="button" onClick={() => setEditor(null)}>×</button></form>}
      </aside>
      <div className="cover-visual">
        <img src="/cover/robot-cover.jpg" alt="A humanoid domestic robot behind three translucent glass panels" />
      </div>
      <section className="cover-copy">
        <p className="eyebrow">ACTIVE RESEARCH PROJECT</p>
        <h1>{activeProject.name === "Inattentive Robot" ? "Inattentive Robot" : activeProject.name.toUpperCase()}</h1>
        <div className="cover-ports" aria-label="Choose a platform port">
          <button onClick={() => onEnter("dashboard")}>RESEARCHER</button>
          <span>·</span>
          <button onClick={() => onEnter("experience-entry")}>EXPERIENCE</button>
          <span>·</span>
          <button onClick={() => onEnter("case-first")}>CASE SHOP</button>
        </div>
      </section>
      <p className="cover-local"><i /> LOCAL STUDY ENVIRONMENT</p>
    </main>
  );
}

function AppHeader({ port, view, project, projects, cloudLabel, onProject, onNavigate, onHome, onAiSettings, onCloudAccess }: {
  port: "Researcher" | "Experience" | "Case Shop";
  view: View;
  project: ProjectData;
  projects: ProjectData[];
  onProject: (id: string) => void;
  onNavigate: (view: View) => void;
  onHome: () => void;
  onAiSettings: () => void;
  cloudLabel: string;
  onCloudAccess: () => void;
}) {
  const links = port === "Researcher"
    ? [
        ["dashboard", "Dashboard"],
        ["families", "Families File"],
        ["scenario-lab", "Scenario Lab"],
        ["case-editor", "Case Shop Editor"],
      ] as Array<[View, string]>
    : port === "Experience"
      ? [["experience-entry", "Participant Entry"], ["experience-list", "Scenario List"]] as Array<[View, string]>
      : [["case-first", "First Order"], ["case-second", "Second Order"]] as Array<[View, string]>;

  return (
    <header className="app-topbar glass-panel">
      <button className="brand" onClick={onHome} aria-label="Return to platform cover">
        <span className="brand-mark"><i /><i /><i /></span>
        <b>IR</b>
      </button>
      <div className="project-switcher">
        <small>PROJECT</small>
        <select value={project.id} aria-label="Current project" onChange={(event) => onProject(event.target.value)}>
          {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
      <nav aria-label={`${port} navigation`}>
        {links.map(([id, label]) => (
          <button key={id} className={view === id || (id === "families" && view === "family") || (id === "case-second" && view === "case-detail") ? "active" : ""} onClick={() => onNavigate(id)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="port-badge"><i /> {port.toUpperCase()} PORT</div>
      {port !== "Experience" && <button className="cloud-access-button" onClick={onCloudAccess}>{cloudLabel}</button>}
      <button className="ai-settings-button" onClick={onAiSettings}>AI API Settings</button>
    </header>
  );
}

function PageIntro({ eyebrow, title, description, action }: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Dashboard({ data, onNavigate }: { data: ProjectData; onNavigate: (view: View) => void }) {
  const averageTime = average(data.responses.map((response) => response.decisionTimeMs));
  const activeFamilies = data.families.filter((family) => family.members.length > 0).length;
  return (
    <div className="page-content dashboard-page">
      <PageIntro eyebrow="RESEARCH OVERVIEW" title="Dashboard" description="A live local view of families, scenario production, and participant responses." />
      <section className="metric-grid">
        <article className="glass-panel metric-card"><small>ACTIVE FAMILIES</small><strong>{String(activeFamilies).padStart(2, "0")}</strong><span>{data.families.length} files total</span></article>
        <article className="glass-panel metric-card"><small>SCENARIOS IN LAB</small><strong>{String(data.labScenarios.length + 1).padStart(2, "0")}</strong><span>1 experience-ready</span></article>
        <article className="glass-panel metric-card"><small>RECORDED CHOICES</small><strong>{String(data.responses.length).padStart(2, "0")}</strong><span>stored on this device</span></article>
        <article className="glass-panel metric-card"><small>AVG. DECISION TIME</small><strong>{formatSeconds(averageTime)}</strong><span>after video completion</span></article>
      </section>
      <section className="dashboard-grid">
        <article className="glass-panel focus-card">
          <div className="panel-heading"><div><small>CURRENT PROJECT</small><h2>One body, many claims</h2></div><span className="status-dot">ACTIVE</span></div>
          <p>Explore what happens when a single domestic robot cannot answer every family request at once.</p>
          <div className="focus-flow">
            <button onClick={() => onNavigate("families")}><span>01</span><b>Document families</b><small>Background, meetings, protocol</small></button>
            <i>→</i>
            <button onClick={() => onNavigate("scenario-lab")}><span>02</span><b>Shape scenarios</b><small>Script and branch scaffold</small></button>
            <i>→</i>
            <button onClick={() => onNavigate("case-editor")}><span>03</span><b>Publish archive</b><small>Editor scheduled next sprint</small></button>
          </div>
        </article>
        <article className="glass-panel recent-card">
          <div className="panel-heading"><div><small>RECENT RESPONSES</small><h2>Decision pulse</h2></div><button onClick={() => onNavigate("case-second")}>View archive ↗</button></div>
          <div className="response-list">
            {data.responses.slice(-4).reverse().map((response) => (
              <div key={response.id}><span className="avatar">{initials(response.memberName)}</span><p><b>{response.memberName}</b><small>{response.choiceLabel} · difficulty {response.difficulty}/5</small></p><time>{formatSeconds(response.decisionTimeMs)}</time></div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function FamiliesPage({ data, onOpen, onAdd }: { data: ProjectData; onOpen: (id: string) => void; onAdd: () => void }) {
  return (
    <div className="page-content">
      <PageIntro eyebrow="RESEARCHER / FAMILIES FILE" title="Families File" description="Each file holds one household’s context, interview protocol, and scenario work." action={<GlassButton accent onClick={onAdd}>＋ New family</GlassButton>} />
      <section className="family-grid">
        {data.families.map((family, index) => (
          <button className="glass-panel family-card" key={family.id} onClick={() => onOpen(family.id)}>
            <div className="family-number">{String(index + 1).padStart(2, "0")}</div>
            <div><small>{family.id}</small><h2>{family.label}</h2><p>{family.location || "Location not recorded"}</p></div>
            <dl><div><dt>MEMBERS</dt><dd>{family.members.length}</dd></div><div><dt>SCENARIOS</dt><dd>{data.generatedScenarios.filter((scenario) => scenario.familyId === family.id).length}</dd></div></dl>
            <span className={`file-state ${family.members.length ? "ready" : "empty"}`}>{family.members.length ? "IN PROGRESS" : "EMPTY FILE"}</span>
            <i className="card-arrow">↗</i>
          </button>
        ))}
      </section>
    </div>
  );
}

function MemberEditor({ family, onChange }: { family: Family; onChange: (family: Family) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyMember);
  const roleOnly = family.id === "F-001";

  function updateMember(id: string, patch: Partial<Member>) {
    onChange({ ...family, members: family.members.map((member) => member.id === id ? { ...member, ...patch } : member) });
  }

  function addMember() {
    if ((!roleOnly && !draft.name.trim()) || !draft.role.trim()) return;
    const nextMember = roleOnly ? { ...draft, name: draft.role.trim(), role: draft.role.trim() } : draft;
    onChange({ ...family, members: [...family.members, { id: nowId("member"), ...nextMember }] });
    setDraft(emptyMember);
    setAdding(false);
  }

  return (
    <section className="glass-panel member-panel">
      <div className="panel-heading"><div><small>HOUSEHOLD ROSTER</small><h2>Family members</h2></div><GlassButton accent onClick={() => setAdding(true)}>＋ Add</GlassButton></div>
      <div className="member-table" role="table" aria-label="Editable family member list">
        <div className={`member-row member-head${roleOnly ? " member-row-role-only" : ""}`} role="row">{!roleOnly && <span>Name</span>}<span>Role</span><span>Age</span><span>Occupation</span><span>Notes</span><span /></div>
        {family.members.length === 0 && !adding && <div className="empty-row"><span>＋</span><p><b>No members yet</b>Use Add to create the first household member.</p></div>}
        {family.members.map((member) => (
          <div className={`member-row${roleOnly ? " member-row-role-only" : ""}`} role="row" key={member.id}>
            {!roleOnly && <input aria-label="Member name" value={member.name} onChange={(event) => updateMember(member.id, { name: event.target.value })} />}
            <input aria-label="Member role" value={member.role} onChange={(event) => updateMember(member.id, roleOnly ? { role: event.target.value, name: event.target.value } : { role: event.target.value })} />
            <input aria-label="Member age" value={member.age} onChange={(event) => updateMember(member.id, { age: event.target.value })} />
            <input aria-label="Member occupation" value={member.occupation} onChange={(event) => updateMember(member.id, { occupation: event.target.value })} />
            <input aria-label="Member notes" value={member.notes} onChange={(event) => updateMember(member.id, { notes: event.target.value })} />
            <button className="icon-button danger" aria-label={`Delete ${roleOnly ? member.role : member.name}`} onClick={() => onChange({ ...family, members: family.members.filter((item) => item.id !== member.id) })}>×</button>
          </div>
        ))}
        {adding && (
          <div className={`member-row member-draft${roleOnly ? " member-row-role-only" : ""}`} role="row">
            {!roleOnly && <input placeholder="Name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />}
            <input placeholder="Mother" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} />
            <input placeholder="Age" value={draft.age} onChange={(event) => setDraft({ ...draft, age: event.target.value })} />
            <input placeholder="Occupation" value={draft.occupation} onChange={(event) => setDraft({ ...draft, occupation: event.target.value })} />
            <input placeholder="Notes" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
            <div className="draft-actions"><button onClick={addMember}>✓</button><button onClick={() => setAdding(false)}>×</button></div>
          </div>
        )}
      </div>
    </section>
  );
}

function BackgroundTab({ family, onChange }: { family: Family; onChange: (family: Family) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const additions: string[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      if (!file.type.startsWith("image/") || file.size > 2_000_000) continue;
      additions.push(await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      }));
    }
    onChange({ ...family, photos: [...family.photos, ...additions].slice(0, 6) });
  }

  return (
    <div className="family-tab-body">
      <section className="background-grid">
        <article className="glass-panel family-facts">
          <small>HOUSEHOLD PROFILE</small>
          <label><span>Family members</span><strong>{family.members.length}</strong></label>
          <label><span>Location</span><input value={family.location} placeholder="City, region" onChange={(event) => onChange({ ...family, location: event.target.value })} /></label>
          <div className="facts-note"><i /> Changes are saved automatically to this device.</div>
        </article>
        <div className="glass-panel photo-zone" role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileRef.current?.click(); }} onClick={() => fileRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void addPhotos(event.dataTransfer.files); }}>
          <input ref={fileRef} hidden type="file" accept="image/*" multiple onChange={(event) => void addPhotos(event.target.files)} />
          {family.photos.length ? (
            <div className="photo-grid">{family.photos.map((photo, index) => <img src={photo} alt={`Uploaded family reference ${index + 1}`} key={`${photo.slice(-16)}-${index}`} />)}</div>
          ) : (
            <div className="photo-empty"><span>＋</span><h3>Family photos</h3><p>Drop images here or choose files · up to 2 MB each</p></div>
          )}
        </div>
      </section>
      <MemberEditor family={family} onChange={onChange} />
    </div>
  );
}

function MeetingTab({ family, onChange }: { family: Family; onChange: (family: Family) => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="meeting-grid">
      <section className="glass-panel text-workspace protocol-workspace">
        <div className="panel-heading"><div><small>FAMILY MEETING 1</small><h2>Protocol</h2></div><span>{family.protocol.length} CHAR</span></div>
        <p>Record conflicts the family anticipated and the solutions they proposed for the robot.</p>
        <textarea value={family.protocol} onChange={(event) => { setSaved(false); onChange({ ...family, protocol: event.target.value }); }} placeholder="Start with the situations the family discussed, then capture the rules or priorities they proposed…" />
        <div className="workspace-footer"><span>Last updated {family.meetingUpdatedAt ? new Date(family.meetingUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span><GlassButton accent onClick={() => { onChange({ ...family, meetingUpdatedAt: new Date().toISOString() }); setSaved(true); }}>{saved ? "Saved ✓" : "Save meeting"}</GlassButton></div>
      </section>
      <aside className="glass-panel text-workspace memo-workspace">
        <div className="panel-heading"><div><small>QUALITATIVE NOTES</small><h2>Memos</h2></div><span>PRIVATE</span></div>
        <p>Capture language, tensions, and observations that do not belong in the protocol.</p>
        <textarea value={family.memos} onChange={(event) => onChange({ ...family, memos: event.target.value })} placeholder="Interview observations, notable quotes, household dynamics…" />
      </aside>
    </div>
  );
}

function ScenarioCard({ scenario, onChange }: { scenario: GeneratedScenario; onChange: (scenario: GeneratedScenario) => void }) {
  return (
    <article className={`glass-panel generated-card ${scenario.selected ? "selected" : ""}`}>
      <label className="scenario-check"><input type="checkbox" checked={scenario.selected} onChange={(event) => onChange({ ...scenario, selected: event.target.checked })} /><i>✓</i></label>
      <input className="scenario-title-input" value={scenario.title} onChange={(event) => onChange({ ...scenario, title: event.target.value })} aria-label="Scenario title" />
      <textarea value={scenario.description} onChange={(event) => onChange({ ...scenario, description: event.target.value })} aria-label="Scenario description" />
      <div className="tag-row member-tags">{scenario.memberTags.map((tag) => <span key={tag}>@ {tag}</span>)}</div>
      <div className="tag-row value-tags">{scenario.valueTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    </article>
  );
}

function GenerationTab({ family, data, setData, onJumpLab }: {
  family: Family;
  data: ProjectData;
  setData: React.Dispatch<React.SetStateAction<ProjectData>>;
  onJumpLab: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [apiStatus, setApiStatus] = useState<{ state: "checking" | "ready" | "missing"; model: string }>({ state: "checking", model: "google/gemini-3.1-flash-lite" });
  const [showKeyEntry, setShowKeyEntry] = useState(false);
  const scenarios = data.generatedScenarios.filter((scenario) => scenario.familyId === family.id);

  useEffect(() => {
    let active = true;
    fetch("/api/scenarios/generate")
      .then((response) => response.json())
      .then((payload: { configured?: boolean; model?: string }) => {
        if (active) setApiStatus({ state: payload.configured ? "ready" : "missing", model: payload.model || "google/gemini-3.1-flash-lite" });
      })
      .catch(() => {
        if (active) setApiStatus({ state: "missing", model: "google/gemini-3.1-flash-lite" });
      });
    return () => { active = false; };
  }, []);

  async function generate() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/scenarios/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: data.name, family }),
      });
      const payload = await response.json() as { scenarios?: Array<Pick<GeneratedScenario, "title" | "description" | "memberTags" | "valueTags"> & Partial<Pick<GeneratedScenario, "choiceA" | "choiceB" | "tags">>>; error?: string };
      if (!response.ok || !payload.scenarios) throw new Error(payload.error || "Scenario generation failed.");
      const createdAt = new Date().toISOString();
      const next = payload.scenarios.map((scenario) => ({ ...scenario, id: nowId("scenario"), familyId: family.id, choiceA: scenario.choiceA || "Respond to the first request", choiceB: scenario.choiceB || "Respond to the competing request", tags: scenario.tags?.length ? scenario.tags : scenario.valueTags, selected: false, source: "openrouter" as const, status: "draft" as const, createdAt, updatedAt: createdAt }));
      setData((current) => ({ ...current, generatedScenarios: [...current.generatedScenarios.filter((scenario) => scenario.familyId !== family.id), ...next] }));
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Scenario generation failed.");
    }
  }

  function updateScenario(next: GeneratedScenario) {
    setData((current) => ({ ...current, generatedScenarios: current.generatedScenarios.map((scenario) => scenario.id === next.id ? next : scenario) }));
  }

  function submitSelected() {
    const selected = scenarios.filter((scenario) => scenario.selected);
    if (!selected.length) return;
    setData((current) => ({
      ...current,
      labScenarios: [
        ...current.labScenarios.filter((existing) => !selected.some((scenario) => scenario.id === existing.id)),
        ...selected.map((scenario) => ({ ...scenario, selected: false })),
      ],
    }));
    onJumpLab();
  }

  return (
    <div className="generation-area">
      {scenarios.length === 0 ? (
        <section className="glass-panel generation-empty">
          <div className="ai-orb"><i /><i /><i /></div>
          <p className="eyebrow">AI SCENARIO GENERATOR</p>
          <h2>Find the protocol’s blind spots.</h2>
          <p>Family background, meeting notes, and the research tagging system are synthesized into ten unexpected attention conflicts.</p>
          <div className={`api-status ${apiStatus.state}`}><i />{apiStatus.state === "checking" ? "Checking OpenRouter…" : apiStatus.state === "ready" ? `OpenRouter connected · ${apiStatus.model}` : "OpenRouter key required"}</div>
          <GlassButton accent onClick={() => void generate()} disabled={status === "loading" || apiStatus.state !== "ready"}>{status === "loading" ? "Generating 10 scenarios…" : "Generate"}</GlassButton>
          <button className="key-settings-link" onClick={() => setShowKeyEntry(true)}>{apiStatus.state === "ready" ? "Replace API keys" : "Set API keys securely"}</button>
          {apiStatus.state === "missing" && <p className="api-path">The key is saved only to the local server environment and is never stored in this browser.</p>}
          {status === "error" && <p className="inline-error">{message}</p>}
        </section>
      ) : (
        <>
          <div className="generation-toolbar glass-panel">
            <div><small>AI SCENARIO GENERATOR</small><b>{scenarios.length} editable drafts</b><span className={`api-status compact ${apiStatus.state}`}><i />{apiStatus.state === "ready" ? apiStatus.model : "OpenRouter offline"}</span></div>
            <div><button className="text-link" onClick={() => setShowKeyEntry(true)}>API settings</button><button className="text-link" onClick={onJumpLab}>Scenario Lab ↗</button><GlassButton onClick={() => void generate()} disabled={status === "loading"}>{status === "loading" ? "Regenerating…" : "↻ Regenerate"}</GlassButton><GlassButton accent onClick={submitSelected} disabled={!scenarios.some((scenario) => scenario.selected)}>Push selected to Lab →</GlassButton></div>
          </div>
          {status === "error" && <p className="inline-error toolbar-error">{message}</p>}
          <section className="generated-grid">{scenarios.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} onChange={updateScenario} />)}</section>
        </>
      )}
      <AiSettingsDialog open={showKeyEntry} onClose={() => setShowKeyEntry(false)} />
    </div>
  );
}

function ExperienceReport({ family, responses, scenarios }: {
  family: Family;
  responses: ExperienceResponse[];
  scenarios: ExperienceScenario[];
}) {
  const familyResponses = responses
    .filter((response) => response.familyId === family.id)
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  const scenarioMap = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const grouped = new Map<string, ExperienceResponse[]>();
  for (const response of familyResponses) grouped.set(response.scenarioId, [...(grouped.get(response.scenarioId) || []), response]);
  const groups = Array.from(grouped.entries()).sort(([firstId], [secondId]) => {
    const first = scenarioMap.get(firstId)?.number || firstId;
    const second = scenarioMap.get(secondId)?.number || secondId;
    return first.localeCompare(second);
  });

  function reportText() {
    const lines = [
      `EXPERIENCE REPORT / 体验报告`,
      `${family.label} · ${family.id}`,
      `Generated / 生成时间: ${new Date().toLocaleString()}`,
      `Responses / 回答数量: ${familyResponses.length}`,
      "",
    ];
    for (const [scenarioId, items] of groups) {
      const scenario = scenarioMap.get(scenarioId);
      lines.push(`SCENARIO ${scenario?.number || "—"} · ${scenario?.titleEn || scenario?.title || scenarioId}`);
      if (scenario?.titleZh) lines.push(scenario.titleZh);
      for (const response of items) {
        lines.push(
          "",
          `${response.memberRole}${response.memberName !== response.memberRole ? ` (${response.memberName})` : ""}`,
          `Choice / 选择: ${response.choice} · ${response.choiceLabel}`,
          `Decision time / 决策时间: ${formatSeconds(response.decisionTimeMs)}`,
          `Alternative / 其他方案: ${response.thirdOption || "None"}`,
          `Difficulty / 难度: ${response.difficulty}/5`,
          `Rationale / 选择理由: ${response.rationale}`,
          `Submitted / 提交时间: ${new Date(response.createdAt).toLocaleString()}`,
        );
      }
      lines.push("", "────────────────────────────────────────", "");
    }
    return lines.join("\n");
  }

  function exportCsv() {
    const header = ["family_id", "family", "scenario_id", "scenario", "member_id", "member_role", "choice", "choice_label", "decision_time_ms", "third_option", "difficulty", "rationale", "created_at"];
    const rows = familyResponses.map((response) => {
      const scenario = scenarioMap.get(response.scenarioId);
      return [family.id, family.label, response.scenarioId, scenario?.titleEn || scenario?.title || response.scenarioId, response.memberId, response.memberRole, response.choice, response.choiceLabel, response.decisionTimeMs, response.thirdOption, response.difficulty, response.rationale, response.createdAt].map(csvCell).join(",");
    });
    downloadTextFile(`${family.id}-experience-report.csv`, [header.map(csvCell).join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
  }

  return (
    <section className="experience-report glass-panel">
      <header className="experience-report-header">
        <div><small>FAMILY EXPERIENCE REPORT</small><h2>体验报告 · Experience Report</h2><p>按场景查看该家庭每位成员的选择、决策时间与 Choice Record 完整回答。</p></div>
        <div><button onClick={() => downloadTextFile(`${family.id}-experience-report.txt`, reportText())}>↓ TXT</button><button onClick={exportCsv}>↓ CSV</button><button onClick={() => downloadTextFile(`${family.id}-experience-report.json`, JSON.stringify(familyResponses, null, 2), "application/json")}>↓ JSON</button></div>
      </header>
      {!groups.length ? <div className="experience-report-empty"><span>○</span><h3>暂无体验记录</h3><p>该家庭成员提交 Choice Record 后，报告会自动显示在这里。</p></div> : groups.map(([scenarioId, items]) => {
        const scenario = scenarioMap.get(scenarioId);
        return (
          <article className="report-scenario" key={scenarioId}>
            <header><span>SCENARIO {scenario?.number || "—"}</span><h3>{scenario?.titleZh || scenario?.title || scenarioId}<small>{scenario?.titleEn || scenarioId}</small></h3><b>{items.length} RESPONSES</b></header>
            <div className="report-response-list">{items.map((response) => (
              <section className="report-response" key={response.id}>
                <div className="report-member"><span className="avatar">{initials(response.memberRole)}</span><p><b>{response.memberRole}</b><small>{new Date(response.createdAt).toLocaleString()}</small></p></div>
                <dl>
                  <div><dt>CHOICE / 选择</dt><dd><b>{response.choice}</b> {response.choiceLabel}</dd></div>
                  <div><dt>DECISION TIME / 决策时间</dt><dd>{formatSeconds(response.decisionTimeMs)}</dd></div>
                  <div><dt>ALTERNATIVE / 其他方案</dt><dd>{response.thirdOption || "None"}</dd></div>
                  <div><dt>DIFFICULTY / 难度</dt><dd>{response.difficulty}/5</dd></div>
                  <div className="report-rationale"><dt>RATIONALE / 选择理由</dt><dd>{response.rationale}</dd></div>
                </dl>
              </section>
            ))}</div>
          </article>
        );
      })}
    </section>
  );
}

function CloudAccessDialog({ open, email, queued, onClose, onSignedIn, onSignedOut }: {
  open: boolean;
  email: string;
  queued: number;
  onClose: () => void;
  onSignedIn: (email: string) => void;
  onSignedOut: () => void;
}) {
  const [draftEmail, setDraftEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const session = await signInResearcher(draftEmail.trim(), password);
      onSignedIn(session?.user.email || draftEmail.trim());
      setPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Researcher sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true); setError("");
    try { await signOutResearcher(); onSignedOut(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Sign-out failed."); }
    finally { setBusy(false); }
  }

  return (
    <div className="local-key-backdrop" role="presentation">
      <section className="local-key-dialog cloud-access-dialog glass-panel" role="dialog" aria-modal="true" aria-label="Cloud response access">
        <header><div><small>SUPABASE RESPONSE CLOUD</small><h2>研究数据同步</h2></div><button onClick={onClose} aria-label="Close cloud access">×</button></header>
        {!cloudResponsesConfigured ? <div className="cloud-config-missing"><b>当前构建尚未配置 Supabase。</b><p>请在本地或 GitHub Actions 中设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY。</p></div> : email ? <div className="cloud-session"><span>● CONNECTED</span><h3>{email}</h3><p>Researcher 与 Case Shop 正在读取共享数据并监听新提交。</p><p>{queued ? `${queued} 条本地记录等待重试。` : "离线队列为空。"}</p><button onClick={signOut} disabled={busy}>退出研究者账号</button></div> : <form onSubmit={submit}><p>参与者无需登录即可提交。Researcher 登录后才能读取原始 Choice Record。</p><label><span>研究者邮箱</span><input type="email" value={draftEmail} onChange={(event) => setDraftEmail(event.target.value)} required /></label><label><span>密码</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="inline-error">{error}</p>}<button className="button button-accent" type="submit" disabled={busy}>{busy ? "正在连接…" : "登录并同步"}</button></form>}
      </section>
    </div>
  );
}

function FamilyDetail({ family, tab, data, scenarios, setData, onBack, onTab, onJumpLab }: {
  family: Family;
  tab: FamilyTab;
  data: ProjectData;
  scenarios: ExperienceScenario[];
  setData: React.Dispatch<React.SetStateAction<ProjectData>>;
  onBack: () => void;
  onTab: (tab: FamilyTab) => void;
  onJumpLab: () => void;
}) {
  function updateFamily(next: Family) {
    setData((current) => ({ ...current, families: current.families.map((item) => item.id === next.id ? next : item) }));
  }
  return (
    <div className="page-content family-detail-page">
      <button className="back-link" onClick={onBack}>← Families File</button>
      <PageIntro eyebrow={`RESEARCHER / ${family.id}`} title={family.id} description={`${family.label} · ${family.location || "Location not recorded"}`} />
      <nav className="section-tabs glass-panel" aria-label="Family file sections">
        <button className={tab === "background" ? "active" : ""} onClick={() => onTab("background")}><span>01</span>Background Info</button>
        <button className={tab === "meeting" ? "active" : ""} onClick={() => onTab("meeting")}><span>02</span>Family Meeting 1</button>
        <button className={tab === "generation" ? "active" : ""} onClick={() => onTab("generation")}><span>03</span>Generation Area</button>
        <button className={tab === "report" ? "active" : ""} onClick={() => onTab("report")}><span>04</span>体验报告 · Experience Report</button>
      </nav>
      {tab === "background" && <BackgroundTab family={family} onChange={updateFamily} />}
      {tab === "meeting" && <MeetingTab family={family} onChange={updateFamily} />}
      {tab === "generation" && <GenerationTab family={family} data={data} setData={setData} onJumpLab={onJumpLab} />}
      {tab === "report" && <ExperienceReport family={family} responses={data.responses} scenarios={scenarios} />}
    </div>
  );
}

function CaseEditor() {
  return (
    <div className="page-content placeholder-page">
      <PageIntro eyebrow="RESEARCHER / CASE SHOP EDITOR" title="Case Shop Editor" description="The publishing workspace for wishes, dilemmas, images, and archive metadata." />
      <section className="glass-panel placeholder-shell">
        <div className="placeholder-icon"><i /><i /><i /></div><span className="sprint-badge">NEXT SPRINT</span><h2>Archive publishing is not active yet.</h2><p>The information architecture is in place. Editing, moderation, and publishing controls remain disabled for this phase.</p>
        <div className="placeholder-controls"><button disabled>＋ New wish card</button><button disabled>Review submissions</button><button disabled>Publish collection</button></div>
      </section>
    </div>
  );
}

function ExperienceEntry({ data, familyId, memberId, language, onFamily, onMember, onContinue }: {
  data: ProjectData;
  familyId: string;
  memberId: string;
  language: InterfaceLanguage;
  onFamily: (id: string) => void;
  onMember: (id: string) => void;
  onContinue: () => void;
}) {
  const family = data.families.find((item) => item.id === familyId);
  return (
    <div className="participant-entry page-content">
      <section className="entry-card glass-panel">
        <p className="eyebrow">{language === "zh" ? "参与者入口" : "PARTICIPANT ENTRY"}</p><h1>{language === "zh" ? "选择你在家庭中的身份。" : <>Choose your place<br />in the family.</>}</h1><p>{language === "zh" ? "这里只会显示分配给你所在家庭的互动场景。" : "Only the interactive scenarios assigned to your family will be shown."}</p>
        <div className="entry-fields">
          <label><span>{language === "zh" ? "01 · 选择家庭编号" : "01 · Select Family ID"}</span><select value={familyId} onChange={(event) => onFamily(event.target.value)}><option value="">{language === "zh" ? "选择家庭" : "Choose a family"}</option>{data.families.map((item) => <option key={item.id} value={item.id}>{language === "zh" ? item.label.replace("Family", "家庭").replace("(test scenarios)", "（测试场景）") : item.label} · {item.id}</option>)}</select></label>
          <label><span>{language === "zh" ? "02 · 我是谁？" : "02 · Who am I?"}</span><select value={memberId} disabled={!familyId || !family?.members.length} onChange={(event) => onMember(event.target.value)}><option value="">{family?.members.length ? (language === "zh" ? "选择你的家庭角色" : "Choose your family role") : (language === "zh" ? "此档案中暂无家庭成员" : "No members in this file")}</option>{family?.members.map((member) => <option key={member.id} value={member.id}>{member.name && member.name !== member.role ? `${member.role} (${member.name})` : member.role}</option>)}</select></label>
        </div>
        <button className="entry-continue" disabled={!familyId || !memberId} onClick={onContinue}><span>{language === "zh" ? "继续进入场景" : "Continue to scenarios"}</span><i>→</i></button>
        <small className="privacy-note"><i /> {language === "zh" ? "无需登录 · 提交后安全同步至研究数据库" : "No login required · submitted responses sync securely to the study database"}</small>
      </section>
      <aside className="entry-visual"><img src="/cover/robot-cover.jpg" alt="Inattentive Robot project cover" /><div><span>ONE BODY</span><i /> <span>MANY CLAIMS</span></div></aside>
    </div>
  );
}

function ExperienceList({ family, member, scenarios, language, onPlayWebsite, onPlayVr, onChangeIdentity }: {
  family: Family;
  member: Member;
  scenarios: ExperienceScenario[];
  language: InterfaceLanguage;
  onPlayWebsite: (scenarioId: string) => void;
  onPlayVr: (scenarioId: string) => void;
  onChangeIdentity: () => void;
}) {
  const assigned = scenarios
    .filter((scenario) => scenario.familyId === family.id)
    .sort((first, second) => (first.experienceOrder ?? Number(first.number)) - (second.experienceOrder ?? Number(second.number)) || first.number.localeCompare(second.number));
  const placeholders = (family.id === "F-002" ? [] : [
    { number: "02", titleZh: "门口的分歧", titleEn: "Threshold Divide", briefZh: "一位老人需要帮助，同时陌生访客正在门外等待。", briefEn: "An older resident needs support while an unknown visitor waits at the door.", image: "/inattentive-assets/scenario-02.png" },
    { number: "03", titleZh: "黑暗中的信号", titleEn: "Signal in the Dark", briefZh: "临时停电引发了两个同时出现的请求。", briefEn: "A temporary power cut creates two simultaneous requests.", image: "/inattentive-assets/scenario-03.png" },
    { number: "04", titleZh: "注意力分流", titleEn: "Split Attention", briefZh: "工作电话与紧迫的杂物间问题发生冲突。", briefEn: "A work call competes with a time-sensitive utility-room problem.", image: "/inattentive-assets/scenario-04.png" },
  ]).filter((placeholder) => !assigned.some((scenario) => scenario.number === placeholder.number));
  const cards = [
    ...assigned.map((scenario) => ({
      id: scenario.id,
      number: scenario.number,
      titleZh: scenario.titleZh,
      titleEn: scenario.titleEn,
      briefZh: scenario.briefZh,
      briefEn: scenario.briefEn,
      image: scenario.thumbnail,
      active: true,
      vrEnabled: Boolean(scenario.vrEnabled),
      experienceOrder: scenario.experienceOrder ?? Number(scenario.number),
    })),
    ...placeholders.map((placeholder) => ({ ...placeholder, id: `placeholder-${placeholder.number}`, active: false, vrEnabled: false, experienceOrder: Number(placeholder.number) })),
  ].sort((first, second) => first.experienceOrder - second.experienceOrder || first.number.localeCompare(second.number));
  return (
    <div className="page-content experience-library">
      <PageIntro eyebrow={language === "zh" ? `影游体验 / ${family.id}` : `EXPERIENCE / ${family.id}`} title={language === "zh" ? "你的体验场景" : "Your scenarios"} description={language === "zh" ? `当前身份：${member.role}` : `Playing as ${member.role}`} action={<GlassButton onClick={onChangeIdentity}>{initials(member.role)} · {language === "zh" ? "更换身份" : "Change identity"}</GlassButton>} />
      <section className="experience-card-list">
        {cards.map((card) => (
          <article className={`glass-panel experience-card ${card.active ? "active" : "locked"}`} key={card.id}>
            <img src={card.image} alt="" />
            <div className="experience-card-shade" /><span className="experience-number">{language === "zh" ? "场景" : "SCENARIO"} {card.number}</span>
            <div><h2>{language === "zh" ? card.titleZh : card.titleEn}</h2><p>{language === "zh" ? card.briefZh : card.briefEn}</p></div>
            {card.active ? <div className="experience-actions">{card.vrEnabled && <button className="vr-mode" onClick={() => onPlayVr(card.id)}><span>{language === "zh" ? "VR 体验" : "VR experience"}</span><i>◉</i></button>}<button onClick={() => onPlayWebsite(card.id)}><span>{language === "zh" ? "网页体验" : "Website experience"}</span><i>▶</i></button></div> : <span className="coming-label">{language === "zh" ? "即将推出" : "COMING LATER"}</span>}
          </article>
        ))}
      </section>
    </div>
  );
}

function SurveyModal({ choice, choiceRecord, language, difficulty, rationale, thirdMode, thirdOption, listening, speechAvailable, submitting, onDifficulty, onRationale, onThirdMode, onThirdOption, onMic, onReplay, onExit, onSubmit }: {
  choice: ExperienceChoice;
  choiceRecord?: BilingualChoiceRecord;
  language: InterfaceLanguage;
  difficulty: number;
  rationale: string;
  thirdMode: "none" | "custom";
  thirdOption: string;
  listening: boolean;
  speechAvailable: boolean;
  submitting: boolean;
  onDifficulty: (value: number) => void;
  onRationale: (value: string) => void;
  onThirdMode: (value: "none" | "custom") => void;
  onThirdOption: (value: string) => void;
  onMic: () => void;
  onReplay: () => void;
  onExit: () => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <div className="survey-backdrop">
      <section className="survey-modal glass-panel" role="dialog" aria-modal="true" aria-label={language === "zh" ? "选择记录" : "Choice record"}>
        <div className="survey-heading"><div><small>{language === "zh" ? "选择记录" : "CHOICE RECORD"} · {choice.id}</small><h2>{language === "zh" ? "记录你的选择。" : "Record your choice."}</h2></div><span>{language === "zh" ? "3 个问题" : "3 QUESTIONS"}</span></div>
        <div className="choice-record-summary"><span>{choice.id}</span><p><b>{language === "zh" ? choice.labelZh : choice.labelEn}</b><em>{language === "zh" ? choice.outcomeZh : choice.outcomeEn}</em></p></div>
        <section className="survey-question" role="group" aria-labelledby="choice-question-1"><h3 id="choice-question-1"><span>01</span><b>{language === "zh" ? choiceRecord?.alternativeQuestionZh || "除了现有选项，你认为还有其他安全且可执行的做法吗？" : choiceRecord?.alternativeQuestionEn || "Beyond the available choices, is there another safe and actionable response?"}</b></h3><div className="radio-line"><label><input type="radio" checked={thirdMode === "none"} onChange={() => onThirdMode("none")} /> {language === "zh" ? "没有" : "None"}</label><label><input type="radio" checked={thirdMode === "custom"} onChange={() => onThirdMode("custom")} /> {language === "zh" ? "我有另一种做法" : "I have another option"}</label></div>{thirdMode === "custom" && <input value={thirdOption} placeholder={language === "zh" ? choiceRecord?.alternativePlaceholderZh || "描述另一种做法……" : choiceRecord?.alternativePlaceholderEn || "Describe another response…"} onChange={(event) => onThirdOption(event.target.value)} />}</section>
        <section className="survey-question" role="group" aria-labelledby="choice-question-2"><h3 id="choice-question-2"><span>02</span><b>{language === "zh" ? "在当时的信息条件下，这个选择有多难？" : "How difficult was this choice with the information available?"}</b></h3><div className="difficulty-scale">{[1, 2, 3, 4, 5].map((value) => <button className={difficulty === value ? "active" : ""} key={value} onClick={() => onDifficulty(value)}><b>{value}</b><small>{value === 1 ? (language === "zh" ? "容易" : "Easy") : value === 5 ? (language === "zh" ? "非常纠结" : "Very conflicted") : ""}</small></button>)}</div></section>
        <section className="survey-question" role="group" aria-labelledby="choice-question-3"><h3 id="choice-question-3"><span>03</span><b>{language === "zh" ? choiceRecord?.rationaleQuestionZh || "你为什么做出这个选择？哪些风险或意愿最重要？" : choiceRecord?.rationaleQuestionEn || "Why did you choose this response? Which risks or wishes mattered most?"}</b></h3><div className="voice-input"><textarea value={rationale} placeholder={language === "zh" ? choiceRecord?.rationalePlaceholderZh || "输入回答或使用麦克风……" : choiceRecord?.rationalePlaceholderEn || "Type your response or use the microphone…"} onChange={(event) => onRationale(event.target.value)} /><button className={listening ? "listening" : ""} onClick={onMic} disabled={!speechAvailable} aria-label={listening ? (language === "zh" ? "停止语音输入" : "Stop voice input") : (language === "zh" ? "开始语音输入" : "Start voice input")}><i>●</i><span>{listening ? (language === "zh" ? "聆听中……" : "Listening…") : (language === "zh" ? "语音" : "Voice")}</span></button></div>{!speechAvailable && <small className="speech-note">{language === "zh" ? "当前浏览器无法使用语音输入；你仍可键入回答。" : "Voice input is unavailable; typing remains available."}</small>}</section>
        <div className="survey-actions"><button onClick={onReplay} disabled={submitting}>↻ {language === "zh" ? "重新体验" : "Try Again"}</button><button onClick={onExit} disabled={submitting}>{language === "zh" ? "退出" : "Exit"}</button><button className="survey-submit" disabled={submitting || !difficulty || !rationale.trim() || (thirdMode === "custom" && !thirdOption.trim())} onClick={() => void onSubmit()}>{submitting ? (language === "zh" ? "正在安全保存…" : "Saving securely…") : (language === "zh" ? "提交并体验下一个场景" : "Submit and Try Next Scenario")} <span>→</span></button></div>
      </section>
    </div>
  );
}

function ScenarioPlayer({ scenario, family, member, language, onSave, onExit, onSubmitNext }: {
  scenario: ExperienceScenario;
  family: Family;
  member: Member;
  language: InterfaceLanguage;
  onSave: (response: ExperienceResponse) => Promise<void>;
  onExit: () => void;
  onSubmitNext: () => void;
}) {
  const [stage, setStage] = useState<PlayerStage>("briefing");
  const [playback, setPlayback] = useState(0);
  const [choice, setChoice] = useState<ExperienceChoice | null>(null);
  const [decisionMs, setDecisionMs] = useState(0);
  const [decisionElapsedMs, setDecisionElapsedMs] = useState(0);
  const [thirdMode, setThirdMode] = useState<"none" | "custom">("none");
  const [thirdOption, setThirdOption] = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [rationale, setRationale] = useState("");
  const [listening, setListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const decisionStartRef = useRef(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const speechCtor = typeof window !== "undefined"
    ? (window as typeof window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      || (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition
    : undefined;

  const dialogue = stage === "dilemma"
    ? scenario.dialogue.dilemma
    : choice
      ? scenario.dialogue[choice.id] ?? []
      : [];
  const sceneKey = stage === "dilemma" ? "dilemma" : choice?.id ?? "dilemma";
  const activeDialogue = dialogue.filter((line) => playback >= line.start && playback < line.end);
  const timeoutVideo = scenario.decisionTimeout?.video04;
  const countdownSeconds = scenario.decisionTimeout?.countdownSeconds ?? 10;
  const urgentSeconds = scenario.decisionTimeout?.urgentSeconds ?? 10;
  const decisionTimeoutMs = scenario.decisionTimeout ? (countdownSeconds + urgentSeconds) * 1000 : null;
  const currentDuration = stage === "dilemma" ? scenario.dilemmaDuration : stage === "timeout" ? timeoutVideo?.duration ?? 15 : choice?.duration ?? 15;
  const decisionCountdown = Math.max(0, countdownSeconds - Math.floor(decisionElapsedMs / 1000));
  const urgentStartsAtMs = countdownSeconds * 1000;
  const showDecisionUrgency = decisionElapsedMs >= urgentStartsAtMs && decisionElapsedMs < urgentStartsAtMs + urgentSeconds * 1000;

  useEffect(() => {
    if (stage !== "decision") return;
    const updateElapsed = () => {
      const elapsed = performance.now() - decisionStartRef.current;
      if (decisionTimeoutMs !== null && elapsed >= decisionTimeoutMs) {
        setDecisionElapsedMs(decisionTimeoutMs);
        setPlayback(0);
        setStage("timeout");
        return;
      }
      setDecisionElapsedMs(elapsed);
    };
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 200);
    return () => window.clearInterval(timer);
  }, [decisionTimeoutMs, stage]);

  function enterDecision(eventTime: number) {
    decisionStartRef.current = eventTime;
    setDecisionElapsedMs(0);
    setPlayback(0);
    setStage("decision");
  }

  function choose(next: ExperienceChoice, eventTime: number) {
    setDecisionMs(Math.max(0, Math.round(eventTime - decisionStartRef.current)));
    setChoice(next);
    setPlayback(0);
    setStage("outcome");
  }

  function toggleMic() {
    if (!speechCtor) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new speechCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = scenario.voiceLanguage || "zh-CN";
    let finalTranscript = rationale.trim();
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalTranscript = `${finalTranscript} ${result[0].transcript}`.trim();
        else interim += result[0].transcript;
      }
      setRationale(`${finalTranscript}${interim ? ` ${interim}` : ""}`.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function submitSurvey() {
    if (!choice) return;
    setSubmitting(true);
    recognitionRef.current?.stop();
    await onSave({
      id: nowId("response"),
      familyId: family.id,
      memberId: member.id,
      memberName: member.name,
      memberRole: member.role,
      scenarioId: scenario.id,
      choice: choice.id,
      choiceLabel: choice.labelEn,
      decisionTimeMs: decisionMs,
      thirdOption: thirdMode === "none" ? "None" : thirdOption.trim(),
      difficulty,
      rationale: rationale.trim(),
      createdAt: new Date().toISOString(),
    });
    setSubmitting(false);
    onSubmitNext();
  }

  function replay() {
    setStage("briefing"); setPlayback(0); setChoice(null); setDecisionMs(0); setThirdMode("none"); setThirdOption(""); setDifficulty(0); setRationale("");
  }

  return (
    <main className={`player-screen stage-${stage}`}>
      {stage === "briefing" || stage === "decision" || stage === "survey" || (stage === "timeout" && timeoutVideo?.placeholder !== false) ? <img className="player-media" src={stage === "timeout" ? timeoutVideo?.poster || scenario.thumbnail : scenario.thumbnail} alt="The family attention conflict" /> : <video key={`${stage}-${choice?.id || "dilemma"}`} className="player-media" src={stage === "dilemma" ? scenario.dilemmaVideo : stage === "timeout" ? timeoutVideo?.video : choice?.video} poster={stage === "dilemma" ? scenario.thumbnail : stage === "timeout" ? timeoutVideo?.poster : choice?.poster} autoPlay playsInline onTimeUpdate={(event) => setPlayback(event.currentTarget.currentTime)} onEnded={(event) => stage === "dilemma" ? enterDecision(event.timeStamp) : stage === "outcome" ? setStage("survey") : undefined} />}
      <div className="player-grade" />
      <ScenarioHud scenarioId={scenario.id} stage={stage} choiceId={choice?.id} playback={playback} language={language} />
      <header className="player-header"><span><i /> Inattentive Robot · {language === "zh" ? "场景" : "SCENARIO"} {scenario.number}</span><b>{member.role.toUpperCase()} · {language === "zh" ? "机器人视角" : "ROBOT POV"}</b><button onClick={onExit}>{language === "zh" ? "退出" : "Exit"} ×</button></header>
      {(stage === "dilemma" || stage === "outcome") && activeDialogue.filter((line) => line.showBubble !== false).map((line) => <DialogueBubble scenarioId={scenario.id} sceneKey={sceneKey} line={line} language={language} key={`${sceneKey}-${line.id}`} />)}
      {stage === "briefing" && <section className="briefing-card glass-panel"><p className="eyebrow">{language === "zh" ? scenario.briefing.eyebrowZh : scenario.briefing.eyebrowEn}</p><h1>{language === "zh" ? scenario.briefing.titleZh : scenario.briefing.titleEn}</h1><div className="briefing-facts">{scenario.briefing.facts.map((fact) => <div key={`${fact.value}-${fact.labelEn}`}><span>{fact.value}</span><p><b>{language === "zh" ? fact.labelZh : fact.labelEn}</b>{language === "zh" ? fact.detailZh : fact.detailEn}</p></div>)}</div><div className="briefing-body"><p>{language === "zh" ? scenario.briefing.bodyZh : scenario.briefing.bodyEn}</p></div><button onClick={() => setStage("dilemma")}>{language === "zh" ? scenario.briefing.startZh : scenario.briefing.startEn}<span>→</span></button></section>}
      {stage === "dilemma" && <div className="playback-status"><span>{language === "zh" ? "场景播放中" : "SCENE PLAYING"}</span><div><i style={{ width: `${Math.min(playback / currentDuration, 1) * 100}%` }} /></div><small>{language === "zh" ? "影片结束后将出现选项" : "Choices appear after the film ends"}</small></div>}
      {stage === "decision" && <section className="decision-card glass-panel">{scenario.decisionTimeout && <div className="decision-status" role="timer" aria-live={showDecisionUrgency ? "assertive" : "off"}>{decisionCountdown > 0 ? <span className="decision-countdown" aria-label={language === "zh" ? `剩余 ${decisionCountdown} 秒` : `${decisionCountdown} seconds remaining`}>{decisionCountdown}</span> : showDecisionUrgency ? <strong className="decision-urgent">{language === "zh" ? "紧急" : "Urgent"}</strong> : null}</div>}<p className="eyebrow"><i /> {language === "zh" ? "请选择回应" : "CHOOSE A RESPONSE"}</p><h1>{language === "zh" ? scenario.decision.titleZh : scenario.decision.titleEn}</h1><p>{language === "zh" ? scenario.decision.bodyZh : scenario.decision.bodyEn}</p><div>{scenario.choices.map((item) => <button key={item.id} onClick={(event) => choose(item, event.timeStamp)}><span>{item.id}</span><p><b>{language === "zh" ? `选项 ${item.id} · ${item.labelZh}` : `Choice ${item.id} · ${item.labelEn}`}</b>{language === "zh" ? item.detailZh : item.detailEn}</p><i>→</i></button>)}</div></section>}
      {stage === "timeout" && <section className="timeout-video-card glass-panel"><p className="eyebrow">VIDEO 04</p><span>04</span><h1>{timeoutVideo?.placeholder !== false ? (language === "zh" ? "视频 04 暂未制作" : "Video 04 is not ready yet") : (language === "zh" ? "超时结果" : "Timed-out outcome")}</h1>{timeoutVideo?.placeholder !== false && <p>{language === "zh" ? "视频完成后将在此处替换当前占位画面。" : "This placeholder will be replaced when Video 04 is complete."}</p>}<div><button onClick={replay}>{language === "zh" ? "重新体验" : "Try Again"}</button><button onClick={onExit}>{language === "zh" ? "退出" : "Exit"}</button></div></section>}
      {stage === "survey" && choice && <SurveyModal choice={choice} choiceRecord={scenario.choiceRecord} language={language} difficulty={difficulty} rationale={rationale} thirdMode={thirdMode} thirdOption={thirdOption} listening={listening} speechAvailable={Boolean(speechCtor)} submitting={submitting} onDifficulty={setDifficulty} onRationale={setRationale} onThirdMode={setThirdMode} onThirdOption={setThirdOption} onMic={toggleMic} onReplay={replay} onExit={onExit} onSubmit={submitSurvey} />}
      {stage === "outcome" && <div className="playback-status outcome-status"><span>{language === "zh" ? `结果 ${choice?.id} · 播放中` : `OUTCOME ${choice?.id} · PLAYING`}</span><div><i style={{ width: `${Math.min(playback / currentDuration, 1) * 100}%` }} /></div><small>{language === "zh" ? "影片结束后将打开选择记录" : "Choice Record opens after the film ends"}</small></div>}
    </main>
  );
}

function FirstOrder({ data, setData }: { data: ProjectData; setData: React.Dispatch<React.SetStateAction<ProjectData>> }) {
  const [error, setError] = useState("");

  function updateCard(id: string, patch: Partial<WishCard>) {
    setData((current) => ({ ...current, wishCards: current.wishCards.map((card) => card.id === id ? { ...card, ...patch } : card) }));
  }

  async function generateImage(card: WishCard) {
    setError(""); updateCard(card.id, { imageStatus: "queued" });
    try {
      const response = await fetch("/api/case-shop/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: card.summary, requester: card.requester, role: card.role }) });
      const payload = await response.json() as { requestId?: string; error?: string };
      if (!response.ok || !payload.requestId) throw new Error(payload.error || "Image generation failed.");
      updateCard(card.id, { imageStatus: "generating", imageTaskId: payload.requestId });
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 2500));
        const statusResponse = await fetch(`/api/case-shop/image?id=${encodeURIComponent(payload.requestId)}`);
        const status = await statusResponse.json() as { status?: string; imageUrl?: string; error?: string };
        if (status.status === "succeeded" && status.imageUrl) { updateCard(card.id, { imageStatus: "idle", imageUrl: status.imageUrl, imageTaskId: undefined }); return; }
        if (status.status === "failed" || !statusResponse.ok) throw new Error(status.error || "Image generation failed.");
      }
      throw new Error("Image generation is still running. Try again shortly.");
    } catch (caught) {
      updateCard(card.id, { imageStatus: "failed" });
      setError(caught instanceof Error ? caught.message : "Image generation failed.");
    }
  }

  return (
    <div className="page-content case-shop-page">
      <PageIntro eyebrow="CASE SHOP / FIRST ORDER" title="The wish archive" description="What families hope a domestic robot might notice, carry, teach, and care for." action={<div className="archive-counter"><span>{data.wishCards.length}</span> WISHES &amp; GROWING</div>} />
      {error && <p className="inline-error shop-error">{error}</p>}
      <section className="masonry-grid">
        {data.wishCards.map((card, index) => (
          <article className={`wish-card glass-panel wish-${index % 3}`} key={card.id}>
            <div className="wish-image"><img src={card.imageUrl} alt={`Robot helping ${card.requester} with ${card.summary.toLowerCase()}`} /><div className="wish-image-top"><span>{String(index + 1).padStart(2, "0")}</span><button onClick={() => void generateImage(card)} disabled={card.imageStatus === "queued" || card.imageStatus === "generating"}>{card.imageStatus === "queued" || card.imageStatus === "generating" ? "Generating…" : "↻ Generate image"}</button></div></div>
            <div className="wish-copy"><p className="eyebrow">{card.familyId} · {card.role}</p><h2>{card.summary}</h2><blockquote>“{card.quote}”</blockquote><footer><span>{card.requester}</span><time>{card.interviewDate}</time></footer></div>
          </article>
        ))}
      </section>
      <div className="archive-continuation"><i /><span>THE ARCHIVE CONTINUES</span><i /><small>New family requests extend this collection.</small></div>
    </div>
  );
}

function SecondOrder({ data, scenarios, onOpen }: {
  data: ProjectData;
  scenarios: ExperienceScenario[];
  onOpen: (id: string) => void;
}) {
  const archive = buildCaseArchive(data, scenarios);

  return (
    <div className="page-content second-order-page">
      <PageIntro eyebrow="CASE SHOP / SECOND ORDER" title="Conflict archive" description="Every current, draft, and placeholder dilemma in one archive. Open a scenario to review its choices, status, and available response evidence." action={<div className="archive-counter"><span>{archive.length}</span> CASES</div>} />
      <section className="conflict-archive-grid">
        {archive.map((item) => (
          <article className="conflict-archive-card glass-panel" key={item.id}>
            <button className="archive-card-open" onClick={() => onOpen(item.id)} aria-label={`Open ${item.title}`}>
              <div className="archive-card-image"><img src={item.thumbnail} alt="" /><span>SCENARIO {item.number} · {item.familyId}</span><i>{item.status === "published" ? "VIEW CASE →" : item.status === "draft" ? "DRAFT →" : "PLACEHOLDER →"}</i></div>
              <div className="archive-card-copy">
                <div className="tag-row value-tags">{item.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
                <h2>{item.title}</h2>
                <p>{item.brief}</p>
                <div className="archive-choices">{item.choices.slice(0, 3).map((choice) => <div key={choice.id}><span>{choice.id}</span><b>{choice.label}</b></div>)}</div>
              </div>
            </button>
          </article>
        ))}
      </section>
      <div className="archive-continuation"><i /><span>THE CONFLICT ARCHIVE CONTINUES</span><i /><small>New published scenarios will extend this collection.</small></div>
    </div>
  );
}

function ScenarioDetail({ data, scenarios, scenarioId, onBack, onPlay }: {
  data: ProjectData;
  scenarios: ExperienceScenario[];
  scenarioId: string;
  onBack: () => void;
  onPlay: (id: string) => void;
}) {
  const archive = buildCaseArchive(data, scenarios);
  const item = archive.find((entry) => entry.id === scenarioId) ?? archive[0];
  const isExperienceReady = item?.status === "published";
  const title = item?.title || "Scenario detail";
  const description = item?.brief || "";
  const tags = item?.tags || [];
  const thumbnail = item?.thumbnail || "/inattentive-assets/scenario-02.png";
  const choices = item?.choices || [];
  const scenarioResponses = data.responses.filter((response) => response.scenarioId === scenarioId);
  const total = scenarioResponses.length;
  const countA = scenarioResponses.filter((response) => response.choice === "A").length;
  const countB = scenarioResponses.filter((response) => response.choice === "B").length;
  const countC = scenarioResponses.filter((response) => response.choice === "C").length;
  const countOther = scenarioResponses.filter((response) => response.choice === "Other").length;
  const pct = (value: number) => total ? Math.round((value / total) * 100) : 0;
  const avgDifficulty = average(scenarioResponses.map((response) => response.difficulty));
  const avgTime = average(scenarioResponses.map((response) => response.decisionTimeMs));
  const alternatives = scenarioResponses.filter((response) => response.thirdOption && response.thirdOption !== "None");
  return (
    <div className="page-content second-order-page scenario-detail-page">
      <button className="back-link" onClick={onBack}>← Conflict archive</button>
      <PageIntro eyebrow={`CASE SHOP / SCENARIO ${item?.number || "DRAFT"}`} title={title} description="Response detail aggregated from the active project’s local study file." />
      <section className="scenario-dashboard glass-panel">
        <div className="scenario-visual"><img src={thumbnail} alt={`${title} scenario`} /><span>{item?.familyId || "F-001"}</span>{isExperienceReady && <button onClick={() => onPlay(item.id)}>▶ Launch experience</button>}</div>
        <div className="scenario-summary"><p className="eyebrow">SCENARIO BRIEF &amp; CHOICES</p><h2>{title}</h2><p>{description}</p><div className="tag-row value-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="choice-brief">{choices.slice(0, 3).map((choice) => <div key={choice.id}><span>{choice.id}</span><p><b>{choice.label}</b><small>{choice.detail}</small></p></div>)}</div></div>
        <div className="metric-stack"><article><small>RESPONSES</small><strong>{total}</strong></article><article><small>AVG. DIFFICULTY</small><strong>{avgDifficulty.toFixed(1)}<i>/5</i></strong></article><article><small>AVG. DECISION TIME</small><strong>{formatSeconds(avgTime)}</strong></article></div>
        <section className="distribution-panel"><div className="panel-heading"><div><small>CHOICE DISTRIBUTION</small><h3>What people chose</h3></div><span>{total} total</span></div>{[["A", countA, "#b7f1dc"], ["B", countB, "#b9dcff"], ["C", countC, "#e3c8ff"], ["OTHER", countOther, "#f5bdd0"]].map(([label, count, color]) => <div className="distribution-row" key={String(label)}><span>{label}</span><div><i style={{ width: `${pct(Number(count))}%`, background: String(color) }} /></div><b>{count} <small>{pct(Number(count))}%</small></b></div>)}</section>
        <section className="alternatives-panel"><div className="panel-heading"><div><small>ALTERNATIVE SOLUTIONS</small><h3>Other ways through</h3></div><span>{alternatives.length}</span></div>{alternatives.length ? alternatives.map((response) => <article key={response.id}><span className="avatar">{initials(response.memberRole)}</span><div><b>{response.thirdOption}</b><p>{response.rationale}</p><small>{response.memberName === response.memberRole ? response.memberRole : `${response.memberName} · ${response.memberRole}`} · difficulty {response.difficulty}/5</small></div></article>) : <p className="no-alternatives">No third options have been submitted yet.</p>}</section>
        <section className="choice-records-panel"><div className="panel-heading"><div><small>INDIVIDUAL CHOICE RECORDS</small><h3>Complete participant responses</h3></div><span>{scenarioResponses.length}</span></div>{scenarioResponses.length ? scenarioResponses.slice().reverse().map((response) => <article key={response.id}><header><span className="avatar">{initials(response.memberRole)}</span><p><b>{response.memberRole}</b><small>{new Date(response.createdAt).toLocaleString()}</small></p><em>{response.choice}</em></header><dl><div><dt>Choice</dt><dd>{response.choiceLabel}</dd></div><div><dt>Decision time</dt><dd>{formatSeconds(response.decisionTimeMs)}</dd></div><div><dt>Alternative</dt><dd>{response.thirdOption || "None"}</dd></div><div><dt>Difficulty</dt><dd>{response.difficulty}/5</dd></div><div><dt>Rationale</dt><dd>{response.rationale}</dd></div></dl></article>) : <p className="no-alternatives">No Choice Records have been submitted for this scenario.</p>}</section>
      </section>
    </div>
  );
}

export default function PlatformApp() {
  const [view, setView] = useState<View>("cover");
  const [language, setLanguage] = useState<InterfaceLanguage>("en");
  const [workspace, setWorkspace] = useState<ProjectWorkspace>(initialWorkspaceData);
  const [hydrated, setHydrated] = useState(false);
  const [familyId, setFamilyId] = useState("F-001");
  const [familyTab, setFamilyTab] = useState<FamilyTab>("background");
  const [entryFamilyId, setEntryFamilyId] = useState("");
  const [entryMemberId, setEntryMemberId] = useState("");
  const [scenarios, setScenarios] = useState<ExperienceScenario[]>([]);
  const [activeExperienceScenarioId, setActiveExperienceScenarioId] = useState("family01-scenario04");
  const [detailScenarioId, setDetailScenarioId] = useState("scenario-01");
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showCloudAccess, setShowCloudAccess] = useState(false);
  const [researcherEmail, setResearcherEmail] = useState("");
  const [queuedResponses, setQueuedResponses] = useState(0);
  const [cloudRefresh, setCloudRefresh] = useState(0);
  const workspaceRef = useRef(workspace);

  useInterfaceTranslation(language);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (window.localStorage.getItem("inattentive-robot.language") === "zh") setLanguage("zh");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function changeLanguage(next: InterfaceLanguage) {
    setLanguage(next);
    window.localStorage.setItem("inattentive-robot.language", next);
  }

  const data = workspace.projects.find((project) => project.id === workspace.activeProjectId) ?? workspace.projects[0];
  const setData: React.Dispatch<React.SetStateAction<ProjectData>> = (next) => {
    setWorkspace((current) => ({
      ...current,
      projects: current.projects.map((project) => {
        if (project.id !== current.activeProjectId) return project;
        return typeof next === "function" ? next(project) : next;
      }),
    }));
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const loaded = projectStorage.load();
      const pendingResponses: ExperienceResponse[] = [];
      const legacyPendingResponse = window.sessionStorage.getItem("inattentive-robot.vr-response");
      const queuedResponses = window.sessionStorage.getItem("inattentive-robot.vr-responses");
      try {
        if (legacyPendingResponse) pendingResponses.push(JSON.parse(legacyPendingResponse) as ExperienceResponse);
        if (queuedResponses) {
          const parsed = JSON.parse(queuedResponses) as ExperienceResponse[];
          if (Array.isArray(parsed)) pendingResponses.push(...parsed);
        }
        const activeProject = loaded.projects.find((project) => project.id === loaded.activeProjectId);
        for (const response of pendingResponses) {
          if (activeProject && !activeProject.responses.some((item) => item.id === response.id)) activeProject.responses.push(response);
        }
      } catch {
        // Ignore invalid one-time VR responses.
      }
      window.sessionStorage.removeItem("inattentive-robot.vr-response");
      window.sessionStorage.removeItem("inattentive-robot.vr-responses");
      setWorkspace(loaded);
      setHydrated(true);
    });
    const vrReturn = window.sessionStorage.getItem("inattentive-robot.vr-return");
    if (vrReturn) {
      try {
        const selection = JSON.parse(vrReturn) as { familyId?: string; memberId?: string };
        if (selection.familyId && selection.memberId) {
          setEntryFamilyId(selection.familyId);
          setEntryMemberId(selection.memberId);
          setView("experience-list");
        }
      } catch {
        // Ignore an invalid one-time return marker and continue to the cover.
      }
      window.sessionStorage.removeItem("inattentive-robot.vr-return");
    }
    Promise.all([
      fetch("/data/family01-scenario04.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family01-scenario02.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family01-scenario03.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family01-scenario05.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family01-scenario06.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family02-scenario04.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family02-scenario07.json?v=03").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family01-scenario-s4.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family02-scenario09.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family02-scenario08.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family02-scenario03.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/scenario-01.json").then((response) => response.json() as Promise<ExperienceScenario>),
      fetch("/data/family02-scenario02.json").then((response) => response.json() as Promise<ExperienceScenario>),
    ]).then(setScenarios).catch(() => undefined);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) projectStorage.save(workspace);
  }, [workspace, hydrated]);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    if (!hydrated || !cloudResponsesConfigured || !responseCloud) return;
    const cloud = responseCloud;
    const projectId = workspace.activeProjectId;
    let alive = true;
    let channel = subscribeToCloudResponses(projectId, (response) => {
      if (!alive) return;
      setWorkspace((current) => ({
        ...current,
        projects: current.projects.map((project) => project.id === projectId ? { ...project, responses: mergeResponses(project.responses, [response]) } : project),
      }));
    });

    async function pullCloud() {
      try {
        const session = await currentResearcherSession();
        if (!alive) return;
        setResearcherEmail(session?.user.email || "");
        const localProject = workspaceRef.current.projects.find((project) => project.id === projectId);
        if (localProject) {
          for (const response of localProject.responses.filter((item) => !item.id.startsWith("seed-"))) {
            await submitCloudResponse(projectId, response);
          }
        }
        setQueuedResponses(await flushQueuedResponses());
        if (!session) return;
        const cloudResponses = await fetchCloudResponses(projectId);
        if (!alive) return;
        setWorkspace((current) => ({
          ...current,
          projects: current.projects.map((project) => project.id === projectId ? { ...project, responses: mergeResponses(project.responses, cloudResponses) } : project),
        }));
      } catch {
        if (alive) setQueuedResponses(pendingResponseCount());
      }
    }

    void pullCloud();
    const timer = window.setInterval(() => void pullCloud(), 10_000);
    const { data: authListener } = cloud.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setResearcherEmail(session?.user.email || "");
      if (session) void pullCloud();
    });
    return () => {
      alive = false;
      window.clearInterval(timer);
      authListener.subscription.unsubscribe();
      if (channel) { void cloud.removeChannel(channel); channel = null; }
    };
  }, [cloudRefresh, hydrated, workspace.activeProjectId]);

  const family = data.families.find((item) => item.id === familyId) ?? data.families[0];
  const entryFamily = data.families.find((item) => item.id === entryFamilyId);
  const entryMember = entryFamily?.members.find((member) => member.id === entryMemberId);
  const activeExperienceScenario = scenarios.find((item) => item.id === activeExperienceScenarioId) ?? null;

  function addFamily() {
    const number = Math.max(0, ...data.families.map((item) => Number(item.id.match(/^F-(\d+)$/)?.[1] || 0))) + 1;
    const id = `F-${String(number).padStart(3, "0")}`;
    setData((current) => ({ ...current, families: [...current.families, { id, label: `Family ${String(number).padStart(2, "0")}`, location: "", photos: [], members: [], protocol: "", memos: "" }] }));
    setFamilyId(id); setFamilyTab("background"); setView("family");
  }

  function openFamily(id: string) { setFamilyId(id); setFamilyTab("background"); setView("family"); }
  function selectEntryFamily(id: string) { setEntryFamilyId(id); setEntryMemberId(""); }
  async function saveResponse(response: ExperienceResponse) {
    setData((current) => ({ ...current, responses: mergeResponses(current.responses, [response]) }));
    await submitCloudResponse(data.id, response);
    setQueuedResponses(pendingResponseCount());
  }

  function selectProject(id: string) {
    const project = workspace.projects.find((item) => item.id === id);
    if (!project) return;
    setWorkspace((current) => ({ ...current, activeProjectId: id }));
    setFamilyId(project.families[0]?.id || "F-001");
    setEntryFamilyId("");
    setEntryMemberId("");
    setDetailScenarioId("scenario-01");
    setActiveExperienceScenarioId("family01-scenario04");
  }

  function createProject(name: string) {
    const project = createBlankProject(name);
    setWorkspace((current) => ({ activeProjectId: project.id, projects: [...current.projects, project] }));
    setFamilyId("F-001");
    setEntryFamilyId("");
    setEntryMemberId("");
  }

  function renameProject(id: string, name: string) {
    setWorkspace((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === id ? { ...project, name: name.trim() || project.name } : project),
    }));
  }

  function launchExperience(scenarioId: string) {
    const targetScenario = scenarios.find((item) => item.id === scenarioId);
    const targetFamily = data.families.find((item) => item.id === targetScenario?.familyId) ?? data.families[0];
    const targetMember = targetFamily?.members[0];
    if (!targetFamily || !targetMember) {
      setEntryFamilyId("");
      setEntryMemberId("");
      setView("experience-entry");
      return;
    }
    setEntryFamilyId(targetFamily.id);
    setEntryMemberId(targetMember.id);
    setActiveExperienceScenarioId(targetScenario?.id || "scenario-01");
    setView("player");
  }

  function launchVrExperience(scenarioId: string) {
    setActiveExperienceScenarioId(scenarioId);
    window.sessionStorage.setItem("inattentive-robot.vr-return", JSON.stringify({ familyId: entryFamilyId, memberId: entryMemberId }));
    window.sessionStorage.setItem("inattentive-robot.vr-context", JSON.stringify({
      familyId: entryFamilyId,
      memberId: entryMemberId,
      memberName: entryMember?.name || entryMember?.role || "Participant",
      memberRole: entryMember?.role || "Participant",
    }));
    if (scenarioId === "scenario-01") window.location.assign("/VR180/index.html");
    else window.location.assign(`/VR180/index.html?scenario=${encodeURIComponent(scenarioId)}`);
  }

  function playNextWebsiteScenario() {
    if (!activeExperienceScenario || !entryFamily) {
      setView("experience-list");
      return;
    }
    const assigned = scenarios
      .filter((item) => item.familyId === entryFamily.id)
      .sort((first, second) => (first.experienceOrder ?? Number(first.number)) - (second.experienceOrder ?? Number(second.number)) || first.number.localeCompare(second.number));
    const currentIndex = assigned.findIndex((item) => item.id === activeExperienceScenario.id);
    const nextScenario = currentIndex >= 0 ? assigned[currentIndex + 1] : undefined;
    if (!nextScenario) {
      setView("experience-list");
      return;
    }
    setActiveExperienceScenarioId(nextScenario.id);
  }

  const port: "Researcher" | "Experience" | "Case Shop" = ["dashboard", "families", "family", "scenario-lab", "case-editor"].includes(view)
    ? "Researcher"
    : ["experience-entry", "experience-list", "player"].includes(view)
      ? "Experience"
      : "Case Shop";
  const cloudLabel = !cloudResponsesConfigured
    ? "Cloud setup needed"
    : queuedResponses
      ? `${queuedResponses} queued`
      : researcherEmail
        ? "● Cloud synced"
        : "Researcher sign in";

  if (view === "cover") return <><Cover projects={workspace.projects} activeProjectId={workspace.activeProjectId} onSelectProject={selectProject} onCreateProject={createProject} onRenameProject={renameProject} onEnter={setView} /><LanguageToggle language={language} onChange={changeLanguage} /></>;
  if (view === "player" && activeExperienceScenario && entryFamily && entryMember) return <><ScenarioPlayer key={activeExperienceScenario.id} scenario={activeExperienceScenario} family={entryFamily} member={entryMember} language={language} onSave={saveResponse} onExit={() => setView("experience-list")} onSubmitNext={playNextWebsiteScenario} /><LanguageToggle language={language} onChange={changeLanguage} /></>;

  return (
    <main className={`platform-shell port-${port.toLowerCase().replace(" ", "-")}`}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <AppHeader port={port} view={view} project={data} projects={workspace.projects} cloudLabel={cloudLabel} onProject={selectProject} onNavigate={setView} onHome={() => setView("cover")} onAiSettings={() => setShowAiSettings(true)} onCloudAccess={() => setShowCloudAccess(true)} />
      {view === "dashboard" && <Dashboard data={data} onNavigate={setView} />}
      {view === "families" && <FamiliesPage data={data} onOpen={openFamily} onAdd={addFamily} />}
      {view === "family" && family && <FamilyDetail family={family} tab={familyTab} data={data} scenarios={scenarios} setData={setData} onBack={() => setView("families")} onTab={setFamilyTab} onJumpLab={() => setView("scenario-lab")} />}
      {view === "scenario-lab" && <ScenarioLabWorkspace data={data} setData={setData} />}
      {view === "case-editor" && <CaseEditor />}
      {view === "experience-entry" && <ExperienceEntry data={data} familyId={entryFamilyId} memberId={entryMemberId} language={language} onFamily={selectEntryFamily} onMember={setEntryMemberId} onContinue={() => setView("experience-list")} />}
      {view === "experience-list" && entryFamily && entryMember ? <ExperienceList family={entryFamily} member={entryMember} scenarios={scenarios} language={language} onPlayWebsite={(scenarioId) => { setActiveExperienceScenarioId(scenarioId); setView("player"); }} onPlayVr={launchVrExperience} onChangeIdentity={() => setView("experience-entry")} /> : view === "experience-list" ? <ExperienceEntry data={data} familyId={entryFamilyId} memberId={entryMemberId} language={language} onFamily={selectEntryFamily} onMember={setEntryMemberId} onContinue={() => setView("experience-list")} /> : null}
      {view === "case-first" && <FirstOrder data={data} setData={setData} />}
      {view === "case-second" && <SecondOrder data={data} scenarios={scenarios} onOpen={(id) => { setDetailScenarioId(id); setView("case-detail"); }} />}
      {view === "case-detail" && <ScenarioDetail data={data} scenarios={scenarios} scenarioId={detailScenarioId} onBack={() => setView("case-second")} onPlay={launchExperience} />}
      <AiSettingsDialog open={showAiSettings} onClose={() => setShowAiSettings(false)} />
      <CloudAccessDialog open={showCloudAccess} email={researcherEmail} queued={queuedResponses} onClose={() => setShowCloudAccess(false)} onSignedIn={(email) => { setResearcherEmail(email); setCloudRefresh((value) => value + 1); }} onSignedOut={() => { setResearcherEmail(""); setCloudRefresh((value) => value + 1); }} />
      <LanguageToggle language={language} onChange={changeLanguage} />
    </main>
  );
}
