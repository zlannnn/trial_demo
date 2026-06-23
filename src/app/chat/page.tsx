import type { Metadata } from "next";

import { ChatLayout } from "~/features/chat/components/chat-layout";

export const metadata: Metadata = {
  title: "Chat | AI Voice Assistant",
  description: "ChatGPT-style AI voice assistant",
};

export default function ChatPage() {
  return <ChatLayout />;
}
