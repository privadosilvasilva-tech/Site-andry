import { CategoryId } from "./categories";

export interface ChatEntry {
  id: string;
  from: "visitor" | "andry";
  text: string;
  at: number;
}

export interface Message {
  id: string;
  name: string;
  category: CategoryId;
  visitorId: string;
  ip: string;
  createdAt: number;
  updatedAt: number;
  status: "nova" | "lida" | "respondida" | "arquivada";
  entries: ChatEntry[];
}

export interface CreateMessageInput {
  name: string;
  category: CategoryId;
  text: string;
  visitorId: string;
  ip: string;
}
