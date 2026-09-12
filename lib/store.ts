import { nanoid } from "nanoid";
import type { ChatEntry, CreateMessageInput, Message } from "./types";

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
const memoryVisitorIndex = new Map<string, string[]>(); // visitorId -> message ids
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
  const now = Date.now();
  const firstEntry: ChatEntry = {
    id: nanoid(8),
    from: "visitor",
    text: input.text.slice(0, 500),
    at: now,
  };

  const message: Message = {
    id: nanoid(10),
    name: input.name.slice(0, 40),
    category: input.category,
    visitorId: input.visitorId,
    ip: input.ip,
    createdAt: now,
    updatedAt: now,
    status: "nova",
    entries: [firstEntry],
  };

  const client = await getKv();
  if (client) {
    await client.set(`message:${message.id}`, message);
    await client.lpush("messages:ids", message.id);
    await client.lpush(`visitor:${message.visitorId}:ids`, message.id);
  } else {
    memoryMessages.set(message.id, message);
    memoryOrder.unshift(message.id);
    const arr = memoryVisitorIndex.get(message.visitorId) ?? [];
    arr.unshift(message.id);
    memoryVisitorIndex.set(message.visitorId, arr);
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
    return raw.filter((m): m is Message => Boolean(m)).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  return memoryOrder
    .map((id) => memoryMessages.get(id))
    .filter((m): m is Message => Boolean(m))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listMessagesByVisitor(visitorId: string): Promise<Message[]> {
  const client = await getKv();
  if (client) {
    const ids = await client.lrange<string>(`visitor:${visitorId}:ids`, 0, -1);
    if (!ids.length) return [];
    const keys = ids.map((id) => `message:${id}`);
    const raw = await client.mget<Message[]>(...keys);
    return raw.filter((m): m is Message => Boolean(m)).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  const ids = memoryVisitorIndex.get(visitorId) ?? [];
  return ids
    .map((id) => memoryMessages.get(id))
    .filter((m): m is Message => Boolean(m))
    .sort((a, b) => b.updatedAt - a.updatedAt);
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
  patch: Partial<Pick<Message, "status">>
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

/**
 * Appends one entry (visitor message or Andry reply) to a message's chat
 * thread. Used both by the public reply endpoint (visitor keeps chatting in
 * their own box) and by the admin PATCH endpoint (Andry replies).
 */
export async function addEntry(
  id: string,
  from: ChatEntry["from"],
  text: string
): Promise<Message | null> {
  const client = await getKv();
  const existing = client ? await client.get<Message>(`message:${id}`) : memoryMessages.get(id);
  if (!existing) return null;

  const entry: ChatEntry = { id: nanoid(8), from, text, at: Date.now() };
  const updated: Message = {
    ...existing,
    entries: [...existing.entries, entry],
    updatedAt: Date.now(),
    status: from === "andry" ? "respondida" : "nova",
  };

  if (client) {
    await client.set(`message:${id}`, updated);
  } else {
    memoryMessages.set(id, updated);
  }
  return updated;
}

const RATE_LIMIT_SECONDS = 60;

/**
 * Server-side rate limit: one *new box* per IP every 60 seconds. Replies
 * inside an existing conversation use a shorter limit (see checkReplyRateLimit).
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

const REPLY_RATE_LIMIT_SECONDS = 5;

/** Lighter rate limit for follow-up messages inside an already-open chat box. */
export async function checkReplyRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = `rlreply:${ip}`;
  const client = await getKv();

  if (client) {
    const setResult = await client.set(key, Date.now(), {
      nx: true,
      ex: REPLY_RATE_LIMIT_SECONDS,
    });
    if (setResult) return { allowed: true, retryAfterSeconds: 0 };
    const ttl = await client.ttl(key);
    return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : REPLY_RATE_LIMIT_SECONDS };
  }

  const now = Date.now();
  const expiry = memoryRateLimits.get(key);
  if (!expiry || expiry <= now) {
    memoryRateLimits.set(key, now + REPLY_RATE_LIMIT_SECONDS * 1000);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return { allowed: false, retryAfterSeconds: Math.ceil((expiry - now) / 1000) };
}
