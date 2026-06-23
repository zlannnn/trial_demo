import { NextResponse } from "next/server";

import { getOrCreateDemoUser } from "~/server/auth/demo-user";
import { listConversations } from "~/server/chat/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getOrCreateDemoUser();
    const conversations = await listConversations(user.id);
    return NextResponse.json({ conversations, userId: user.id });
  } catch (error) {
    console.error("[GET /api/chat/conversations]", error);
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const user = await getOrCreateDemoUser();
    const { createConversation } = await import("~/server/chat/service");
    const conversation = await createConversation(user.id);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("[POST /api/chat/conversations]", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}
