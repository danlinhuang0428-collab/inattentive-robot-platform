import * as THREE from "three";
import { buildHemisphere, directionFromYawPitch } from "./projection.js";

const params = new URLSearchParams(window.location.search);
const VARIANTS = {
  current: {
    video: "./assets/scenario-01-vr180.mp4?v=4",
    depth: "./assets/scenario-01-vr180.depth.mp4",
    captions: "current",
  },
  "h3-exact": {
    video: "./assets/scenario-01-vr180-candidate-minimax-h3-exact.mp4",
    depth: null,
    captions: "h3-exact",
  },
  "h3-natural": {
    video: "./assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.mp4",
    depth: "./assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.depth.mp4",
    captions: "h3-natural",
  },
  "h3-natural-depth": {
    video: "./assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.mp4",
    depth: "./assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.depth.mp4",
    captions: "h3-natural",
  },
};
const variantName = params.get("variant") || "current";
const selectedVariant = VARIANTS[variantName] || VARIANTS.current;
// Bump this token whenever the mastered media changes so headsets do not reuse a stale MP4.
const VIDEO_URL = params.get("video") || selectedVariant.video;
const POSTER_URL = "./assets/scenario-01-vr180-start.png";
const depthParam = params.get("depth");
const depthUrl = depthParam === "off" ? null : depthParam || selectedVariant.depth;

const canvas = document.querySelector("#vr-view");
const startButton = document.querySelector("#start-scene");
const vrButton = document.querySelector("#enter-vr");
const backLink = document.querySelector("#back-scenarios");
const status = document.querySelector("#viewer-status");
const progress = document.querySelector("#progress-fill");
const timeLabel = document.querySelector("#time-label");
document.querySelector(".mode").textContent = depthUrl ? "DEPTH STEREO · 180°" : "VR180 · MONO PREVIEW";
document.querySelector(".technical span").textContent = depthUrl ? "Quest: depth-enhanced stereo" : "Quest: monoscopic preview";

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType("local");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);
const camera = new THREE.PerspectiveCamera(80, 1, 0.1, 1000);
camera.layers.enable(1);
scene.add(camera);

const CAPTION_TRACKS = {
  current: [
    { start: 0.3, end: 4.13, speaker: "妈妈", text: "慢一点，这锅刚开。我们一起放到台上。" },
    { start: 4.6, end: 7.1, speaker: "外婆", text: "我要回家，他们都在等我。" },
    { start: 9.2, end: 12.03, speaker: "机器人", text: "妹妹！表妹！快去拦住外婆！" },
    { start: 12.6, end: 14.73, speaker: "妈妈", text: "别松手！这锅还没放稳！" },
  ],
  "h3-exact": [
    { start: 0.0, end: 4.3, speaker: "妈妈", text: "慢一点，这锅刚开。我们一起放到台上。" },
    { start: 4.4, end: 8.1, speaker: "外婆", text: "我要回家，他们都在等我。" },
    { start: 8.2, end: 12.2, speaker: "机器人", text: "妹妹！表妹！快去拦住外婆！" },
    { start: 12.3, end: 15.0, speaker: "妈妈", text: "别松手！这锅还没放稳！" },
  ],
  "h3-natural": [
    { start: 0.0, end: 4.2, speaker: "妈妈", text: "慢点儿，汤刚开。来，跟我一起稳稳放到台上。" },
    { start: 4.3, end: 8.0, speaker: "外婆", text: "我要回家，他们还在等我呢。" },
    { start: 8.1, end: 12.1, speaker: "机器人", text: "妹妹！表妹！快来拦住外婆！" },
    { start: 12.2, end: 15.0, speaker: "妈妈", text: "先别松手！锅还没放稳！" },
  ],
};
const SUBTITLES = CAPTION_TRACKS[params.get("captions") || selectedVariant.captions] || CAPTION_TRACKS.current;

