export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { scenarioId?: string; videoType?: string; sourceClips?: Array<{ taskId?: string; outputUrl?: string }>; assemblyPlan?: { clipOrder?: string[] } } | null;
  if (!body?.scenarioId || !body.videoType || !body.sourceClips?.every((clip) => clip.taskId && clip.outputUrl)) return Response.json({ error: "Succeeded source clips and an assembly plan are required." }, { status: 422 });
  return Response.json({ provider: "deterministic-manifest", manifest: { sourceClips: body.sourceClips, clipOrder: body.assemblyPlan?.clipOrder ?? [], trim: [], audioTransitions: ["continuous room tone"], webDerivative: `scenario-${body.scenarioId}-${body.videoType.replaceAll("_", "-")}.mp4`, codec: "H.264 High / yuv420p / AAC stereo / fast-start" } });
}
