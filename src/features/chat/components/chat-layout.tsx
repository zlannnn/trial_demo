"use client";

import { MessageList } from "./message-list";
import { ChatComposer } from "./chat-composer";
import { MobileHeader, ChatSidebar } from "./chat-sidebar";
import { useChat } from "../hooks/use-chat";

export function ChatLayout() {
  const chat = useChat();

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <ChatSidebar
        conversations={chat.conversations}
        activeId={chat.activeConversationId}
        isLoading={chat.isLoadingConversations}
        isOpen={chat.isSidebarOpen}
        onOpenChange={chat.setIsSidebarOpen}
        onSelect={(id) => void chat.selectConversation(id)}
        onNewChat={() => void chat.startNewChat()}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <MobileHeader
          onMenuClick={() => chat.setIsSidebarOpen(true)}
          onNewChat={() => void chat.startNewChat()}
        />

        {chat.error && (
          <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
            {chat.error}
          </div>
        )}

        <MessageList
          messages={chat.messages}
          isLoading={chat.status === "loading"}
          activeToolCalls={chat.activeToolCalls}
          onPlayAudio={(text) => void chat.speakMessage(text)}
          onStopAudio={chat.stopSpeaking}
          isSpeaking={chat.isSpeaking}
          voiceTtsAvailable={chat.voiceTtsAvailable}
          voiceUnavailableHint={chat.voiceUnavailableHint}
        />

        <ChatComposer
          onSend={(text) => void chat.sendMessage(text)}
          onStartRecording={() => void chat.startVoiceInput()}
          onStopRecording={() => chat.stopVoiceInput()}
          disabled={chat.status === "error"}
          isLoading={chat.status === "loading"}
          isRecording={chat.isRecording}
          recordingDurationMs={chat.recordingDurationMs}
          voiceSttAvailable={chat.voiceSttAvailable}
          voiceUnavailableHint={chat.voiceUnavailableHint}
        />

        {chat.appConfig && (
          <p className="pb-2 text-center text-[11px] text-muted-foreground/60">
            DeepSeek · {chat.appConfig.model}
            {!chat.voiceSttAvailable && !chat.voiceTtsAvailable && (
              <span className="text-amber-600">
                {" "}
                · 语音需配置 OPENAI_API_KEY
              </span>
            )}
          </p>
        )}
      </main>
    </div>
  );
}
