import * as THREE from "three";
import { buildHemisphere, directionFromYawPitch } from "./projection.js";

const params = new URLSearchParams(window.location.search);
let activeScenarioId = params.get("scenario") || "scenario-01";
const SCENARIO_URLS = {
  "scenario-01": "/data/scenario-01.json",
  "family01-scenario02": "/data/family01-scenario02.json",
  "family01-scenario03": "/data/family01-scenario03.json",
};
const NEXT_WEBXR_SCENARIO = {
  "family01-scenario02": "family01-scenario03",
};

// Tutorial Scenario01 remains the visual baseline from the reference WebXR project.
const VARIANTS = {
  current: { video: "./assets/scenario-01-vr180.mp4?v=4", depth: "./assets/scenario-01-vr180.depth.mp4" },
  "h3-exact": { video: "./assets/scenario-01-vr180-candidate-minimax-h3-exact.mp4", depth: null },
  "h3-natural": { video: "./assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.mp4", depth: "./assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.depth.mp4" },
  "h3-natural-depth": { video: "./assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.mp4", depth: "./assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.depth.mp4" },
};
const selectedVariant = VARIANTS[params.get("variant") || "current"] || VARIANTS.current;
const LEGACY_VR = { dilemma: { video: selectedVariant.video, depth: selectedVariant.depth }, choices: {} };
const CAPTION_TRACKS = {
  current: [{ speaker: "妈妈", text: "慢一点，这锅刚开。我们一起放到台上。" }],
  "h3-natural": [{ speaker: "妈妈", text: "慢点儿，汤刚开。来，跟我一起稳稳放到台上。" }],
};

const canvas = document.querySelector("#vr-view");
const ui = document.querySelector("#experience-ui");
const vrButton = document.querySelector("#enter-vr");
const backLink = document.querySelector("#back-scenarios");
const status = document.querySelector("#viewer-status");
const progress = document.querySelector("#progress-fill");
const timeLabel = document.querySelector("#time-label");
const scenarioTitle = document.querySelector("#scenario-title");
const scenarioBrief = document.querySelector("#scenario-brief");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType("local");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);
const camera = new THREE.PerspectiveCamera(80, 1, 0.1, 1000);
camera.layers.enable(1);
scene.add(camera);

const hemisphereGeometry = buildHemisphere({ radius: 200, segments: 128 });
let mediaMeshes = [];
let video = null;
let depthVideo = null;
let videoTexture = null;
let depthTexture = null;
let placeholderStart = 0;
let placeholderDuration = 15;
let currentMedia = null;
let stage = "briefing";
let scenario = null;
let choice = null;
let decisionStarted = 0;
let decisionDisplayTick = -1;
let decisionTimeMs = 0;
let thirdMode = "none";
let difficulty = 0;
let rationale = "";
let listening = false;
let recognition = null;

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}

function legacyChoiceMedia(item) {
  return { video: item.video, depth: null };
}

function siteMediaUrl(value) {
  if (!value || /^(?:https?:|data:|blob:)/.test(value)) return value;
  if (value.startsWith("./assets/")) return value;
  const siteRoot = new URL("../", window.location.href);
  return new URL(value.replace(/^\.?\//, ""), siteRoot).href;
}

function normalizeMedia(media) {
  return {
    ...media,
    video: siteMediaUrl(media.video),
    depth: siteMediaUrl(media.depth),
  };
}

function mediaFor(kind, selectedChoice) {
  if (kind === "timeout") return normalizeMedia({ ...scenario.decisionTimeout.video04, depth: null });
  const config = scenario.vr || LEGACY_VR;
  if (kind === "dilemma") {
    const configured = { ...config.dilemma };
    if (scenario.id === "scenario-01") {
      configured.video = params.get("video") || configured.video;
      configured.depth = params.get("depth") === "off" ? null : params.get("depth") || configured.depth;
    }
    return normalizeMedia(configured);
  }
  return normalizeMedia(config.choices?.[selectedChoice.id] || legacyChoiceMedia(selectedChoice));
}

function disposeMedia() {
  video?.pause();
  depthVideo?.pause();
  for (const mesh of mediaMeshes) scene.remove(mesh);
  mediaMeshes.forEach((mesh) => mesh.material.dispose());
  mediaMeshes = [];
  videoTexture?.dispose();
  depthTexture?.dispose();
  video = null;
  depthVideo = null;
  videoTexture = null;
  depthTexture = null;
  placeholderStart = 0;
}

function depthMaterial(eyeSign) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: videoTexture }, depthMap: { value: depthTexture }, eyeSign: { value: eyeSign }, maxDisparity: { value: 1.1 / 180 } },
    vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: "varying vec2 vUv;uniform sampler2D map;uniform sampler2D depthMap;uniform float eyeSign;uniform float maxDisparity;void main(){float inverseDepth=texture2D(depthMap,vUv).r;float shift=eyeSign*maxDisparity*inverseDepth;vec2 colorUv=vec2(clamp(vUv.x+shift,0.0,1.0),vUv.y);gl_FragColor=texture2D(map,colorUv);}",
  });
}

