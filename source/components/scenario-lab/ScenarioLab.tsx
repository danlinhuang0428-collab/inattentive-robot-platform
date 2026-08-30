"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import {
  createBundle,
  createManualScenario,
  scenarioOne,
  SCENARIO_TAGS,
  validateManualScenario,
  VIDEO_LABELS,
  WORKFLOW_STAGES,
} from "../../lib/scenario-lab";
import type {
  FrameAsset,
  GeneralRevision,
  ProductionPackage,
  ProjectData,
  QaReview,
  ResearchScript,
  ScriptBeat,
  ScriptVersion,
  VideoBundle,
  VideoGenerationTask,
  VideoType,
  WorkflowStage,
} from "../../lib/types";
import type { ManualScenarioErrors } from "../../lib/scenario-lab";

const VIDEO_TYPES: VideoType[] = ["conflict", "choice_a", "choice_b"];
const outputFallback: Record<VideoType, string> = {
  conflict: "/videos/scenario-01-dilemma.mp4",
  choice_a: "/videos/scenario-01-choice-a.mp4",
  choice_b: "/videos/scenario-01-choice-b.mp4",
};

function latest<T>(items?: T[]) {
  return items?.[items.length - 1];
}

function stageIndex(stage: WorkflowStage) {
  return WORKFLOW_STAGES.findIndex((item) => item.id === stage);
}

function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function nowId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function assetToDataUrl(path: string) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load required reference asset: ${path}`);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not encode required reference asset: ${path}`));
    reader.readAsDataURL(blob);
  });
}

function statusIcon(status: string) {
  if (["accepted", "frames_approved", "succeeded", "approved"].includes(status)) return "✓";
  if (["failed", "rejected", "cancelled"].includes(status)) return "!";
  if (["video_generating", "frames_generating", "running"].includes(status)) return "↻";
  return "•";
}

function BranchTabs({ value, onChange }: { value: VideoType; onChange: (value: VideoType) => void }) {
  return <div className="lab-branch-tabs" role="tablist" aria-label="Video branch">{VIDEO_TYPES.map((item) => <button key={item} role="tab" aria-selected={value === item} className={value === item ? "active" : ""} onClick={() => onChange(item)}><span>{item === "conflict" ? "01" : item === "choice_a" ? "A" : "B"}</span>{VIDEO_LABELS[item]}</button>)}</div>;
}

function NewScenarioDialog({ data, onClose, onCreate }: { data: ProjectData; onClose: () => void; onCreate: (scenario: ReturnType<typeof createManualScenario>) => void }) {
  const [draft, setDraft] = useState({ title: "", description: "", choiceA: "", choiceB: "", tags: [] as string[], familyId: data.families[0]?.id ?? "" });
  const [tagDraft, setTagDraft] = useState("");
  const [errors, setErrors] = useState<ManualScenarioErrors>({});

  function addTag(value: string) {
    const tag = value.trim().replace(/,$/, "");
    if (tag && !draft.tags.includes(tag)) setDraft((current) => ({ ...current, tags: [...current.tags, tag] }));
    setTagDraft("");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateManualScenario(draft, data.families.map((family) => family.id));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onCreate(createManualScenario(draft));
  }

  return <div className="lab-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="lab-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="new-scenario-title" onSubmit={submit}>
      <header><div><p className="eyebrow">TEMPORARY MANUAL ENTRY</p><h2 id="new-scenario-title">New Scenario</h2><p>Create a research draft without calling AI, image, or video services.</p></div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
      <div className="lab-modal-grid">
        <label><span>Title</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} aria-invalid={Boolean(errors.title)} />{errors.title && <small className="field-error">{errors.title}</small>}</label>
        <label><span>Family ID</span><select value={draft.familyId} onChange={(event) => setDraft({ ...draft, familyId: event.target.value })} aria-invalid={Boolean(errors.familyId)}><option value="">Select a family…</option>{data.families.map((family) => <option key={family.id} value={family.id}>{family.id} · {family.label} · {family.location || "No location"}</option>)}</select>{errors.familyId && <small className="field-error">{errors.familyId}</small>}</label>
        <label className="wide"><span>Description</span><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Describe both competing requests and the robot's single-body constraint." aria-invalid={Boolean(errors.description)} />{errors.description && <small className="field-error">{errors.description}</small>}</label>
        <label><span>Choice A</span><input value={draft.choiceA} onChange={(event) => setDraft({ ...draft, choiceA: event.target.value })} aria-invalid={Boolean(errors.choiceA)} />{errors.choiceA && <small className="field-error">{errors.choiceA}</small>}</label>
        <label><span>Choice B</span><input value={draft.choiceB} onChange={(event) => setDraft({ ...draft, choiceB: event.target.value })} aria-invalid={Boolean(errors.choiceB)} />{errors.choiceB && <small className="field-error">{errors.choiceB}</small>}</label>
        <label className="wide"><span>Tags</span><div className={`chip-input ${errors.tags ? "invalid" : ""}`}>{draft.tags.map((tag) => <button type="button" key={tag} onClick={() => setDraft({ ...draft, tags: draft.tags.filter((item) => item !== tag) })}>{tag} ×</button>)}<input list="scenario-tag-options" value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(tagDraft); } }} onBlur={() => { if (tagDraft.trim()) addTag(tagDraft); }} placeholder="Type a tag, then press Enter" /></div><datalist id="scenario-tag-options">{SCENARIO_TAGS.map((tag) => <option key={tag} value={tag} />)}</datalist>{errors.tags && <small className="field-error">{errors.tags}</small>}</label>
      </div>
      <footer><button type="button" onClick={onClose}>Cancel</button><button className="primary" type="submit">Create Scenario</button></footer>
    </form>
  </div>;
}

function EditableBeat({ beat, onChange, onRemove }: { beat: ScriptBeat; onChange: (beat: ScriptBeat) => void; onRemove: () => void }) {
  const dialogue = beat.dialogue[0] ?? { speaker: "", line: "", delivery: "", looksAtRobot: true };
  const action = beat.actions[0] ?? { characterId: "", action: "", emotion: "" };
  return <article className="beat-card">
    <header><div><span>BEAT {String(beat.order).padStart(2, "0")}</span><input value={beat.timeRange} onChange={(event) => onChange({ ...beat, timeRange: event.target.value })} aria-label={`Beat ${beat.order} time range`} /></div><button onClick={onRemove} aria-label={`Remove beat ${beat.order}`}>Remove</button></header>
    <label><span>What happens</span><textarea value={beat.whatHappens} onChange={(event) => onChange({ ...beat, whatHappens: event.target.value })} /></label>
    <div className="lab-two-col"><label><span>Camera attention</span><input value={beat.cameraAttention} onChange={(event) => onChange({ ...beat, cameraAttention: event.target.value })} /></label><label><span>Action & emotion</span><input value={`${action.action} · ${action.emotion}`} onChange={(event) => onChange({ ...beat, actions: [{ ...action, action: event.target.value }] })} /></label></div>
    <div className="lab-dialogue-row"><label><span>Speaker</span><input value={dialogue.speaker} onChange={(event) => onChange({ ...beat, dialogue: [{ ...dialogue, speaker: event.target.value }] })} /></label><label><span>Dialogue</span><input value={dialogue.line} onChange={(event) => onChange({ ...beat, dialogue: [{ ...dialogue, line: event.target.value }] })} /></label><label><span>Delivery</span><input value={dialogue.delivery} onChange={(event) => onChange({ ...beat, dialogue: [{ ...dialogue, delivery: event.target.value }] })} /></label></div>
  </article>;
}

