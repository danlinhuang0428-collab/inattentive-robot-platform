export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { reviews?: Array<{ finalVerdict?: string }> } | null;
  if (!id || body?.reviews?.length !== 3 || body.reviews.some((review) => review.finalVerdict !== "accept")) return Response.json({ error: "All three videos must have an explicit accept verdict. Any P0/P1 failure blocks bundle acceptance." }, { status: 422 });
  return Response.json({ bundleId: id, status: "accepted", acceptedAt: new Date().toISOString() });
}

