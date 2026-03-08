"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Plus, Loader2, Trash2 } from "lucide-react";
import { chatApi, type ConversationSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  token: string;
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({
  token,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [token]);

  async function loadConversations() {
    try {
      setLoading(true);
      const data = await chatApi.getConversations(token);
      setConversations(data.conversations ?? []);
    } catch {
      // Silently fail — sidebar is non-critical
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-3 border-b">
        <Button
          onClick={onNewConversation}
          className="w-full"
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No conversations yet
          </div>
        )}

        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors group",
              activeConversationId === conv.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate flex-1">
                {conv.title || "Untitled"}
              </span>
            </div>
            <p className="text-xs mt-0.5 ml-5.5 opacity-60">
              {formatDate(conv.updated_at)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
