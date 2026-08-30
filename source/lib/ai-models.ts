export const AI_MODELS = {
  textFast: "google/gemini-3.1-flash-lite",
  textComplex: "google/gemini-3.5-flash",
  imageFast: "fal-ai/flux/schnell",
  imageReference: "fal-ai/nano-banana-2/edit",
  finalVideo: "minimax/h3/image-to-video",
  videoUnderstanding: "fal-ai/video-understanding",
} as const;

export type TextComplexity = "fast" | "complex";

export function textModel(complexity: TextComplexity) {
  if (complexity === "complex") return process.env.OPENROUTER_COMPLEX_MODEL?.trim() || AI_MODELS.textComplex;
  return process.env.OPENROUTER_FAST_MODEL?.trim() || AI_MODELS.textFast;
}

export function falModel(kind: "imageFast" | "imageReference" | "finalVideo" | "videoUnderstanding") {
  const envName = {
    imageFast: "FAL_IMAGE_FAST_MODEL",
    imageReference: "FAL_IMAGE_REFERENCE_MODEL",
    finalVideo: "FAL_VIDEO_MODEL",
    videoUnderstanding: "FAL_VIDEO_QA_MODEL",
  }[kind];
  return process.env[envName]?.trim() || AI_MODELS[kind];
}
