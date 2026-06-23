import type {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";

import { deepseek } from "./client";
import { aiConfig } from "./config";
import {
  buildChatMessages,
  ensureConversation,
  loadConversationHistory,
  mergeSession,
  persistMessage,
} from "./context";
import { loadUserMemory, refreshUserMemory } from "./memory";
import { buildSystemInstructions } from "./prompts";
import {
  buildStructuredOutputPrompt,
  parseAgentReply,
} from "./schemas/agent-reply";
import {
  executeToolCall,
  getOpenAITools,
} from "./tools";
import type {
  AgentRunInput,
  AgentRunOutput,
  AgentSession,
  AgentToolCallRecord,
} from "./types";

/**
 * AI Agent — DeepSeek Chat Completions
 *
 * 架构说明：
 * - DeepSeek 不支持 OpenAI Responses API，使用 Chat Completions 等价实现
 * - Tool Calling：标准 OpenAI 格式 agentic loop
 * - Structured Outputs：工具执行完毕后 JSON Output 生成最终回复
 * - 上下文：DB 消息持久化（非 previous_response_id）
 *
 * 开发阶段：
 * Phase 1 ✅ 文本聊天
 * Phase 2 ✅ Tool Calling + Structured Output
 * Phase 3 🔜 实时语音 Agent
 */
export class Agent {
  async run(input: AgentRunInput): Promise<AgentRunOutput> {
    const { userId, message } = input;

    const session = await ensureConversation(
      userId,
      input.session?.conversationId,
    );

    const toolCtx = {
      userId,
      conversationId: session.conversationId,
    };

    let memory = await loadUserMemory(userId);
    let instructions = buildSystemInstructions(memory);
    const tools = getOpenAITools();

    const toolCallRecords: AgentToolCallRecord[] = [];

    const history = await loadConversationHistory(session.conversationId);
    await persistMessage(session.conversationId, "USER", message);

    const messages: ChatCompletionMessageParam[] = buildChatMessages({
      systemInstructions: instructions,
      history,
      userMessage: message,
    });

    let reply = "";
    let structured: AgentRunOutput["structured"];
    let hadToolCalls = false;

    for (let i = 0; i < aiConfig.maxToolIterations; i++) {
      const response = await deepseek.chat.completions.create({
        model: aiConfig.model,
        messages,
        tools,
        tool_choice: "auto",
        temperature: aiConfig.temperature,
      });

      const assistantMessage = response.choices[0]?.message;

      if (!assistantMessage) {
        throw new Error("DeepSeek returned empty completion");
      }

      const toolCalls = assistantMessage.tool_calls ?? [];

      if (toolCalls.length === 0) {
        const parsed = parseAgentReply(assistantMessage.content ?? "");
        reply = parsed.reply;
        structured = {
          status: parsed.status,
          toolsUsed: parsed.toolsUsed,
        };
        break;
      }

      hadToolCalls = true;
      messages.push(assistantMessageToParam(assistantMessage));

      for (const call of toolCalls) {
        const parsedArgs = safeParseJson(call.function.arguments);

        const output = await executeToolCall({
          ctx: toolCtx,
          toolCall: {
            id: call.id,
            type: "function",
            function: {
              name: call.function.name,
              arguments: call.function.arguments,
            },
          },
        });

        toolCallRecords.push({
          callId: call.id,
          name: call.function.name,
          arguments: parsedArgs,
          result: output.result,
          success: output.result.success,
        });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: output.output,
        });
      }

      if (toolCallRecords.some((t) => t.success && isProfileTool(t.name))) {
        memory = await refreshUserMemory(userId);
        instructions = buildSystemInstructions(memory);
        messages[0] = { role: "system", content: instructions };
      }
    }

    // 工具调用后：Structured Output 合成最终回复
    if (hadToolCalls && aiConfig.structuredOutput) {
      const synthesized = await this.synthesizeStructuredReply(messages);
      reply = synthesized.reply;
      structured = {
        status: synthesized.status,
        toolsUsed: synthesized.toolsUsed ?? toolCallRecords.map((t) => t.name),
      };
    }

    if (!reply) {
      reply = "抱歉，我暂时无法处理您的请求，请稍后再试。";
      structured = { status: "error" };
    }

    await persistMessage(session.conversationId, "ASSISTANT", reply);

    return {
      reply,
      structured,
      session: mergeSession(session, {}),
      toolCalls: toolCallRecords,
    };
  }

  /** 工具执行完毕后，用 JSON Output 生成结构化最终回复 */
  private async synthesizeStructuredReply(
    messages: ChatCompletionMessageParam[],
  ) {
    const response = await deepseek.chat.completions.create({
      model: aiConfig.model,
      messages: [
        ...messages,
        {
          role: "user",
          content: buildStructuredOutputPrompt(),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? "";
    return parseAgentReply(content);
  }
}

export const agent = new Agent();

function assistantMessageToParam(
  message: ChatCompletionMessage,
): ChatCompletionMessageParam {
  const param: ChatCompletionMessageParam = {
    role: "assistant",
    content: message.content,
  };

  if (message.tool_calls?.length) {
    return {
      ...param,
      tool_calls: message.tool_calls.map(
        (tc: ChatCompletionMessageToolCall) => ({
          id: tc.id,
          type: tc.type,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        }),
      ),
    };
  }

  return param;
}

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return { raw };
  }
}

function isProfileTool(name: string): boolean {
  return (
    name === "createUserProfile" ||
    name === "updateUserProfile" ||
    name === "getUserProfile"
  );
}

export type { AgentRunInput, AgentRunOutput, AgentSession };
