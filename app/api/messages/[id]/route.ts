import { NextRequest, NextResponse } from "next/server";
import { getMessage, updateMessage } from "@/lib/store";
import { sanitizeText } from "@/lib/sanitize";
import { ADMIN_COOKIE, isValidSessionToken } from "@/lib/auth";
import type { Message } from "@/lib/types";

export const runtime = "nodejs";

async function requireAdmin(req: NextRequest) {
  const session = req.cookies.get(ADMIN_COOKIE)?.value;
  return isValidSessionToken(session);
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
  const patch: Partial<Pick<Message, "status" | "reply" | "repliedAt">> = {};

  if (typeof body.reply === "string") {
    const cleanReply = sanitizeText(body.reply).slice(0, 1000);
    if (cleanReply.length < 1) {
      return NextResponse.json({ error: "Resposta vazia." }, { status: 400 });
    }
    patch.reply = cleanReply;
    patch.repliedAt = Date.now();
    patch.status = "respondida";
  }

  if (typeof body.status === "string") {
    const allowed: Message["status"][] = ["nova", "lida", "respondida", "arquivada"];
    if (!allowed.includes(body.status as Message["status"])) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    patch.status = body.status as Message["status"];
  }

  const updated = await updateMessage(params.id, patch);
  return NextResponse.json({ ok: true, message: updated });
}
