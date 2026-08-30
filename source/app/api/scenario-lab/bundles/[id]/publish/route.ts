export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { status?: string; explicit?: boolean } | null;
  if (!id || body?.status !== "accepted" || !body.explicit) return Response.json({ error: "Publishing is separate from acceptance and requires an explicit accepted-bundle action." }, { status: 409 });
  return Response.json({ bundleId: id, publishedAt: new Date().toISOString(), experiencePortLinked: true, cacheVersion: Date.now() });
}
