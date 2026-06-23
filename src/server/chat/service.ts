import { db } from "~/server/db";

export async function listConversations(userId: string) {
  const conversations = await db.conversation.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true, role: true },
      },
      _count: { select: { messages: true } },
    },
  });

  return conversations.map((conv) => ({
    id: conv.id,
    startedAt: conv.startedAt.toISOString(),
    preview:
      conv.messages[0]?.content.slice(0, 60) ??
      "新对话",
    messageCount: conv._count.messages,
  }));
}

export async function getConversationMessages(conversationId: string, userId: string) {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });

  if (!conversation) return null;

  const messages = await db.message.findMany({
    where: {
      conversationId,
      role: { in: ["USER", "ASSISTANT"] },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  }));
}

export async function createConversation(userId: string) {
  const conversation = await db.conversation.create({
    data: { userId },
    select: { id: true, startedAt: true },
  });

  return {
    id: conversation.id,
    startedAt: conversation.startedAt.toISOString(),
    preview: "新对话",
    messageCount: 0,
  };
}
