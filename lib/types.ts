import { CategoryId } from "./categories";

export interface Message {
  id: string;
  name: string;
  category: CategoryId;
  text: string;
  createdAt: number;
  status: "nova" | "lida" | "respondida" | "arquivada";
  reply?: string;
  repliedAt?: number;
}

export interface CreateMessageInput {
  name: string;
  category: CategoryId;
  text: string;
}
