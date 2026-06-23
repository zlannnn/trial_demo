import type { ConversationConfirmation } from "./conversation-confirmation";
import { emptyConversationConfirmation } from "./conversation-confirmation";

export interface ConfirmationTaskDef {
  id: string;
  label: string;
  hint: string;
  required: boolean;
}

export interface ConfirmationTaskStatus extends ConfirmationTaskDef {
  completed: boolean;
  value: string | null;
}

export interface TaskProgress {
  conversationId: string | null;
  tasks: ConfirmationTaskStatus[];
  completedCount: number;
  requiredCount: number;
  totalCount: number;
  progressPercent: number;
  allRequiredDone: boolean;
  finalized: boolean;
  nextPendingTask: ConfirmationTaskStatus | null;
}

/** 学资保险契约确认任务清单（按推荐采集顺序） */
export const CONFIRMATION_TASKS: ConfirmationTaskDef[] = [
  {
    id: "policyholder_name",
    label: "确认投保人姓名",
    hint: "主动问候并核对客户姓名，确认无误后入库",
    required: true,
  },
  {
    id: "identity",
    label: "身份核验（生日）",
    hint: "确认出生日期，用于身份核对",
    required: true,
  },
  {
    id: "phone",
    label: "确认联系电话",
    hint: "核对手机号码，确保后续可联系",
    required: true,
  },
  {
    id: "insured",
    label: "确认被保人",
    hint: "学资保险的被保人（通常为子女）姓名",
    required: true,
  },
  {
    id: "annual_premium",
    label: "确认年缴保费",
    hint: "主动说明并确认每年需缴纳的保费金额",
    required: true,
  },
  {
    id: "payment_years",
    label: "确认缴费年限",
    hint: "确认总共需要缴费多少年",
    required: true,
  },
  {
    id: "coverage_until",
    label: "确认保障期限",
    hint: "确认保障至多少岁或保障年限",
    required: true,
  },
  {
    id: "beneficiary",
    label: "确认受益人",
    hint: "确认保险受益人姓名及关系",
    required: true,
  },
  {
    id: "finalize",
    label: "完成契约确认",
    hint: "全部信息入库后，正式完成确认并告知客户可以结束通话",
    required: true,
  },
];

function getTaskValue(
  taskId: string,
  confirmation: ConversationConfirmation,
): string | null {
  switch (taskId) {
    case "policyholder_name":
      return confirmation.policyholderName?.trim() || null;
    case "identity":
      return confirmation.birthday?.trim() || null;
    case "phone":
      return confirmation.phone?.trim() || null;
    case "insured":
      return confirmation.insuredName?.trim() || null;
    case "annual_premium":
      return confirmation.annualPremium?.trim() || null;
    case "payment_years":
      return confirmation.paymentYears?.trim() || null;
    case "coverage_until":
      return confirmation.coverageUntilAge?.trim() || null;
    case "beneficiary":
      return confirmation.beneficiary?.trim() || null;
    case "finalize":
      return confirmation.contractConfirmedAt;
    default:
      return null;
  }
}

function isTaskComplete(
  taskId: string,
  confirmation: ConversationConfirmation,
): boolean {
  if (taskId === "finalize") {
    return !!confirmation.contractConfirmedAt;
  }
  return !!getTaskValue(taskId, confirmation);
}

export function computeTaskProgress(
  confirmation: ConversationConfirmation | null,
): TaskProgress {
  const data = confirmation ?? emptyConversationConfirmation();

  const tasks: ConfirmationTaskStatus[] = CONFIRMATION_TASKS.map((task) => ({
    ...task,
    completed: isTaskComplete(task.id, data),
    value: getTaskValue(task.id, data),
  }));

  const requiredTasks = tasks.filter((t) => t.required);
  const dataTasks = tasks.filter((t) => t.id !== "finalize");
  const allDataDone = dataTasks.every((t) => t.completed);
  const finalized = tasks.find((t) => t.id === "finalize")?.completed ?? false;

  const nextPendingTask =
    tasks.find((t) => !t.completed && t.id !== "finalize") ??
    (allDataDone && !finalized
      ? (tasks.find((t) => t.id === "finalize") ?? null)
      : null);

  const completedCount = tasks.filter((t) => t.completed).length;

  return {
    conversationId: confirmation?.conversationId ?? null,
    tasks,
    completedCount,
    requiredCount: requiredTasks.length,
    totalCount: tasks.length,
    progressPercent: Math.round((completedCount / tasks.length) * 100),
    allRequiredDone: allDataDone,
    finalized,
    nextPendingTask,
  };
}

export function formatTasksForPrompt(
  confirmation: ConversationConfirmation | null,
): string {
  const progress = computeTaskProgress(confirmation);

  if (progress.finalized) {
    return "✅ 本次外呼的契约确认已全部完成。客户可以结束通话。如需补充说明，简短回应即可，勿重复采集。";
  }

  const lines = progress.tasks.map((task) => {
    const status = task.completed ? "✅ 已完成" : "⬜ 待完成";
    const value = task.completed && task.value ? `（${task.value}）` : "";
    return `- ${task.label}: ${status}${value}`;
  });

  const next = progress.nextPendingTask;
  const nextHint = next
    ? `\n\n**当前应优先推进**：${next.label} — ${next.hint}`
    : "";

  return `${lines.join("\n")}${nextHint}`;
}

export function getMissingTaskLabels(
  confirmation: ConversationConfirmation,
): string[] {
  const progress = computeTaskProgress(confirmation);
  return progress.tasks
    .filter((t) => t.id !== "finalize" && !t.completed)
    .map((t) => t.label);
}

export function emptyTaskProgress(): TaskProgress {
  return computeTaskProgress(null);
}