const subtitleCanvas = document.createElement("canvas");
subtitleCanvas.width = 2048;
subtitleCanvas.height = 320;
const subtitleContext = subtitleCanvas.getContext("2d");
const subtitleTexture = new THREE.CanvasTexture(subtitleCanvas);
subtitleTexture.colorSpace = THREE.SRGBColorSpace;
subtitleTexture.minFilter = THREE.LinearFilter;
subtitleTexture.magFilter = THREE.LinearFilter;
const subtitleMaterial = new THREE.MeshBasicMaterial({
  map: subtitleTexture,
  transparent: true,
  depthTest: false,
  depthWrite: false,
  toneMapped: false,
  side: THREE.DoubleSide,
});
const subtitleLayer = new THREE.Mesh(new THREE.PlaneGeometry(3.35, 0.52), subtitleMaterial);
subtitleLayer.position.set(0, -0.78, -2.55);
subtitleLayer.renderOrder = 1000;
subtitleLayer.frustumCulled = false;
subtitleLayer.layers.set(1);
subtitleLayer.layers.enable(2);
subtitleLayer.visible = false;
camera.add(subtitleLayer);

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

let renderedSubtitle = null;
function renderSubtitle(cue) {
  if (cue === renderedSubtitle) return;
  renderedSubtitle = cue;
  subtitleContext.clearRect(0, 0, subtitleCanvas.width, subtitleCanvas.height);
  subtitleLayer.visible = Boolean(cue);
  if (!cue) {
    subtitleTexture.needsUpdate = true;
    return;
  }

  roundedRect(subtitleContext, 54, 44, 1940, 226, 42);
  subtitleContext.fillStyle = "rgba(0, 0, 0, 0.72)";
  subtitleContext.fill();
  subtitleContext.textAlign = "center";
  subtitleContext.textBaseline = "middle";
  subtitleContext.shadowColor = "rgba(0, 0, 0, 0.95)";
  subtitleContext.shadowBlur = 10;
  subtitleContext.font = '600 42px -apple-system, BlinkMacSystemFont, "Noto Sans SC", "PingFang SC", sans-serif';
  subtitleContext.fillStyle = "#f0c878";
  subtitleContext.fillText(cue.speaker, 1024, 105);
  subtitleContext.font = '700 58px -apple-system, BlinkMacSystemFont, "Noto Sans SC", "PingFang SC", sans-serif';
  subtitleContext.fillStyle = "#ffffff";
  subtitleContext.fillText(cue.text, 1024, 194);
  subtitleTexture.needsUpdate = true;
}

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

const video = document.createElement("video");
video.src = VIDEO_URL;
video.poster = POSTER_URL;
video.crossOrigin = "anonymous";
video.loop = false;
video.playsInline = true;
video.preload = "auto";
const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.SRGBColorSpace;

let depthVideo = null;
let depthTexture = null;
if (depthUrl) {
  depthVideo = document.createElement("video");
  depthVideo.src = depthUrl;
  depthVideo.crossOrigin = "anonymous";
  depthVideo.loop = false;
  depthVideo.muted = true;
  depthVideo.playsInline = true;
  depthVideo.preload = "auto";
  depthTexture = new THREE.VideoTexture(depthVideo);
  depthTexture.colorSpace = THREE.NoColorSpace;
}

