import { z } from "zod";

import { db } from "~/server/db";

import { toToolFailure, ValidationError } from "./errors";
import { defineTool } from "./helpers";

export const searchConversationHistoryParameters = z.object({
  query: z
    .string()
    .min(1)
    .max(200)
    .describe("Keyword or phrase to search in the current call session messages"),
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
    "Search messages within the CURRENT outbound call session only. Cannot search past calls.",
  parameters: searchConversationHistoryParameters,
  execute: async (ctx, args) => {
    try {
      if (!ctx.conversationId) {
        throw new ValidationError("No active conversation for this call session.");
      }

      const limit = args.limit ?? 10;

      const messages = await db.message.findMany({
        where: {
          conversationId: ctx.conversationId,
          content: { contains: args.query, mode: "insensitive" },
          conversation: { userId: ctx.userId },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return {
        success: true,
        data: {
          query: args.query,
          conversationId: ctx.conversationId,
          total: messages.length,
          results: messages.map((msg) => ({
            messageId: msg.id,
            conversationId: msg.conversationId,
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
