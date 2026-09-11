import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, createMessage, listMessages } from "@/lib/store";
import { validateMessageInput, getClientIp } from "@/lib/sanitize";
import { ADMIN_COOKIE, isValidSessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const validation = validateMessageInput(body);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const ip = getClientIp(req.headers);
  const rate = await checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Aguarde antes de enviar outra mensagem.", retryAfterSeconds: rate.retryAfterSeconds },
      { status: 429 }
    );
  }

  const message = await createMessage({
    name: validation.name!,
    category: validation.category!,
    text: validation.text!,
  });

  return NextResponse.json({ ok: true, id: message.id });
}

export async function GET(req: NextRequest) {
  const session = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!(await isValidSessionToken(session))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const messages = await listMessages();
  return NextResponse.json({ messages });
}
