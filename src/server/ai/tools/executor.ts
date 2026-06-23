import { FunctionCallStatus, Prisma } from "@prisma/client";

import { db } from "~/server/db";

import { toToolFailure, UnknownToolError, ValidationError } from "./errors";
import type { ToolErrorCode } from "./errors";
import { getTool, toolNames } from "./registry";
import type {
  ExecutorOptions,
  OpenAIToolCall,
  ToolContext,
  ToolResult,
} from "./types";

export interface ExecuteToolCallInput {
  ctx: ToolContext;
  toolCall: OpenAIToolCall;
  options?: ExecutorOptions;
}

export interface ExecuteToolCallOutput {
  toolCallId: string;
  toolName: string;
  result: ToolResult;
  /** 可直接回传给 OpenAI 的 JSON 字符串 */
  output: string;
}

/**
 * 执行单个 OpenAI tool_call
 *
 * 流程：解析 JSON → Zod 校验 → 权限/业务执行 → 审计日志
 */
export async function executeToolCall(
  input: ExecuteToolCallInput,
): Promise<ExecuteToolCallOutput> {
  const { ctx, toolCall, options = {} } = input;
  const { persistLog = true } = options;
  const toolName = toolCall.function.name;

  let parsedArgs: unknown;
  let result: ToolResult;

  const tool = getTool(toolName);

  if (!tool) {
    const failure = toToolFailure(new UnknownToolError(toolName));
    result = failure;

    if (persistLog) {
      await persistFunctionCallLog({
        userId: ctx.userId,
        conversationId: ctx.conversationId,
        functionName: toolName,
        arguments: { raw: toolCall.function.arguments },
        result: failure,
        status: FunctionCallStatus.REJECTED,
      });
    }

    return buildOutput(toolCall.id, toolName, result);
  }

  // Step 1: 解析 JSON
  try {
    parsedArgs = JSON.parse(toolCall.function.arguments || "{}");
  } catch {
    result = toToolFailure(
      new ValidationError("Tool arguments must be valid JSON"),
    );

    if (persistLog) {
      await persistFunctionCallLog({
        userId: ctx.userId,
        conversationId: ctx.conversationId,
        functionName: toolName,
        arguments: { raw: toolCall.function.arguments },
        result,
        status: FunctionCallStatus.FAILED,
      });
    }

    return buildOutput(toolCall.id, toolName, result);
  }

  // Step 2: Zod 校验
  const validation = tool.parameters.safeParse(parsedArgs);

  if (!validation.success) {
    const message = validation.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");

    result = toToolFailure(new ValidationError(message));

    if (persistLog) {
      await persistFunctionCallLog({
        userId: ctx.userId,
        conversationId: ctx.conversationId,
        functionName: toolName,
        arguments: parsedArgs as Record<string, unknown>,
        result,
        status: FunctionCallStatus.FAILED,
      });
    }

    return buildOutput(toolCall.id, toolName, result);
  }

  // Step 3: 执行工具
  try {
    result = await tool.execute(ctx, validation.data);
  } catch (error) {
    result = toToolFailure(error);
  }

  // Step 4: 审计日志
  if (persistLog) {
    await persistFunctionCallLog({
      userId: ctx.userId,
      conversationId: ctx.conversationId,
      functionName: toolName,
      arguments: validation.data as Record<string, unknown>,
      result,
      status: resolveLogStatus(result),
    });
  }

  return buildOutput(toolCall.id, toolName, result);
}

/**
 * 批量执行 OpenAI 返回的多个 tool_calls
 */
export async function executeToolCalls(
  ctx: ToolContext,
  toolCalls: OpenAIToolCall[],
  options?: ExecutorOptions,
): Promise<ExecuteToolCallOutput[]> {
  return Promise.all(
    toolCalls.map((toolCall) =>
      executeToolCall({ ctx, toolCall, options }),
    ),
  );
}

function buildOutput(
  toolCallId: string,
  toolName: string,
  result: ToolResult,
): ExecuteToolCallOutput {
  return {
    toolCallId,
    toolName,
    result,
    output: JSON.stringify(result),
  };
}

async function persistFunctionCallLog(params: {
  userId: string;
  conversationId?: string;
  functionName: string;
  arguments: Record<string, unknown>;
  result: ToolResult;
  status: FunctionCallStatus;
}) {
  try {
    await db.functionCallLog.create({
      data: {
        userId: params.userId,
        conversationId: params.conversationId,
        functionName: params.functionName,
        arguments: params.arguments as Prisma.InputJsonValue,
        result: params.result as unknown as Prisma.InputJsonValue,
        status: params.status,
      },
    });
  } catch (error) {
    console.error("[ToolExecutor] Failed to persist FunctionCallLog:", error);
  }
}

/** 列出所有已注册工具名称（调试用） */
export function listRegisteredTools(): string[] {
  return [...toolNames];
}

const REJECTED_CODES: ToolErrorCode[] = [
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "CONFLICT",
  "FORBIDDEN",
  "UNKNOWN_TOOL",
  "INVALID_JSON",
];

function resolveLogStatus(result: ToolResult): FunctionCallStatus {
  if (result.success) return FunctionCallStatus.SUCCESS;
  if (REJECTED_CODES.includes(result.error.code as ToolErrorCode)) {
    return FunctionCallStatus.REJECTED;
  }
  return FunctionCallStatus.FAILED;
}
