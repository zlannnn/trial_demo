import type { ConversationConfirmation } from "~/server/contract/conversation-confirmation";

import { z } from "zod";

/** 学资保险契约相关字段，供 create/update profile 共用 */
export const contractProfileFields = {
  insuredName: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe("被保人姓名（学资保险通常为子女），如 张小明"),
  annualPremium: z
    .string()
    .max(50)
    .optional()
    .describe("年缴保费金额，如 12000元 或 1万2千元"),
  paymentYears: z
    .string()
    .max(50)
    .optional()
    .describe("缴费年限，如 10年 或 缴至18岁"),
  coverageUntilAge: z
    .string()
    .max(50)
    .optional()
    .describe("保障期限，如 保至25岁 或 保障20年"),
  beneficiary: z
    .string()
    .max(100)
    .optional()
    .describe("受益人姓名及关系，如 妻子 李女士"),
} as const;

export interface ConversationPolicyRecord {
  conversationId: string;
  policyholderName: string | null;
  birthday: string | null;
  phone: string | null;
  insuredName: string | null;
  annualPremium: string | null;
  paymentYears: string | null;
  coverageUntilAge: string | null;
  beneficiary: string | null;
  contractConfirmedAt: string | null;
}

export function formatConversationPolicyRecord(
  confirmation: ConversationConfirmation,
): ConversationPolicyRecord {
  return {
    conversationId: confirmation.conversationId,
    policyholderName: confirmation.policyholderName,
    birthday: confirmation.birthday,
    phone: confirmation.phone,
    insuredName: confirmation.insuredName,
    annualPremium: confirmation.annualPremium,
    paymentYears: confirmation.paymentYears,
    coverageUntilAge: confirmation.coverageUntilAge,
    beneficiary: confirmation.beneficiary,
    contractConfirmedAt: confirmation.contractConfirmedAt,
  };
}
