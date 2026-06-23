import { z } from "zod";

/**
 * Agent 最终回复 — DeepSeek JSON Output (Structured Output)
 * 文档要求 prompt 中包含 "json" 字样
 */
export const agentReplySchema = z.object({
  reply: z.string().min(1).describe("给用户的自然语言中文回复"),
  status: z
    .enum(["completed", "needs_clarification", "error"])
    .default("completed"),
  toolsUsed: z.array(z.string()).optional(),
});

export type AgentStructuredReply = z.infer<typeof agentReplySchema>;

export const STRUCTURED_OUTPUT_INSTRUCTION = `
当你完成所有工具调用、需要给用户最终回复时，必须输出 JSON（不要 markdown 代码块）：
{
  "reply": "给用户的中文回复",
  "status": "completed | needs_clarification | error",
  "toolsUsed": ["可选，已调用的工具名"]
}
`.trim();

export function parseAgentReply(raw: string): AgentStructuredReply {
  const trimmed = raw.trim();

  try {
    const json = JSON.parse(trimmed) as unknown;
    return agentReplySchema.parse(json);
  } catch {
    // 模型未按 JSON 格式返回时降级为纯文本
    return {
      reply: trimmed,
      status: "completed",
    };
  }
}

export function buildStructuredOutputPrompt(): string {
  return `请以 json 格式输出最终回复。${STRUCTURED_OUTPUT_INSTRUCTION}`;
}
