"use client";

import { useRef, useEffect, useState } from "react";
import { Send, Loader2, RefreshCw, AlertCircle, PanelLeftClose, PanelLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChat } from "@/hooks/useChat";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  token: string;
}

export function ChatInterface({ token }: Props) {
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    sendMessage,
    clearMessages,
    loadConversation,
    isLoading,
    isLoadingHistory,
    usage,
    error,
    conversationId,
  } = useChat({ token });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 border rounded-xl overflow-hidden bg-card">
      {/* Sidebar */}
      {sidebarOpen && (
        <ConversationSidebar
          token={token}
          activeConversationId={conversationId}
          onSelectConversation={loadConversation}
          onNewConversation={clearMessages}
        />
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Toolbar */}
        <div className="px-3 py-1.5 border-b flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className="h-8 w-8"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          {usage && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {usage.used} / {usage.limit} messages
              </span>
              <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    usage.used / usage.limit > 0.9
                      ? "bg-destructive"
                      : "bg-primary"
                  )}
                  style={{
                    width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-4xl mb-4">AI</div>
              <h3 className="text-lg font-semibold mb-2">How can I help you?</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Ask me anything — I&apos;m powered by GPT-4o mini via LangChain
                and remember your conversation history.
              </p>
            </div>
          )}

          {!isLoadingHistory &&
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "chat-bubble",
                    message.role === "user" ? "user" : "assistant"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p
                    className={cn(
                      "text-xs mt-1",
                      message.role === "user"
                        ? "text-primary-foreground/70 text-right"
                        : "text-muted-foreground"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="chat-bubble assistant flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Thinking…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              disabled={isLoading}
              className="flex-1"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              title="New conversation"
              disabled={messages.length === 0 || isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
