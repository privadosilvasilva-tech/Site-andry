import { nanoid } from "nanoid";
import type { CreateMessageInput, Message } from "./types";

const KV_CONFIGURED = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

// ---------------------------------------------------------------------------
// In-memory fallback (used only when Vercel KV env vars are not present, e.g.
// running `npm run dev` locally without linking a KV store). Data does not
// persist across server restarts / serverless cold starts — for a real
// deployment on Vercel, always add the KV integration described in README.md
// ---------------------------------------------------------------------------
const memoryMessages = new Map<string, Message>();
const memoryOrder: string[] = [];
const memoryRateLimits = new Map<string, number>(); // key -> expiry epoch ms

type KvClient = typeof import("@vercel/kv").kv;
let kv: KvClient | null = null;
async function getKv() {
  if (!KV_CONFIGURED) return null;
  if (!kv) {
    const mod = await import("@vercel/kv");
    kv = mod.kv;
  }
  return kv;
}

export async function createMessage(input: CreateMessageInput): Promise<Message> {
  const message: Message = {
    id: nanoid(10),
    name: input.name.slice(0, 40),
    category: input.category,
    text: input.text.slice(0, 500),
    createdAt: Date.now(),
    status: "nova",
  };

  const client = await getKv();
  if (client) {
    await client.set(`message:${message.id}`, message);
    await client.lpush("messages:ids", message.id);
  } else {
    memoryMessages.set(message.id, message);
    memoryOrder.unshift(message.id);
  }

  return message;
}

export async function listMessages(): Promise<Message[]> {
  const client = await getKv();
  if (client) {
    const ids = await client.lrange<string>("messages:ids", 0, -1);
    if (!ids.length) return [];
    const keys = ids.map((id) => `message:${id}`);
    const raw = await client.mget<Message[]>(...keys);
    return raw.filter((m): m is Message => Boolean(m)).sort((a, b) => b.createdAt - a.createdAt);
  }
  return memoryOrder
    .map((id) => memoryMessages.get(id))
    .filter((m): m is Message => Boolean(m))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMessage(id: string): Promise<Message | null> {
  const client = await getKv();
  if (client) {
    const msg = await client.get<Message>(`message:${id}`);
    return msg ?? null;
  }
  return memoryMessages.get(id) ?? null;
}

export async function updateMessage(
  id: string,
  patch: Partial<Pick<Message, "status" | "reply" | "repliedAt">>
): Promise<Message | null> {
  const client = await getKv();
  if (client) {
    const existing = await client.get<Message>(`message:${id}`);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    await client.set(`message:${id}`, updated);
    return updated;
  }
  const existing = memoryMessages.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  memoryMessages.set(id, updated);
  return updated;
}

const RATE_LIMIT_SECONDS = 60;

/**
 * Server-side rate limit: one message per IP every 60 seconds.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
 */
export async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = `rl:${ip}`;
  const client = await getKv();

  if (client) {
    const setResult = await client.set(key, Date.now(), {
      nx: true,
      ex: RATE_LIMIT_SECONDS,
    });
    if (setResult) {
      return { allowed: true, retryAfterSeconds: 0 };
    }
    const ttl = await client.ttl(key);
    return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : RATE_LIMIT_SECONDS };
  }

  const now = Date.now();
  const expiry = memoryRateLimits.get(key);
  if (!expiry || expiry <= now) {
    memoryRateLimits.set(key, now + RATE_LIMIT_SECONDS * 1000);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return { allowed: false, retryAfterSeconds: Math.ceil((expiry - now) / 1000) };
}
