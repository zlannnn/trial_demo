"use client";

import { ChatComposer } from "./chat-composer";
import { ChatHeader } from "./chat-header";
import { ChatSidebar, MobileHeaderBar } from "./chat-sidebar";
import { MessageList } from "./message-list";
import { TaskChecklistPanel } from "./task-checklist-panel";
import { useChat } from "../hooks/use-chat";

export function ChatLayout() {
  const chat = useChat();
  const hasMessages = chat.messages.length > 0;

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <ChatSidebar
        conversations={chat.conversations}
        activeId={chat.activeConversationId}
        isLoading={chat.isLoadingConversations}
        isDeleting={chat.isDeletingConversation}
        isOpen={chat.isSidebarOpen}
        onOpenChange={chat.setIsSidebarOpen}
        onSelect={(id) => void chat.selectConversation(id)}
        onNewChat={() => void chat.startNewChat()}
        onDelete={(id) => void chat.deleteConversation(id)}
        onDeleteAll={() => void chat.deleteAllConversations()}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <MobileHeaderBar
          onMenuClick={() => chat.setIsSidebarOpen(true)}
          onNewChat={() => void chat.startNewChat()}
          onDeleteActive={() => {
            if (chat.activeConversationId) {
              void chat.deleteConversation(chat.activeConversationId);
            }
          }}
          hasActiveConversation={!!chat.activeConversationId}
          isDeleting={chat.isDeletingConversation}
          isRecording={chat.isRecording}
        />

        <ChatHeader
          isLoading={chat.status === "loading"}
          isRecording={chat.isRecording}
          isSpeaking={chat.isSpeaking}
          voiceSttAvailable={chat.voiceSttAvailable}
          voiceTtsAvailable={chat.voiceTtsAvailable}
          model={chat.appConfig?.model}
          activeConversationId={chat.activeConversationId}
          isDeleting={chat.isDeletingConversation}
          onDeleteActive={() => {
            if (chat.activeConversationId) {
              void chat.deleteConversation(chat.activeConversationId);
            }
          }}
        />

        {chat.error && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-center text-sm text-red-300">
            {chat.error}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <MessageList
              messages={chat.messages}
              isLoading={chat.status === "loading"}
              activeToolCalls={chat.activeToolCalls}
              onPlayAudio={(text) => void chat.speakMessage(text)}
              onStopAudio={chat.stopSpeaking}
              isSpeaking={chat.isSpeaking}
              voiceTtsAvailable={chat.voiceTtsAvailable}
              voiceUnavailableHint={chat.voiceUnavailableHint}
              onQuickPrompt={(text) => void chat.sendMessage(text)}
              voiceSttAvailable={chat.voiceSttAvailable}
            />

            <TaskChecklistPanel
              taskProgress={chat.taskProgress}
              isLoading={chat.status === "loading"}
              hasActiveConversation={!!chat.activeConversationId}
              variant="mobile"
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
              showQuickPrompts={hasMessages}
            />
          </div>

          <TaskChecklistPanel
            taskProgress={chat.taskProgress}
            isLoading={chat.status === "loading"}
            hasActiveConversation={!!chat.activeConversationId}
            variant="desktop"
          />
        </div>
      </main>
    </div>
  );
}
