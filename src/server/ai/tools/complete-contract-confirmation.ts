import { z } from "zod";

import {
  finalizeConversationConfirmation,
  loadConversationConfirmation,
} from "~/server/contract/conversation-confirmation";
import { getMissingTaskLabels } from "~/server/contract/tasks";

import { NotFoundError, toToolFailure, ValidationError } from "./errors";
import { defineTool } from "./helpers";

export const completeContractConfirmationParameters = z.object({
  summary: z
    .string()
    .max(500)
    .optional()
    .describe("Optional brief summary of what was confirmed in this call"),
});

export const completeContractConfirmationTool = defineTool({
  name: "completeContractConfirmation",
  description:
    "Mark the CURRENT call session's contract confirmation as fully completed. Call ONLY after all 8 data fields have been saved for this conversation via createUserProfile/updateUserProfile.",
  parameters: completeContractConfirmationParameters,
  execute: async (ctx, args) => {
    try {
      if (!ctx.conversationId) {
        throw new ValidationError("No active conversation for this call session.");
      }

      const confirmation = await loadConversationConfirmation(
        ctx.conversationId,
        ctx.userId,
      );

      if (!confirmation) {
        throw new NotFoundError("Conversation");
      }

      const missing = getMissingTaskLabels(confirmation);
      if (missing.length > 0) {
        throw new ValidationError(
          `仍有未完成项，无法完成确认：${missing.join("、")}`,
        );
      }

      if (confirmation.contractConfirmedAt) {
        return {
          success: true,
          data: {
            alreadyConfirmed: true,
            conversationId: ctx.conversationId,
            confirmedAt: confirmation.contractConfirmedAt,
            message: "本次外呼的契约确认此前已完成。",
          },
        };
      }

      const updated = await finalizeConversationConfirmation(
        ctx.conversationId,
        ctx.userId,
        args.summary,
      );

      return {
        success: true,
        data: {
          conversationId: ctx.conversationId,
          confirmedAt: updated!.contractConfirmedAt,
          message: "本次外呼契约确认已完成，记录已入库。",
        },
      };
    } catch (error) {
      return toToolFailure(error);
    }
  },
});
