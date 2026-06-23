"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useVoiceInput } from "~/features/voice/hooks/use-voice-input";
import { useVoiceOutput } from "~/features/voice/hooks/use-voice-output";

import {
  createConversation,
  fetchAppConfig,
  fetchConversations,
  fetchMessages,
  sendChatMessage,
} from "../lib/chat-api";
import type {
  AppConfig,
  ChatMessage,
  ChatSession,
  ChatStatus,
  ConversationSummary,
  ToolCallInfo,
} from "../types";

export function useChat() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCallInfo[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  const sessionRef = useRef<ChatSession>({});

  const voiceInput = useVoiceInput({ language: "zh" });
  const voiceOutput = useVoiceOutput();

  const voiceSttAvailable = appConfig?.voice.sttAvailable ?? false;
  const voiceTtsAvailable = appConfig?.voice.ttsAvailable ?? false;
  const voiceUnavailableHint =
    appConfig?.voice.unavailableHint ??
    "请配置 OPENAI_API_KEY 以启用语音功能";

  useEffect(() => {
    void fetchAppConfig()
      .then(setAppConfig)
      .catch(() => {
        /* 配置加载失败时使用默认值（纯文本模式） */
      });
  }, []);

  const loadConversationList = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const data = await fetchConversations();
      setConversations(data.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载会话失败");
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void loadConversationList();
  }, [loadConversationList]);

  const selectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setError(null);
    setStatus("loading");
    sessionRef.current = { conversationId: id };

    try {
      const msgs = await fetchMessages(id);
      setMessages(msgs);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载消息失败");
      setStatus("error");
    }

    setIsSidebarOpen(false);
  }, []);

  const startNewChat = useCallback(async () => {
    setError(null);
    setMessages([]);
    setActiveToolCalls([]);
    sessionRef.current = {};

    try {
      const conv = await createConversation();
      setConversations((prev) => [conv, ...prev]);
      setActiveConversationId(conv.id);
      sessionRef.current = { conversationId: conv.id };
      setIsSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建会话失败");
    }
  }, []);

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
        const response = await sendChatMessage({
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
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === response.conversationId);
          const updated: ConversationSummary = {
            id: response.conversationId,
            startedAt: exists?.startedAt ?? new Date().toISOString(),
            preview: trimmed.slice(0, 60),
            messageCount: assistantMessages.length,
          };

          if (exists) {
            return prev.map((c) =>
              c.id === response.conversationId ? updated : c,
            );
          }
          return [updated, ...prev];
        });

        setStatus("idle");
        return response;
      } catch (err) {
        setMessages((prev) => prev.filter((m) => !m.isStreaming));
        setError(err instanceof Error ? err.message : "发送失败");
        setStatus("error");
        return null;
      }
    },
    [activeConversationId, status],
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
    appConfig,
    voiceSttAvailable,
    voiceTtsAvailable,
    voiceUnavailableHint,
    isRecording: voiceInput.isRecording,
    isSpeaking: voiceOutput.isSpeaking,
    recordingDurationMs: voiceInput.durationMs,
    loadConversationList,
    selectConversation,
    startNewChat,
    sendMessage,
    startVoiceInput,
    stopVoiceInput,
    speakMessage,
    stopSpeaking: voiceOutput.stop,
  };
}
