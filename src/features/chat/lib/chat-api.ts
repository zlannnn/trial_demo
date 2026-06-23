import type {
  AppConfig,
  ChatMessage,
  ConversationSummary,
  SendMessageResponse,
} from "../types";

export async function fetchAppConfig(): Promise<AppConfig> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Failed to load app config");
  return res.json();
}

export async function fetchConversations(): Promise<{
  conversations: ConversationSummary[];
  userId: string;
}> {
  const res = await fetch("/api/chat/conversations");
  if (!res.ok) throw new Error("Failed to load conversations");
  return res.json();
}

export async function createConversation(): Promise<ConversationSummary> {
  const res = await fetch("/api/chat/conversations", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function fetchMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const res = await fetch(
    `/api/chat/conversations/${conversationId}/messages`,
  );
  if (!res.ok) throw new Error("Failed to load messages");
  const data = (await res.json()) as { messages: ChatMessage[] };
  return data.messages;
}

export async function sendChatMessage(params: {
  message: string;
  conversationId?: string;
}): Promise<SendMessageResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to send message");
  }

  return res.json();
}