function BriefStage({ data, scenario, bundle, onScenario, onBundle, onGenerate, busy, error }: StageProps & { onGenerate: () => void; busy: boolean; error: string }) {
  const family = data.families.find((item) => item.id === scenario.familyId);
  return <div className="lab-stage-body">
    <div className="lab-stage-heading"><div><p className="eyebrow">INPUT & CONTEXT</p><h2>Confirm the dilemma before AI work begins.</h2><p>Edits here remain a draft until you request the three structured scripts.</p></div><span className="stage-number">01</span></div>
    <div className="brief-layout">
      <section className="lab-form-panel">
        <div className="lab-form-grid">
          <label><span>Title</span><input value={scenario.title} onChange={(event) => onScenario({ ...scenario, title: event.target.value, updatedAt: new Date().toISOString() })} /></label>
          <label><span>Family</span><select value={scenario.familyId} onChange={(event) => onScenario({ ...scenario, familyId: event.target.value, updatedAt: new Date().toISOString() })}>{data.families.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.label}</option>)}</select></label>
          <label className="wide"><span>Short description</span><textarea value={scenario.description} onChange={(event) => onScenario({ ...scenario, description: event.target.value, updatedAt: new Date().toISOString() })} /></label>
          <label><span>Choice A</span><input value={scenario.choiceA} onChange={(event) => onScenario({ ...scenario, choiceA: event.target.value, updatedAt: new Date().toISOString() })} /></label>
          <label><span>Choice B</span><input value={scenario.choiceB} onChange={(event) => onScenario({ ...scenario, choiceB: event.target.value, updatedAt: new Date().toISOString() })} /></label>
          <label className="wide"><span>Research tags</span><div className="brief-tags">{scenario.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></label>
          <label><span>Location / household context</span><input value={family?.location || ""} readOnly /></label>
          <label><span>Production defaults</span><input value="English · 15 sec · 16:9 · 2K master" readOnly /></label>
          <label className="wide"><span>Appearance profile</span><textarea value={bundle.visualBible.appearanceProfile} onChange={(event) => onBundle({ ...bundle, visualBible: { ...bundle.visualBible, appearanceProfile: event.target.value } })} /></label>
        </div>
      </section>
      <aside className="visual-bible-card">
        <div className="robot-reference"><img src="/inattentive-assets/scenario-02.png" alt="Mandatory reference showing two silver-white robot hands in the lower corners" /><span>MANDATORY ROBOT-HANDS REFERENCE</span></div>
        <h3>Continuity locks</h3><p>Only the two hands and forearms are copied from this image. Its people, hallway, rain, and story are excluded.</p>
        <div className="lock-list">{bundle.visualBible.locks.map((lock) => <label key={lock.id}><input type="checkbox" aria-label={`Lock ${lock.label}`} checked={lock.locked} onChange={(event) => onBundle({ ...bundle, visualBible: { ...bundle.visualBible, locks: bundle.visualBible.locks.map((item) => item.id === lock.id ? { ...item, locked: event.target.checked } : item) } })} /><span><b>{lock.label}</b><small>{lock.value}</small></span></label>)}</div>
      </aside>
    </div>
    {error && <p className="lab-inline-error">{error}</p>}
    <div className="lab-actionbar"><span><i />No AI call occurs until you choose Generate.</span><button className="lab-primary" onClick={onGenerate} disabled={busy || !scenario.title.trim() || !scenario.description.trim() || !scenario.choiceA.trim() || !scenario.choiceB.trim()}>{busy ? "Generating structured scripts…" : "Generate three scripts →"}</button></div>
  </div>;
}

type StageProps = {
  data: ProjectData;
  scenario: ProjectData["labScenarios"][number];
  bundle: VideoBundle;
  onScenario: (scenario: ProjectData["labScenarios"][number]) => void;
  onBundle: (bundle: VideoBundle) => void;
};

function ScriptsStage({ bundle, branch, onBranch, onBundle, onRegenerate, onApprove, busy, error }: { bundle: VideoBundle; branch: VideoType; onBranch: (branch: VideoType) => void; onBundle: (bundle: VideoBundle) => void; onRegenerate: (script: ResearchScript) => void; onApprove: () => void; busy: boolean; error: string }) {
  const version = latest(bundle.scripts[branch]);
  const script = version?.script;
  if (!script) return <EmptyStage title="Scripts have not been generated" text="Return to Scenario Brief and generate a structured three-script set." />;
  function updateScript(next: ResearchScript) {
    const versions = bundle.scripts[branch] ?? [];
    onBundle({ ...bundle, status: "script_ready", scripts: { ...bundle.scripts, [branch]: versions.map((item, index) => index === versions.length - 1 ? { ...item, script: next, status: "draft", updatedAt: new Date().toISOString(), createdBy: "researcher" } : item) }, productionPackages: {}, frames: [], videoTasks: [], qaReviews: [] });
  }
  const dialogueWords = script.beats.flatMap((item) => item.dialogue).reduce((sum, line) => sum + words(line.line), 0);
  const wps = dialogueWords / Math.max(1, script.estimatedDurationSeconds - 2);
  return <div className="lab-stage-body"><div className="lab-stage-heading"><div><p className="eyebrow">RESEARCHER-EDITABLE</p><h2>Shape the three scripts before production.</h2><p>These are readable research scripts—not generation prompts.</p></div><span className="stage-number">02</span></div><BranchTabs value={branch} onChange={onBranch} />
    <div className="script-metrics"><span>Script v{version.version}</span><span>{script.estimatedDurationSeconds}s target</span><span>{dialogueWords} dialogue words</span><span className={wps > 3.2 ? "warning" : ""}>{wps.toFixed(2)} words/sec {wps > 3.2 ? "· shorten" : "· within guide"}</span></div>
    <section className="structured-script">
      <div className="lab-form-grid"><label><span>Title</span><input value={script.title} onChange={(event) => updateScript({ ...script, title: event.target.value })} /></label><label><span>Purpose</span><input value={script.purpose} onChange={(event) => updateScript({ ...script, purpose: event.target.value })} /></label><label className="wide"><span>Space & layout</span><textarea value={script.space.layout} onChange={(event) => updateScript({ ...script, space: { ...script.space, layout: event.target.value } })} /></label></div>
      <div className="beat-stack">{script.beats.map((beat) => <EditableBeat key={beat.id} beat={beat} onChange={(next) => updateScript({ ...script, beats: script.beats.map((item) => item.id === next.id ? next : item) })} onRemove={() => updateScript({ ...script, beats: script.beats.filter((item) => item.id !== beat.id).map((item, itemIndex) => ({ ...item, order: itemIndex + 1 })) })} />)}<button className="add-beat" onClick={() => updateScript({ ...script, beats: [...script.beats, { id: nowId("beat"), order: script.beats.length + 1, timeRange: "", whatHappens: "", cameraAttention: "", actions: [], dialogue: [], ambientSound: [] }] })}>＋ Add beat</button></div>
      <div className="lab-form-grid"><label className="wide"><span>Ending state</span><textarea value={script.endingState} onChange={(event) => updateScript({ ...script, endingState: event.target.value })} /></label><label className="wide"><span>Research meaning</span><textarea value={script.researchMeaning} onChange={(event) => updateScript({ ...script, researchMeaning: event.target.value })} /></label></div>
    </section>
    {error && <p className="lab-inline-error">{error}</p>}
    <div className="lab-actionbar"><button onClick={() => onRegenerate(script)} disabled={busy}>{busy ? "Regenerating…" : "↻ Regenerate this script"}</button><button className="lab-primary" onClick={onApprove}>Approve all scripts →</button></div>
  </div>;
}

