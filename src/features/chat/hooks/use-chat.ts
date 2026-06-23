"use client";

import { useCallback, useRef, useState } from "react";

import { useVoiceInput } from "~/features/voice/hooks/use-voice-input";
import { useVoiceOutput } from "~/features/voice/hooks/use-voice-output";
import { api } from "~/trpc/react";

import type {
  AppConfig,
  ChatMessage,
  ChatSession,
  ChatStatus,
  ConversationSummary,
  TaskProgress,
  ToolCallInfo,
} from "../types";

export function useChat() {
  const utils = api.useUtils();

  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCallInfo[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

  const sessionRef = useRef<ChatSession>({});

  const voiceInput = useVoiceInput({ language: "zh" });
  const voiceOutput = useVoiceOutput();

  const { data: appConfigData } = api.config.getAppConfig.useQuery(undefined, {
    staleTime: 60_000,
  });
  const appConfig: AppConfig | null = appConfigData ?? null;

  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = api.chat.listConversations.useQuery(undefined, {
    staleTime: 10_000,
  });
  const conversations: ConversationSummary[] =
    conversationsData?.conversations ?? [];

  const createConversationMutation = api.chat.createConversation.useMutation({
    onSuccess: async () => {
      await utils.chat.listConversations.invalidate();
    },
  });

  const deleteConversationMutation = api.chat.deleteConversation.useMutation({
    onSuccess: async () => {
      await utils.chat.listConversations.invalidate();
    },
  });

  const deleteAllMutation = api.chat.deleteAllConversations.useMutation({
    onSuccess: async () => {
      await utils.chat.listConversations.invalidate();
    },
  });

  const sendMessageMutation = api.chat.sendMessage.useMutation();

  const voiceSttAvailable = appConfig?.voice.sttAvailable ?? false;
  const voiceTtsAvailable = appConfig?.voice.ttsAvailable ?? false;
  const voiceUnavailableHint =
    appConfig?.voice.unavailableHint ??
    "请配置 OPENAI_API_KEY 以启用语音功能";

  const refreshTaskProgress = useCallback(
    async (conversationId?: string) => {
      const id = conversationId ?? activeConversationId;
      if (!id) {
        setTaskProgress(null);
        return;
      }

      try {
        const progress = await utils.chat.getTaskProgress.fetch({
          conversationId: id,
        });
        setTaskProgress(progress);
      } catch {
        setTaskProgress(null);
      }
    },
    [activeConversationId, utils.chat.getTaskProgress],
  );

  const resetActiveChat = useCallback(() => {
    setActiveConversationId(undefined);
    setMessages([]);
    setActiveToolCalls([]);
    setTaskProgress(null);
    sessionRef.current = {};
    setStatus("idle");
    setError(null);
    voiceOutput.stop();
  }, [voiceOutput]);

  const selectConversation = useCallback(
    async (id: string) => {
      setActiveConversationId(id);
      setError(null);
      setStatus("loading");
      sessionRef.current = { conversationId: id };

      try {
        const data = await utils.chat.getMessages.fetch({ conversationId: id });
        setMessages(data.messages);
        setStatus("idle");
        await refreshTaskProgress(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载消息失败");
        setStatus("error");
      }

      setIsSidebarOpen(false);
    },
    [refreshTaskProgress, utils.chat.getMessages],
  );

  const startNewChat = useCallback(async () => {
    setError(null);
    setMessages([]);
    setActiveToolCalls([]);
    sessionRef.current = {};

    try {
      const conv = await createConversationMutation.mutateAsync();
      setActiveConversationId(conv.id);
      sessionRef.current = { conversationId: conv.id };
      setIsSidebarOpen(false);
      await refreshTaskProgress(conv.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建会话失败");
    }
  }, [createConversationMutation, refreshTaskProgress]);

  const deleteConversation = useCallback(
    async (id: string) => {
      setIsDeletingConversation(true);
      setError(null);

      try {
        await deleteConversationMutation.mutateAsync({ id });

        if (
          activeConversationId === id ||
          sessionRef.current.conversationId === id
        ) {
          resetActiveChat();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "删除会话失败");
      } finally {
        setIsDeletingConversation(false);
      }
    },
    [activeConversationId, deleteConversationMutation, resetActiveChat],
  );

  const deleteAllConversations = useCallback(async () => {
    setIsDeletingConversation(true);
    setError(null);

    try {
      await deleteAllMutation.mutateAsync();
      resetActiveChat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "清空外呼记录失败");
    } finally {
      setIsDeletingConversation(false);
    }
  }, [deleteAllMutation, resetActiveChat]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status === "loading") return;

      setError(null);
      setActiveToolCalls([]);

      const userMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      const loadingMessage: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingMessage]);
      setStatus("loading");

      try {
        const response = await sendMessageMutation.mutateAsync({
          message: trimmed,
          conversationId: sessionRef.current.conversationId,
        });

        sessionRef.current = {
          conversationId: response.conversationId,
        };

        if (!activeConversationId) {
          setActiveConversationId(response.conversationId);
        }

        setActiveToolCalls(response.toolCalls);

        const assistantMessages: ChatMessage[] = response.messages.map(
          (msg: ChatMessage) => ({
            ...msg,
            toolCalls:
              msg.role === "assistant" && response.toolCalls.length > 0
                ? response.toolCalls
                : undefined,
          }),
        );

        let lastAssistantIdx = -1;
        for (let i = assistantMessages.length - 1; i >= 0; i--) {
          if (assistantMessages[i]?.role === "assistant") {
            lastAssistantIdx = i;
            break;
          }
        }
        if (lastAssistantIdx >= 0 && response.toolCalls.length > 0) {
          assistantMessages[lastAssistantIdx] = {
            ...assistantMessages[lastAssistantIdx]!,
            toolCalls: response.toolCalls,
          };
        }

        setMessages(assistantMessages);
        if (response.taskProgress) {
          setTaskProgress(response.taskProgress);
        } else {
          void refreshTaskProgress(response.conversationId);
        }

        await utils.chat.listConversations.invalidate();

        setStatus("idle");
        return response;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "发送失败";

        if (
          errMsg.includes("Conversation not found") ||
          errMsg.includes("not found")
        ) {
          resetActiveChat();
        } else {
          setMessages((prev) => prev.filter((m) => !m.isStreaming));
        }

        setError(errMsg);
        setStatus("error");
        return null;
      }
    },
    [
      activeConversationId,
      refreshTaskProgress,
      resetActiveChat,
      sendMessageMutation,
      status,
      utils.chat.listConversations,
    ],
  );

  const startVoiceInput = useCallback(async () => {
    if (!voiceSttAvailable) {
      setError(voiceUnavailableHint);
      return;
    }
    setError(null);
    setStatus("recording");
    await voiceInput.startRecording();
  }, [voiceInput, voiceSttAvailable, voiceUnavailableHint]);

  const stopVoiceInput = useCallback(async () => {
    setStatus("transcribing");
    const text = await voiceInput.stopAndTranscribe();
    setStatus("idle");
    return text;
  }, [voiceInput]);

  const speakMessage = useCallback(
    async (text: string) => {
      if (!voiceTtsAvailable) {
        setError(voiceUnavailableHint);
        return;
      }
      await voiceOutput.speak(text);
    },
    [voiceOutput, voiceTtsAvailable, voiceUnavailableHint],
  );

  return {
    conversations,
    activeConversationId,
    messages,
    status,
    error,
    activeToolCalls,
    isSidebarOpen,
    setIsSidebarOpen,
    isLoadingConversations,
    isDeletingConversation,
    appConfig,
    taskProgress,
    refreshTaskProgress,
    voiceSttAvailable,
    voiceTtsAvailable,
    voiceUnavailableHint,
    isRecording: voiceInput.isRecording,
    isSpeaking: voiceOutput.isSpeaking,
    recordingDurationMs: voiceInput.durationMs,
    loadConversationList: () => void refetchConversations(),
    selectConversation,
    startNewChat,
    deleteConversation,
    deleteAllConversations,
    sendMessage,
    startVoiceInput,
    stopVoiceInput,
    speakMessage,
    stopSpeaking: voiceOutput.stop,
  };
}