function depthMaterial(eyeSign) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: videoTexture },
      depthMap: { value: depthTexture },
      eyeSign: { value: eyeSign },
      maxDisparity: { value: 1.1 / 180 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D map;
      uniform sampler2D depthMap;
      uniform float eyeSign;
      uniform float maxDisparity;
      void main() {
        float inverseDepth = texture2D(depthMap, vUv).r;
        float shift = eyeSign * maxDisparity * inverseDepth;
        vec2 colorUv = vec2(clamp(vUv.x + shift, 0.0, 1.0), vUv.y);
        gl_FragColor = texture2D(map, colorUv);
      }
    `,
  });
}

const geometry = buildHemisphere({ radius: 200, segments: 128 });
if (depthTexture) {
  for (const [eyeSign, layer] of [[-1, 1], [1, 2]]) {
    const mesh = new THREE.Mesh(geometry, depthMaterial(eyeSign));
    mesh.layers.set(layer);
    scene.add(mesh);
  }
} else {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: videoTexture }));
  mesh.layers.set(1);
  mesh.layers.enable(2);
  scene.add(mesh);
}

let yaw = 0;
let pitch = 0;
let dragging = false;
let pointerX = 0;
let pointerY = 0;

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  pointerX = event.clientX;
  pointerY = event.clientY;
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener("pointerup", () => { dragging = false; });
canvas.addEventListener("pointercancel", () => { dragging = false; });
canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  yaw = Math.max(-110, Math.min(110, yaw - (event.clientX - pointerX) * 0.18));
  pitch = Math.max(-85, Math.min(85, pitch + (event.clientY - pointerY) * 0.18));
  pointerX = event.clientX;
  pointerY = event.clientY;
});

async function playScene() {
  video.muted = false;
  try {
    await video.play();
  } catch {
    video.muted = true;
    await video.play().catch(() => undefined);
  }
  await depthVideo?.play().catch(() => undefined);
  startButton.classList.add("hidden");
  status.textContent = "SCENE PLAYING";
}

startButton.addEventListener("click", playScene);
backLink.addEventListener("click", (event) => {
  event.preventDefault();
  if (window.history.length > 1) window.history.back();
  else window.location.assign("/");
});

let xrSession = null;
async function configureVrButton() {
  const supported = Boolean(navigator.xr && await navigator.xr.isSessionSupported?.("immersive-vr").catch(() => false));
  vrButton.disabled = !supported;
  vrButton.textContent = supported ? "Enter VR" : "VR requires a supported headset";
  document.documentElement.dataset.xr = supported ? "available" : "unavailable";
}

configureVrButton();
vrButton.addEventListener("click", async () => {
  if (xrSession) {
    await xrSession.end();
    return;
  }
  try {
    xrSession = await navigator.xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor"] });
    xrSession.addEventListener("end", () => {
      xrSession = null;
      vrButton.textContent = "Enter VR";
    });
    await renderer.xr.setSession(xrSession);
    vrButton.textContent = "Exit VR";
    await playScene();
  } catch (error) {
    status.textContent = "VR SESSION COULD NOT START";
    console.error("Unable to start immersive VR", error);
  }
});

video.addEventListener("loadedmetadata", () => {
  status.textContent = `${video.videoWidth} × ${video.videoHeight} · ${depthUrl ? "DEPTH STEREO READY" : "VR180 READY"}`;
});
video.addEventListener("ended", () => {
  status.textContent = "SCENARIO COMPLETE";
  startButton.textContent = "Replay scenario";
  startButton.classList.remove("hidden");
});

renderer.setAnimationLoop(() => {
  if (depthVideo && !video.paused) {
    if (depthVideo.paused) depthVideo.play().catch(() => undefined);
    if (Math.abs(depthVideo.currentTime - video.currentTime) > 0.08) depthVideo.currentTime = video.currentTime;
  }
  if (!renderer.xr.isPresenting) camera.lookAt(directionFromYawPitch(yaw, pitch));
  const duration = Number.isFinite(video.duration) ? video.duration : 15;
  renderSubtitle(SUBTITLES.find((cue) => video.currentTime >= cue.start && video.currentTime <= cue.end) || null);
  const ratio = duration > 0 ? Math.min(video.currentTime / duration, 1) : 0;
  progress.style.width = `${ratio * 100}%`;
  timeLabel.textContent = `${video.currentTime.toFixed(1)} / ${duration.toFixed(1)}s`;
  renderer.render(scene, camera);
});

window.__vr180 = { renderer, scene, camera, video, depthVideo, geometry, subtitleLayer, subtitles: SUBTITLES, setView(nextYaw, nextPitch) { yaw = nextYaw; pitch = nextPitch; } };
