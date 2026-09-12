import { NextRequest, NextResponse } from "next/server";
import { addEntry, checkReplyRateLimit, getMessage } from "@/lib/store";
import { getClientIp, isValidVisitorId, sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

/**
 * Lets the original sender keep chatting inside a box they already created.
 * Access is verified by matching the visitorId sent in the body against the
 * visitorId stored on the message — so only the person who sent it can add
 * to it or read it back, exactly like the "mine" endpoint.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const visitorId = (body as Record<string, unknown> | null)?.visitorId;
  const text = (body as Record<string, unknown> | null)?.text;

  if (!isValidVisitorId(visitorId)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const existing = await getMessage(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  }
  if (existing.visitorId !== visitorId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const ip = getClientIp(req.headers);
  const rate = await checkReplyRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Aguarde um instante antes de enviar outra mensagem.", retryAfterSeconds: rate.retryAfterSeconds },
      { status: 429 }
    );
  }

  if (typeof text !== "string") {
    return NextResponse.json({ error: "Escreva uma mensagem." }, { status: 400 });
  }
  const cleanText = sanitizeText(text).slice(0, 500);
  if (cleanText.length < 1) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  const updated = await addEntry(params.id, "visitor", cleanText);
  return NextResponse.json({ ok: true, message: updated });
}
