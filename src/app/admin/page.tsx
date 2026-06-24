"use client";

import { Loader2, Shield, User } from "lucide-react";
import { useState } from "react";

import { AdminSignOutButton } from "~/components/admin-auth";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { FieldStatusBadges, FieldStatusList } from "~/features/chat/components/field-status-badges";
import { MessageBubble } from "~/features/chat/components/message-bubble";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function AdminDashboardPage() {
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const { data: listData, isLoading: listLoading } =
    api.admin.listAllConversations.useQuery(undefined, {
      staleTime: 10_000,
    });

  const { data: detailData, isLoading: detailLoading } =
    api.admin.getConversationDetail.useQuery(
      { conversationId: selectedId! },
      { enabled: !!selectedId },
    );

  const conversations = listData?.conversations ?? [];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">J-Ghost 管理后台</h1>
            <p className="text-[11px] text-muted-foreground">
              全部用户外呼记录 · 字段采集状态
            </p>
          </div>
        </div>
        <AdminSignOutButton />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-80 shrink-0 flex-col border-r bg-sidebar">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              全部外呼记录
            </p>
            <Badge variant="outline" className="text-[10px]">
              {conversations.length} 条
            </Badge>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            {listLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                暂无外呼记录
              </p>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedId(conv.id)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition-all",
                      "hover:bg-primary/5 hover:border-primary/20 border-transparent",
                      selectedId === conv.id &&
                        "bg-primary/10 border-primary/25 ghost-glow",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs font-medium">
                        {conv.userName ?? conv.userEmail}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">
                      {conv.preview}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(conv.startedAt).toLocaleString("zh-CN")} ·{" "}
                      {conv.messageCount} 轮 · {conv.fields.completedCount}/
                      {conv.fields.totalCount}
                    </p>
                    <FieldStatusBadges
                      tasks={conv.fields.tasks}
                      compact
                      className="mt-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </aside>

        <main className="flex flex-1 overflow-hidden">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              请从左侧选择一条外呼记录查看详情
            </div>
          ) : detailLoading || !detailData ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b bg-card/50 px-6 py-3">
                  <p className="text-sm font-medium">
                    {detailData.conversation.userName ??
                      detailData.conversation.userEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detailData.conversation.userEmail} ·{" "}
                    {new Date(detailData.conversation.startedAt).toLocaleString(
                      "zh-CN",
                    )}
                  </p>
                </div>
                <ScrollArea className="flex-1">
                  <div className="divide-y">
                    {detailData.messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <aside className="flex w-72 shrink-0 flex-col border-l bg-card/30">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold">信息采集状态</p>
                  <p className="text-[10px] text-muted-foreground">
                    绿色 = 已获取 · 红色 = 未获取
                  </p>
                </div>
                <ScrollArea className="flex-1 p-3">
                  <FieldStatusList tasks={detailData.taskProgress.tasks} />
                </ScrollArea>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
