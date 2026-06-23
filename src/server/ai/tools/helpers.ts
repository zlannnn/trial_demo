import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { z } from "zod";
import { z as zod } from "zod";

import type { ToolContext, ToolDefinition, ToolResult } from "./types";

/** 将 Zod Object Schema 转为 OpenAI function parameters JSON Schema */
export function zodToOpenAIParameters(
  schema: z.ZodObject<z.ZodRawShape>,
): Record<string, unknown> {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    properties[key] = zodFieldToJsonSchema(value as z.ZodType);
    if (!(value as z.ZodType).isOptional()) {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  };
}

function zodFieldToJsonSchema(field: z.ZodType): Record<string, unknown> {
  if (field instanceof zod.ZodOptional) {
    return zodFieldToJsonSchema(field.unwrap() as z.ZodType);
  }

  if (field instanceof zod.ZodString) {
    const schema: Record<string, unknown> = { type: "string" };
    if (field.description) schema.description = field.description;
    return schema;
  }

  if (field instanceof zod.ZodNumber) {
    const schema: Record<string, unknown> = { type: "number" };
    if (field.description) schema.description = field.description;
    return schema;
  }

  if (field instanceof zod.ZodEnum) {
    return {
      type: "string",
      enum: field.options,
      ...(field.description ? { description: field.description } : {}),
    };
  }

  if (field instanceof zod.ZodBoolean) {
    return { type: "boolean" };
  }

  return { type: "string" };
}

export function defineTool<TSchema extends z.ZodObject<z.ZodRawShape>>(config: {
  name: string;
  description: string;
  parameters: TSchema;
  execute: (
    ctx: ToolContext,
    args: z.infer<TSchema>,
  ) => Promise<ToolResult<unknown>>;
}): ToolDefinition {
  const openaiDefinition: ChatCompletionTool = {
    type: "function",
    function: {
      name: config.name,
      description: config.description,
      parameters: zodToOpenAIParameters(config.parameters),
    },
  };

  return {
    name: config.name,
    description: config.description,
    parameters: config.parameters,
    openaiDefinition,
    execute: (ctx, args) => config.execute(ctx, args as z.infer<TSchema>),
  };
}

/** ISO date string → Date (date only) */
export function parseBirthday(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${value}`);
  }
  return date;
}

export function formatBirthday(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}
