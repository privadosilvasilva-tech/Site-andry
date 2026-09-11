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

export interface ValidationResult {
  ok: boolean;
  error?: string;
  name?: string;
  category?: CategoryId;
  text?: string;
}

export function validateMessageInput(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Dados inválidos." };
  }
  const { name, category, text } = body as Record<string, unknown>;

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

  return { ok: true, name: cleanName, category, text: cleanText };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
