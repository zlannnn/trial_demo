import { db } from "~/server/db";
import {
  type ConversationConfirmation,
  mapConversationRecord,
} from "~/server/contract/conversation-confirmation";
import { computeTaskProgress, type ConfirmationTaskStatus } from "~/server/contract/tasks";

export interface ConversationSummaryFields {
  tasks: ConfirmationTaskStatus[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  finalized: boolean;
}

export interface ConversationSummary {
  id: string;
  startedAt: string;
  preview: string;
  messageCount: number;
  fields: ConversationSummaryFields;
}

export interface AdminConversationSummary extends ConversationSummary {
  userId: string;
  userEmail: string;
  userName: string | null;
}

const conversationSelect = {
  id: true,
  startedAt: true,
  userId: true,
  policyholderName: true,
  birthday: true,
  phone: true,
  insuredName: true,
  annualPremium: true,
  paymentYears: true,
  coverageUntilAge: true,
  beneficiary: true,
  contractConfirmedAt: true,
} as const;

function buildSummaryFields(
  confirmation: ConversationConfirmation,
): ConversationSummaryFields {
  const progress = computeTaskProgress(confirmation);
  return {
    tasks: progress.tasks,
    completedCount: progress.completedCount,
    totalCount: progress.totalCount,
    progressPercent: progress.progressPercent,
    finalized: progress.finalized,
  };
}

function buildPreview(content: string | undefined): string {
  return content?.slice(0, 60) ?? "新对话";
}

export async function listConversations(userId: string) {
  const conversations = await db.conversation.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 50,
    select: {
      ...conversationSelect,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true },
      },
      _count: { select: { messages: true } },
    },
  });

  return conversations.map((conv) => {
    const confirmation = mapConversationRecord(conv);
    return {
      id: conv.id,
      startedAt: conv.startedAt.toISOString(),
      preview: buildPreview(conv.messages[0]?.content),
      messageCount: conv._count.messages,
      fields: buildSummaryFields(confirmation),
    } satisfies ConversationSummary;
  });
}

export async function listAllConversationsForAdmin() {
  const conversations = await db.conversation.findMany({
    orderBy: { startedAt: "desc" },
    take: 200,
    select: {
      ...conversationSelect,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true },
      },
      _count: { select: { messages: true } },
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return conversations.map((conv) => {
    const confirmation = mapConversationRecord(conv);
    return {
      id: conv.id,
      startedAt: conv.startedAt.toISOString(),
      preview: buildPreview(conv.messages[0]?.content),
      messageCount: conv._count.messages,
      fields: buildSummaryFields(confirmation),
      userId: conv.userId,
      userEmail: conv.user.email,
      userName: conv.user.name,
    } satisfies AdminConversationSummary;
  });
}

export async function getConversationMessages(conversationId: string, userId: string) {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });

  if (!conversation) return null;

  return getConversationMessagesById(conversationId);
}

export async function getConversationMessagesById(conversationId: string) {
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

  const emptyFields = buildSummaryFields(
    mapConversationRecord({
      id: conversation.id,
      policyholderName: null,
      birthday: null,
      phone: null,
      insuredName: null,
      annualPremium: null,
      paymentYears: null,
      coverageUntilAge: null,
      beneficiary: null,
      contractConfirmedAt: null,
    }),
  );

  return {
    id: conversation.id,
    startedAt: conversation.startedAt.toISOString(),
    preview: "新对话",
    messageCount: 0,
    fields: emptyFields,
  } satisfies ConversationSummary;
}

export async function deleteConversation(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });

  if (!conversation) return false;

  await db.conversation.delete({ where: { id: conversationId } });
  return true;
}

export async function deleteAllConversations(userId: string): Promise<number> {
  const result = await db.conversation.deleteMany({ where: { userId } });
  return result.count;
}