async function startMedia(media, duration) {
  disposeMedia();
  currentMedia = media;
  placeholderDuration = duration || 15;
  if (media.placeholder || !media.video) {
    placeholderStart = performance.now();
    status.textContent = "PLACEHOLDER VIDEO · PLAYING";
    renderDom();
    refreshXrPanel();
    return;
  }

  video = document.createElement("video");
  video.src = media.video;
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  video.preload = "auto";
  videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  if (media.depth) {
    depthVideo = document.createElement("video");
    depthVideo.src = media.depth;
    depthVideo.crossOrigin = "anonymous";
    depthVideo.muted = true;
    depthVideo.playsInline = true;
    depthVideo.preload = "auto";
    depthTexture = new THREE.VideoTexture(depthVideo);
    depthTexture.colorSpace = THREE.NoColorSpace;
    for (const [eyeSign, layer] of [[-1, 1], [1, 2]]) {
      const mesh = new THREE.Mesh(hemisphereGeometry, depthMaterial(eyeSign));
      mesh.layers.set(layer);
      mediaMeshes.push(mesh);
      scene.add(mesh);
    }
  } else {
    const mesh = new THREE.Mesh(hemisphereGeometry, new THREE.MeshBasicMaterial({ map: videoTexture }));
    mesh.layers.set(1);
    mesh.layers.enable(2);
    mediaMeshes.push(mesh);
    scene.add(mesh);
  }

  video.addEventListener("loadedmetadata", () => {
    status.textContent = `${video.videoWidth} × ${video.videoHeight} · ${media.depth ? "DEPTH STEREO READY" : "VR180 READY"}`;
  });
  video.addEventListener("ended", finishFilm);
  try { await video.play(); } catch { video.muted = true; await video.play().catch(() => undefined); }
  await depthVideo?.play().catch(() => undefined);
  status.textContent = stage === "dilemma" ? "CONFLICT SCENE · PLAYING" : stage === "timeout" ? "VIDEO 04 · PLAYING" : `OUTCOME ${choice?.id} · PLAYING`;
  renderDom();
  refreshXrPanel();
}

function finishFilm() {
  if (stage === "dilemma") {
    stage = "decision";
    decisionStarted = performance.now();
    decisionDisplayTick = -1;
  } else if (stage === "outcome") {
    stage = "survey";
  }
  status.textContent = stage === "decision" ? "RESPOND NOW" : stage === "timeout" ? "VIDEO 04" : "CHOICE RECORD";
  renderDom();
  refreshXrPanel();
}

function beginDilemma() {
  stage = "dilemma";
  startMedia(mediaFor("dilemma"), scenario.dilemmaDuration);
}

function selectChoice(id) {
  choice = scenario.choices.find((item) => item.id === id);
  if (!choice) return;
  decisionTimeMs = Math.max(0, Math.round(performance.now() - decisionStarted));
  stage = "outcome";
  startMedia(mediaFor("outcome", choice), choice.duration);
}

function beginTimeoutVideo() {
  if (stage !== "decision" || !scenario.decisionTimeout) return;
  decisionTimeMs = Math.round((scenario.decisionTimeout.countdownSeconds + scenario.decisionTimeout.urgentSeconds) * 1000);
  stage = "timeout";
  startMedia(mediaFor("timeout"), scenario.decisionTimeout.video04.duration);
}

