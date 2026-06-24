"use client";

import { Sparkles } from "lucide-react";

import { Separator } from "~/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";

import { BRAND } from "../constants/branding";
import type { ConversationSummary } from "../types";
import { ConversationList } from "./conversation-list";

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  activeId?: string;
  isLoading?: boolean;
  isDeleting?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-teal-500/10 ghost-border">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h1 className="text-base font-bold tracking-tight text-gradient-ghost">
          {BRAND.name}
        </h1>
        <p className="text-[10px] text-muted-foreground">{BRAND.scenario}</p>
      </div>
    </div>
  );
}

export function ChatSidebar({
  conversations,
  activeId,
  isLoading,
  isDeleting,
  isOpen,
  onOpenChange,
  onSelect,
  onNewChat,
  onDelete,
  onDeleteAll,
}: ChatSidebarProps) {
  const sidebarContent = (
    <ConversationList
      conversations={conversations}
      activeId={activeId}
      isLoading={isLoading}
      isDeleting={isDeleting}
      onSelect={onSelect}
      onNewChat={onNewChat}
      onDelete={onDelete}
      onDeleteAll={onDeleteAll}
    />
  );

  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl md:flex lg:w-72">
        <SidebarBrand />
        <Separator className="bg-border/60" />
        {sidebarContent}
      </aside>

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="w-72 border-border/60 bg-sidebar p-0"
        >
          <SheetTitle className="sr-only">{BRAND.name}</SheetTitle>
          <SidebarBrand />
          <Separator className="bg-border/60" />
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}

export { MobileHeaderBar } from "./chat-header";
