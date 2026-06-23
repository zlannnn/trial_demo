import { NextResponse } from "next/server";
import { z } from "zod";

import { agent } from "~/server/ai/agent";
import { getOrCreateDemoUser } from "~/server/auth/demo-user";
import { getConversationMessages } from "~/server/chat/service";

export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join("; ") },
        { status: 400 },
      );
    }

    const user = await getOrCreateDemoUser();

    const result = await agent.run({
      userId: user.id,
      message: parsed.data.message,
      session: {
        conversationId: parsed.data.conversationId,
      },
    });

    const messages = await getConversationMessages(
      result.session.conversationId,
      user.id,
    );

    return NextResponse.json({
      reply: result.reply,
      conversationId: result.session.conversationId,
      structured: result.structured,
      toolCalls: result.toolCalls.map((tc) => ({
        callId: tc.callId,
        name: tc.name,
        arguments: tc.arguments,
        success: tc.success,
        result: tc.result,
      })),
      messages: messages ?? [],
    });
  } catch (error) {
    console.error("[POST /api/chat]", error);
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