function choiceButton(item) {
  return `<button class="choice" data-choice="${item.id}"><span>${item.id}</span><p><b>${escapeHtml(item.labelEn)}</b><small>${escapeHtml(item.detailEn)}</small></p><i>→</i></button>`;
}

function renderDom() {
  if (!scenario) return;
  if (stage === "briefing") {
    ui.innerHTML = `<section class="panel"><p class="eyebrow">${escapeHtml(scenario.briefing.eyebrowEn)}</p><h1>${escapeHtml(scenario.briefing.titleEn)}</h1><div class="facts">${scenario.briefing.facts.map((fact) => `<div class="fact"><span>${escapeHtml(fact.value)}</span><b>${escapeHtml(fact.labelEn)}</b><small>${escapeHtml(fact.detailEn)}</small></div>`).join("")}</div><p class="panel-copy">${escapeHtml(scenario.briefing.bodyEn)}</p><button class="primary" data-action="start">${escapeHtml(scenario.briefing.startEn)} →</button></section>`;
  } else if (stage === "decision") {
    const elapsedSeconds = Math.max(0, (performance.now() - decisionStarted) / 1000);
    const countdownSeconds = scenario.decisionTimeout?.countdownSeconds ?? 10;
    const urgent = Boolean(scenario.decisionTimeout && elapsedSeconds >= countdownSeconds);
    const timerLabel = urgent ? "URGENT" : String(Math.max(1, Math.ceil(countdownSeconds - elapsedSeconds)));
    ui.innerHTML = `<section class="panel"><p class="eyebrow">● RESPOND NOW · ${timerLabel}</p><h1>${escapeHtml(scenario.decision.titleEn)}</h1><p class="panel-copy">${escapeHtml(scenario.decision.bodyEn)}</p><div class="choices">${scenario.choices.map(choiceButton).join("")}</div></section>`;
  } else if (stage === "survey") {
    const canSubmit = difficulty && rationale.trim() && (thirdMode === "none" || rationale.trim());
    ui.innerHTML = `<section class="panel record-panel"><p class="eyebrow">CHOICE RECORD · ${choice.id}</p><h1>Record your choice.</h1><div class="record-summary"><span>${choice.id}</span><p><b>${escapeHtml(choice.labelEn)}</b><small>${escapeHtml(choice.outcomeEn)}</small></p></div><section class="question"><h2>01 · Beyond the available choices, is there another safe and actionable response?</h2><div class="survey-row"><button class="survey-option ${thirdMode === "none" ? "selected" : ""}" data-third="none">None</button><button class="survey-option ${thirdMode === "custom" ? "selected" : ""}" data-third="custom">I have another option</button></div></section><section class="question"><h2>02 · How difficult was this choice with the information available?</h2><div class="survey-row">${[1,2,3,4,5].map((value) => `<button class="survey-option ${difficulty === value ? "selected" : ""}" data-difficulty="${value}">${value}${value === 1 ? " · Easy" : value === 5 ? " · Very conflicted" : ""}</button>`).join("")}</div></section><section class="question"><h2>03 · Why did you choose this response? Which risks or wishes mattered most?</h2><textarea id="rationale" placeholder="Type here or use the microphone…">${escapeHtml(rationale)}</textarea><button class="survey-option mic ${listening ? "selected" : ""}" data-action="mic">${listening ? "● Listening…" : "● Voice response"}</button><button class="survey-option mic" data-action="controller-response">Use controller-only response</button></section><div class="record-actions"><button data-action="replay">↻ Try Again</button><button data-action="exit">Exit</button><button class="submit" data-action="submit" ${canSubmit ? "" : "disabled"}>Submit and Try Next Scenario →</button></div></section>`;
  } else if (currentMedia?.placeholder) {
    ui.innerHTML = `<section class="panel play-card"><span class="placeholder-badge">PLACEHOLDER VIDEO</span><h1>${stage === "timeout" ? "Video 04" : `Outcome ${choice?.id || ""}`}<small>The final video has not been generated yet.</small></h1><div class="record-actions"><button data-action="replay">↻ Try Again</button><button data-action="exit">Exit</button></div></section>`;
  } else {
    ui.innerHTML = "";
  }
  bindDomActions();
}

