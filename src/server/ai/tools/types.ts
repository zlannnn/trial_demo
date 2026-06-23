import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { z } from "zod";

/** 工具执行上下文 — userId 始终从 Session 注入，不信任 AI 传参 */
export interface ToolContext {
  userId: string;
  /** 当前语音/聊天会话 ID，saveMessage 等工具可默认使用 */
  conversationId?: string;
}

export interface ToolSuccessResult<T = unknown> {
  success: true;
  data: T;
}

export interface ToolFailureResult {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ToolResult<T = unknown> = ToolSuccessResult<T> | ToolFailureResult;

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
  openaiDefinition: ChatCompletionTool;
  execute: (ctx: ToolContext, args: unknown) => Promise<ToolResult>;
}

export interface OpenAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ResponsesFunctionCall {
  call_id: string;
  name: string;
  arguments: string;
}

/** 将 Responses API function_call item 转为 executor 通用格式 */
export function toOpenAIToolCall(call: ResponsesFunctionCall): OpenAIToolCall {
  return {
    id: call.call_id,
    type: "function",
    function: {
      name: call.name,
      arguments: call.arguments,
    },
  };
}

export interface ExecutorOptions {
  /** 是否写入 FunctionCallLog，默认 true */
  persistLog?: boolean;
}
