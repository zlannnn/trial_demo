import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { db } from "~/server/db";

import { aiConfig } from "./config";
import type { AgentSession, ConversationMessage } from "./types";

export async function ensureConversation(
  userId: string,
  conversationId?: string,
): Promise<AgentSession> {
  if (conversationId) {
    const existing = await db.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    return { conversationId: existing.id };
  }

  const conversation = await db.conversation.create({
    data: { userId },
    select: { id: true },
  });

  return { conversationId: conversation.id };
}

export async function loadConversationHistory(
  conversationId: string,
  limit = aiConfig.maxHistoryMessages,
): Promise<ConversationMessage[]> {
  return db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      role: true,
      content: true,
      createdAt: true,
    },
  });
}

export function historyToChatMessages(
  messages: ConversationMessage[],
): ChatCompletionMessageParam[] {
  return messages
    .filter((msg) => msg.role === "USER" || msg.role === "ASSISTANT")
    .map((msg) => ({
      role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));
}

export async function persistMessage(
  conversationId: string,
  role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL",
  content: string,
): Promise<void> {
  await db.message.create({
    data: {
      conversationId,
      role,
      content,
    },
  });
}

export function buildChatMessages(params: {
  systemInstructions: string;
  history?: ConversationMessage[];
  userMessage: string;
}): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: params.systemInstructions },
  ];

  if (params.history?.length) {
    messages.push(...historyToChatMessages(params.history));
  }

  messages.push({ role: "user", content: params.userMessage });

  return messages;
}

export function mergeSession(
  base: AgentSession,
  update: Partial<AgentSession>,
): AgentSession {
  return {
    conversationId: update.conversationId ?? base.conversationId,
  };
}
