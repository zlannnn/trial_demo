import { z } from "zod";

import { db } from "~/server/db";

import { toToolFailure } from "./errors";
import { defineTool } from "./helpers";

export const createConversationParameters = z.object({});

export const createConversationTool = defineTool({
  name: "createConversation",
  description:
    "Start a new conversation session. Use at the beginning of a new chat or when the user explicitly wants to start fresh.",
  parameters: createConversationParameters,
  execute: async (ctx) => {
    try {
      const conversation = await db.conversation.create({
        data: {
          userId: ctx.userId,
        },
      });

      return {
        success: true,
        data: {
          id: conversation.id,
          userId: conversation.userId,
          startedAt: conversation.startedAt.toISOString(),
        },
      };
    } catch (error) {
      return toToolFailure(error);
    }
  },
});
