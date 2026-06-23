import { z } from "zod";

import { updateConversationConfirmation } from "~/server/contract/conversation-confirmation";

import { toToolFailure, ValidationError } from "./errors";
import {
  contractProfileFields,
  formatConversationPolicyRecord,
} from "./profile-fields";
import { defineTool } from "./helpers";

export const updateUserProfileParameters = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe("Updated policyholder name"),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
    .optional()
    .describe("Updated birthday in YYYY-MM-DD format"),
  phone: z.string().max(20).optional().describe("Updated phone number"),
  ...contractProfileFields,
});

function toConversationUpdate(args: z.infer<typeof updateUserProfileParameters>) {
  return {
    ...(args.name !== undefined && { policyholderName: args.name }),
    ...(args.birthday !== undefined && { birthday: args.birthday }),
    ...(args.phone !== undefined && { phone: args.phone }),
    ...(args.insuredName !== undefined && { insuredName: args.insuredName }),
    ...(args.annualPremium !== undefined && { annualPremium: args.annualPremium }),
    ...(args.paymentYears !== undefined && { paymentYears: args.paymentYears }),
    ...(args.coverageUntilAge !== undefined && {
      coverageUntilAge: args.coverageUntilAge,
    }),
    ...(args.beneficiary !== undefined && { beneficiary: args.beneficiary }),
  };
}

export const updateUserProfileTool = defineTool({
  name: "updateUserProfile",
  description:
    "Update confirmed contract fields for the CURRENT outbound call session only. Use when the customer confirms or corrects any field in this call.",
  parameters: updateUserProfileParameters,
  execute: async (ctx, args) => {
    try {
      if (!ctx.conversationId) {
        throw new ValidationError("No active conversation for this call session.");
      }

      const confirmation = await updateConversationConfirmation(
        ctx.conversationId,
        ctx.userId,
        toConversationUpdate(args),
      );

      if (!confirmation) {
        throw new ValidationError("Conversation not found for this call session.");
      }

      return {
        success: true,
        data: formatConversationPolicyRecord(confirmation),
      };
    } catch (error) {
      return toToolFailure(error);
    }
  },
});