function ProductionStage({ bundle, branch, onBranch, onCompile, onBundle, onApprove, busy, error }: { bundle: VideoBundle; branch: VideoType; onBranch: (branch: VideoType) => void; onCompile: () => void; onBundle: (bundle: VideoBundle) => void; onApprove: () => void; busy: boolean; error: string }) {
  const packageVersion = latest(bundle.productionPackages[branch]);
  const [promptDraft, setPromptDraft] = useState(() => packageVersion?.clips[0]?.promptVersions.at(-1)?.prompt ?? "");
  if (!packageVersion) return <div className="lab-stage-body"><div className="lab-stage-heading"><div><p className="eyebrow">COMPILER GATE</p><h2>Compile scripts into production contracts.</h2><p>The compiler protects P0/P1 meaning, separates camera movement from critical action, and checks dialogue budgets.</p></div><span className="stage-number">03</span></div>{error && <p className="lab-inline-error">{error}</p>}<div className="empty-production"><span>⌁</span><h3>No production package yet</h3><p>OpenRouter will direct three MiniMax H3-ready production contracts from the approved scripts.</p><button className="lab-primary" onClick={onCompile} disabled={busy}>{busy ? "Compiling with AI…" : "Compile production plan"}</button></div></div>;
  const activePackage = packageVersion;
  const prompt = activePackage.clips[0].promptVersions.at(-1);
  function savePromptVersion() {
    if (!prompt || promptDraft === prompt.prompt) return;
    const updated: ProductionPackage = { ...activePackage, version: activePackage.version + 1, parentVersionId: activePackage.id, id: nowId(`package-${branch}`), clips: activePackage.clips.map((clip, index) => index === 0 ? { ...clip, promptVersions: [...clip.promptVersions.map((item) => ({ ...item, immutable: true })), { id: nowId(`prompt-${branch}`), version: prompt.version + 1, parentVersionId: prompt.id, prompt: promptDraft, createdAt: new Date().toISOString(), lastEditedBy: "researcher", immutable: false }] } : clip) };
    onBundle({ ...bundle, productionPackages: { ...bundle.productionPackages, [branch]: [...(bundle.productionPackages[branch] ?? []), updated] }, frames: [], status: "plan_ready" });
  }
  return <div className="lab-stage-body"><div className="lab-stage-heading"><div><p className="eyebrow">PRODUCTION CONTRACT</p><h2>Review the plan before creating anchors.</h2><p>Final output remains three videos; clips are internal production units only.</p></div><span className="stage-number">03</span></div><BranchTabs value={branch} onChange={onBranch} />
    <div className="package-summary"><div><span>PACKAGE</span><b>v{packageVersion.version}</b></div><div><span>FINAL DURATION</span><b>{packageVersion.finalDurationSeconds}s</b></div><div><span>PRODUCTION CLIPS</span><b>{packageVersion.clips.length}</b></div><div><span>BLOCKING ISSUES</span><b>{packageVersion.blockingIssues.length}</b></div></div>
    <section className="requirements-panel"><header><div><span>SINGLE RESEARCH TURN</span><h3>{packageVersion.singleResearchTurn}</h3></div><span className="mode-badge">{packageVersion.clips[0].mode}</span></header><div className="requirement-list">{packageVersion.requirements.map((item) => <div key={item.id}><span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span><p><b>{item.requirement}</b><small>{item.promptCarrier} · QA {item.qaTarget}</small></p><em>{item.failurePolicy.replaceAll("_", " ")}</em></div>)}</div></section>
    {packageVersion.clips.map((clip) => <article className="clip-card" key={clip.clipId}><header><div><span>{clip.clipId}</span><h3>{clip.purpose}</h3></div><b>{clip.timelineRange}</b></header><div className="clip-grid"><div><span>MODE</span><b>{clip.mode}</b><small>{clip.modeReason}</small></div><div><span>ATTENTION OWNER</span><b>{clip.attentionOwner}</b><small>{clip.offscreenCarrier}</small></div><div><span>CAMERA PATH</span><b>{clip.cameraPath}</b></div></div><div className="dialogue-budget">{clip.dialogueBudget.map((line, index) => <div key={`${line.speaker}-${index}`}><span>{line.speaker}</span><p>“{line.line}”</p><b className={line.wordsPerSecond > 3.2 ? "warning" : ""}>{line.wordsPerSecond} w/s</b></div>)}</div><details className="prompt-panel"><summary>View full prompt <span>v{prompt?.version} · {prompt?.lastEditedBy}</span></summary><textarea value={promptDraft} onChange={(event) => setPromptDraft(event.target.value)} /><footer><span>Editing creates a new version; submitted prompts remain immutable.</span><button onClick={savePromptVersion} disabled={promptDraft === prompt?.prompt}>Save as new prompt version</button></footer></details></article>)}
    <div className="warning-list">{packageVersion.warnings.map((warning) => <p key={warning}>△ {warning}</p>)}</div>
    {error && <p className="lab-inline-error">{error}</p>}
    <div className="lab-actionbar"><button onClick={onCompile} disabled={busy}>{busy ? "Recompiling…" : "↻ Recompile this video set"}</button><button className="lab-primary" onClick={onApprove} disabled={Boolean(packageVersion.blockingIssues.length)}>Approve production plan →</button></div>
  </div>;
}

