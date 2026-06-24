import { z } from "zod";

import {
  getConversationMessagesById,
  listAllConversationsForAdmin,
} from "~/server/chat/service";
import { loadConversationConfirmationById } from "~/server/contract/conversation-confirmation";
import { computeTaskProgress } from "~/server/contract/tasks";
import { db } from "~/server/db";

import { adminProcedure, createTRPCRouter } from "../trpc";

export const adminRouter = createTRPCRouter({
  listAllConversations: adminProcedure.query(async () => {
    const conversations = await listAllConversationsForAdmin();
    return { conversations };
  }),

  getConversationDetail: adminProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => {
      const row = await db.conversation.findFirst({
        where: { id: input.conversationId },
        select: {
          id: true,
          startedAt: true,
          userId: true,
          user: { select: { email: true, name: true } },
          _count: { select: { messages: true } },
        },
      });

      if (!row) {
        throw new Error("Conversation not found");
      }

      const confirmation = await loadConversationConfirmationById(
        input.conversationId,
      );
      if (!confirmation) {
        throw new Error("Conversation not found");
      }

      const messages = await getConversationMessagesById(input.conversationId);
      const taskProgress = computeTaskProgress(confirmation);

      return {
        conversation: {
          id: row.id,
          startedAt: row.startedAt.toISOString(),
          messageCount: row._count.messages,
          userId: row.userId,
          userEmail: row.user.email,
          userName: row.user.name,
        },
        messages,
        taskProgress,
      };
    }),
});
