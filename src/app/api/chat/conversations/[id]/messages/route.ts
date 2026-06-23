import { NextResponse } from "next/server";

import { getOrCreateDemoUser } from "~/server/auth/demo-user";
import { getConversationMessages } from "~/server/chat/service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getOrCreateDemoUser();
    const messages = await getConversationMessages(id, user.id);

    if (!messages) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[GET /api/chat/conversations/:id/messages]", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}
