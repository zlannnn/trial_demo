import { z } from "zod";

import { db } from "~/server/db";

import { ForbiddenError, NotFoundError, toToolFailure } from "./errors";
import { defineTool } from "./helpers";

const messageRoleEnum = z.enum(["USER", "ASSISTANT", "SYSTEM", "TOOL"]);

export const saveMessageParameters = z.object({
  conversationId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Target conversation ID. Falls back to the current session conversation if omitted.",
    ),
  role: messageRoleEnum.describe(
    "Message role: USER, ASSISTANT, SYSTEM, or TOOL",
  ),
  content: z
    .string()
    .min(1)
    .max(10000)
    .describe("Message text content to persist"),
});

export const saveMessageTool = defineTool({
  name: "saveMessage",
  description:
    "Persist a message to a conversation. Use to save user utterances or assistant replies for history tracking.",
  parameters: saveMessageParameters,
  execute: async (ctx, args) => {
    try {
      const conversationId = args.conversationId ?? ctx.conversationId;

      if (!conversationId) {
        throw new NotFoundError(
          "Conversation ID — provide conversationId or set ctx.conversationId",
        );
      }

      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, userId: true },
      });

      if (!conversation) {
        throw new NotFoundError("Conversation");
      }

      if (conversation.userId !== ctx.userId) {
        throw new ForbiddenError("Cannot save message to another user's conversation");
      }

      const message = await db.message.create({
        data: {
          conversationId,
          role: args.role,
          content: args.content,
        },
      });

      return {
        success: true,
        data: {
          id: message.id,
          conversationId: message.conversationId,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        },
      };
    } catch (error) {
      return toToolFailure(error);
    }
  },
});
