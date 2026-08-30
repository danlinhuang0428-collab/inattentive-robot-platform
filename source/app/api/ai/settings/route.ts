import { falStatus } from "../../../../lib/server/fal";
import { openRouterStatus } from "../../../../lib/server/openrouter";

export async function GET() {
  return Response.json({ openRouter: openRouterStatus(), fal: falStatus() }, { headers: { "Cache-Control": "no-store" } });
}