function FrameCard({ frame, versions, onFrame, onRevise }: { frame: FrameAsset; versions: FrameAsset[]; onFrame: (frame: FrameAsset) => void; onRevise: (frame: FrameAsset) => void }) {
  return <article className={`frame-card ${frame.status}`}><header><div><span>{VIDEO_LABELS[frame.videoType]}</span><b>{frame.clipId}</b></div><em>{frame.frameRole.toUpperCase()} · v{frame.version}</em></header><button className="frame-preview" onClick={() => window.open(frame.assetUrl, "_blank", "noopener,noreferrer")}><img src={frame.assetUrl} alt={`${VIDEO_LABELS[frame.videoType]} ${frame.frameRole} frame`} /><span>Open full frame ↗</span></button><div className="frame-meta"><span><i>{statusIcon(frame.status)}</i>{frame.status}</span><span>1920 × 1080</span><span>{versions.length} version{versions.length === 1 ? "" : "s"}</span></div><details><summary>Frame prompt & provenance</summary><p>{frame.prompt}</p><code>{frame.robotReference.assetPath} · {frame.robotReference.scope}</code></details><label><span>Focused comment</span><textarea value={frame.comment} onChange={(event) => onFrame({ ...frame, comment: event.target.value })} placeholder="Change only this frame layer…" /></label><footer><button onClick={() => onFrame({ ...frame, status: "rejected" })}>Reject</button><button onClick={() => onRevise(frame)} disabled={!frame.comment.trim()}>Regenerate this frame</button><button className="approve" onClick={() => onFrame({ ...frame, status: "approved", anchorGate: { silentStoryPass: true, thumbnailPass: true, intensityPass: true, shotScalePass: true, contradictionPass: true, persistencePass: true, transitionPass: true, robotHandsPass: true, reviewedAt: new Date().toISOString() } })}>Approve</button></footer></article>;
}

function FramesStage({ bundle, onBundle, onGenerate, onRevise, onGeneralRevision, busy, error }: { bundle: VideoBundle; onBundle: (bundle: VideoBundle) => void; onGenerate: () => void; onRevise: (frame: FrameAsset) => void; onGeneralRevision: (comment: string) => void; busy: boolean; error: string }) {
  const [generalComment, setGeneralComment] = useState("");
  const groups = useMemo(() => bundle.frames.reduce<Record<string, FrameAsset[]>>((result, frame) => { const key = `${frame.clipId}:${frame.frameRole}`; result[key] = [...(result[key] ?? []), frame]; return result; }, {}), [bundle.frames]);
  const latestFrames = Object.values(groups).map((items) => items.toSorted((a, b) => a.version - b.version).at(-1) as FrameAsset);
  function updateFrame(next: FrameAsset) { onBundle({ ...bundle, frames: bundle.frames.map((item) => item.frameId === next.frameId ? next : item), status: "frames_review" }); }
  const allApproved = latestFrames.length > 0 && latestFrames.every((frame) => frame.status === "approved" && Object.entries(frame.anchorGate).filter(([key]) => key !== "reviewedAt").every(([, value]) => value === true));
  return <div className="lab-stage-body"><div className="lab-stage-heading"><div><p className="eyebrow">ANCHOR GATE</p><h2>Inspect every actual first and last frame.</h2><p>Paid generation stays locked until all current frame versions pass the eight-part gate and receive researcher approval.</p></div><span className="stage-number">04</span></div>
    {!latestFrames.length ? <div className="empty-production"><span>▧</span><h3>No keyframes generated</h3><p>Nano Banana 2 will generate six actual 2K review anchors using the mandatory robot-hands image reference.</p><button className="lab-primary" onClick={onGenerate} disabled={busy}>{busy ? "Generating six AI anchors…" : "Generate review keyframes"}</button></div> : <>
      <div className="anchor-gate-banner"><div><span>ANCHOR GATE</span><b>{latestFrames.filter((frame) => frame.status === "approved").length} / {latestFrames.length} approved</b></div><ul><li>Silent story</li><li>25% thumbnail</li><li>P0 intensity</li><li>Shot scale</li><li>Contradiction</li><li>Persistence</li><li>Transition</li><li>Robot hands</li></ul></div>
      <div className="reference-compare"><img src="/inattentive-assets/scenario-02.png" alt="Robot hand reference comparison" /><div><span>REFERENCE COMPARISON</span><h3>Two silver-white articulated hands</h3><p>Compare lower-left and lower-right placement, five segmented fingers, black palm/joint mechanisms, thick wrists, forearm scale, and first-person perspective. Ignore every person and environmental detail in the reference.</p></div></div>
      <div className="frames-grid">{latestFrames.map((frame) => <FrameCard key={frame.frameId} frame={frame} versions={groups[`${frame.clipId}:${frame.frameRole}`]} onFrame={updateFrame} onRevise={onRevise} />)}</div>
      <section className="general-revision"><div><span>BUNDLE-LEVEL CONTROL</span><h3>General revision</h3><p>Use this only for shared identity, wardrobe, room geometry, robot-hands, axis, or production-language problems. It creates a new bundle version and never submits video tasks.</p></div><textarea value={generalComment} onChange={(event) => setGeneralComment(event.target.value)} placeholder="Describe a problem shared across multiple frames or branches…" /><div className="revision-impact"><span>Expected impact</span><b>New bundle v{bundle.version + 1}</b><b>Recompile 3 packages</b><b>Regenerate 6 anchors</b><b>0 video tasks</b></div><button onClick={() => { onGeneralRevision(generalComment); setGeneralComment(""); }} disabled={!generalComment.trim() || busy}>{busy ? "Creating revised bundle…" : "Apply general revision"}</button></section>
      {latestFrames.some((frame) => frame.status === "rejected") && <div className="lab-actionbar"><span>Revised prompts are ready. Previous anchors remain in version history.</span><button className="lab-primary" onClick={onGenerate} disabled={busy}>{busy ? "Generating revised anchors…" : "Generate revised anchor set"}</button></div>}
    </>}
    {error && <p className="lab-inline-error">{error}</p>}
    {latestFrames.length > 0 && <div className="lab-actionbar"><span>{allApproved ? "✓ All current raster anchors passed researcher review." : "Generation locked: approve every current first/last frame."}</span><button className="lab-primary" disabled={!allApproved} onClick={() => onBundle({ ...bundle, currentStage: "generation", status: "frames_approved" })}>Approve all frames →</button></div>}
  </div>;
}

