"use client";

const STORAGE_KEY = "andry_visitor_id";

/**
 * Returns a private random ID stored in this browser's localStorage,
 * creating one on first visit. This is what lets someone come back later
 * and see only the boxes they personally sent — it's never sent anywhere
 * else and nobody else can guess it.
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : `v${Date.now()}${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

const SENT_IDS_KEY = "andry_sent_message_ids";

export function rememberSentMessageId(id: string) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(SENT_IDS_KEY);
  const list: string[] = raw ? JSON.parse(raw) : [];
  if (!list.includes(id)) {
    list.unshift(id);
    window.localStorage.setItem(SENT_IDS_KEY, JSON.stringify(list.slice(0, 100)));
  }
}
