import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { FunctionTool } from "openai/resources/responses/responses";
import type { z } from "zod";

import { zodToOpenAIParameters } from "./helpers";
import { completeContractConfirmationTool } from "./complete-contract-confirmation";
import { createConversationTool } from "./create-conversation";
import { createUserProfileTool } from "./create-user-profile";
import { getUserProfileTool } from "./get-user-profile";
import { saveMessageTool } from "./save-message";
import { searchConversationHistoryTool } from "./search-conversation-history";
import type { ToolDefinition } from "./types";
import { updateUserProfileTool } from "./update-user-profile";

/** 所有可用工具，按名称索引 */
export const toolRegistry = {
  createUserProfile: createUserProfileTool,
  updateUserProfile: updateUserProfileTool,
  getUserProfile: getUserProfileTool,
  completeContractConfirmation: completeContractConfirmationTool,
  createConversation: createConversationTool,
  saveMessage: saveMessageTool,
  searchConversationHistory: searchConversationHistoryTool,
} as const;

export type ToolName = keyof typeof toolRegistry;

export const toolNames = Object.keys(toolRegistry) as ToolName[];

/** 获取单个工具定义 */
export function getTool(name: string): ToolDefinition | undefined {
  return toolRegistry[name as ToolName];
}

/** 获取全部 OpenAI Tool 定义，用于 Chat/Realtime API 的 tools 参数 */
export function getOpenAITools(): ChatCompletionTool[] {
  return toolNames.map((name) => toolRegistry[name].openaiDefinition);
}

/** 获取 Responses API 格式的 tools（扁平结构，无嵌套 function 字段） */
export function getResponsesTools(): FunctionTool[] {
  return toolNames.map((name) => {
    const tool = toolRegistry[name];
    return {
      type: "function",
      name: tool.name,
      description: tool.description,
      parameters: zodToOpenAIParameters(
        tool.parameters as z.ZodObject<z.ZodRawShape>,
      ),
      strict: true,
    };
  });
}