function GenerationStage({ bundle, onBundle, onSubmit, onQuery, busy, error }: { bundle: VideoBundle; onBundle: (bundle: VideoBundle) => void; onSubmit: () => void; onQuery: (task: VideoGenerationTask) => void; busy: boolean; error: string }) {
  const [confirming, setConfirming] = useState(false);
  const packages = VIDEO_TYPES.map((type) => latest(bundle.productionPackages[type])).filter(Boolean) as ProductionPackage[];
  const taskCount = packages.reduce((sum, item) => sum + item.clips.length, 0);
  const complete = bundle.videoTasks.length === taskCount && bundle.videoTasks.every((task) => task.status === "succeeded");
  return <div className="lab-stage-body"><div className="lab-stage-heading"><div><p className="eyebrow">TASK SAFETY</p><h2>Submit once. Poll the same task IDs.</h2><p>Each confirmed clip creates one paid fal.ai MiniMax H3 task; polling never recreates it.</p></div><span className="stage-number">05</span></div>
    <div className="provider-banner"><div><i /> <span><b>fal.ai production provider</b><small>minimax/h3/image-to-video · native audio · 2K</small></span></div><em>LIVE API</em></div>
    {!bundle.videoTasks.length ? <div className="generation-overview">{packages.map((item) => <article key={item.id}><header><span>{VIDEO_LABELS[item.videoType]}</span><b>{item.clips.length} clip</b></header>{item.clips.map((clip) => <div key={clip.clipId}><span>{clip.mode}</span><p>{clip.clipId}</p><b>{clip.durationSeconds}s · 2K · 1 candidate</b></div>)}</article>)}<button className="lab-primary paid-button" onClick={() => setConfirming(true)}>Review {taskCount} generation tasks →</button></div> : <div className="task-stack">{VIDEO_TYPES.map((type) => <article key={type}><header><div><span>{VIDEO_LABELS[type]}</span><b>{bundle.videoTasks.filter((task) => task.videoType === type).length} source clip</b></div><em>{bundle.videoTasks.filter((task) => task.videoType === type).every((task) => task.status === "succeeded") ? "Ready for QA" : "In progress"}</em></header>{bundle.videoTasks.filter((task) => task.videoType === type).map((task) => <div className="task-row" key={task.taskId}><i>{statusIcon(task.status)}</i><p><b>{task.clipId}</b><small>{task.taskId} · {task.mode} · {task.provider}</small></p><span className={`task-status ${task.status}`}>{task.status}</span>{task.status !== "succeeded" && <button onClick={() => onQuery(task)} disabled={busy}>Query same task</button>}</div>)}</article>)}</div>}
    {error && <p className="lab-inline-error">{error}</p>}
    {complete && <div className="lab-actionbar"><span>✓ All source clips succeeded; no task was recreated during polling.</span><button className="lab-primary" onClick={() => onBundle({ ...bundle, currentStage: "qa", status: "video_review" })}>Open QA & Export →</button></div>}
    {confirming && <div className="lab-modal-backdrop"><div className="confirm-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><p className="eyebrow">FINAL SUBMISSION CHECK</p><h2 id="confirm-title">Confirm the immutable paid task snapshot</h2><div className="confirm-grid"><span>Provider<b>fal.ai</b></span><span>Model<b>MiniMax H3</b></span><span>Final videos<b>3</b></span><span>Internal clips<b>{taskCount}</b></span><span>Candidate count<b>1 per clip</b></span><span>Paid tasks<b>{taskCount}</b></span><span>Resolution<b>2K master</b></span><span>Bundle version<b>v{bundle.version}</b></span></div><p>This creates {taskCount} paid generations. A stable idempotency key prevents a second click from silently creating the same clip tasks again.</p><footer><button onClick={() => setConfirming(false)}>Cancel</button><button className="lab-primary" onClick={() => { setConfirming(false); onSubmit(); }}>Confirm and submit {taskCount} paid H3 tasks</button></footer></div></div>}
  </div>;
}

function QaStage({ scenario, bundle, onBundle, onRunQa, busy, error }: { scenario: ProjectData["labScenarios"][number]; bundle: VideoBundle; onBundle: (bundle: VideoBundle) => void; onRunQa: () => void; busy: boolean; error: string }) {
  const allAccepted = VIDEO_TYPES.every((type) => bundle.qaReviews.find((item) => item.videoType === type)?.finalVerdict === "accept");
  const [timestamp, setTimestamp] = useState("5.5");
  function updateReview(type: VideoType, patch: Partial<QaReview>) {
    onBundle({ ...bundle, qaReviews: bundle.qaReviews.map((item) => item.videoType === type ? { ...item, ...patch } : item) });
  }
  async function acceptBundle() {
    const response = await fetch(`/api/scenario-lab/bundles/${bundle.id}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviews: bundle.qaReviews }) });
    if (response.ok) onBundle({ ...bundle, status: "accepted", acceptedAt: new Date().toISOString() });
  }
  async function publishBundle() {
    const response = await fetch(`/api/scenario-lab/bundles/${bundle.id}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: bundle.status, explicit: true }) });
    if (response.ok) onBundle({ ...bundle, publishedAt: new Date().toISOString() });
  }
  function exportManifest() {
    const manifest = { scenario, bundle, exportedAt: new Date().toISOString(), captions: "Website VTT only; no text is burned into video" };
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `scenario-${scenario.id}-bundle-v${bundle.version}-manifest.json`; anchor.click(); URL.revokeObjectURL(url);
  }
  return <div className="lab-stage-body"><div className="lab-stage-heading"><div><p className="eyebrow">TIMELINE & TECHNICAL QA</p><h2>Accept evidence, not filenames.</h2><p>Review the full picture and audio. P0/P1 failures cannot be overridden as accepted.</p></div><span className="stage-number">06</span></div>
    {!bundle.qaReviews.length ? <div className="empty-production"><span>◎</span><h3>QA records are not created yet</h3><p>Run AI video-understanding and contract checks, then complete researcher timeline and audio review for each final video.</p><button className="lab-primary" onClick={onRunQa} disabled={busy}>{busy ? "Running checks…" : "Run technical & contract checks"}</button></div> : <div className="qa-grid">{VIDEO_TYPES.map((type) => { const review = bundle.qaReviews.find((item) => item.videoType === type) as QaReview; const task = bundle.videoTasks.find((item) => item.videoType === type); const captions = type === "conflict" ? "/data/scenario-01-dilemma.vtt" : type === "choice_a" ? "/data/scenario-01-choice-a.vtt" : "/data/scenario-01-choice-b.vtt"; return <article className="qa-card" key={type}><header><div><span>{VIDEO_LABELS[type]}</span><b>{review.technicalPass ? "Technical pass" : "Technical fail"}</b></div><em className={review.finalVerdict}>{review.finalVerdict.replaceAll("_", " ")}</em></header><video src={task?.outputUrl || outputFallback[type]} controls preload="metadata"><track kind="captions" src={captions} srcLang="en" label="English" default /></video><div className="technical-strip"><span>≈15s</span><span>1920×1080</span><span>H.264</span><span>AAC stereo</span><span>Decodable</span></div><div className="qa-checks">{review.checks.map((check) => <div key={check.id}><span className={`priority ${check.priority.toLowerCase()}`}>{check.priority}</span><p><b>{check.observation}</b><small>@ {check.timestamp.toFixed(1)}s · {check.requirementId}</small></p><em>{check.status.replaceAll("_", " ")}</em></div>)}</div><label><span>Timestamped researcher comment</span><div><input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} aria-label="Comment timestamp" /><textarea value={review.comment} onChange={(event) => updateReview(type, { comment: event.target.value })} placeholder="Describe camera, performance, dialogue, audio, robot-hands, or integration evidence…" /></div></label><footer><button onClick={() => updateReview(type, { finalVerdict: "reject", checks: review.checks.map((check, index) => index === 0 ? { ...check, status: "fail", timestamp: Number(timestamp) || 0, observation: review.comment || "Researcher rejected this clip at the selected timestamp." } : check) })}>Reject & create revision evidence</button><button className="approve" onClick={() => updateReview(type, { finalVerdict: "accept", checks: review.checks.map((check) => ({ ...check, status: "pass" })) })}>Accept video</button></footer></article>; })}</div>}
    {error && <p className="lab-inline-error">{error}</p>}
    {bundle.qaReviews.length > 0 && <div className="export-panel"><div><span>EXPORT / PUBLISH</span><h3>Three-video bundle v{bundle.version}</h3><p>Acceptance and Experience Port publishing remain separate explicit actions. Old accepted versions are preserved in bundle history.</p></div><button onClick={exportManifest}>Download production manifest</button>{bundle.status !== "accepted" ? <button className="lab-primary" onClick={() => void acceptBundle()} disabled={!allAccepted}>Accept three-video bundle</button> : <button className="lab-primary" onClick={() => void publishBundle()} disabled={Boolean(bundle.publishedAt)}>{bundle.publishedAt ? "Published to Experience Port ✓" : "Publish accepted bundle to Experience Port"}</button>}</div>}
  </div>;
}

