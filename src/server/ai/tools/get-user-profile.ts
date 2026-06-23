import { z } from "zod";

import {
  emptyConversationConfirmation,
  loadConversationConfirmation,
} from "~/server/contract/conversation-confirmation";

import { toToolFailure, ValidationError } from "./errors";
import { formatConversationPolicyRecord } from "./profile-fields";
import { defineTool } from "./helpers";

export const getUserProfileParameters = z.object({});

export const getUserProfileTool = defineTool({
  name: "getUserProfile",
  description:
    "Retrieve contract information saved in the CURRENT outbound call session only. Cannot access data from other calls.",
  parameters: getUserProfileParameters,
  execute: async (ctx) => {
    try {
      if (!ctx.conversationId) {
        throw new ValidationError("No active conversation for this call session.");
      }

      const confirmation = await loadConversationConfirmation(
        ctx.conversationId,
        ctx.userId,
      );

      if (!confirmation) {
        return {
          success: true,
          data: {
            exists: false,
            profile: null,
            message: "No policy data saved in this call session yet.",
          },
        };
      }

      const hasAnyField = Object.entries(confirmation).some(
        ([key, value]) =>
          key !== "conversationId" &&
          key !== "contractConfirmedAt" &&
          value !== null,
      );

      if (!hasAnyField) {
        return {
          success: true,
          data: {
            exists: false,
            profile: formatConversationPolicyRecord(
              emptyConversationConfirmation(ctx.conversationId),
            ),
            message: "No policy data saved in this call session yet.",
          },
        };
      }

      return {
        success: true,
        data: {
          exists: true,
          profile: formatConversationPolicyRecord(confirmation),
        },
      };
    } catch (error) {
      return toToolFailure(error);
    }
  },
});
