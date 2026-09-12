import { NextRequest, NextResponse } from "next/server";
import { addEntry, getMessage, updateMessage } from "@/lib/store";
import { isValidVisitorId, sanitizeText } from "@/lib/sanitize";
import { ADMIN_COOKIE, isValidSessionToken } from "@/lib/auth";
import type { Message } from "@/lib/types";

export const runtime = "nodejs";

async function requireAdmin(req: NextRequest) {
  const session = req.cookies.get(ADMIN_COOKIE)?.value;
  return isValidSessionToken(session);
}

/**
 * Fetch a single box — used for the live polling in the sender's own chat
 * widget. Allowed either for the admin (Andry) or for the original sender,
 * identified by their private visitorId passed as a query param.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getMessage(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Não encontrada." }, { status: 404 });
  }

  if (await requireAdmin(req)) {
    return NextResponse.json({ message: existing });
  }

  const visitorId = req.nextUrl.searchParams.get("visitorId");
  if (isValidVisitorId(visitorId) && existing.visitorId === visitorId) {
    return NextResponse.json({ message: existing });
  }

  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const existing = await getMessage(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  let result: Message | null = existing;

  if (typeof body.reply === "string") {
    const cleanReply = sanitizeText(body.reply).slice(0, 1000);
    if (cleanReply.length < 1) {
      return NextResponse.json({ error: "Resposta vazia." }, { status: 400 });
    }
    result = await addEntry(params.id, "andry", cleanReply);
  }

  if (typeof body.status === "string") {
    const allowed: Message["status"][] = ["nova", "lida", "respondida", "arquivada"];
    if (!allowed.includes(body.status as Message["status"])) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    result = await updateMessage(params.id, { status: body.status as Message["status"] });
  }

  return NextResponse.json({ ok: true, message: result });
}
