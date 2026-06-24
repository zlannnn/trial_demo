import { db } from "~/server/db";

import { formatBirthday, parseBirthday } from "../ai/tools/helpers";

export interface ConversationConfirmation {
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

export function emptyConversationConfirmation(
  conversationId = "",
): ConversationConfirmation {
  return {
    conversationId,
    policyholderName: null,
    birthday: null,
    phone: null,
    insuredName: null,
    annualPremium: null,
    paymentYears: null,
    coverageUntilAge: null,
    beneficiary: null,
    contractConfirmedAt: null,
  };
}

export function mapConversationRecord(
  conversation: {
    id: string;
    policyholderName: string | null;
    birthday: Date | null;
    phone: string | null;
    insuredName: string | null;
    annualPremium: string | null;
    paymentYears: string | null;
    coverageUntilAge: string | null;
    beneficiary: string | null;
    contractConfirmedAt: Date | null;
  },
): ConversationConfirmation {
  return {
    conversationId: conversation.id,
    policyholderName: conversation.policyholderName,
    birthday: formatBirthday(conversation.birthday),
    phone: conversation.phone,
    insuredName: conversation.insuredName,
    annualPremium: conversation.annualPremium,
    paymentYears: conversation.paymentYears,
    coverageUntilAge: conversation.coverageUntilAge,
    beneficiary: conversation.beneficiary,
    contractConfirmedAt: conversation.contractConfirmedAt?.toISOString() ?? null,
  };
}

const confirmationSelect = {
  id: true,
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

export async function loadConversationConfirmation(
  conversationId: string,
  userId: string,
): Promise<ConversationConfirmation | null> {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, userId },
    select: confirmationSelect,
  });

  if (!conversation) return null;
  return mapConversationRecord(conversation);
}

export async function loadConversationConfirmationById(
  conversationId: string,
): Promise<ConversationConfirmation | null> {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId },
    select: confirmationSelect,
  });

  if (!conversation) return null;
  return mapConversationRecord(conversation);
}

export interface ConversationConfirmationUpdate {
  policyholderName?: string;
  birthday?: string;
  phone?: string;
  insuredName?: string;
  annualPremium?: string;
  paymentYears?: string;
  coverageUntilAge?: string;
  beneficiary?: string;
}

export async function updateConversationConfirmation(
  conversationId: string,
  userId: string,
  data: ConversationConfirmationUpdate,
): Promise<ConversationConfirmation | null> {
  const existing = await db.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });

  if (!existing) return null;

  const updated = await db.conversation.update({
    where: { id: conversationId },
    data: {
      ...(data.policyholderName !== undefined && {
        policyholderName: data.policyholderName,
      }),
      ...(data.birthday !== undefined && {
        birthday: parseBirthday(data.birthday),
      }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.insuredName !== undefined && { insuredName: data.insuredName }),
      ...(data.annualPremium !== undefined && {
        annualPremium: data.annualPremium,
      }),
      ...(data.paymentYears !== undefined && {
        paymentYears: data.paymentYears,
      }),
      ...(data.coverageUntilAge !== undefined && {
        coverageUntilAge: data.coverageUntilAge,
      }),
      ...(data.beneficiary !== undefined && { beneficiary: data.beneficiary }),
    },
    select: {
      id: true,
      policyholderName: true,
      birthday: true,
      phone: true,
      insuredName: true,
      annualPremium: true,
      paymentYears: true,
      coverageUntilAge: true,
      beneficiary: true,
      contractConfirmedAt: true,
    },
  });

  return mapConversationRecord(updated);
}

export async function finalizeConversationConfirmation(
  conversationId: string,
  userId: string,
  summary?: string,
): Promise<ConversationConfirmation | null> {
  const existing = await db.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true, contractConfirmedAt: true },
  });

  if (!existing) return null;

  const confirmedAt = existing.contractConfirmedAt ?? new Date();
  const updated = await db.conversation.update({
    where: { id: conversationId },
    data: {
      contractConfirmedAt: confirmedAt,
    },
    select: {
      id: true,
      policyholderName: true,
      birthday: true,
      phone: true,
      insuredName: true,
      annualPremium: true,
      paymentYears: true,
      coverageUntilAge: true,
      beneficiary: true,
      contractConfirmedAt: true,
    },
  });

  void summary;
  return mapConversationRecord(updated);
}