function bindDomActions() {
  ui.querySelector('[data-action="start"]')?.addEventListener("click", beginDilemma);
  ui.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", () => selectChoice(button.dataset.choice)));
  ui.querySelectorAll("[data-third]").forEach((button) => button.addEventListener("click", () => { thirdMode = button.dataset.third; renderDom(); refreshXrPanel(); }));
  ui.querySelectorAll("[data-difficulty]").forEach((button) => button.addEventListener("click", () => { difficulty = Number(button.dataset.difficulty); renderDom(); refreshXrPanel(); }));
  ui.querySelector('[data-action="mic"]')?.addEventListener("click", toggleMic);
  ui.querySelector('[data-action="controller-response"]')?.addEventListener("click", () => { rationale = "Controller-only response recorded in WebXR; no voice transcript was provided."; renderDom(); refreshXrPanel(); });
  ui.querySelector('[data-action="replay"]')?.addEventListener("click", replayExperience);
  ui.querySelector('[data-action="exit"]')?.addEventListener("click", returnToScenarios);
  ui.querySelector('[data-action="submit"]')?.addEventListener("click", submitRecord);
  ui.querySelector("#rationale")?.addEventListener("input", (event) => { rationale = event.target.value; });
}

function toggleMic() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (listening) { recognition?.stop(); return; }
  if (!SpeechRecognition) { status.textContent = "VOICE INPUT UNAVAILABLE · TYPE OR USE CONTROLLER RESPONSE"; return; }
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = scenario.voiceLanguage || "zh-CN";
  recognition.onresult = (event) => {
    for (let index = event.resultIndex; index < event.results.length; index += 1) if (event.results[index].isFinal) rationale = `${rationale} ${event.results[index][0].transcript}`.trim();
    renderDom(); refreshXrPanel();
  };
  recognition.onend = () => { listening = false; renderDom(); refreshXrPanel(); };
  recognition.onerror = recognition.onend;
  listening = true;
  recognition.start();
  renderDom(); refreshXrPanel();
}

function replayExperience() {
  recognition?.stop();
  disposeMedia();
  currentMedia = null;
  stage = "briefing";
  choice = null;
  decisionTimeMs = 0;
  decisionDisplayTick = -1;
  thirdMode = "none";
  difficulty = 0;
  rationale = "";
  listening = false;
  status.textContent = "WEBXR EXPERIENCE READY";
  renderDom();
  refreshXrPanel();
}

function queueResponse(response) {
  let queued = [];
  try { queued = JSON.parse(window.sessionStorage.getItem("inattentive-robot.vr-responses") || "[]"); } catch { queued = []; }
  if (!Array.isArray(queued)) queued = [];
  queued.push(response);
  window.sessionStorage.setItem("inattentive-robot.vr-responses", JSON.stringify(queued));
}

