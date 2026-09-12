import { NextRequest, NextResponse } from "next/server";
import { listMessagesByVisitor } from "@/lib/store";
import { isValidVisitorId } from "@/lib/sanitize";

export const runtime = "nodejs";

/**
 * Public endpoint used by a *sender* to see only their own boxes — access is
 * gated by their private visitorId (a random token stored in their own
 * browser), never by admin session, so this never exposes anyone else's
 * messages.
 */
export async function GET(req: NextRequest) {
  const visitorId = req.nextUrl.searchParams.get("visitorId");
  if (!isValidVisitorId(visitorId)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }
  const messages = await listMessagesByVisitor(visitorId);
  return NextResponse.json({ messages });
}
