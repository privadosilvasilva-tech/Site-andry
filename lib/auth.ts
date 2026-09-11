import { timingSafeEqual as nodeTimingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "andry_admin_session";

// Default password requested for this deployment. Override it in production
// by setting the ADMIN_PASSWORD environment variable in Vercel.
const DEFAULT_PASSWORD = "pybHjWU/T3nv&jE";

const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

// Only used inside the login API route, which always runs on the Node.js
// runtime, so Node's `crypto` module is safe to use here.
export function checkPassword(candidate: string): boolean {
  const expected = getAdminPassword();
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return nodeTimingSafeEqual(a, b);
}

// HMAC-SHA256 via Web Crypto (SubtleCrypto) — available in both the Node.js
// runtime and the Edge runtime (middleware), unlike Node's `crypto` module.
async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmacHex(getSecret(), `andry-session.${ts}`);
  return `${ts}.${sig}`;
}

export async function isValidSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  if (Date.now() - tsNum > SESSION_MAX_AGE_MS) return false;

  const expected = await hmacHex(getSecret(), `andry-session.${ts}`);
  return constantTimeEqual(expected, sig);
}
