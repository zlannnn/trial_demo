export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
}

export interface ToolCallInfo {
  callId: string;
  name: string;
  arguments: Record<string, unknown>;
  success: boolean;
  result?: unknown;
}

export interface ConversationSummary {
  id: string;
  startedAt: string;
  preview: string;
  messageCount: number;
}

export interface ChatSession {
  conversationId?: string;
}

export type ChatStatus = "idle" | "loading" | "recording" | "transcribing" | "error";

export interface SendMessageResponse {
  reply: string;
  conversationId: string;
  structured?: {
    status: "completed" | "needs_clarification" | "error";
    toolsUsed?: string[];
  };
  toolCalls: ToolCallInfo[];
  messages: ChatMessage[];
}

export interface AppConfig {
  provider: string;
  model: string;
  voice: {
    sttEnabled: boolean;
    ttsEnabled: boolean;
    sttAvailable: boolean;
    ttsAvailable: boolean;
    realtimeEnabled: boolean;
    unavailableHint?: string;
  };
}
