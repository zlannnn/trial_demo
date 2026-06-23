import type { MessageRole } from "@prisma/client";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/** Agent 会话状态 — 上下文由 DB 消息持久化，不依赖 Responses API chain */
export interface AgentSession {
  conversationId: string;
}

export interface AgentRunInput {
  userId: string;
  message: string;
  session?: Partial<AgentSession>;
}

export interface AgentToolCallRecord {
  callId: string;
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
  success: boolean;
}

export interface AgentRunOutput {
  reply: string;
  structured?: {
    status: "completed" | "needs_clarification" | "error";
    toolsUsed?: string[];
  };
  session: AgentSession;
  toolCalls: AgentToolCallRecord[];
}

export interface UserMemory {
  userId: string;
  name: string | null;
  email: string;
}

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export type ChatMessageParam = ChatCompletionMessageParam;