function submitRecord() {
  if (!choice || !difficulty || !rationale.trim()) return;
  let context = {};
  try { context = JSON.parse(window.sessionStorage.getItem("inattentive-robot.vr-context") || "{}"); } catch { /* use defaults */ }
  const response = {
    id: `response-vr-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    familyId: context.familyId || scenario.familyId,
    memberId: context.memberId || "participant",
    memberName: context.memberName || "Participant",
    memberRole: context.memberRole || "Participant",
    scenarioId: scenario.id,
    choice: choice.id,
    choiceLabel: choice.labelEn,
    decisionTimeMs,
    thirdOption: thirdMode === "none" ? "None" : "Another response described in rationale",
    difficulty,
    rationale: rationale.trim(),
    createdAt: new Date().toISOString(),
    experienceMode: "WebXR",
  };
  queueResponse(response);
  const nextScenarioId = NEXT_WEBXR_SCENARIO[scenario.id];
  if (nextScenarioId) void initialize(nextScenarioId);
  else returnToScenarios();
}

function returnToScenarios() {
  if (renderer.xr.isPresenting) renderer.xr.getSession()?.end().finally(() => window.location.assign("/"));
  else if (window.history.length > 1) window.history.back();
  else window.location.assign("/");
}
backLink.addEventListener("click", (event) => { event.preventDefault(); returnToScenarios(); });

// Head-locked WebXR panels reproduce the website's briefing, choices and Choice Record in-headset.
const xrUi = new THREE.Group();
xrUi.position.set(0, 0, -3);
xrUi.layers.set(1); xrUi.layers.enable(2);
camera.add(xrUi);
const xrPanelCanvas = document.createElement("canvas");
xrPanelCanvas.width = 1536; xrPanelCanvas.height = 960;
const xrPanelContext = xrPanelCanvas.getContext("2d");
const xrPanelTexture = new THREE.CanvasTexture(xrPanelCanvas);
xrPanelTexture.colorSpace = THREE.SRGBColorSpace;
const xrPanel = new THREE.Mesh(new THREE.PlaneGeometry(3.84, 2.4), new THREE.MeshBasicMaterial({ map: xrPanelTexture, transparent: true, depthTest: false, toneMapped: false }));
xrPanel.layers.set(1); xrPanel.layers.enable(2); xrPanel.renderOrder = 900;
xrUi.add(xrPanel);
let xrButtons = [];

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || "").split(/\s+/); let line = ""; let lines = 0;
  for (const word of words) {
    const test = `${line}${line ? " " : ""}${word}`;
    if (context.measureText(test).width > maxWidth && line) { context.fillText(line, x, y); y += lineHeight; line = word; lines += 1; if (lines >= maxLines) return y; }
    else line = test;
  }
  if (line && lines < maxLines) { context.fillText(line, x, y); y += lineHeight; }
  return y;
}

function addXrButton(label, x, y, width, height, action, selected = false) {
  xrPanelContext.fillStyle = selected ? "#b9dcff" : "rgba(185,220,255,.12)";
  xrPanelContext.strokeStyle = "rgba(185,220,255,.65)";
  xrPanelContext.lineWidth = 2;
  xrPanelContext.fillRect(x, y, width, height); xrPanelContext.strokeRect(x, y, width, height);
  xrPanelContext.fillStyle = selected ? "#07101a" : "#f4f5f6";
  xrPanelContext.font = "700 25px sans-serif";
  xrPanelContext.fillText(label, x + 18, y + height / 2 + 8, width - 36);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width / 400, height / 400), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false }));
  mesh.position.set((x + width / 2 - 768) / 400, (480 - y - height / 2) / 400, 0.025);
  mesh.layers.set(1); mesh.layers.enable(2); mesh.userData.onSelect = action;
  xrUi.add(mesh); xrButtons.push(mesh);
}

function refreshXrPanel() {
  xrButtons.forEach((button) => { xrUi.remove(button); button.geometry.dispose(); button.material.dispose(); });
  xrButtons = [];
  xrUi.visible = ["briefing", "decision", "survey"].includes(stage) || Boolean(currentMedia?.placeholder);
  xrPanelContext.clearRect(0, 0, 1536, 960);
  if (!scenario || !xrUi.visible) { xrPanelTexture.needsUpdate = true; return; }
  xrPanelContext.fillStyle = "rgba(7,10,14,.94)"; xrPanelContext.fillRect(0, 0, 1536, 960);
  xrPanelContext.strokeStyle = "rgba(185,220,255,.4)"; xrPanelContext.lineWidth = 4; xrPanelContext.strokeRect(4, 4, 1528, 952);
  xrPanelContext.fillStyle = "#b9dcff"; xrPanelContext.font = "700 24px sans-serif";
  xrPanelContext.fillText(`INATTENTIVE ROBOT · SCENARIO ${scenario.number}`, 70, 70);
  xrPanelContext.fillStyle = "#f4f5f6";
  if (stage === "briefing") {
    xrPanelContext.font = "750 54px sans-serif"; wrapText(xrPanelContext, scenario.briefing.titleEn, 70, 155, 1390, 62, 2);
    xrPanelContext.font = "400 28px sans-serif"; xrPanelContext.fillStyle = "#aeb5bc"; wrapText(xrPanelContext, scenario.briefing.bodyEn, 70, 285, 1390, 40, 6);
    scenario.briefing.facts.forEach((fact, index) => { const x = 70 + index * 470; xrPanelContext.fillStyle = "#b9dcff"; xrPanelContext.font = "750 38px sans-serif"; xrPanelContext.fillText(fact.value, x, 590); xrPanelContext.fillStyle = "#fff"; xrPanelContext.font = "700 20px sans-serif"; xrPanelContext.fillText(fact.labelEn, x, 625); });
    addXrButton(`${scenario.briefing.startEn}  →`, 70, 740, 1396, 110, beginDilemma);
  } else if (stage === "decision") {
    const elapsedSeconds = Math.max(0, (performance.now() - decisionStarted) / 1000);
    const countdownSeconds = scenario.decisionTimeout?.countdownSeconds ?? 10;
    const timerLabel = scenario.decisionTimeout && elapsedSeconds >= countdownSeconds ? "URGENT" : String(Math.max(1, Math.ceil(countdownSeconds - elapsedSeconds)));
    xrPanelContext.font = "750 48px sans-serif"; xrPanelContext.fillText(`${scenario.decision.titleEn}  ·  ${timerLabel}`, 70, 155);
    xrPanelContext.font = "400 25px sans-serif"; xrPanelContext.fillStyle = "#aeb5bc"; wrapText(xrPanelContext, scenario.decision.bodyEn, 70, 210, 1390, 36, 3);
    scenario.choices.forEach((item, index) => addXrButton(`${item.id}  ·  ${item.labelEn}`, 70, 350 + index * 145, 1396, 112, () => selectChoice(item.id)));
  } else if (stage === "survey") {
    xrPanelContext.font = "750 42px sans-serif"; xrPanelContext.fillText(`CHOICE RECORD · ${choice.id} · ${choice.labelEn}`, 70, 135);
    xrPanelContext.font = "400 22px sans-serif"; xrPanelContext.fillStyle = "#aeb5bc"; wrapText(xrPanelContext, choice.outcomeEn, 70, 180, 1390, 30, 3);
    xrPanelContext.fillStyle = "#fff"; xrPanelContext.font = "700 21px sans-serif"; xrPanelContext.fillText("01 · Another safe and actionable response?", 70, 310);
    addXrButton("None", 70, 340, 250, 70, () => { thirdMode = "none"; refreshXrPanel(); }, thirdMode === "none");
    addXrButton("Another option", 340, 340, 340, 70, () => { thirdMode = "custom"; toggleMic(); }, thirdMode === "custom");
    xrPanelContext.fillStyle = "#fff"; xrPanelContext.fillText("02 · Difficulty", 70, 475);
    [1,2,3,4,5].forEach((value, index) => addXrButton(String(value), 70 + index * 130, 505, 108, 70, () => { difficulty = value; refreshXrPanel(); }, difficulty === value));
    xrPanelContext.fillStyle = "#fff"; xrPanelContext.fillText("03 · Why? Which risks or wishes mattered most?", 70, 650);
    addXrButton(listening ? "● Listening…" : "● Voice response", 70, 680, 360, 70, toggleMic, listening);
    addXrButton("Controller-only response", 450, 680, 390, 70, () => { rationale = "Controller-only response recorded in WebXR; no voice transcript was provided."; refreshXrPanel(); }, rationale.startsWith("Controller-only"));
    if (rationale) { xrPanelContext.font = "400 18px sans-serif"; xrPanelContext.fillStyle = "#aeb5bc"; wrapText(xrPanelContext, rationale, 70, 795, 830, 24, 2); }
    const canSubmit = Boolean(difficulty && rationale.trim());
    addXrButton("↻ Try Again", 70, 850, 280, 70, replayExperience);
    addXrButton("Exit", 370, 850, 220, 70, returnToScenarios);
    addXrButton("Submit and Try Next Scenario  →", 610, 850, 856, 70, canSubmit ? submitRecord : () => {}, canSubmit);
  } else {
    xrPanelContext.font = "750 52px sans-serif"; xrPanelContext.textAlign = "center"; xrPanelContext.fillText(stage === "timeout" ? "VIDEO 04 · PLACEHOLDER" : "PLACEHOLDER VIDEO", 768, 430); xrPanelContext.font = "400 26px sans-serif"; xrPanelContext.fillStyle = "#aeb5bc"; xrPanelContext.fillText("The final video has not been generated yet.", 768, 490); xrPanelContext.textAlign = "left";
    addXrButton("↻ Try Again", 360, 650, 380, 90, replayExperience);
    addXrButton("Exit", 796, 650, 380, 90, returnToScenarios);
  }
  xrPanelTexture.needsUpdate = true;
}

const subtitleCanvas = document.createElement("canvas");
subtitleCanvas.width = 2048; subtitleCanvas.height = 420;
const subtitleContext = subtitleCanvas.getContext("2d");
const subtitleTexture = new THREE.CanvasTexture(subtitleCanvas);
subtitleTexture.colorSpace = THREE.SRGBColorSpace;
const subtitleLayer = new THREE.Mesh(new THREE.PlaneGeometry(3.35, 0.69), new THREE.MeshBasicMaterial({ map: subtitleTexture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
subtitleLayer.position.set(0, -0.82, -2.55); subtitleLayer.renderOrder = 1000; subtitleLayer.frustumCulled = false; subtitleLayer.layers.set(1); subtitleLayer.layers.enable(2); subtitleLayer.visible = false;
camera.add(subtitleLayer);
let renderedSubtitle = null;
function renderSubtitle(cue) {
  if (cue === renderedSubtitle) return; renderedSubtitle = cue;
  subtitleContext.clearRect(0, 0, 2048, 420); subtitleLayer.visible = Boolean(cue);
  if (cue) {
    subtitleContext.fillStyle = "rgba(0,0,0,.76)"; subtitleContext.fillRect(40, 35, 1968, 330);
    subtitleContext.textAlign = "center"; subtitleContext.fillStyle = "#f0c878"; subtitleContext.font = "600 40px sans-serif"; subtitleContext.fillText(cue.speakerZh || cue.speaker, 1024, 105);
    subtitleContext.fillStyle = "#fff"; subtitleContext.font = "700 52px sans-serif"; subtitleContext.fillText(cue.textZh || cue.text, 1024, 190);
    subtitleContext.fillStyle = "#d1d5d9"; subtitleContext.font = "500 34px sans-serif"; subtitleContext.fillText(cue.textEn || "", 1024, 270);
  }
  subtitleTexture.needsUpdate = true;
}

let yaw = 0; let pitch = 0; let dragging = false; let pointerX = 0; let pointerY = 0;
canvas.addEventListener("pointerdown", (event) => { dragging = true; pointerX = event.clientX; pointerY = event.clientY; canvas.setPointerCapture?.(event.pointerId); });
canvas.addEventListener("pointerup", () => { dragging = false; }); canvas.addEventListener("pointercancel", () => { dragging = false; });
canvas.addEventListener("pointermove", (event) => { if (!dragging) return; yaw = Math.max(-110, Math.min(110, yaw - (event.clientX - pointerX) * .18)); pitch = Math.max(-85, Math.min(85, pitch + (event.clientY - pointerY) * .18)); pointerX = event.clientX; pointerY = event.clientY; });

const raycaster = new THREE.Raycaster();
const rotationMatrix = new THREE.Matrix4();
for (let index = 0; index < 2; index += 1) {
  const controller = renderer.xr.getController(index);
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-4)]);
  const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xb9dcff }));
  controller.add(line); scene.add(controller);
  controller.addEventListener("selectstart", () => {
    rotationMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0,0,-1).applyMatrix4(rotationMatrix);
    raycaster.intersectObjects(xrButtons, false)[0]?.object.userData.onSelect?.();
  });
}

let xrSession = null;
async function configureVrButton() {
  const supported = Boolean(navigator.xr && await navigator.xr.isSessionSupported?.("immersive-vr").catch(() => false));
  vrButton.disabled = !supported;
  vrButton.textContent = supported ? "Enter VR" : "VR requires a supported headset";
  document.documentElement.dataset.xr = supported ? "available" : "unavailable";
}
configureVrButton();
vrButton.addEventListener("click", async () => {
  if (xrSession) { await xrSession.end(); return; }
  try {
    xrSession = await navigator.xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor"] });
    xrSession.addEventListener("end", () => { xrSession = null; vrButton.textContent = "Enter VR"; document.documentElement.dataset.xrPresenting = "false"; });
    await renderer.xr.setSession(xrSession);
    document.documentElement.dataset.xrPresenting = "true";
    vrButton.textContent = "Exit VR";
    refreshXrPanel();
  } catch (error) { status.textContent = "VR SESSION COULD NOT START"; console.error("Unable to start immersive VR", error); }
});

function playbackTime() {
  if (placeholderStart) return Math.min((performance.now() - placeholderStart) / 1000, placeholderDuration);
  return video?.currentTime || 0;
}

renderer.setAnimationLoop(() => {
  if (stage === "decision" && scenario?.decisionTimeout) {
    const elapsedMs = performance.now() - decisionStarted;
    const timeoutMs = (scenario.decisionTimeout.countdownSeconds + scenario.decisionTimeout.urgentSeconds) * 1000;
    if (elapsedMs >= timeoutMs) beginTimeoutVideo();
    else {
      const tick = Math.floor(elapsedMs / 1000);
      if (tick !== decisionDisplayTick) { decisionDisplayTick = tick; renderDom(); refreshXrPanel(); }
    }
  }
  if (depthVideo && video && !video.paused) { if (depthVideo.paused) depthVideo.play().catch(() => undefined); if (Math.abs(depthVideo.currentTime - video.currentTime) > .08) depthVideo.currentTime = video.currentTime; }
  if (!renderer.xr.isPresenting) camera.lookAt(directionFromYawPitch(yaw, pitch));
  const duration = placeholderStart ? placeholderDuration : Number.isFinite(video?.duration) ? video.duration : (stage === "dilemma" ? scenario?.dilemmaDuration : choice?.duration) || 15;
  const time = playbackTime();
  if (placeholderStart && time >= placeholderDuration) { placeholderStart = 0; if (stage === "timeout") { renderDom(); refreshXrPanel(); } else finishFilm(); }
  const dialogue = stage === "dilemma" ? scenario?.dialogue.dilemma : stage === "outcome" && choice ? scenario?.dialogue[choice.id] || [] : [];
  renderSubtitle(dialogue?.find((cue) => time >= cue.start && time <= cue.end) || null);
  progress.style.width = `${duration ? Math.min(time / duration, 1) * 100 : 0}%`;
  timeLabel.textContent = `${time.toFixed(1)} / ${Number(duration).toFixed(1)}s`;
  renderer.render(scene, camera);
});

async function initialize(nextScenarioId = activeScenarioId) {
  const response = await fetch(SCENARIO_URLS[nextScenarioId] || SCENARIO_URLS["scenario-01"]);
  if (!response.ok) throw new Error(`Unable to load ${nextScenarioId}`);
  scenario = await response.json();
  activeScenarioId = scenario.id;
  window.history.replaceState(null, "", scenario.id === "scenario-01" ? "/VR180/index.html" : `/VR180/index.html?scenario=${encodeURIComponent(scenario.id)}`);
  replayExperience();
  scenarioTitle.textContent = `${scenario.number} · ${scenario.titleEn}`;
  scenarioBrief.textContent = scenario.briefEn;
  document.title = `Scenario ${scenario.number} · WebXR`;
  status.textContent = "WEBXR EXPERIENCE READY";
}
initialize().catch((error) => { status.textContent = "SCENARIO COULD NOT LOAD"; ui.innerHTML = `<section class="panel"><h1>Unable to load this scenario.</h1><p class="panel-copy">${escapeHtml(error.message)}</p></section>`; console.error(error); });

window.__vr180 = { renderer, scene, camera, get video(){return video;}, get depthVideo(){return depthVideo;}, geometry: hemisphereGeometry, subtitleLayer, CAPTION_TRACKS, setView(nextYaw,nextPitch){yaw=nextYaw;pitch=nextPitch;} };