function EmptyStage({ title, text }: { title: string; text: string }) { return <div className="empty-production"><span>○</span><h3>{title}</h3><p>{text}</p></div>; }

export default function ScenarioLab({ data, setData }: { data: ProjectData; setData: React.Dispatch<React.SetStateAction<ProjectData>> }) {
  const [scenarioId, setScenarioId] = useState(data.labScenarios[0]?.id ?? "");
  const [showNew, setShowNew] = useState(false);
  const [branch, setBranch] = useState<VideoType>("conflict");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scenario = data.labScenarios.find((item) => item.id === scenarioId) ?? data.labScenarios[0] ?? scenarioOne();
  const storedBundle = data.scenarioLabBundles.find((item) => item.scenarioId === scenario.id);
  const bundle = useMemo(() => storedBundle ?? createBundle(scenario, data.families.find((item) => item.id === scenario.familyId)), [scenario, storedBundle, data.families]);

  useEffect(() => {
    if (storedBundle) return;
    setData((current) => ({ ...current, scenarioLabBundles: [...current.scenarioLabBundles, createBundle(scenario, current.families.find((item) => item.id === scenario.familyId))] }));
  }, [scenario, storedBundle, setData]);

  function persistBundle(next: VideoBundle) {
    const saved = { ...next, saveState: "saved" as const, updatedAt: new Date().toISOString() };
    setData((current) => ({ ...current, scenarioLabBundles: current.scenarioLabBundles.some((item) => item.id === saved.id) ? current.scenarioLabBundles.map((item) => item.id === saved.id ? saved : item) : [...current.scenarioLabBundles, saved] }));
  }

  function persistScenario(next: typeof scenario) { setData((current) => ({ ...current, labScenarios: current.labScenarios.map((item) => item.id === next.id ? next : item) })); }

  async function run<T>(work: () => Promise<T>) { setBusy(true); setError(""); try { return await work(); } catch (caught) { setError(caught instanceof Error ? caught.message : "The workflow step failed. Review the brief and try again."); return undefined; } finally { setBusy(false); } }

  async function generateAllScripts(currentScript?: ResearchScript) {
    await run(async () => {
      const family = data.families.find((item) => item.id === scenario.familyId);
      const response = await fetch("/api/scenario-lab/scripts/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario, familyContext: family, currentScript }) });
      const payload = await response.json() as { scripts?: Record<VideoType, ResearchScript>; error?: string };
      if (!response.ok || !payload.scripts) throw new Error(payload.error || "The script provider did not return a valid structured set.");
      const stamp = new Date().toISOString();
      const nextScripts = { ...bundle.scripts };
      VIDEO_TYPES.forEach((type) => {
        if (currentScript && type !== currentScript.videoType) return;
        const parent = latest(nextScripts[type]);
        const version: ScriptVersion = { id: nowId(`script-${type}`), version: (parent?.version ?? 0) + 1, parentVersionId: parent?.id ?? null, script: payload.scripts?.[type] as ResearchScript, status: "draft", createdAt: stamp, updatedAt: stamp, createdBy: "ai" };
        nextScripts[type] = [...(nextScripts[type] ?? []), version];
      });
      persistBundle({ ...bundle, scripts: nextScripts, currentStage: "scripts", status: "script_ready", productionPackages: currentScript ? bundle.productionPackages : {}, frames: currentScript ? bundle.frames : [], videoTasks: [], qaReviews: [] });
    });
  }

  function approveScripts() {
    const approved = { ...bundle.scripts };
    VIDEO_TYPES.forEach((type) => { approved[type] = (approved[type] ?? []).map((item, index, items) => index === items.length - 1 ? { ...item, status: "approved" } : item); });
    persistBundle({ ...bundle, scripts: approved, currentStage: "production", status: "script_approved" });
  }

  async function compile() {
    await run(async () => {
      const scripts = Object.fromEntries(VIDEO_TYPES.map((type) => [type, latest(bundle.scripts[type])?.script]));
      const response = await fetch("/api/scenario-lab/production/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          approvedScripts: scripts,
          globalContinuity: bundle.visualBible,
          providerCapabilities: {
            provider: "fal.ai",
            model: "minimax/h3/image-to-video",
            durationSeconds: 15,
            modes: ["FLF2V"],
            nativeSynchronizedAudio: true,
            limitation: "Timestamps guide generation but are not frame-deterministic.",
          },
          previousFailureEvidence: bundle.videoTasks.flatMap((task) => task.failureEvidence),
        }),
      });
      const payload = await response.json() as { packages?: Record<VideoType, ProductionPackage>; error?: string };
      if (!response.ok || !payload.packages) throw new Error(payload.error || "Production compilation failed.");
      persistBundle({ ...bundle, productionPackages: Object.fromEntries(VIDEO_TYPES.map((type) => [type, [...(bundle.productionPackages[type] ?? []), payload.packages?.[type]]])), status: "plan_ready", currentStage: "production", frames: [], videoTasks: [], qaReviews: [] });
    });
  }

  async function generateFrames() {
    await run(async () => {
      const packages = Object.fromEntries(VIDEO_TYPES.map((type) => [type, latest(bundle.productionPackages[type])]));
      const dataUrl = await assetToDataUrl("/inattentive-assets/scenario-02.png");
      const response = await fetch("/api/scenario-lab/frames/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario, packages, previousFrames: bundle.frames, robotReference: [{ assetPath: "/inattentive-assets/scenario-02.png", role: "mandatory_robot_hands_shape_position_reference", scope: "copy only the two robot hands and forearms; ignore people and environment", dataUrl }] }) });
      const payload = await response.json() as { frames?: FrameAsset[]; error?: string };
      if (!response.ok || !payload.frames) throw new Error(payload.error || "Frame generation failed.");
      persistBundle({ ...bundle, frames: [...bundle.frames, ...payload.frames], status: "frames_review", currentStage: "frames" });
    });
  }

  async function reviseFrame(frame: FrameAsset) {
    await run(async () => {
      const dataUrl = await assetToDataUrl(frame.robotReference.assetPath);
      const response = await fetch(`/api/scenario-lab/frames/${frame.frameId}/revise`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ frame, comment: frame.comment, retain: ["all unmentioned frame layers", "approved scripts", "global continuity locks"], change: [frame.comment], robotReference: { ...frame.robotReference, dataUrl } }) });
      const payload = await response.json() as { revision?: { frameId: string; version: number; parentFrameId: string; assetUrl: string; generationTaskId: string; prompt: string }; error?: string };
      if (!response.ok || !payload.revision) throw new Error(payload.error || "The frame revision failed.");
      const revised: FrameAsset = { ...frame, frameId: payload.revision.frameId, version: payload.revision.version, parentFrameId: payload.revision.parentFrameId, assetUrl: payload.revision.assetUrl, status: "generated", comment: "", generationTaskId: payload.revision.generationTaskId, sha256: `${frame.sha256}-r${payload.revision.version}`, prompt: payload.revision.prompt, createdAt: new Date().toISOString(), anchorGate: { silentStoryPass: false, thumbnailPass: false, intensityPass: false, shotScalePass: false, contradictionPass: false, persistencePass: false, transitionPass: false, robotHandsPass: false, reviewedAt: null } };
      persistBundle({ ...bundle, frames: [...bundle.frames, revised], status: "frames_review" });
    });
  }

  async function generalRevision(comment: string) {
    await run(async () => {
      const prompts = Object.fromEntries(VIDEO_TYPES.map((type) => [type, latest(bundle.productionPackages[type])?.clips[0]?.promptVersions.at(-1)?.prompt ?? ""]));
      const response = await fetch("/api/scenario-lab/revisions/general", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment, bundleVersion: bundle.version, scope: "bundle", affectsResearchMeaning: /dialogue|meaning|choice/i.test(comment), prompts, scenario }) });
      const payload = await response.json() as { revision?: { bundleVersion: number; parentBundleVersion: number; retain: string[]; change: string[]; requiresScriptDiffConfirmation: boolean; affectedVideoTypes: VideoType[]; revisedPrompts: Record<VideoType, string> }; error?: string };
      if (!response.ok || !payload.revision) throw new Error(payload.error || "The bundle revision could not be created.");
      if (payload.revision.requiresScriptDiffConfirmation && !window.confirm("This comment may change dialogue or research meaning. Create a new bundle version while preserving the current scripts for diff review?")) return;
      const revision: GeneralRevision = { id: nowId("revision"), level: "bundle", comment, retain: payload.revision.retain, change: payload.revision.change, affectedVideoTypes: payload.revision.affectedVideoTypes, parentBundleVersion: bundle.version, createdAt: new Date().toISOString() };
      const productionPackages = { ...bundle.productionPackages };
      VIDEO_TYPES.forEach((type) => {
        const current = latest(bundle.productionPackages[type]); if (!current) return;
        const clip = current.clips[0]; const parentPrompt = clip.promptVersions.at(-1); if (!parentPrompt) return;
        const nextPackage: ProductionPackage = { ...current, id: nowId(`package-${type}`), version: current.version + 1, parentVersionId: current.id, clips: [{ ...clip, promptVersions: [...clip.promptVersions.map((item) => ({ ...item, immutable: true })), { id: nowId(`prompt-${type}`), version: parentPrompt.version + 1, parentVersionId: parentPrompt.id, prompt: payload.revision?.revisedPrompts[type] ?? parentPrompt.prompt, createdAt: new Date().toISOString(), lastEditedBy: "ai", immutable: false }] }] };
        productionPackages[type] = [...(productionPackages[type] ?? []), nextPackage];
      });
      persistBundle({ ...bundle, version: payload.revision.bundleVersion, parentVersion: bundle.version, productionPackages, frames: bundle.frames.map((frame) => ({ ...frame, status: "rejected" })), generalRevisions: [...bundle.generalRevisions, revision], status: "frames_review", videoTasks: [], qaReviews: [] });
    });
  }

  async function submitTasks() {
    await run(async () => {
      const packages = VIDEO_TYPES.map((type) => latest(bundle.productionPackages[type]) as ProductionPackage);
      const requestTasks = packages.flatMap((item) => item.clips.map((clip) => { const first = bundle.frames.filter((frame) => frame.clipId === clip.clipId && frame.frameRole === "first").toSorted((a, b) => b.version - a.version)[0]; const lastFrame = bundle.frames.filter((frame) => frame.clipId === clip.clipId && frame.frameRole === "last").toSorted((a, b) => b.version - a.version)[0]; return { videoType: item.videoType, clipId: clip.clipId, prompt: clip.promptVersions.at(-1)?.prompt, mode: clip.mode, request: { model: "minimax/h3/image-to-video", duration: clip.durationSeconds, resolution: "2K", ratio: "16:9", nativeAudio: true, candidateIndex: 1 }, inputs: { firstFrameUrl: first?.assetUrl ?? null, lastFrameUrl: lastFrame?.assetUrl ?? null } }; }));
      const idempotencyKey = `${scenario.id}:bundle:${bundle.version}:candidates:1`;
      const response = await fetch("/api/scenario-lab/videos/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true, candidateCount: 1, idempotencyKey, tasks: requestTasks }) });
      const payload = await response.json() as { tasks?: Array<{ taskId: string; videoType: VideoType; clipId: string; status: "queued"; provider: string; model: string; createdAt: string; idempotencyKey: string }>; error?: string };
      if (!response.ok || !payload.tasks) throw new Error(payload.error || "Task submission failed.");
      const tasks: VideoGenerationTask[] = payload.tasks.map((task) => { const pack = packages.find((item) => item.videoType === task.videoType) as ProductionPackage; const clip = pack.clips.find((item) => item.clipId === task.clipId) as ProductionPackage["clips"][number]; const prompt = clip.promptVersions.at(-1); const first = bundle.frames.filter((frame) => frame.clipId === clip.clipId && frame.frameRole === "first").toSorted((a, b) => b.version - a.version)[0]; const lastFrame = bundle.frames.filter((frame) => frame.clipId === clip.clipId && frame.frameRole === "last").toSorted((a, b) => b.version - a.version)[0]; return { ...task, scenarioId: scenario.id, bundleVersion: bundle.version, promptVersion: prompt?.id ?? "unknown", parentPromptVersion: prompt?.parentVersionId ?? null, prompt: prompt?.prompt ?? "", mode: clip.mode, request: { model: task.model, duration: clip.durationSeconds, resolution: "2K", ratio: "16:9", nativeAudio: true, candidateIndex: 1 }, inputs: { firstFrame: first ? { url: first.assetUrl, sha256: first.sha256 } : null, lastFrame: lastFrame ? { url: lastFrame.assetUrl, sha256: lastFrame.sha256 } : null }, failureEvidence: [], retain: [], change: [], updatedAt: task.createdAt, outputUrl: null } as VideoGenerationTask; });
      persistBundle({ ...bundle, videoTasks: tasks, status: "video_queued", currentStage: "generation" });
    });
  }

  async function queryTask(task: VideoGenerationTask) {
    await run(async () => {
      const response = await fetch(`/api/scenario-lab/videos/tasks?taskId=${encodeURIComponent(task.taskId)}`);
      const payload = await response.json() as { status?: VideoGenerationTask["status"]; outputUrl?: string; error?: string };
      if (!response.ok || !payload.status) throw new Error(payload.error || "Task query failed. The original task remains saved; retry the query later.");
      persistBundle({ ...bundle, status: payload.status === "succeeded" ? "video_review" : "video_generating", videoTasks: bundle.videoTasks.map((item) => item.taskId === task.taskId ? { ...item, status: payload.status as VideoGenerationTask["status"], outputUrl: payload.outputUrl ?? item.outputUrl, updatedAt: new Date().toISOString() } : item) });
    });
  }

  async function runQa() {
    await run(async () => {
      const reviews = await Promise.all(VIDEO_TYPES.map(async (type) => { const pack = latest(bundle.productionPackages[type]) as ProductionPackage; const task = bundle.videoTasks.find((item) => item.videoType === type); const response = await fetch("/api/scenario-lab/videos/qa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoType: type, outputUrl: task?.outputUrl, requirements: pack.requirements }) }); const payload = await response.json() as { qa?: Omit<QaReview, "comment">; error?: string }; if (!response.ok || !payload.qa) throw new Error(payload.error || `QA failed for ${VIDEO_LABELS[type]}.`); return { ...payload.qa, checks: payload.qa.checks.map((check) => ({ ...check, id: nowId("qa") })), comment: "" }; }));
      persistBundle({ ...bundle, qaReviews: reviews, currentStage: "qa", status: "video_review" });
    });
  }

  const stage = bundle.currentStage;
  const finalStatuses = VIDEO_TYPES.map((type) => ({ type, status: bundle.qaReviews.find((item) => item.videoType === type)?.finalVerdict === "accept" ? "accepted" : bundle.videoTasks.find((item) => item.videoType === type)?.status ?? (bundle.frames.some((item) => item.videoType === type && item.status === "approved") ? "frames approved" : "not ready") }));
  return <div className="page-content lab-page">
    <div className="lab-product-header"><div><p className="eyebrow">RESEARCHER / SCENARIO LAB</p><h1>Scenario Lab</h1><p>From a dilemma brief to a reviewable three-video bundle.</p></div><div className="lab-save"><i />{bundle.saveState === "saved" ? "All changes saved locally" : bundle.saveState}</div></div>
    <section className="lab-workspace glass-panel">
      <aside className="scenario-queue"><div className="queue-heading"><span>SCENARIO QUEUE</span><b>{data.labScenarios.length}</b></div><button className="new-scenario" onClick={() => setShowNew(true)}>＋ New Scenario<small>Temporary manual entry</small></button><div className="queue-list">{data.labScenarios.map((item, index) => { const itemBundle = data.scenarioLabBundles.find((candidate) => candidate.scenarioId === item.id); return <button key={item.id} className={item.id === scenario.id ? "active" : ""} onClick={() => { setScenarioId(item.id); setBranch("conflict"); }}><i>{String(index + 1).padStart(2, "0")}</i><span><b>{item.title}</b><small>{item.familyId} · {itemBundle?.status ?? item.status}</small></span><em>{statusIcon(itemBundle?.status ?? item.status)}</em></button>; })}</div></aside>
      <main className="lab-main">
        <header className="bundle-bar"><div><span>{scenario.title}</span><b>{data.families.find((item) => item.id === scenario.familyId)?.label ?? scenario.familyId}</b></div><div><span>BUNDLE</span><b>v{bundle.version}{bundle.parentVersion ? ` · from v${bundle.parentVersion}` : ""}</b></div><div><span>STAGE</span><b>{WORKFLOW_STAGES.find((item) => item.id === stage)?.number} · {WORKFLOW_STAGES.find((item) => item.id === stage)?.label}</b></div><div className="final-statuses">{finalStatuses.map((item) => <span key={item.type}><i>{statusIcon(item.status)}</i>{item.type === "conflict" ? "Conflict" : item.type === "choice_a" ? "Choice A" : "Choice B"}<small>{item.status}</small></span>)}</div></header>
        <nav className="workflow-stepper" aria-label="Scenario Lab workflow">{WORKFLOW_STAGES.map((item, index) => <button key={item.id} className={`${stage === item.id ? "active" : ""} ${index < stageIndex(stage) ? "complete" : ""}`} onClick={() => { if (index <= stageIndex(stage)) persistBundle({ ...bundle, currentStage: item.id }); }} disabled={index > stageIndex(stage)}><i>{index < stageIndex(stage) ? "✓" : item.number}</i><span>{item.label}</span></button>)}</nav>
        {stage === "brief" && <BriefStage data={data} scenario={scenario} bundle={bundle} onScenario={persistScenario} onBundle={persistBundle} onGenerate={() => void generateAllScripts()} busy={busy} error={error} />}
        {stage === "scripts" && <ScriptsStage bundle={bundle} branch={branch} onBranch={setBranch} onBundle={persistBundle} onRegenerate={(script) => void generateAllScripts(script)} onApprove={approveScripts} busy={busy} error={error} />}
        {stage === "production" && <ProductionStage key={`${branch}-${latest(bundle.productionPackages[branch])?.id ?? "none"}`} bundle={bundle} branch={branch} onBranch={setBranch} onCompile={() => void compile()} onBundle={persistBundle} onApprove={() => persistBundle({ ...bundle, currentStage: "frames", status: "plan_ready" })} busy={busy} error={error} />}
        {stage === "frames" && <FramesStage bundle={bundle} onBundle={persistBundle} onGenerate={() => void generateFrames()} onRevise={(frame) => void reviseFrame(frame)} onGeneralRevision={(comment) => void generalRevision(comment)} busy={busy} error={error} />}
        {stage === "generation" && <GenerationStage bundle={bundle} onBundle={persistBundle} onSubmit={() => void submitTasks()} onQuery={(task) => void queryTask(task)} busy={busy} error={error} />}
        {stage === "qa" && <QaStage scenario={scenario} bundle={bundle} onBundle={persistBundle} onRunQa={() => void runQa()} busy={busy} error={error} />}
      </main>
    </section>
    {showNew && <NewScenarioDialog data={data} onClose={() => setShowNew(false)} onCreate={(created) => { setData((current) => ({ ...current, labScenarios: [...current.labScenarios, created] })); setScenarioId(created.id); setShowNew(false); }} />}
  </div>;
}
