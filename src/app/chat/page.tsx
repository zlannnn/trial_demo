import type { Metadata } from "next";

import { ChatLayout } from "~/features/chat/components/chat-layout";
import { BRAND } from "~/features/chat/constants/branding";

export const metadata: Metadata = {
  title: `${BRAND.name} | ${BRAND.scenario}`,
  description: BRAND.scenarioDesc,
};

export default function ChatPage() {
  return <ChatLayout />;
}
