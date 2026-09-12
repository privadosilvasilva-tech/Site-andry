import { CATEGORIES, CategoryId } from "./categories";

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

function stripControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

export function sanitizeText(input: string): string {
  return stripControlChars(stripHtml(input)).trim();
}

export function isValidCategory(value: unknown): value is CategoryId {
  return typeof value === "string" && CATEGORIES.some((c) => c.id === value);
}

const VISITOR_ID_RE = /^[a-zA-Z0-9_-]{10,64}$/;

/**
 * The "visitorId" is a random token generated in the sender's browser and
 * saved to localStorage — it's what lets a person come back later and see
 * only the boxes they personally sent (their IP is also stored server-side
 * for Andry's reference, but IPs are shared/rotate too often to use as the
 * access key by themselves).
 */
export function isValidVisitorId(value: unknown): value is string {
  return typeof value === "string" && VISITOR_ID_RE.test(value);
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  name?: string;
  category?: CategoryId;
  text?: string;
  visitorId?: string;
}

export function validateMessageInput(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Dados inválidos." };
  }
  const { name, category, text, visitorId } = body as Record<string, unknown>;

  if (typeof name !== "string" || sanitizeText(name).length < 1) {
    return { ok: false, error: "Informe um nome." };
  }
  const cleanName = sanitizeText(name).slice(0, 40);
  if (cleanName.length < 1) {
    return { ok: false, error: "Nome inválido." };
  }

  if (!isValidCategory(category)) {
    return { ok: false, error: "Categoria inválida." };
  }

  if (typeof text !== "string" || sanitizeText(text).length < 2) {
    return { ok: false, error: "Escreva uma mensagem." };
  }
  const cleanText = sanitizeText(text).slice(0, 500);
  if (cleanText.length < 2) {
    return { ok: false, error: "Mensagem muito curta." };
  }
  if (cleanText.length > 500) {
    return { ok: false, error: "Mensagem muito longa (máx. 500 caracteres)." };
  }

  if (!isValidVisitorId(visitorId)) {
    return { ok: false, error: "Identificador inválido. Recarregue a página." };
  }

  return { ok: true, name: cleanName, category, text: cleanText, visitorId: visitorId as string };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
