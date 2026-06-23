import { z } from "zod";

import { db } from "~/server/db";

import { toToolFailure } from "./errors";
import { defineTool } from "./helpers";

export const searchConversationHistoryParameters = z.object({
  query: z
    .string()
    .min(1)
    .max(200)
    .describe("Keyword or phrase to search in past conversation messages"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe("Maximum number of matching messages to return (default 10)"),
});

export const searchConversationHistoryTool = defineTool({
  name: "searchConversationHistory",
  description:
    "Search the user's past conversation messages by keyword. Use when the user asks about something discussed before or wants to recall past chats.",
  parameters: searchConversationHistoryParameters,
  execute: async (ctx, args) => {
    try {
      const limit = args.limit ?? 10;

      const messages = await db.message.findMany({
        where: {
          content: { contains: args.query, mode: "insensitive" },
          conversation: { userId: ctx.userId },
        },
        include: {
          conversation: {
            select: { id: true, startedAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return {
        success: true,
        data: {
          query: args.query,
          total: messages.length,
          results: messages.map((msg) => ({
            messageId: msg.id,
            conversationId: msg.conversationId,
            conversationStartedAt: msg.conversation.startedAt.toISOString(),
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt.toISOString(),
          })),
        },
      };
    } catch (error) {
      return toToolFailure(error);
    }
  },
});
