"use client";

import { Menu, MessageSquarePlus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

import type { ConversationSummary } from "../types";
import { ConversationList } from "./conversation-list";

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  activeId?: string;
  isLoading?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  isLoading,
  isOpen,
  onOpenChange,
  onSelect,
  onNewChat,
}: ChatSidebarProps) {
  const sidebarContent = (
    <ConversationList
      conversations={conversations}
      activeId={activeId}
      isLoading={isLoading}
      onSelect={onSelect}
      onNewChat={onNewChat}
    />
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-sidebar md:flex lg:w-72">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">AI 助手</h1>
        </div>
        <Separator />
        {sidebarContent}
      </aside>

      {/* Mobile sidebar sheet */}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="flex h-14 items-center px-4 text-lg font-semibold">
            AI 助手
          </SheetTitle>
          <Separator />
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}

interface MobileHeaderProps {
  onMenuClick: () => void;
  onNewChat: () => void;
}

export function MobileHeader({ onMenuClick, onNewChat }: MobileHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
      <Button variant="ghost" size="icon" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">打开菜单</span>
      </Button>
      <span className="font-semibold">AI 助手</span>
      <Button variant="ghost" size="icon" onClick={onNewChat}>
        <MessageSquarePlus className="h-5 w-5" />
        <span className="sr-only">新对话</span>
      </Button>
    </header>
  );
}

// Re-export SheetTrigger for mobile menu button in layout
export { SheetTrigger };
