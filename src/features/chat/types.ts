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

export interface ConversationSummaryFields {
  tasks: ConfirmationTaskStatus[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  finalized: boolean;
}

export interface ConversationSummary {
  id: string;
  startedAt: string;
  preview: string;
  messageCount: number;
  fields: ConversationSummaryFields;
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
  taskProgress?: TaskProgress;
}

export interface ConfirmationTaskStatus {
  id: string;
  label: string;
  hint: string;
  required: boolean;
  completed: boolean;
  value: string | null;
}

export interface TaskProgress {
  conversationId: string | null;
  tasks: ConfirmationTaskStatus[];
  completedCount: number;
  requiredCount: number;
  totalCount: number;
  progressPercent: number;
  allRequiredDone: boolean;
  finalized: boolean;
  nextPendingTask: ConfirmationTaskStatus | null;
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
